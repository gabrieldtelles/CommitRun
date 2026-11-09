import { shortHash } from "../hash";
import { headHash } from "../repo";
import type { CommandResult } from "../types";
import { fail, ok, type GitContext } from "./context";
import { resolveRevision } from "./revision";

export function gitTag(ctx: GitContext, args: string[]): CommandResult {
  const { repo } = ctx;
  const nomes = args.filter((arg) => !arg.startsWith("-"));
  const anotada = args.includes("-a");
  const apagar = args.includes("-d");

  const indiceMensagem = args.findIndex((arg) => arg === "-m");
  const mensagem = indiceMensagem >= 0 ? args[indiceMensagem + 1] : undefined;
  const nome = nomes.find((item) => item !== mensagem);

  if (apagar) {
    if (!nome || !repo.tags[nome]) return fail(`error: tag '${nome ?? ""}' not found.`);
    const alvo = repo.tags[nome];
    delete repo.tags[nome];
    return ok(`Deleted tag '${nome}' (was ${shortHash(alvo.hash)})`);
  }

  if (!nome) {
    const lista = Object.keys(repo.tags).sort();
    return ok(lista.join("\n"));
  }

  if (repo.tags[nome]) return fail(`fatal: tag '${nome}' already exists`);

  const alvoInformado = nomes.find((item) => item !== nome && item !== mensagem);
  const hash = alvoInformado ? resolveRevision(repo, alvoInformado) : headHash(repo);
  if (!hash) return fail("fatal: Failed to resolve 'HEAD' as a valid ref.");

  if (anotada && !mensagem) return fail('fatal: use git tag -a <nome> -m "mensagem"');

  repo.tags[nome] = mensagem ? { hash, mensagem } : { hash };
  return ok("");
}

export function gitReflog(ctx: GitContext): CommandResult {
  const { repo } = ctx;
  if (repo.reflog.length === 0) return ok("");

  return ok(
    repo.reflog
      .map((entrada, posicao) => `${shortHash(entrada.hash)} HEAD@{${posicao}}: ${entrada.acao}`)
      .join("\n"),
  );
}
