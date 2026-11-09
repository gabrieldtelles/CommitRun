import { missions } from "@/content/missions";
import { xpGanho } from "@/lib/progresso";
import { estaVencida, xpDeRevisao } from "@/lib/revisao";
import { calcularSequencia, chaveDoDia, xpDaSemana } from "@/lib/temporada";
import { consultar, umaLinha } from "./bd";

export type ConclusaoSalva = {
  concluidaEm: number;
  ultimaEm: number;
  revisoes: number;
  dicas: number;
};

export type ProgressoSalvo = {
  missoes: Record<string, ConclusaoSalva>;
  atividade: Record<string, number>;
  xpExtra: number;
  xp: number;
  atualizadoEm: number;
};

export type MissaoEnviada = { id: string; revisoes?: number; dicas?: number };

export type Jogador = { contaId: string; apelido: string; avatar: string | null };

const catalogo = new Map(missions.map((mission) => [mission.id, mission]));

export function calcularXp(salvas: Record<string, ConclusaoSalva>, xpExtra = 0): number {
  let total = Math.max(0, xpExtra);

  for (const [id, conclusao] of Object.entries(salvas)) {
    const mission = catalogo.get(id);
    if (!mission) continue;
    total += xpGanho(mission, conclusao.dicas) + conclusao.revisoes * xpDeRevisao(mission);
  }

  return total;
}

export async function garantirJogador(jogador: Jogador): Promise<void> {
  await consultar(
    `INSERT INTO jogadores (conta_id, apelido, avatar)
     VALUES ($1, $2, $3)
     ON CONFLICT (conta_id) DO UPDATE SET apelido = EXCLUDED.apelido, avatar = EXCLUDED.avatar`,
    [jogador.contaId, jogador.apelido, jogador.avatar],
  );
}

export async function lerProgresso(contaId: string): Promise<ProgressoSalvo> {
  const [jogador, feitas, dias] = await Promise.all([
    umaLinha<{ xp_extra: number; atualizado_em: Date }>(
      `SELECT xp_extra, atualizado_em FROM jogadores WHERE conta_id = $1`,
      [contaId],
    ),
    consultar<{
      missao_id: string;
      revisoes: number;
      dicas: number;
      concluida_em: Date;
      ultima_em: Date;
    }>(
      `SELECT missao_id, revisoes, dicas, concluida_em, ultima_em
       FROM missoes_feitas WHERE conta_id = $1`,
      [contaId],
    ),
    consultar<{ dia: string; xp: number }>(
      `SELECT to_char(dia, 'YYYY-MM-DD') AS dia, xp FROM atividade WHERE conta_id = $1`,
      [contaId],
    ),
  ]);

  const missoes: Record<string, ConclusaoSalva> = {};
  for (const linha of feitas) {
    if (!catalogo.has(linha.missao_id)) continue;
    missoes[linha.missao_id] = {
      concluidaEm: new Date(linha.concluida_em).getTime(),
      ultimaEm: new Date(linha.ultima_em).getTime(),
      revisoes: Number(linha.revisoes),
      dicas: Number(linha.dicas),
    };
  }

  const atividade: Record<string, number> = {};
  for (const linha of dias) atividade[linha.dia] = Number(linha.xp);

  const xpExtra = Number(jogador?.xp_extra ?? 0);

  return {
    missoes,
    atividade,
    xpExtra,
    xp: calcularXp(missoes, xpExtra),
    atualizadoEm: jogador ? new Date(jogador.atualizado_em).getTime() : 0,
  };
}

async function registrarGanho(contaId: string, ganho: number, agora: number): Promise<void> {
  if (ganho <= 0) return;

  await consultar(
    `INSERT INTO atividade (conta_id, dia, xp) VALUES ($1, $2, $3)
     ON CONFLICT (conta_id, dia) DO UPDATE SET xp = atividade.xp + EXCLUDED.xp`,
    [contaId, chaveDoDia(agora), ganho],
  );
}

async function atualizarResumo(contaId: string, progresso: ProgressoSalvo): Promise<void> {
  const sequencia = calcularSequencia(progresso.atividade);

  await consultar(
    `UPDATE jogadores
     SET xp = $2, total_missoes = $3, sequencia = $4, atualizado_em = now()
     WHERE conta_id = $1`,
    [contaId, progresso.xp, Object.keys(progresso.missoes).length, sequencia.atual],
  );
}

export async function sincronizarProgresso(
  contaId: string,
  enviadas: MissaoEnviada[],
  agora = Date.now(),
): Promise<ProgressoSalvo> {
  const atual = await lerProgresso(contaId);
  const quando = new Date(agora).toISOString();

  for (const enviada of enviadas) {
    if (!catalogo.has(enviada.id)) continue;

    const dicas = Math.max(0, Math.min(3, Number(enviada.dicas) || 0));
    const salva = atual.missoes[enviada.id];

    if (!salva) {
      await consultar(
        `INSERT INTO missoes_feitas (conta_id, missao_id, revisoes, dicas, concluida_em, ultima_em)
         VALUES ($1, $2, 0, $3, $4, $4)
         ON CONFLICT (conta_id, missao_id) DO NOTHING`,
        [contaId, enviada.id, dicas, quando],
      );
      continue;
    }

    const pedidas = Math.max(0, Number(enviada.revisoes) || 0);
    const podeRevisar =
      pedidas > salva.revisoes && estaVencida(salva.revisoes, salva.ultimaEm, agora);

    await consultar(
      `UPDATE missoes_feitas
       SET dicas = GREATEST(dicas, $3),
           revisoes = CASE WHEN $4 THEN revisoes + 1 ELSE revisoes END,
           ultima_em = CASE WHEN $4 THEN $5::timestamptz ELSE ultima_em END
       WHERE conta_id = $1 AND missao_id = $2`,
      [contaId, enviada.id, dicas, podeRevisar, quando],
    );
  }

  const atualizado = await lerProgresso(contaId);
  await registrarGanho(contaId, atualizado.xp - atual.xp, agora);

  const comAtividade = await lerProgresso(contaId);
  await atualizarResumo(contaId, comAtividade);

  return comAtividade;
}

export async function creditarXp(
  contaId: string,
  quantidade: number,
  agora = Date.now(),
): Promise<ProgressoSalvo> {
  const premio = Math.max(0, Math.round(quantidade));
  if (premio === 0) return lerProgresso(contaId);

  await consultar(`UPDATE jogadores SET xp_extra = xp_extra + $2 WHERE conta_id = $1`, [
    contaId,
    premio,
  ]);

  await registrarGanho(contaId, premio, agora);

  const progresso = await lerProgresso(contaId);
  await atualizarResumo(contaId, progresso);

  return progresso;
}

export function resumoDoProgresso(progresso: ProgressoSalvo, agora = Date.now()) {
  return {
    xp: progresso.xp,
    missoes: Object.keys(progresso.missoes).length,
    xpDaSemana: xpDaSemana(progresso.atividade, agora),
    sequencia: calcularSequencia(progresso.atividade, agora),
  };
}
