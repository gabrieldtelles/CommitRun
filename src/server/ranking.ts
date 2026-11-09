import { chaveDoDia, fimDaSemana, inicioDaSemana } from "@/lib/temporada";
import { consultar } from "./bd";

export type Pontuacao = {
  contaId: string;
  apelido: string;
  avatar: string | null;
  xp: number;
  xpDaSemana: number;
  missoes: number;
  sequencia: number;
};

export type Periodo = "geral" | "semana";

const LIMITE = 50;

type LinhaRanking = {
  conta_id: string;
  apelido: string;
  avatar: string | null;
  xp: number;
  xp_semana: number;
  total_missoes: number;
  sequencia: number;
};

export async function listarRanking(
  periodo: Periodo = "geral",
  agora = Date.now(),
): Promise<Pontuacao[]> {
  const ordem = periodo === "semana" ? "xp_semana" : "j.xp";
  const filtro = periodo === "semana" ? "COALESCE(SUM(a.xp), 0) > 0" : "j.xp > 0";

  const linhas = await consultar<LinhaRanking>(
    `SELECT j.conta_id, j.apelido, j.avatar, j.xp, j.total_missoes, j.sequencia,
            COALESCE(SUM(a.xp), 0)::int AS xp_semana
     FROM jogadores j
     LEFT JOIN atividade a
       ON a.conta_id = j.conta_id AND a.dia BETWEEN $1 AND $2
     GROUP BY j.conta_id
     HAVING ${filtro}
     ORDER BY ${ordem} DESC, j.total_missoes DESC, j.atualizado_em ASC
     LIMIT ${LIMITE}`,
    [chaveDoDia(inicioDaSemana(agora)), chaveDoDia(fimDaSemana(agora))],
  );

  return linhas.map((linha) => ({
    contaId: linha.conta_id,
    apelido: linha.apelido,
    avatar: linha.avatar,
    xp: Number(linha.xp),
    xpDaSemana: Number(linha.xp_semana),
    missoes: Number(linha.total_missoes),
    sequencia: Number(linha.sequencia),
  }));
}
