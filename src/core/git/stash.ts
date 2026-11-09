import { readFile, remove, writeFile } from "../fs";
import {
  applySnapshot,
  currentBranch,
  diffSnapshots,
  headSnapshot,
  readBlob,
  status,
  workdirSnapshot,
  writeBlob,
} from "../repo";
import type { CommandResult, Guardado, Snapshot } from "../types";
import { fail, ok, type GitContext } from "./context";

function separarMudancas(ctx: GitContext): { mudancas: Snapshot; removidos: string[] } {
  const { machine, repo } = ctx;
  const base = headSnapshot(repo);
  const atual = workdirSnapshot(machine.fs, repo);

  const mudancas: Snapshot = {};
  const removidos: string[] = [];

  for (const mudanca of diffSnapshots(base, atual)) {
    if (mudanca.state === "apagado") {
      removidos.push(mudanca.path);
      continue;
    }
    const conteudo = readFile(machine.fs, `${repo.root}/${mudanca.path}`) ?? "";
    mudancas[mudanca.path] = writeBlob(repo, conteudo);
  }

  return { mudancas, removidos };
}

function reaplicar(ctx: GitContext, guardado: Guardado): void {
  const { machine, repo } = ctx;

  for (const [caminho, hash] of Object.entries(guardado.mudancas)) {
    writeFile(machine.fs, `${repo.root}/${caminho}`, readBlob(repo, hash));
    repo.index[caminho] = hash;
  }

  for (const caminho of guardado.removidos) {
    remove(machine.fs, `${repo.root}/${caminho}`);
    delete repo.index[caminho];
  }
}

const SUBCOMANDOS = ["push", "save", "list", "pop", "apply", "drop", "clear"];

export function gitStash(ctx: GitContext, args: string[]): CommandResult {
  const { machine, repo } = ctx;
  const indiceMensagem = args.findIndex((arg) => arg === "-m");
  const mensagemDaFlag = indiceMensagem >= 0 ? args[indiceMensagem + 1] : undefined;

  const positivos = args.filter((arg) => !arg.startsWith("-") && arg !== mensagemDaFlag);
  const primeiro = positivos[0];
  const acao = primeiro && SUBCOMANDOS.includes(primeiro) ? primeiro : "push";
  const resto = primeiro && SUBCOMANDOS.includes(primeiro) ? positivos.slice(1) : positivos;

  if (acao === "list") {
    if (repo.stash.length === 0) return ok("");
    return ok(
      repo.stash
        .map((item, posicao) => `stash@{${posicao}}: On ${item.branch}: ${item.mensagem}`)
        .join("\n"),
    );
  }

  if (acao === "push" || acao === "save") {
    const atual = status(machine.fs, repo);
    if (atual.staged.length === 0 && atual.unstaged.length === 0) {
      return ok("No local changes to save");
    }

    const mensagem = mensagemDaFlag || resto.join(" ") || "mudanças guardadas";
    const { mudancas, removidos } = separarMudancas(ctx);
    const base = headSnapshot(repo);

    repo.stash = [
      { mensagem, mudancas, removidos, branch: currentBranch(repo) ?? "HEAD", em: Date.now() },
      ...repo.stash,
    ];

    repo.index = { ...base };
    applySnapshot(machine.fs, repo, base);

    return ok(`Saved working directory and index state: ${mensagem}`);
  }

  if (acao === "pop" || acao === "apply") {
    const guardado = repo.stash[0];
    if (!guardado) return fail("No stash entries found.");

    reaplicar(ctx, guardado);
    if (acao === "pop") repo.stash = repo.stash.slice(1);

    return ok(
      `${acao === "pop" ? "Dropped" : "Applied"} stash@{0} (${guardado.mensagem})`,
    );
  }

  if (acao === "drop") {
    if (repo.stash.length === 0) return fail("No stash entries found.");
    const [removido, ...restantes] = repo.stash;
    repo.stash = restantes;
    return ok(`Dropped stash@{0} (${removido?.mensagem ?? ""})`);
  }

  if (acao === "clear") {
    repo.stash = [];
    return ok("");
  }

  return fail(`error: unknown subcommand: ${acao}`);
}
