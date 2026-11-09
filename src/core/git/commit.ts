import { readFile } from "../fs";
import { shortHash } from "../hash";
import {
  createCommit,
  registrarReflog,
  diffSnapshots,
  headCommit,
  headHash,
  headSnapshot,
  workdirSnapshot,
  writeBlob,
} from "../repo";
import type { CommandResult, Commit, Snapshot } from "../types";
import { fail, ok, type GitContext } from "./context";

function readMessage(args: string[]): string | null {
  const flag = args.findIndex((arg) => arg === "-m" || arg === "--message" || arg === "-am");
  if (flag === -1) return null;
  return args[flag + 1] ?? null;
}

function amendBaseSnapshot(ctx: GitContext, commit: Commit | null): Snapshot {
  const grandparent = commit?.parents[0];
  return grandparent ? (ctx.repo.commits[grandparent]?.snapshot ?? {}) : {};
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
  registrarReflog(repo, `commit: ${message}`);

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
