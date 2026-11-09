import { listFiles, readFile, remove, writeFile, type VDir } from "./fs";
import { hashContent } from "./hash";
import type { Commit, Repo, Snapshot } from "./types";

export const GIT_DIR = ".git";

export function createRepo(root: string): Repo {
  return {
    root,
    objects: {},
    commits: {},
    branches: {},
    head: { kind: "branch", name: "main" },
    index: {},
    config: {},
    remote: null,
    merge: null,
  };
}

export function writeBlob(repo: Repo, content: string): string {
  const hash = hashContent(content);
  repo.objects[hash] = content;
  return hash;
}

export function readBlob(repo: Repo, hash: string): string {
  return repo.objects[hash] ?? "";
}

export function currentBranch(repo: Repo): string | null {
  return repo.head.kind === "branch" ? repo.head.name : null;
}

export function headHash(repo: Repo): string | null {
  if (repo.head.kind === "detached") return repo.head.hash;
  return repo.branches[repo.head.name] ?? null;
}

export function headCommit(repo: Repo): Commit | null {
  const hash = headHash(repo);
  return hash ? (repo.commits[hash] ?? null) : null;
}

export function headSnapshot(repo: Repo): Snapshot {
  return headCommit(repo)?.snapshot ?? {};
}

export function parseIgnore(fs: VDir, repo: Repo): string[] {
  const content = readFile(fs, `${repo.root}/.gitignore`);
  if (!content) return [];
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function isIgnored(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const clean = pattern.replace(/\/$/, "");
    if (clean === path) return true;
    if (path.startsWith(`${clean}/`)) return true;
    if (clean.startsWith("*.")) return path.endsWith(clean.slice(1));
    if (clean.endsWith("/*")) return path.startsWith(`${clean.slice(0, -2)}/`);
    if (clean.includes("*")) {
      const escaped = clean.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
      return new RegExp(`^${escaped}$`).test(path);
    }
    return false;
  });
}

export function workdirSnapshot(fs: VDir, repo: Repo): Snapshot {
  const snapshot: Snapshot = {};
  for (const path of listFiles(fs, repo.root)) {
    if (path === GIT_DIR || path.startsWith(`${GIT_DIR}/`)) continue;
    const content = readFile(fs, `${repo.root}/${path}`) ?? "";
    snapshot[path] = hashContent(content);
  }
  return snapshot;
}

export type FileChange = { path: string; state: "novo" | "modificado" | "apagado" };

export function diffSnapshots(from: Snapshot, to: Snapshot): FileChange[] {
  const changes: FileChange[] = [];
  for (const path of Object.keys(to)) {
    if (!(path in from)) changes.push({ path, state: "novo" });
    else if (from[path] !== to[path]) changes.push({ path, state: "modificado" });
  }
  for (const path of Object.keys(from)) {
    if (!(path in to)) changes.push({ path, state: "apagado" });
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path));
}

export type RepoStatus = {
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
};

export function status(fs: VDir, repo: Repo): RepoStatus {
  const work = workdirSnapshot(fs, repo);
  const patterns = parseIgnore(fs, repo);
  const tracked = new Set(Object.keys(repo.index));

  const trackedWork: Snapshot = {};
  for (const [path, hash] of Object.entries(work)) {
    if (tracked.has(path)) trackedWork[path] = hash;
  }

  const untracked = Object.keys(work)
    .filter((path) => !tracked.has(path) && !isIgnored(path, patterns))
    .sort();

  return {
    staged: diffSnapshots(headSnapshot(repo), repo.index),
    unstaged: diffSnapshots(repo.index, trackedWork),
    untracked,
  };
}

export function isClean(fs: VDir, repo: Repo): boolean {
  const current = status(fs, repo);
  return (
    current.staged.length === 0 &&
    current.unstaged.length === 0 &&
    current.untracked.length === 0
  );
}

export function ancestry(repo: Repo, hash: string | null): string[] {
  if (!hash) return [];
  const seen = new Set<string>();
  const queue = [hash];
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (seen.has(current)) continue;
    seen.add(current);
    order.push(current);
    const commit = repo.commits[current];
    if (commit) queue.push(...commit.parents);
  }
  return order;
}

export function history(repo: Repo, hash: string | null): Commit[] {
  return ancestry(repo, hash)
    .map((item) => repo.commits[item])
    .filter((commit): commit is Commit => Boolean(commit))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function mergeBase(repo: Repo, a: string, b: string): string | null {
  const ancestorsOfA = new Set(ancestry(repo, a));
  for (const hash of ancestry(repo, b)) {
    if (ancestorsOfA.has(hash)) return hash;
  }
  return null;
}

export function isAncestor(repo: Repo, candidate: string, descendant: string): boolean {
  return ancestry(repo, descendant).includes(candidate);
}

export function applySnapshot(fs: VDir, repo: Repo, snapshot: Snapshot): void {
  for (const path of Object.keys(workdirSnapshot(fs, repo))) {
    remove(fs, `${repo.root}/${path}`);
  }
  for (const [path, hash] of Object.entries(snapshot)) {
    writeFile(fs, `${repo.root}/${path}`, readBlob(repo, hash));
  }
}

export function createCommit(
  repo: Repo,
  message: string,
  parents: string[],
  snapshot: Snapshot,
): Commit {
  const author = repo.config["user.name"] ?? "dev";
  const timestamp = Date.now() + Object.keys(repo.commits).length;
  const hash = hashContent(
    `${message}|${parents.join(",")}|${JSON.stringify(snapshot)}|${timestamp}`,
  );
  const commit: Commit = { hash, message, parents, author, timestamp, snapshot };
  repo.commits[hash] = commit;
  return commit;
}
