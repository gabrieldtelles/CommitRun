import { readFile } from "../fs";
import { shortHash } from "../hash";
import {
  applySnapshot,
  createCommit,
  diffSnapshots,
  headCommit,
  headHash,
  headSnapshot,
  history,
  readBlob,
  workdirSnapshot,
  writeBlob,
} from "../repo";
import type { CommandResult, Commit, Snapshot } from "../types";
import { expandPathspec, fail, ok, type GitContext } from "./context";
import { fileDiff } from "./diff";
import { resolveRevision } from "./revision";

function readMessage(args: string[]): string | null {
  const flag = args.findIndex((arg) => arg === "-m" || arg === "--message" || arg === "-am");
  if (flag === -1) return null;
  return args[flag + 1] ?? null;
}

export function gitCommit(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const amend = args.includes("--amend");
  const stageAll = args.some((arg) => arg === "-a" || arg === "-am" || arg === "--all");
  const message = readMessage(args);

  if (repo.merge && repo.merge.conflicts.length > 0) {
    return fail(
      "error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use 'git add <file>'.",
    );
  }

  if (stageAll) {
    const work = workdirSnapshot(machine.fs, repo);
    for (const path of Object.keys(repo.index)) {
      if (!(path in work)) {
        delete repo.index[path];
        continue;
      }
      const content = readFile(machine.fs, `${repo.root}/${path}`) ?? "";
      repo.index[path] = writeBlob(repo, content);
    }
  }

  if (!message) {
    return fail(
      'error: a mensagem do commit é obrigatória\nuse: git commit -m "descreva a mudança"',
    );
  }

  const parentCommit = headCommit(repo);
  const baseSnapshot = amend ? amendBaseSnapshot(ctx, parentCommit) : headSnapshot(repo);
  const changes = diffSnapshots(baseSnapshot, repo.index);

  if (changes.length === 0 && !amend && !repo.merge) {
    return fail('nothing to commit, working tree clean\n(use "git add <file>" para preparar mudanças)');
  }

  if (amend && !parentCommit) return fail("fatal: You have nothing to amend.");

  const parents = amend
    ? parentCommit!.parents
    : repo.merge
      ? [headHash(repo) as string, repo.merge.sourceHash]
      : parentCommit
        ? [parentCommit.hash]
        : [];

  const commit = createCommit(repo, message, parents, { ...repo.index });
  if (repo.head.kind === "branch") repo.branches[repo.head.name] = commit.hash;
  else repo.head = { kind: "detached", hash: commit.hash };

  const wasMerge = Boolean(repo.merge);
  repo.merge = null;

  const label = repo.head.kind === "branch" ? repo.head.name : "HEAD detached";
  const rootTag = parents.length === 0 ? " (root-commit)" : "";
  const summary = `${changes.length} file${changes.length === 1 ? "" : "s"} changed`;

  return ok(
    [
      `[${label}${rootTag} ${shortHash(commit.hash)}] ${message}`,
      wasMerge ? " merge concluído" : ` ${summary}`,
    ].join("\n"),
  );
}

function amendBaseSnapshot(ctx: GitContext, commit: Commit | null): Snapshot {
  const grandparent = commit?.parents[0];
  return grandparent ? (ctx.repo.commits[grandparent]?.snapshot ?? {}) : {};
}

export function gitLog(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  const oneline = args.includes("--oneline");
  const graph = args.includes("--graph");
  const all = args.includes("--all");

  const limitFlag = args.findIndex((arg) => arg === "-n");
  const limit = limitFlag >= 0 ? Number(args[limitFlag + 1] ?? "0") : 0;

  const roots = all ? Object.values(repo.branches) : [headHash(repo)];
  const seen = new Set<string>();
  const commits: Commit[] = [];

  for (const root of roots) {
    for (const commit of history(repo, root ?? null)) {
      if (seen.has(commit.hash)) continue;
      seen.add(commit.hash);
      commits.push(commit);
    }
  }

  if (commits.length === 0) {
    const branch = repo.head.kind === "branch" ? repo.head.name : "HEAD";
    return fail(
      `fatal: your current branch '${branch}' does not have any commits yet`,
    );
  }

  commits.sort((a, b) => b.timestamp - a.timestamp);
  const selected = limit > 0 ? commits.slice(0, limit) : commits;
  const head = headHash(repo);

  const refsOf = (hash: string): string => {
    const names = Object.entries(repo.branches)
      .filter(([, target]) => target === hash)
      .map(([name]) => (repo.head.kind === "branch" && repo.head.name === name ? `HEAD -> ${name}` : name));
    return names.length > 0 ? ` (${names.join(", ")})` : hash === head ? " (HEAD)" : "";
  };

  const lines = selected.map((commit) => {
    const prefix = graph ? "* " : "";
    if (oneline) return `${prefix}${shortHash(commit.hash)}${refsOf(commit.hash)} ${commit.message}`;
    return [
      `${prefix}commit ${commit.hash}${refsOf(commit.hash)}`,
      `Author: ${commit.author}`,
      `Date:   ${new Date(commit.timestamp).toLocaleString("pt-BR")}`,
      "",
      `    ${commit.message}`,
      "",
    ].join("\n");
  });

  return ok(lines.join(oneline ? "\n" : "\n"));
}

export function gitShow(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  const revision = args.find((arg) => !arg.startsWith("-")) ?? "HEAD";
  const hash = resolveRevision(repo, revision);
  const commit = hash ? repo.commits[hash] : null;

  if (!commit) return fail(`fatal: ambiguous argument '${revision}': unknown revision`);

  const parent = commit.parents[0] ? repo.commits[commit.parents[0]] : null;
  const before = parent?.snapshot ?? {};
  const diffs = diffSnapshots(before, commit.snapshot)
    .map((change) =>
      fileDiff(
        change.path,
        readBlob(repo, before[change.path] ?? ""),
        readBlob(repo, commit.snapshot[change.path] ?? ""),
      ),
    )
    .filter(Boolean);

  return ok(
    [
      `commit ${commit.hash}`,
      `Author: ${commit.author}`,
      `Date:   ${new Date(commit.timestamp).toLocaleString("pt-BR")}`,
      "",
      `    ${commit.message}`,
      "",
      ...diffs,
    ].join("\n"),
  );
}

export function gitDiff(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const staged = args.includes("--staged") || args.includes("--cached");
  const pathspecs = args.filter((arg) => !arg.startsWith("-"));

  const before = staged ? headSnapshot(repo) : repo.index;
  const after = staged ? repo.index : workdirTracked(ctx);
  const changes = diffSnapshots(before, after);
  const filter = pathspecs.length > 0 ? new Set(expandPathspec(ctx, pathspecs)) : null;

  const diffs = changes
    .filter((change) => !filter || filter.has(change.path))
    .map((change) => {
      const previous = readBlob(repo, before[change.path] ?? "");
      const current = staged
        ? readBlob(repo, after[change.path] ?? "")
        : (readFile(machine.fs, `${repo.root}/${change.path}`) ?? "");
      return fileDiff(change.path, previous, current);
    })
    .filter(Boolean);

  return ok(diffs.join("\n"));
}

function workdirTracked(ctx: GitContext): Snapshot {
  const work = workdirSnapshot(ctx.machine.fs, ctx.repo);
  const tracked: Snapshot = {};
  for (const path of Object.keys(ctx.repo.index)) {
    if (path in work) tracked[path] = work[path] as string;
  }
  return tracked;
}

export function gitReset(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const mode = args.includes("--hard") ? "hard" : args.includes("--soft") ? "soft" : "mixed";
  const revision = args.find((arg) => !arg.startsWith("-")) ?? "HEAD";
  const hash = resolveRevision(repo, revision);

  if (!hash) return fail(`fatal: ambiguous argument '${revision}': unknown revision`);

  const target = repo.commits[hash];
  if (!target) return fail(`fatal: ${revision} não aponta para um commit`);

  if (repo.head.kind === "branch") repo.branches[repo.head.name] = hash;
  else repo.head = { kind: "detached", hash };

  if (mode !== "soft") repo.index = { ...target.snapshot };
  if (mode === "hard") {
    applySnapshot(machine.fs, repo, target.snapshot);
    repo.merge = null;
  }

  return ok(mode === "hard" ? `HEAD is now at ${shortHash(hash)} ${target.message}` : "");
}
