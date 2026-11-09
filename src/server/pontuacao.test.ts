import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import { apurarPontuacao } from "./pontuacao";

describe("apuração de pontuação", () => {
  it("ignora identificadores que não existem no catálogo", () => {
    expect(apurarPontuacao(["inexistente", "c9m9"])).toEqual({ xp: 0, validas: 0 });
  });

  it("não conta a mesma missão duas vezes", () => {
    const primeira = missions[0]!;
    expect(apurarPontuacao([primeira.id, primeira.id])).toEqual({
      xp: primeira.xp,
      validas: 1,
    });
  });

  it("soma o xp do catálogo, não o enviado pelo cliente", () => {
    const todas = missions.map((mission) => mission.id);
    const total = missions.reduce((soma, mission) => soma + mission.xp, 0);
    expect(apurarPontuacao(todas)).toEqual({ xp: total, validas: missions.length });
  });
});
