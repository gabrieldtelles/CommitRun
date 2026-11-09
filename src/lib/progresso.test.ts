import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import {
  estaDesbloqueada,
  nivel,
  ordenadas,
  patente,
  percentualConcluido,
  proximaMissao,
  xpGanho,
  type Progresso,
} from "./progresso";

const vazio: Progresso = { xp: 0, missoes: {} };

describe("progresso", () => {
  it("sobe de nível a cada faixa de xp", () => {
    expect(nivel(0)).toBe(1);
    expect(nivel(199)).toBe(1);
    expect(nivel(200)).toBe(2);
    expect(patente(0)).toBe("estagiário");
    expect(patente(1000)).toBe("mantenedor");
  });

  it("desconta xp por dica usada, com piso", () => {
    const mission = missions[0]!;
    expect(xpGanho(mission, 0)).toBe(mission.xp);
    expect(xpGanho(mission, 1)).toBe(Math.round(mission.xp * 0.9));
    expect(xpGanho(mission, 5)).toBe(Math.round(mission.xp * 0.7));
  });

  it("libera apenas a primeira missão no início", () => {
    const [primeira, segunda] = ordenadas();
    expect(estaDesbloqueada(primeira!, vazio)).toBe(true);
    expect(estaDesbloqueada(segunda!, vazio)).toBe(false);
  });

  it("libera a próxima missão depois de concluir a anterior", () => {
    const [primeira, segunda] = ordenadas();
    const progresso: Progresso = {
      xp: primeira!.xp,
      missoes: { [primeira!.id]: { revisoes: 0, ultimaEm: Date.now() } },
    };

    expect(estaDesbloqueada(segunda!, progresso)).toBe(true);
    expect(proximaMissao(progresso)?.id).toBe(segunda!.id);
    expect(percentualConcluido(progresso)).toBe(Math.round((1 / missions.length) * 100));
  });
});
