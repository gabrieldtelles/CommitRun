import { shortHash } from "../hash";
import {
  ancestry,
  applySnapshot,
  createCommit,
  diffSnapshots,
  headHash,
  mergeBase,
  registrarReflog,
  status,
} from "../repo";
import type { CommandResult, Commit, Repo, Snapshot } from "../types";
import { fail, ok, type GitContext } from "./context";
import { resolveRevision } from "./revision";

type Aplicacao = { snapshot: Snapshot; conflitos: string[] };

function paiDe(repo: Repo, commit: Commit): Snapshot {
  const pai = commit.parents[0];
  return pai ? (repo.commits[pai]?.snapshot ?? {}) : {};
}

function aplicarMudancas(base: Snapshot, antes: Snapshot, depois: Snapshot): Aplicacao {
  const snapshot: Snapshot = { ...base };
  const conflitos: string[] = [];

  for (const mudanca of diffSnapshots(antes, depois)) {
    const naBase = base[mudanca.path];
    const noAntes = antes[mudanca.path];

    if (naBase !== undefined && noAntes !== undefined && naBase !== noAntes) {
      conflitos.push(mudanca.path);
      continue;
    }

    const novo = depois[mudanca.path];
    if (novo === undefined) delete snapshot[mudanca.path];
    else snapshot[mudanca.path] = novo;
  }

  return { snapshot, conflitos };
}

function exigirArvoreLimpa(ctx: GitContext, comando: string): CommandResult | null {
  const atual = status(ctx.machine.fs, ctx.repo);
  if (atual.staged.length === 0 && atual.unstaged.length === 0) return null;
  return fail(`error: your local changes would be overwritten by ${comando}.\nPlease commit them first.`);
}

function mover(repo: Repo, hash: string): void {
  if (repo.head.kind === "branch") repo.branches[repo.head.name] = hash;
  else repo.head = { kind: "detached", hash };
}

export function gitRevert(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const bloqueio = exigirArvoreLimpa(ctx, "revert");
  if (bloqueio) return bloqueio;

  const revisao = args.find((arg) => !arg.startsWith("-"));
  if (!revisao) return fail("usage: git revert <commit>");

  const hash = resolveRevision(repo, revisao);
  const commit = hash ? repo.commits[hash] : null;
  if (!commit) return fail(`fatal: bad revision '${revisao}'`);

  const atual = headHash(repo);
  const base = atual ? (repo.commits[atual]?.snapshot ?? {}) : {};
  const { snapshot, conflitos } = aplicarMudancas(base, commit.snapshot, paiDe(repo, commit));

  if (conflitos.length > 0) {
    return fail(
      `error: could not revert ${shortHash(commit.hash)}\nhint: conflito em ${conflitos.join(", ")}`,
    );
  }

  const novo = createCommit(repo, `Revert "${commit.message}"`, atual ? [atual] : [], snapshot);
  mover(repo, novo.hash);
  repo.index = { ...snapshot };
  applySnapshot(machine.fs, repo, snapshot);
  registrarReflog(repo, `revert: ${commit.message}`);

  return ok(`[${shortHash(novo.hash)}] Revert "${commit.message}"`);
}

export function gitCherryPick(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const bloqueio = exigirArvoreLimpa(ctx, "cherry-pick");
  if (bloqueio) return bloqueio;

  const revisao = args.find((arg) => !arg.startsWith("-"));
  if (!revisao) return fail("usage: git cherry-pick <commit>");

  const hash = resolveRevision(repo, revisao);
  const commit = hash ? repo.commits[hash] : null;
  if (!commit) return fail(`fatal: bad revision '${revisao}'`);

  const atual = headHash(repo);
  const base = atual ? (repo.commits[atual]?.snapshot ?? {}) : {};
  const { snapshot, conflitos } = aplicarMudancas(base, paiDe(repo, commit), commit.snapshot);

  if (conflitos.length > 0) {
    return fail(
      `error: could not apply ${shortHash(commit.hash)}\nhint: conflito em ${conflitos.join(", ")}`,
    );
  }

  const novo = createCommit(repo, commit.message, atual ? [atual] : [], snapshot);
  mover(repo, novo.hash);
  repo.index = { ...snapshot };
  applySnapshot(machine.fs, repo, snapshot);
  registrarReflog(repo, `cherry-pick: ${commit.message}`);

  return ok(`[${shortHash(novo.hash)}] ${commit.message}`);
}

export function gitRebase(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const bloqueio = exigirArvoreLimpa(ctx, "rebase");
  if (bloqueio) return bloqueio;

  const alvo = args.find((arg) => !arg.startsWith("-"));
  if (!alvo) return fail("usage: git rebase <branch>");

  const destino = repo.branches[alvo] ?? resolveRevision(repo, alvo);
  const atual = headHash(repo);

  if (!destino) return fail(`fatal: invalid upstream '${alvo}'`);
  if (!atual) return fail("fatal: no commits to rebase");
  if (destino === atual) return ok("Current branch is up to date.");

  const base = mergeBase(repo, atual, destino);
  if (base === destino) return ok(`Current branch is up to date with ${alvo}.`);

  const daBase = new Set(ancestry(repo, base));
  const pendentes = ancestry(repo, atual)
    .filter((item) => !daBase.has(item))
    .map((item) => repo.commits[item])
    .filter((commit): commit is Commit => Boolean(commit))
    .sort((a, b) => a.timestamp - b.timestamp);

  let cursor = destino;
  let snapshot = repo.commits[destino]?.snapshot ?? {};

  for (const commit of pendentes) {
    const aplicado = aplicarMudancas(snapshot, paiDe(repo, commit), commit.snapshot);
    if (aplicado.conflitos.length > 0) {
      return fail(
        `error: could not apply ${shortHash(commit.hash)}... ${commit.message}\nhint: conflito em ${aplicado.conflitos.join(", ")}`,
      );
    }

    const novo = createCommit(repo, commit.message, [cursor], aplicado.snapshot);
    cursor = novo.hash;
    snapshot = aplicado.snapshot;
  }

  mover(repo, cursor);
  repo.index = { ...snapshot };
  applySnapshot(machine.fs, repo, snapshot);
  registrarReflog(repo, `rebase: onto ${alvo}`);

  const nome = repo.head.kind === "branch" ? repo.head.name : "HEAD";
  return ok(
    `Successfully rebased and updated ${nome}.\n ${pendentes.length} commit(s) reaplicados sobre ${alvo}`,
  );
}
