import { mkdirp, readFile, remove, writeFile } from "../fs";
import {
  GIT_DIR,
  createRepo,
  headSnapshot,
  isIgnored,
  parseIgnore,
  readBlob,
  status,
  workdirSnapshot,
  writeBlob,
} from "../repo";
import type { CommandResult, Machine } from "../types";
import { expandPathspec, fail, ok, toRepoPath, type GitContext } from "./context";

const LABEL: Record<string, string> = {
  novo: "new file",
  modificado: "modified",
  apagado: "deleted",
};

function pad(label: string): string {
  return `${label}:`.padEnd(12, " ");
}

export function gitInit(machine: Machine): CommandResult {
  if (machine.repo && machine.repo.root === machine.cwd) {
    return ok(`Reinitialized existing Git repository in ${machine.cwd}/${GIT_DIR}/`);
  }

  machine.repo = createRepo(machine.cwd);
  mkdirp(machine.fs, `${machine.cwd}/${GIT_DIR}`);
  return ok(`Initialized empty Git repository in ${machine.cwd}/${GIT_DIR}/`);
}

export function gitConfig(ctx: GitContext, args: string[]): CommandResult {
  const values = args.filter((arg) => !arg.startsWith("--"));
  const [key, value] = values;

  if (args.includes("--list")) {
    const entries = Object.entries(ctx.repo.config);
    if (entries.length === 0) return ok("");
    return ok(entries.map(([name, item]) => `${name}=${item}`).join("\n"));
  }

  if (!key) return fail("usage: git config <chave> [<valor>]");

  if (value === undefined) {
    const current = ctx.repo.config[key];
    return current ? ok(current) : fail("");
  }

  ctx.repo.config[key] = value;
  return ok("");
}

export function gitStatus(ctx: GitContext): CommandResult {
  const { machine, repo } = ctx;
  const current = status(machine.fs, repo);
  const lines: string[] = [];

  lines.push(
    repo.head.kind === "branch"
      ? `On branch ${repo.head.name}`
      : `HEAD detached at ${repo.head.hash.slice(0, 7)}`,
  );

  if (repo.merge) {
    lines.push("");
    lines.push(
      repo.merge.conflicts.length > 0
        ? "You have unmerged paths.\n  (fix conflicts and run \"git commit\")"
        : "All conflicts fixed but you are still merging.",
    );
  }

  if (!headSnapshot(repo) || Object.keys(repo.commits).length === 0) {
    lines.push("", "No commits yet");
  }

  if (current.staged.length > 0) {
    lines.push("", "Changes to be committed:");
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    for (const change of current.staged) {
      lines.push(`\t${pad(LABEL[change.state] ?? change.state)}${change.path}`);
    }
  }

  if (current.unstaged.length > 0) {
    lines.push("", "Changes not staged for commit:");
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push('  (use "git restore <file>..." to discard changes in working directory)');
    for (const change of current.unstaged) {
      lines.push(`\t${pad(LABEL[change.state] ?? change.state)}${change.path}`);
    }
  }

  if (current.untracked.length > 0) {
    lines.push("", "Untracked files:");
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    for (const path of current.untracked) lines.push(`\t${path}`);
  }

  if (current.staged.length === 0 && current.unstaged.length === 0) {
    lines.push(
      "",
      current.untracked.length > 0
        ? 'nothing added to commit but untracked files present (use "git add" to track)'
        : "nothing to commit, working tree clean",
    );
  }

  return ok(lines.join("\n"));
}

export function gitAdd(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const pathspecs = args.filter((arg) => !arg.startsWith("-"));
  const all = args.includes("-A") || args.includes("--all");

  if (pathspecs.length === 0 && !all) {
    return fail("Nothing specified, nothing added.\nhint: Maybe you wanted to say 'git add .'?");
  }

  const targets = expandPathspec(ctx, all ? ["."] : pathspecs);
  if (targets.length === 0) {
    const missing = pathspecs[0] ?? ".";
    const patterns = parseIgnore(machine.fs, repo);
    const repoPath = toRepoPath(machine, repo, missing);
    if (isIgnored(repoPath, patterns)) {
      return fail(
        `The following paths are ignored by one of your .gitignore files:\n${repoPath}\nhint: Use -f if you really want to add them.`,
      );
    }
    return fail(`fatal: pathspec '${missing}' did not match any files`);
  }

  const work = workdirSnapshot(machine.fs, repo);
  for (const path of targets) {
    if (!(path in work)) {
      delete repo.index[path];
      continue;
    }
    const content = readFile(machine.fs, `${repo.root}/${path}`) ?? "";
    repo.index[path] = writeBlob(repo, content);
  }

  if (repo.merge) {
    repo.merge.conflicts = repo.merge.conflicts.filter((path) => !targets.includes(path));
  }

  return ok("");
}

export function gitRestore(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const staged = args.includes("--staged");
  const pathspecs = args.filter((arg) => !arg.startsWith("-"));

  if (pathspecs.length === 0) return fail("fatal: you must specify path(s) to restore");

  const targets = expandPathspec(ctx, pathspecs);
  if (targets.length === 0) {
    return fail(`error: pathspec '${pathspecs[0]}' did not match any file(s) known to git`);
  }

  const head = headSnapshot(repo);
  for (const path of targets) {
    if (staged) {
      const hash = head[path];
      if (hash) repo.index[path] = hash;
      else delete repo.index[path];
      continue;
    }

    const hash = repo.index[path];
    if (hash === undefined) continue;
    writeFile(machine.fs, `${repo.root}/${path}`, readBlob(repo, hash));
  }

  return ok("");
}

export function gitRm(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const cached = args.includes("--cached");
  const pathspecs = args.filter((arg) => !arg.startsWith("-"));
  const targets = expandPathspec(ctx, pathspecs);

  if (targets.length === 0) {
    return fail(`fatal: pathspec '${pathspecs[0] ?? ""}' did not match any files`);
  }

  for (const path of targets) {
    delete repo.index[path];
    if (!cached) remove(machine.fs, `${repo.root}/${path}`);
  }

  return ok(targets.map((path) => `rm '${path}'`).join("\n"));
}
