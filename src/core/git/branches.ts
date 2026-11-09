import { shortHash } from "../hash";
import {
  applySnapshot,
  createCommit,
  registrarReflog,
  headHash,
  isAncestor,
  mergeBase,
  readBlob,
  status,
  writeBlob,
} from "../repo";
import type { CommandResult, Snapshot } from "../types";
import { fail, ok, type GitContext } from "./context";
import { resolveRevision } from "./revision";

function hasPendingChanges(ctx: GitContext): boolean {
  const current = status(ctx.machine.fs, ctx.repo);
  return current.staged.length > 0 || current.unstaged.length > 0;
}

export function gitBranch(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  const names = args.filter((arg) => !arg.startsWith("-"));
  const deleteFlag = args.includes("-d") || args.includes("-D");
  const renameFlag = args.includes("-m");

  if (deleteFlag) {
    const name = names[0];
    if (!name) return fail("fatal: branch name required");
    if (!(name in repo.branches)) return fail(`error: branch '${name}' not found.`);
    if (repo.head.kind === "branch" && repo.head.name === name) {
      return fail(`error: cannot delete branch '${name}' used by worktree`);
    }
    const hash = repo.branches[name] as string;
    delete repo.branches[name];
    return ok(`Deleted branch ${name} (was ${shortHash(hash)}).`);
  }

  if (renameFlag) {
    const name = names[0];
    if (!name || repo.head.kind !== "branch") return fail("fatal: branch name required");
    const previous = repo.head.name;
    repo.branches[name] = repo.branches[previous] as string;
    delete repo.branches[previous];
    repo.head = { kind: "branch", name };
    return ok("");
  }

  if (names.length === 0) {
    const current = repo.head.kind === "branch" ? repo.head.name : null;
    const list = Object.keys(repo.branches).sort();
    if (list.length === 0) return ok("");
    return ok(list.map((name) => (name === current ? `* ${name}` : `  ${name}`)).join("\n"));
  }

  const name = names[0] as string;
  if (name in repo.branches) return fail(`fatal: a branch named '${name}' already exists`);

  const target = headHash(repo);
  if (!target) return fail("fatal: Not a valid object name: 'HEAD'.");

  repo.branches[name] = target;
  return ok("");
}

export function gitSwitch(ctx: GitContext, args: string[], allowDetach = false): CommandResult {
  const { machine, repo } = ctx;
  const create = args.includes("-c") || args.includes("-b");
  const names = args.filter((arg) => !arg.startsWith("-"));
  const name = names[0];

  if (!name) return fail("fatal: missing branch name");

  if (create) {
    const created = gitBranch(ctx, [name]);
    if (created.error) return created;
  }

  const isBranch = name in repo.branches;
  if (!isBranch && !allowDetach) {
    return fail(`fatal: invalid reference: ${name}`);
  }

  if (hasPendingChanges(ctx)) {
    return fail(
      `error: Your local changes would be overwritten by checkout.\nPlease commit your changes before you switch branches.`,
    );
  }

  const hash = isBranch ? (repo.branches[name] as string) : resolveRevision(repo, name);
  if (!hash) return fail(`fatal: invalid reference: ${name}`);

  const snapshot = repo.commits[hash]?.snapshot ?? {};
  repo.head = isBranch ? { kind: "branch", name } : { kind: "detached", hash };
  repo.index = { ...snapshot };
  applySnapshot(machine.fs, repo, snapshot);

  registrarReflog(repo, `checkout: moving to ${name}`);

  if (!isBranch) return ok(`Note: switching to '${name}'.\nHEAD is now at ${shortHash(hash)}`);
  return ok(create ? `Switched to a new branch '${name}'` : `Switched to branch '${name}'`);
}

export function gitMerge(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;

  if (args.includes("--abort")) {
    if (!repo.merge) return fail("fatal: There is no merge to abort (MERGE_HEAD missing).");
    const snapshot = repo.commits[headHash(repo) as string]?.snapshot ?? {};
    repo.index = { ...snapshot };
    applySnapshot(machine.fs, repo, snapshot);
    repo.merge = null;
    return ok("");
  }

  const name = args.find((arg) => !arg.startsWith("-"));
  if (!name) return fail("fatal: No commit specified and merge.defaultToUpstream not set.");

  const sourceHash = repo.branches[name] ?? resolveRevision(repo, name);
  const current = headHash(repo);

  if (!sourceHash) return fail(`merge: ${name} - not something we can merge`);
  if (!current) return fail("fatal: Non-fast-forward commit does not make sense into an empty head");
  if (sourceHash === current) return ok("Already up to date.");

  if (isAncestor(repo, sourceHash, current)) return ok("Already up to date.");

  if (isAncestor(repo, current, sourceHash)) {
    const snapshot = repo.commits[sourceHash]?.snapshot ?? {};
    if (repo.head.kind === "branch") repo.branches[repo.head.name] = sourceHash;
    else repo.head = { kind: "detached", hash: sourceHash };
    repo.index = { ...snapshot };
    applySnapshot(machine.fs, repo, snapshot);
    return ok(
      `Updating ${shortHash(current)}..${shortHash(sourceHash)}\nFast-forward`,
    );
  }

  const baseHash = mergeBase(repo, current, sourceHash);
  const base = baseHash ? (repo.commits[baseHash]?.snapshot ?? {}) : {};
  const ours = repo.commits[current]?.snapshot ?? {};
  const theirs = repo.commits[sourceHash]?.snapshot ?? {};

  const merged: Snapshot = {};
  const conflicts: string[] = [];
  const paths = new Set([...Object.keys(ours), ...Object.keys(theirs)]);

  for (const path of paths) {
    const inBase = base[path];
    const inOurs = ours[path];
    const inTheirs = theirs[path];

    if (inOurs === inTheirs) {
      if (inOurs) merged[path] = inOurs;
      continue;
    }
    if (inOurs === inBase) {
      if (inTheirs) merged[path] = inTheirs;
      continue;
    }
    if (inTheirs === inBase) {
      if (inOurs) merged[path] = inOurs;
      continue;
    }

    conflicts.push(path);
    const marked = [
      "<<<<<<< HEAD",
      readBlob(repo, inOurs ?? ""),
      "=======",
      readBlob(repo, inTheirs ?? ""),
      `>>>>>>> ${name}`,
    ].join("\n");
    merged[path] = writeBlob(repo, marked);
  }

  repo.index = { ...merged };
  applySnapshot(machine.fs, repo, merged);

  if (conflicts.length > 0) {
    repo.merge = { sourceBranch: name, sourceHash, conflicts: conflicts.sort() };
    return fail(
      [
        ...conflicts.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
        "Automatic merge failed; fix conflicts and then commit the result.",
      ].join("\n"),
    );
  }

  const commit = createCommit(repo, `Merge branch '${name}'`, [current, sourceHash], merged);
  if (repo.head.kind === "branch") repo.branches[repo.head.name] = commit.hash;
  else repo.head = { kind: "detached", hash: commit.hash };

  return ok(`Merge made by the 'ort' strategy.\n ${paths.size} arquivo(s) combinados`);
}
