import { headHash } from "../repo";
import type { Repo } from "../types";

export function resolveRevision(repo: Repo, revision: string): string | null {
  const match = revision.match(/^(.+?)(?:(~|\^)(\d*))?$/);
  if (!match) return null;

  const [, base = "", operator, countRaw] = match;
  const resolved = resolveBase(repo, base);
  if (!resolved) return null;
  if (!operator) return resolved;

  let current: string = resolved;
  const steps = Number(countRaw || "1");
  for (let step = 0; step < steps; step += 1) {
    const parent: string | undefined = repo.commits[current]?.parents[0];
    if (!parent) return null;
    current = parent;
  }

  return current;
}

function resolveBase(repo: Repo, base: string): string | null {
  if (base === "HEAD") return headHash(repo);
  if (repo.branches[base]) return repo.branches[base] as string;
  if (repo.commits[base]) return base;

  const matches = Object.keys(repo.commits).filter((hash) => hash.startsWith(base));
  return matches.length === 1 ? (matches[0] as string) : null;
}
