import { missions } from "@/content/missions";
import { chaveDoDia, calcularSequencia, xpDaSemana } from "@/lib/temporada";
import { estaVencida, xpDeRevisao } from "@/lib/revisao";
import { xpGanho } from "@/lib/progresso";
import { obterDeposito } from "./deposito";

const MAPA = "commitrun:progresso";

export type ConclusaoSalva = {
  concluidaEm: number;
  revisoes: number;
  ultimaEm: number;
  dicas: number;
};

export type ProgressoSalvo = {
  missoes: Record<string, ConclusaoSalva>;
  atividade: Record<string, number>;
  xp: number;
  atualizadoEm: number;
};

export type MissaoEnviada = { id: string; revisoes?: number; dicas?: number };

const VAZIO: ProgressoSalvo = { missoes: {}, atividade: {}, xp: 0, atualizadoEm: 0 };

const catalogo = new Map(missions.map((mission) => [mission.id, mission]));

export function calcularXp(salvas: Record<string, ConclusaoSalva>): number {
  let total = 0;
  for (const [id, conclusao] of Object.entries(salvas)) {
    const mission = catalogo.get(id);
    if (!mission) continue;
    total += xpGanho(mission, conclusao.dicas) + conclusao.revisoes * xpDeRevisao(mission);
  }
  return total;
}

function migrar(bruto: unknown): ProgressoSalvo {
  if (!bruto || typeof bruto !== "object") return { ...VAZIO };
  const dados = bruto as Partial<ProgressoSalvo> & { missoes?: unknown };

  if (Array.isArray(dados.missoes)) {
    const agora = Date.now();
    const missoes: Record<string, ConclusaoSalva> = {};
    for (const id of dados.missoes) {
      if (typeof id === "string" && catalogo.has(id)) {
        missoes[id] = { concluidaEm: agora, revisoes: 0, ultimaEm: agora, dicas: 0 };
      }
    }
    return { missoes, atividade: {}, xp: calcularXp(missoes), atualizadoEm: agora };
  }

  const missoes: Record<string, ConclusaoSalva> = {};
  for (const [id, valor] of Object.entries(dados.missoes ?? {})) {
    if (!catalogo.has(id) || !valor || typeof valor !== "object") continue;
    const conclusao = valor as Partial<ConclusaoSalva>;
    missoes[id] = {
      concluidaEm: Number(conclusao.concluidaEm) || 0,
      revisoes: Math.max(0, Number(conclusao.revisoes) || 0),
      ultimaEm: Number(conclusao.ultimaEm) || Number(conclusao.concluidaEm) || 0,
      dicas: Math.max(0, Number(conclusao.dicas) || 0),
    };
  }

  const atividade: Record<string, number> = {};
  for (const [dia, xp] of Object.entries(dados.atividade ?? {})) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dia) && typeof xp === "number" && xp > 0) atividade[dia] = xp;
  }

  return { missoes, atividade, xp: calcularXp(missoes), atualizadoEm: Number(dados.atualizadoEm) || 0 };
}

export async function lerProgresso(contaId: string): Promise<ProgressoSalvo> {
  const bruto = await obterDeposito().obterCampo(MAPA, contaId);
  if (!bruto) return { ...VAZIO };

  try {
    return migrar(JSON.parse(bruto));
  } catch {
    return { ...VAZIO };
  }
}

export async function sincronizarProgresso(
  contaId: string,
  enviadas: MissaoEnviada[],
  agora = Date.now(),
): Promise<ProgressoSalvo> {
  const atual = await lerProgresso(contaId);
  const missoes = { ...atual.missoes };

  for (const enviada of enviadas) {
    if (!catalogo.has(enviada.id)) continue;
    const salva = missoes[enviada.id];

    const dicas = Math.max(0, Math.min(3, Number(enviada.dicas) || 0));

    if (!salva) {
      missoes[enviada.id] = { concluidaEm: agora, revisoes: 0, ultimaEm: agora, dicas };
      continue;
    }

    const comDicas = { ...salva, dicas: Math.max(salva.dicas, dicas) };
    const pedidas = Math.max(0, Number(enviada.revisoes) || 0);
    const podeRevisar = pedidas > salva.revisoes && estaVencida(salva.revisoes, salva.ultimaEm, agora);

    missoes[enviada.id] = podeRevisar
      ? { ...comDicas, revisoes: salva.revisoes + 1, ultimaEm: agora }
      : comDicas;
  }

  const xp = calcularXp(missoes);
  const ganho = xp - atual.xp;
  const atividade = { ...atual.atividade };

  if (ganho > 0) {
    const hoje = chaveDoDia(agora);
    atividade[hoje] = (atividade[hoje] ?? 0) + ganho;
  }

  const atualizado: ProgressoSalvo = { missoes, atividade, xp, atualizadoEm: agora };

  if (ganho !== 0 || Object.keys(missoes).length !== Object.keys(atual.missoes).length) {
    await obterDeposito().definirCampo(MAPA, contaId, JSON.stringify(atualizado));
  }

  return atualizado;
}

export function resumoDoProgresso(progresso: ProgressoSalvo, agora = Date.now()) {
  return {
    xp: progresso.xp,
    missoes: Object.keys(progresso.missoes).length,
    xpDaSemana: xpDaSemana(progresso.atividade, agora),
    sequencia: calcularSequencia(progresso.atividade, agora),
  };
}
