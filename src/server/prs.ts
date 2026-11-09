import { missions } from "@/content/missions";
import {
  MAX_ARQUIVOS,
  MAX_LINHAS_POR_ARQUIVO,
  REVIEWS_NECESSARIOS,
  XP_POR_REVIEW,
  podeRevisar,
  qualidadeDoReview,
  xpDaAvaliacao,
  type ArquivoDoPr,
  type ComentarioDeReview,
  type PullRequest,
  type Review,
  type Veredito,
} from "@/lib/pull-request";
import { obterDeposito } from "./deposito";
import { creditarXp } from "./progresso-do-usuario";

const MAPA = "commitrun:prs";
const LIMITE_DE_LISTA = 60;

export type Autor = { contaId: string; apelido: string; avatar: string | null };

export type DadosDoPr = {
  missaoId: string;
  titulo: string;
  descricao: string;
  arquivos: ArquivoDoPr[];
};

export type DadosDoReview = {
  veredito: Veredito;
  resumo: string;
  comentarios: ComentarioDeReview[];
};

export class ErroDeRegra extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

const catalogo = new Map(missions.map((mission) => [mission.id, mission]));

function identificador(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function limitar(texto: string, maximo: number): string {
  return texto.trim().slice(0, maximo);
}

function converter(bruto: string): PullRequest | null {
  try {
    const dados = JSON.parse(bruto) as PullRequest;
    return typeof dados?.id === "string" && Array.isArray(dados.arquivos) ? dados : null;
  } catch {
    return null;
  }
}

export async function listarPrs(): Promise<PullRequest[]> {
  const valores = await obterDeposito().listarValores(MAPA);
  return valores
    .map(converter)
    .filter((item): item is PullRequest => item !== null)
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .slice(0, LIMITE_DE_LISTA);
}

export async function lerPr(id: string): Promise<PullRequest | null> {
  const bruto = await obterDeposito().obterCampo(MAPA, id);
  return bruto ? converter(bruto) : null;
}

async function gravar(pr: PullRequest): Promise<void> {
  await obterDeposito().definirCampo(MAPA, pr.id, JSON.stringify(pr));
}

export async function abrirPr(autor: Autor, dados: DadosDoPr): Promise<PullRequest> {
  const mission = catalogo.get(dados.missaoId);
  if (!mission) throw new ErroDeRegra("missão desconhecida");

  const arquivos = dados.arquivos.slice(0, MAX_ARQUIVOS).map((arquivo) => ({
    caminho: limitar(arquivo.caminho, 120),
    diff: arquivo.diff.split("\n").slice(0, MAX_LINHAS_POR_ARQUIVO).join("\n"),
  }));

  if (arquivos.length === 0) throw new ErroDeRegra("o pull request precisa de pelo menos um arquivo");

  const titulo = limitar(dados.titulo, 120);
  if (titulo.length < 5) throw new ErroDeRegra("o título precisa explicar a mudança");

  const existentes = await listarPrs();
  const abertoDaMesmaMissao = existentes.find(
    (pr) => pr.autorId === autor.contaId && pr.missaoId === dados.missaoId,
  );
  if (abertoDaMesmaMissao) {
    throw new ErroDeRegra("você já abriu um pull request desta missão", 409);
  }

  const pr: PullRequest = {
    id: identificador(),
    autorId: autor.contaId,
    autorApelido: autor.apelido,
    autorAvatar: autor.avatar,
    missaoId: mission.id,
    missaoTitulo: mission.title,
    titulo,
    descricao: limitar(dados.descricao, 600),
    arquivos,
    criadoEm: Date.now(),
    reviews: [],
  };

  await gravar(pr);
  return pr;
}

export async function registrarReview(
  prId: string,
  revisor: Autor,
  dados: DadosDoReview,
): Promise<{ pr: PullRequest; xp: number }> {
  const pr = await lerPr(prId);
  if (!pr) throw new ErroDeRegra("pull request não encontrado", 404);

  if (!podeRevisar(pr, revisor.contaId)) {
    throw new ErroDeRegra("este pull request não está disponível para você revisar", 409);
  }

  const caminhos = new Set(pr.arquivos.map((arquivo) => arquivo.caminho));
  const comentarios = dados.comentarios
    .filter((comentario) => caminhos.has(comentario.arquivo))
    .slice(0, 20)
    .map((comentario) => ({
      arquivo: comentario.arquivo,
      linha: Math.max(0, Math.round(comentario.linha)),
      texto: limitar(comentario.texto, 400),
    }))
    .filter((comentario) => comentario.texto.length > 0);

  const resumo = limitar(dados.resumo, 1000);
  const faltas = qualidadeDoReview(resumo, comentarios);
  if (faltas.length > 0) throw new ErroDeRegra(faltas.join(" e "));

  const review: Review = {
    id: identificador(),
    revisorId: revisor.contaId,
    revisorApelido: revisor.apelido,
    revisorAvatar: revisor.avatar,
    veredito: dados.veredito,
    resumo,
    comentarios,
    criadoEm: Date.now(),
    nota: null,
    xp: XP_POR_REVIEW,
  };

  const atualizado: PullRequest = { ...pr, reviews: [...pr.reviews, review] };
  await gravar(atualizado);
  await creditarXp(revisor.contaId, XP_POR_REVIEW);

  return { pr: atualizado, xp: XP_POR_REVIEW };
}

export async function avaliarReview(
  prId: string,
  reviewId: string,
  autorId: string,
  nota: number,
): Promise<PullRequest> {
  const pr = await lerPr(prId);
  if (!pr) throw new ErroDeRegra("pull request não encontrado", 404);
  if (pr.autorId !== autorId) throw new ErroDeRegra("só o autor avalia os reviews recebidos", 403);

  const review = pr.reviews.find((item) => item.id === reviewId);
  if (!review) throw new ErroDeRegra("review não encontrado", 404);
  if (review.nota !== null) throw new ErroDeRegra("este review já foi avaliado", 409);

  const limitada = Math.min(5, Math.max(1, Math.round(nota)));
  const bonus = xpDaAvaliacao(limitada);

  const atualizado: PullRequest = {
    ...pr,
    reviews: pr.reviews.map((item) =>
      item.id === reviewId ? { ...item, nota: limitada, xp: item.xp + bonus } : item,
    ),
  };

  await gravar(atualizado);
  if (bonus > 0) await creditarXp(review.revisorId, bonus);

  return atualizado;
}

export function organizarPara(prs: PullRequest[], contaId: string) {
  return {
    fila: prs.filter((pr) => podeRevisar(pr, contaId)),
    meus: prs.filter((pr) => pr.autorId === contaId),
    revisados: prs
      .filter((pr) => pr.reviews.some((review) => review.revisorId === contaId))
      .map((pr) => ({
        pr,
        review: pr.reviews.find((review) => review.revisorId === contaId) as Review,
      })),
    necessarios: REVIEWS_NECESSARIOS,
  };
}
