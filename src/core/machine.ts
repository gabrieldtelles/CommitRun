import { createRoot, mkdirp, readFile, writeFile } from "./fs";
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
    staged?: string[];
    descartado?: SeedCommit;
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
  repo.config = { "user.name": "dev", "user.email": "dev@telleslab.dev", ...seed.repo.config };
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

  if (seed.repo.descartado && base.hash) {
    const perdido = applyCommits(repo, base, [seed.repo.descartado]);
    if (perdido.hash) {
      repo.reflog = [
        { hash: base.hash, acao: "reset: moving to HEAD~1", em: Date.now() - 300_000 },
        { hash: perdido.hash, acao: `commit: ${seed.repo.descartado.message}`, em: Date.now() - 600_000 },
      ];
    }
  }

  const mainTip = repo.branches[main];
  const mainSnapshot = mainTip ? (repo.commits[mainTip]?.snapshot ?? {}) : {};
  repo.head = { kind: "branch", name: main };
  repo.index = { ...mainSnapshot };

  if (seed.repo.remote) {
    repo.remote = {
      name: seed.repo.remote.name,
      url: seed.repo.remote.url,
      branches: {},
      commits: {},
      objects: {},
    };
    if (seed.repo.remote.synced && mainTip) {
      repo.remote.branches[main] = mainTip;
      repo.remote.commits = { ...repo.commits };
      repo.remote.objects = { ...repo.objects };
    }
  }

  machine.repo = repo;
  if (mainTip) applySnapshot(fs, repo, mainSnapshot);

  for (const [path, content] of Object.entries(seed.files ?? {})) {
    writeFile(fs, `${seed.cwd}/${path}`, content);
  }

  for (const path of seed.repo.staged ?? []) {
    repo.index[path] = writeBlob(repo, readFile(fs, `${seed.cwd}/${path}`) ?? "");
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
