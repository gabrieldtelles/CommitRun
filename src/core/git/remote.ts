import { shortHash } from "../hash";
import { ancestry, headHash, isAncestor } from "../repo";
import type { CommandResult, Remote } from "../types";
import { fail, ok, type GitContext } from "./context";
import { gitMerge } from "./branches";

function createRemote(name: string, url: string): Remote {
  return { name, url, branches: {}, commits: {}, objects: {} };
}

export function gitRemote(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  const [action, name, url] = args.filter((arg) => !arg.startsWith("-"));

  if (args.includes("-v") || !action) {
    if (!repo.remote) return ok("");
    return ok(
      [`${repo.remote.name}\t${repo.remote.url} (fetch)`, `${repo.remote.name}\t${repo.remote.url} (push)`].join("\n"),
    );
  }

  if (action === "add") {
    if (!name || !url) return fail("usage: git remote add <nome> <url>");
    if (repo.remote) return fail(`error: remote ${name} already exists.`);
    repo.remote = createRemote(name, url);
    return ok("");
  }

  if (action === "remove" || action === "rm") {
    repo.remote = null;
    return ok("");
  }

  return fail(`error: Unknown subcommand: ${action}`);
}

export function gitPush(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  if (!repo.remote) {
    return fail("fatal: No configured push destination.\nuse: git remote add origin <url>");
  }

  const branch = repo.head.kind === "branch" ? repo.head.name : null;
  if (!branch) return fail("fatal: You are not currently on a branch.");

  const local = headHash(repo);
  if (!local) return fail(`error: src refspec ${branch} does not match any`);

  const remoteHash = repo.remote.branches[branch];
  if (remoteHash === local) return ok("Everything up-to-date");
  if (remoteHash && !isAncestor(repo, remoteHash, local)) {
    return fail(
      [
        `! [rejected]        ${branch} -> ${branch} (non-fast-forward)`,
        "hint: Updates were rejected because the remote contains work that you do not have locally.",
        "hint: Integre as mudanças remotas (git pull) antes de publicar de novo.",
      ].join("\n"),
    );
  }

  for (const hash of ancestry(repo, local)) {
    const commit = repo.commits[hash];
    if (!commit) continue;
    repo.remote.commits[hash] = commit;
    for (const blob of Object.values(commit.snapshot)) {
      repo.remote.objects[blob] = repo.objects[blob] ?? "";
    }
  }

  repo.remote.branches[branch] = local;
  const range = remoteHash ? `${shortHash(remoteHash)}..${shortHash(local)}` : `[new branch]`;

  return ok(
    [
      `To ${repo.remote.url}`,
      ` ${range}  ${branch} -> ${branch}`,
      args.includes("-u") || args.includes("--set-upstream")
        ? `branch '${branch}' set up to track '${repo.remote.name}/${branch}'.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export function gitPull(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  if (!repo.remote) return fail("fatal: No remote repository specified.");

  const branch = repo.head.kind === "branch" ? repo.head.name : null;
  if (!branch) return fail("fatal: You are not currently on a branch.");

  const remoteHash = repo.remote.branches[branch];
  if (!remoteHash) return ok("Already up to date.");

  for (const [hash, commit] of Object.entries(repo.remote.commits)) {
    repo.commits[hash] = commit;
  }
  for (const [hash, content] of Object.entries(repo.remote.objects)) {
    repo.objects[hash] = content;
  }

  const result = gitMerge(ctx, [remoteHash, ...args.filter((arg) => arg.startsWith("-"))]);
  return result.error ? result : ok([`From ${repo.remote.url}`, result.output].join("\n"));
}
