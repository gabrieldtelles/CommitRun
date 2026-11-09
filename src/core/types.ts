import type { VDir } from "./fs";

export type Snapshot = Record<string, string>;

export type Commit = {
  hash: string;
  message: string;
  parents: string[];
  author: string;
  timestamp: number;
  snapshot: Snapshot;
};

export type Head = { kind: "branch"; name: string } | { kind: "detached"; hash: string };

export type MergeState = {
  sourceBranch: string;
  sourceHash: string;
  conflicts: string[];
};

export type Remote = {
  name: string;
  url: string;
  branches: Record<string, string>;
  commits: Record<string, Commit>;
  objects: Record<string, string>;
};

export type EntradaDeReflog = { hash: string; acao: string; em: number };

export type Guardado = {
  mensagem: string;
  mudancas: Snapshot;
  removidos: string[];
  branch: string;
  em: number;
};

export type Etiqueta = { hash: string; mensagem?: string };

export type Repo = {
  root: string;
  objects: Record<string, string>;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head: Head;
  index: Snapshot;
  config: Record<string, string>;
  remote: Remote | null;
  merge: MergeState | null;
  reflog: EntradaDeReflog[];
  stash: Guardado[];
  tags: Record<string, Etiqueta>;
};

export type Machine = {
  fs: VDir;
  cwd: string;
  repo: Repo | null;
};

export type CommandEffect = { type: "clear" } | { type: "edit"; path: string };

export type CommandResult = {
  output: string;
  error?: boolean;
  effect?: CommandEffect;
};
