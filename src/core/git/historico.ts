import { shortHash } from "../hash";
import { diffSnapshots, headHash, history, readBlob } from "../repo";
import type { CommandResult, Commit } from "../types";
import { fail, ok, type GitContext } from "./context";
import { fileDiff } from "./diff";
import { resolveRevision } from "./revision";

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
