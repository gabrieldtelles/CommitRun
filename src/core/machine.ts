import { createRoot, mkdirp, writeFile } from "./fs";
import { runGit } from "./git";
import { parseLine, runShell } from "./shell";
import { createRepo, writeBlob } from "./repo";
import type { CommandResult, Machine, Snapshot } from "./types";

export type MachineSeed = {
  cwd: string;
  files?: Record<string, string>;
  directories?: string[];
  repo?: {
    commits: { message: string; files: Record<string, string> }[];
    branch?: string;
    config?: Record<string, string>;
  };
};

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
  repo.config = { "user.name": "dev", ...seed.repo.config };
  mkdirp(fs, `${seed.cwd}/.git`);

  let parent: string | null = null;
  let snapshot: Snapshot = {};

  seed.repo.commits.forEach((entry, position) => {
    snapshot = { ...snapshot };
    for (const [path, content] of Object.entries(entry.files)) {
      snapshot[path] = writeBlob(repo, content);
      writeFile(fs, `${seed.cwd}/${path}`, content);
    }

    const timestamp = Date.now() - (seed.repo!.commits.length - position) * 60_000;
    const hash = writeBlob(repo, `${entry.message}|${position}|${JSON.stringify(snapshot)}`);
    repo.commits[hash] = {
      hash,
      message: entry.message,
      parents: parent ? [parent] : [],
      author: repo.config["user.name"] ?? "dev",
      timestamp,
      snapshot,
    };
    parent = hash;
  });

  const branch = seed.repo.branch ?? "main";
  if (parent) repo.branches[branch] = parent;
  repo.head = { kind: "branch", name: branch };
  repo.index = { ...snapshot };

  machine.repo = repo;
  return machine;
}

export function runCommand(machine: Machine, line: string): CommandResult {
  const tokens = parseLine(line.trim());
  const [command, ...args] = tokens;

  if (!command) return { output: "" };
  if (command === "git") return runGit(machine, args);
  return runShell(machine, command, args);
}

export function prompt(machine: Machine): string {
  const folder = machine.cwd.split("/").filter(Boolean).pop() ?? "/";
  const branch = machine.repo && machine.repo.head.kind === "branch" ? machine.repo.head.name : null;
  return branch ? `~/${folder} (${branch})` : `~/${folder}`;
}
