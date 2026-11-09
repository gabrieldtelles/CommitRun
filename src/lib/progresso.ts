import { missions } from "@/content/missions";
import type { Mission } from "@/content/types";

export const XP_POR_NIVEL = 200;

export const PATENTES = [
  "estagiário",
  "júnior",
  "pleno",
  "sênior",
  "tech lead",
  "mantenedor",
] as const;

export type Conclusao = { xp: number; dicas: number; concluidaEm: number };

export type Progresso = {
  xp: number;
  concluidas: Record<string, Conclusao>;
};

export function nivel(xp: number): number {
  return Math.floor(xp / XP_POR_NIVEL) + 1;
}

export function patente(xp: number): string {
  const indice = Math.min(nivel(xp) - 1, PATENTES.length - 1);
  return PATENTES[indice] ?? PATENTES[0];
}

export function xpNoNivel(xp: number): { atual: number; total: number } {
  return { atual: xp % XP_POR_NIVEL, total: XP_POR_NIVEL };
}

export function xpGanho(mission: Mission, dicas: number): number {
  const fator = Math.max(1 - dicas * 0.1, 0.7);
  return Math.round(mission.xp * fator);
}

export function ordenadas(): Mission[] {
  return [...missions].sort((a, b) => a.chapter - b.chapter || a.order - b.order);
}

export function estaDesbloqueada(mission: Mission, progresso: Progresso): boolean {
  const lista = ordenadas();
  const posicao = lista.findIndex((item) => item.id === mission.id);
  if (posicao <= 0) return true;

  const anterior = lista[posicao - 1];
  return Boolean(anterior && progresso.concluidas[anterior.id]);
}

export function proximaMissao(progresso: Progresso): Mission | null {
  return ordenadas().find((mission) => !progresso.concluidas[mission.id]) ?? null;
}

export function percentualConcluido(progresso: Progresso): number {
  const total = missions.length;
  if (total === 0) return 0;
  return Math.round((Object.keys(progresso.concluidas).length / total) * 100);
}
