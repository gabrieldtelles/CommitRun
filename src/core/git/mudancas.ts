import { readFile } from "../fs";
import { shortHash } from "../hash";
import {
  applySnapshot,
  diffSnapshots,
  headSnapshot,
  readBlob,
  registrarReflog,
  workdirSnapshot,
} from "../repo";
import type { CommandResult, Snapshot } from "../types";
import { expandPathspec, fail, ok, type GitContext } from "./context";
import { fileDiff } from "./diff";
import { resolveRevision } from "./revision";

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

  registrarReflog(repo, `reset: moving to ${revision}`);

  return ok(mode === "hard" ? `HEAD is now at ${shortHash(hash)} ${target.message}` : "");
}
