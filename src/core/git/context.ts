import { relative, resolve } from "../path";
import { isIgnored, parseIgnore, workdirSnapshot } from "../repo";
import type { CommandResult, Machine, Repo } from "../types";

export type GitContext = { machine: Machine; repo: Repo };

export function ok(output: string): CommandResult {
  return { output };
}

export function fail(output: string): CommandResult {
  return { output, error: true };
}

export function requireRepo(machine: Machine): Repo | null {
  if (!machine.repo) return null;
  const inside =
    machine.cwd === machine.repo.root || machine.cwd.startsWith(`${machine.repo.root}/`);
  return inside ? machine.repo : null;
}

export function notARepo(): CommandResult {
  return fail("fatal: not a git repository (or any of the parent directories): .git");
}

export function toRepoPath(machine: Machine, repo: Repo, arg: string): string {
  return relative(repo.root, resolve(machine.cwd, arg));
}

export function expandPathspec(ctx: GitContext, args: string[]): string[] {
  const { machine, repo } = ctx;
  const candidates = new Set([
    ...Object.keys(workdirSnapshot(machine.fs, repo)),
    ...Object.keys(repo.index),
  ]);
  const patterns = parseIgnore(machine.fs, repo);
  const matched = new Set<string>();

  for (const arg of args) {
    const target = toRepoPath(machine, repo, arg);
    const explicit = candidates.has(target);

    for (const path of candidates) {
      const isAll = target === "" || target === ".";
      const inDirectory = target !== "" && path.startsWith(`${target}/`);
      const globMatch = arg.includes("*") && matchesGlob(path, target);

      if (!(isAll || path === target || inDirectory || globMatch)) continue;
      if (!explicit && isIgnored(path, patterns)) continue;
      matched.add(path);
    }
  }

  return [...matched].sort();
}

function matchesGlob(path: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`).test(path);
}
