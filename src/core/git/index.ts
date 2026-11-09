import type { CommandResult, Machine } from "../types";
import { fail, notARepo, ok, requireRepo, type GitContext } from "./context";
import { gitAdd, gitConfig, gitInit, gitRestore, gitRm, gitStatus } from "./basics";
import { gitBranch, gitMerge, gitSwitch } from "./branches";
import { gitCommit } from "./commit";
import { gitLog, gitShow } from "./historico";
import { gitDiff, gitReset } from "./mudancas";
import { gitPull, gitPush, gitRemote } from "./remote";

const HELP = `comandos git disponíveis nesta simulação:

  init                      cria o repositório
  config <chave> <valor>    guarda uma configuração (ex: user.name)
  status                    mostra o que mudou
  add <arquivo>             prepara mudanças para o commit
  restore [--staged] <arq>  desfaz mudanças ou tira do stage
  rm [--cached] <arquivo>   remove um arquivo do repositório
  commit -m "mensagem"      grava um commit (--amend corrige o último)
  log [--oneline|--graph]   mostra o histórico
  show [revisão]            detalha um commit
  diff [--staged]           compara versões
  reset [--soft|--hard]     move o HEAD e desfaz commits
  branch [-d|-m] [nome]     lista, cria ou remove branches
  switch [-c] <branch>      troca de branch
  checkout [-b] <alvo>      troca de branch ou revisão
  merge <branch>            junta duas linhas de trabalho
  remote add <nome> <url>   conecta um repositório remoto
  push / pull               envia e recebe commits do remoto`;

export function runGit(machine: Machine, args: string[]): CommandResult {
  const [subcommand = "", ...rest] = args;

  if (subcommand === "" || subcommand === "help" || subcommand === "--help") {
    return ok(HELP);
  }

  if (subcommand === "init") return gitInit(machine);

  const repo = requireRepo(machine);
  if (!repo) return notARepo();

  const ctx: GitContext = { machine, repo };

  switch (subcommand) {
    case "config":
      return gitConfig(ctx, rest);
    case "status":
      return gitStatus(ctx);
    case "add":
      return gitAdd(ctx, rest);
    case "restore":
      return gitRestore(ctx, rest);
    case "rm":
      return gitRm(ctx, rest);
    case "commit":
      return gitCommit(ctx, rest);
    case "log":
      return gitLog(ctx, rest);
    case "show":
      return gitShow(ctx, rest);
    case "diff":
      return gitDiff(ctx, rest);
    case "reset":
      return gitReset(ctx, rest);
    case "branch":
      return gitBranch(ctx, rest);
    case "switch":
      return gitSwitch(ctx, rest);
    case "checkout":
      return gitSwitch(ctx, rest, true);
    case "merge":
      return gitMerge(ctx, rest);
    case "remote":
      return gitRemote(ctx, rest);
    case "push":
      return gitPush(ctx, rest);
    case "pull":
      return gitPull(ctx, rest);
    default:
      return fail(
        `git: '${subcommand}' is not a git command. Veja 'git help' para a lista de comandos.`,
      );
  }
}
