import { createRoot, mkdirp, writeFile } from "./fs";
import { runGit } from "./git";
import { parseLine, runShell } from "./shell";
import { applySnapshot, createRepo, writeBlob } from "./repo";
import type { CommandResult, Machine, Repo, Snapshot } from "./types";

export type SeedCommit = { message: string; files?: Record<string, string>; removes?: string[] };

export type SeedBranch = { name: string; from?: string; commits: SeedCommit[] };

export type MachineSeed = {
  cwd: string;
  files?: Record<string, string>;
  directories?: string[];
  repo?: {
    branch?: string;
    config?: Record<string, string>;
    commits?: SeedCommit[];
    branches?: SeedBranch[];
    remote?: { name: string; url: string; synced?: boolean };
  };
};

type Position = { hash: string | null; snapshot: Snapshot };

function applyCommits(repo: Repo, start: Position, commits: SeedCommit[]): Position {
  let position = start;

  for (const entry of commits) {
    const snapshot: Snapshot = { ...position.snapshot };
    for (const [path, content] of Object.entries(entry.files ?? {})) {
      snapshot[path] = writeBlob(repo, content);
    }
    for (const path of entry.removes ?? []) delete snapshot[path];

    const sequence = Object.keys(repo.commits).length;
    const hash = writeBlob(repo, `${entry.message}|${sequence}|${JSON.stringify(snapshot)}`);
    repo.commits[hash] = {
      hash,
      message: entry.message,
      parents: position.hash ? [position.hash] : [],
      author: repo.config["user.name"] ?? "dev",
      timestamp: Date.now() - 86_400_000 + sequence * 60_000,
      snapshot,
    };
    position = { hash, snapshot };
  }

  return position;
}

export function createMachine(seed: MachineSeed): Machine {
  const fs = createRoot();
  mkdirp(fs, seed.cwd);

  for (const dir of seed.directories ?? []) mkdirp(fs, `${seed.cwd}/${dir}`);
  for (const [path, content] of Object.entries(seed.files ?? {})) {
    writeFile(fs, `${seed.cwd}/${path}`, content);
  }

  const machine: Machine = { fs, cwd: seed.cwd, repo: null };
  if (!seed.repo) return machine;

  const repo = createRepo(seed.cwd);
  repo.config = { "user.name": "dev", "user.email": "dev@pulso.studio", ...seed.repo.config };
  mkdirp(fs, `${seed.cwd}/.git`);

  const main = seed.repo.branch ?? "main";
  const base = applyCommits(repo, { hash: null, snapshot: {} }, seed.repo.commits ?? []);
  if (base.hash) repo.branches[main] = base.hash;

  for (const branch of seed.repo.branches ?? []) {
    const fromHash = branch.from ? repo.branches[branch.from] : base.hash;
    const fromSnapshot = fromHash ? (repo.commits[fromHash]?.snapshot ?? {}) : {};
    const tip = applyCommits(repo, { hash: fromHash ?? null, snapshot: fromSnapshot }, branch.commits);
    if (tip.hash) repo.branches[branch.name] = tip.hash;
  }

  repo.head = { kind: "branch", name: main };
  repo.index = { ...base.snapshot };

  if (seed.repo.remote) {
    repo.remote = {
      name: seed.repo.remote.name,
      url: seed.repo.remote.url,
      branches: {},
      commits: {},
      objects: {},
    };
    if (seed.repo.remote.synced && base.hash) {
      repo.remote.branches[main] = base.hash;
      repo.remote.commits = { ...repo.commits };
      repo.remote.objects = { ...repo.objects };
    }
  }

  machine.repo = repo;
  if (base.hash) applySnapshot(fs, repo, base.snapshot);

  for (const [path, content] of Object.entries(seed.files ?? {})) {
    writeFile(fs, `${seed.cwd}/${path}`, content);
  }

  return machine;
}

export function runCommand(machine: Machine, line: string): CommandResult {
  const [command, ...args] = parseLine(line.trim());

  if (!command) return { output: "" };
  if (command === "git") return runGit(machine, args);
  return runShell(machine, command, args);
}

export function prompt(machine: Machine): string {
  const folder = machine.cwd.split("/").filter(Boolean).pop() ?? "/";
  const branch = machine.repo && machine.repo.head.kind === "branch" ? machine.repo.head.name : null;
  return branch ? `~/${folder} (${branch})` : `~/${folder}`;
}
