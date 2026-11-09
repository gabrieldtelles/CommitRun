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
import { consultar, umaLinha } from "./bd";
import { creditarXp, garantirJogador, type Jogador } from "./progresso-do-usuario";

const LIMITE_DE_LISTA = 60;

export type Autor = Jogador;

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

type LinhaPr = {
  id: string;
  autor_id: string;
  apelido: string;
  avatar: string | null;
  missao_id: string;
  titulo: string;
  descricao: string;
  arquivos: ArquivoDoPr[];
  criado_em: Date;
};

type LinhaReview = {
  id: string;
  pr_id: string;
  revisor_id: string;
  apelido: string;
  avatar: string | null;
  veredito: Veredito;
  resumo: string;
  comentarios: ComentarioDeReview[];
  nota: number | null;
  xp: number;
  criado_em: Date;
};

function montarReview(linha: LinhaReview): Review {
  return {
    id: linha.id,
    revisorId: linha.revisor_id,
    revisorApelido: linha.apelido,
    revisorAvatar: linha.avatar,
    veredito: linha.veredito,
    resumo: linha.resumo,
    comentarios: linha.comentarios ?? [],
    criadoEm: new Date(linha.criado_em).getTime(),
    nota: linha.nota === null ? null : Number(linha.nota),
    xp: Number(linha.xp),
  };
}

function montarPr(linha: LinhaPr, reviews: Review[]): PullRequest {
  return {
    id: linha.id,
    autorId: linha.autor_id,
    autorApelido: linha.apelido,
    autorAvatar: linha.avatar,
    missaoId: linha.missao_id,
    missaoTitulo: catalogo.get(linha.missao_id)?.title ?? linha.missao_id,
    titulo: linha.titulo,
    descricao: linha.descricao,
    arquivos: linha.arquivos ?? [],
    criadoEm: new Date(linha.criado_em).getTime(),
    reviews,
  };
}

async function reviewsDe(prIds: string[]): Promise<Map<string, Review[]>> {
  const mapa = new Map<string, Review[]>();
  if (prIds.length === 0) return mapa;

  const linhas = await consultar<LinhaReview>(
    `SELECT r.*, j.apelido, j.avatar
     FROM reviews r
     JOIN jogadores j ON j.conta_id = r.revisor_id
     WHERE r.pr_id = ANY($1)
     ORDER BY r.criado_em ASC`,
    [prIds],
  );

  for (const linha of linhas) {
    const atuais = mapa.get(linha.pr_id) ?? [];
    atuais.push(montarReview(linha));
    mapa.set(linha.pr_id, atuais);
  }

  return mapa;
}

export async function listarPrs(): Promise<PullRequest[]> {
  const linhas = await consultar<LinhaPr>(
    `SELECT p.*, j.apelido, j.avatar
     FROM pull_requests p
     JOIN jogadores j ON j.conta_id = p.autor_id
     ORDER BY p.criado_em DESC
     LIMIT ${LIMITE_DE_LISTA}`,
  );

  const reviews = await reviewsDe(linhas.map((linha) => linha.id));
  return linhas.map((linha) => montarPr(linha, reviews.get(linha.id) ?? []));
}

export async function lerPr(id: string): Promise<PullRequest | null> {
  const linha = await umaLinha<LinhaPr>(
    `SELECT p.*, j.apelido, j.avatar
     FROM pull_requests p
     JOIN jogadores j ON j.conta_id = p.autor_id
     WHERE p.id = $1`,
    [id],
  );

  if (!linha) return null;

  const reviews = await reviewsDe([id]);
  return montarPr(linha, reviews.get(id) ?? []);
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

  await garantirJogador(autor);

  const id = identificador();
  const inserido = await consultar(
    `INSERT INTO pull_requests (id, autor_id, missao_id, titulo, descricao, arquivos)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (autor_id, missao_id) DO NOTHING
     RETURNING id`,
    [id, autor.contaId, mission.id, titulo, limitar(dados.descricao, 600), JSON.stringify(arquivos)],
  );

  if (inserido.length === 0) {
    throw new ErroDeRegra("você já abriu um pull request desta missão", 409);
  }

  const pr = await lerPr(id);
  if (!pr) throw new ErroDeRegra("não foi possível abrir o pull request", 503);
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

  await garantirJogador(revisor);

  const inserido = await consultar(
    `INSERT INTO reviews (id, pr_id, revisor_id, veredito, resumo, comentarios, xp)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     ON CONFLICT (pr_id, revisor_id) DO NOTHING
     RETURNING id`,
    [
      identificador(),
      prId,
      revisor.contaId,
      dados.veredito,
      resumo,
      JSON.stringify(comentarios),
      XP_POR_REVIEW,
    ],
  );

  if (inserido.length === 0) throw new ErroDeRegra("você já revisou este pull request", 409);

  await creditarXp(revisor.contaId, XP_POR_REVIEW);

  const atualizado = await lerPr(prId);
  return { pr: atualizado as PullRequest, xp: XP_POR_REVIEW };
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

  const atualizados = await consultar(
    `UPDATE reviews SET nota = $2, xp = xp + $3
     WHERE id = $1 AND nota IS NULL
     RETURNING id`,
    [reviewId, limitada, bonus],
  );

  if (atualizados.length === 0) throw new ErroDeRegra("este review já foi avaliado", 409);
  if (bonus > 0) await creditarXp(review.revisorId, bonus);

  return (await lerPr(prId)) as PullRequest;
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
