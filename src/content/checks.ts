import { readFile } from "@/core/fs";
import { headCommit, history, status } from "@/core/repo";
import type { Commit, Machine } from "@/core/types";
import type { MissionCheck, MissionState } from "./types";

export function commits(machine: Machine): Commit[] {
  if (!machine.repo) return [];
  return history(machine.repo, machine.repo.branches[branchOf(machine) ?? "main"] ?? null);
}

export function allCommits(machine: Machine): Commit[] {
  return machine.repo ? Object.values(machine.repo.commits) : [];
}

export function branchOf(machine: Machine): string | null {
  const head = machine.repo?.head;
  return head && head.kind === "branch" ? head.name : null;
}

export function fileOf(machine: Machine, path: string): string | null {
  if (!machine.repo) return null;
  return readFile(machine.fs, `${machine.repo.root}/${path}`);
}

export function isTracked(machine: Machine, path: string): boolean {
  return Boolean(machine.repo && path in machine.repo.index);
}

export function isClean(machine: Machine): boolean {
  if (!machine.repo) return false;
  const current = status(machine.fs, machine.repo);
  return current.staged.length === 0 && current.unstaged.length === 0;
}

export function lastMessage(machine: Machine): string {
  return headCommit(machine.repo as NonNullable<Machine["repo"]>)?.message ?? "";
}

export function usedCommand(state: MissionState, pattern: RegExp): boolean {
  return state.history.some((line) => pattern.test(line.trim()));
}

export function sequence(...steps: [boolean, string][]): MissionCheck {
  const pending = steps.find(([done]) => !done);
  return pending
    ? { ok: false, message: pending[1] }
    : { ok: true, message: "Missão concluída. Pode seguir." };
}
