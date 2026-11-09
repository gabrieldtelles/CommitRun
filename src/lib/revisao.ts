import type { Mission } from "@/content/types";

export const INTERVALOS_EM_DIAS = [2, 7, 21, 60];
const UM_DIA = 86_400_000;

export const FATOR_XP_REVISAO = 0.3;

export function xpDeRevisao(mission: Mission): number {
  return Math.round(mission.xp * FATOR_XP_REVISAO);
}

export function intervaloDe(revisoes: number): number {
  const posicao = Math.min(revisoes, INTERVALOS_EM_DIAS.length - 1);
  return INTERVALOS_EM_DIAS[posicao] ?? 60;
}

export function proximaRevisaoEm(revisoes: number, ultimaEm: number): number {
  return ultimaEm + intervaloDe(revisoes) * UM_DIA;
}

export function estaVencida(revisoes: number, ultimaEm: number, agora = Date.now()): boolean {
  return proximaRevisaoEm(revisoes, ultimaEm) <= agora;
}

export function diasAteRevisao(revisoes: number, ultimaEm: number, agora = Date.now()): number {
  const restante = proximaRevisaoEm(revisoes, ultimaEm) - agora;
  return Math.max(0, Math.ceil(restante / UM_DIA));
}

export const NIVEIS_DE_DOMINIO = ["recém-aprendido", "fixando", "consolidado", "dominado"] as const;

export function dominio(revisoes: number): string {
  const indice = Math.min(revisoes, NIVEIS_DE_DOMINIO.length - 1);
  return NIVEIS_DE_DOMINIO[indice] ?? NIVEIS_DE_DOMINIO[0];
}
