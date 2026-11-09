import { missions } from "@/content/missions";

export type Apuracao = { xp: number; validas: number };

export function apurarPontuacao(ids: string[]): Apuracao {
  const unicos = new Set(ids);
  let xp = 0;
  let validas = 0;

  for (const mission of missions) {
    if (!unicos.has(mission.id)) continue;
    xp += mission.xp;
    validas += 1;
  }

  return { xp, validas };
}
