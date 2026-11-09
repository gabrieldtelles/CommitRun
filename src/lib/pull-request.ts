import { readFile } from "@/core/fs";
import { diffSnapshots, headCommit, readBlob } from "@/core/repo";
import { fileDiff } from "@/core/git/diff";
import type { Machine } from "@/core/types";
import type { Mission } from "@/content/types";

export const MAX_ARQUIVOS = 10;
export const MAX_LINHAS_POR_ARQUIVO = 200;
export const REVIEWS_NECESSARIOS = 2;
export const XP_POR_REVIEW = 60;
export const XP_BONUS_MAXIMO = 60;
export const REPUTACAO_INICIAL = 100;

export type ArquivoDoPr = { caminho: string; diff: string };

export type Veredito = "aprovado" | "mudancas";

export type ComentarioDeReview = { arquivo: string; linha: number; texto: string };

export type Review = {
  id: string;
  revisorId: string;
  revisorApelido: string;
  revisorAvatar: string | null;
  veredito: Veredito;
  resumo: string;
  comentarios: ComentarioDeReview[];
  criadoEm: number;
  nota: number | null;
  xp: number;
};

export type PullRequest = {
  id: string;
  autorId: string;
  autorApelido: string;
  autorAvatar: string | null;
  missaoId: string;
  missaoTitulo: string;
  titulo: string;
  descricao: string;
  arquivos: ArquivoDoPr[];
  criadoEm: number;
  reviews: Review[];
};

export function gerarArquivosDoPr(machine: Machine, inicial: Record<string, string>): ArquivoDoPr[] {
  const repo = machine.repo;
  if (!repo) return [];

  const final = headCommit(repo)?.snapshot ?? {};
  const arquivos: ArquivoDoPr[] = [];

  for (const mudanca of diffSnapshots(inicial, final)) {
    const antes = inicial[mudanca.path] ? readBlob(repo, inicial[mudanca.path] as string) : "";
    const depois = final[mudanca.path]
      ? readBlob(repo, final[mudanca.path] as string)
      : (readFile(machine.fs, `${repo.root}/${mudanca.path}`) ?? "");

    const diff = fileDiff(mudanca.path, antes, depois);
    if (!diff) continue;

    arquivos.push({
      caminho: mudanca.path,
      diff: diff.split("\n").slice(0, MAX_LINHAS_POR_ARQUIVO).join("\n"),
    });

    if (arquivos.length >= MAX_ARQUIVOS) break;
  }

  return arquivos;
}

export function tituloSugerido(machine: Machine, mission: Mission): string {
  const commit = machine.repo ? headCommit(machine.repo) : null;
  return commit?.message ?? mission.title;
}

export function estaAberto(pr: PullRequest): boolean {
  return pr.reviews.length < REVIEWS_NECESSARIOS;
}

export function podeRevisar(pr: PullRequest, contaId: string): boolean {
  return (
    pr.autorId !== contaId &&
    estaAberto(pr) &&
    !pr.reviews.some((review) => review.revisorId === contaId)
  );
}

export function reputacaoDe(reviews: Review[]): number {
  const avaliados = reviews.filter((review) => typeof review.nota === "number");
  if (avaliados.length === 0) return REPUTACAO_INICIAL;

  const media = avaliados.reduce((soma, review) => soma + (review.nota ?? 0), 0) / avaliados.length;
  return Math.round(REPUTACAO_INICIAL + (media - 3) * 40);
}

export function xpDaAvaliacao(nota: number): number {
  const limitada = Math.min(5, Math.max(1, Math.round(nota)));
  return Math.round(((limitada - 1) / 4) * XP_BONUS_MAXIMO);
}

export function qualidadeDoReview(resumo: string, comentarios: ComentarioDeReview[]): string[] {
  const faltas: string[] = [];
  if (resumo.trim().length < 40) faltas.push("escreva um resumo com pelo menos 40 caracteres");
  if (comentarios.length === 0) faltas.push("deixe pelo menos um comentário em uma linha do diff");
  return faltas;
}
