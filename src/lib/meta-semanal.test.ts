import { describe, expect, it } from "vitest";
import { metaConcluida, metaDaSemana, progressoDaMeta } from "./meta-semanal";

const QUARTA = new Date(2026, 10, 11);
const SEMANA_SEGUINTE = new Date(2026, 10, 18);

describe("meta da semana", () => {
  it("entrega a mesma meta para qualquer dia da mesma semana", () => {
    expect(metaDaSemana(new Date(2026, 10, 9))).toEqual(metaDaSemana(new Date(2026, 10, 15)));
  });

  it("troca de meta quando vira a semana", () => {
    expect(metaDaSemana(QUARTA).tipo).not.toBe(metaDaSemana(SEMANA_SEGUINTE).tipo);
  });

  it("sempre define alvo e bônus positivos", () => {
    for (let semana = 0; semana < 12; semana += 1) {
      const meta = metaDaSemana(new Date(2026, 0, 5 + semana * 7));
      expect(meta.alvo).toBeGreaterThan(0);
      expect(meta.bonus).toBeGreaterThan(0);
      expect(meta.descricao).toContain(String(meta.alvo));
    }
  });

  it("conta missões concluídas dentro da semana", () => {
    const meta = { tipo: "missoes" as const, titulo: "", descricao: "", alvo: 2, bonus: 50 };
    const dados = {
      missoes: {
        c1m1: { concluidaEm: new Date(2026, 10, 10).getTime(), ultimaEm: 0, revisoes: 0 },
        c1m2: { concluidaEm: new Date(2026, 10, 11).getTime(), ultimaEm: 0, revisoes: 0 },
        c1m3: { concluidaEm: new Date(2026, 10, 2).getTime(), ultimaEm: 0, revisoes: 0 },
      },
      atividade: {},
    };

    expect(progressoDaMeta(meta, dados, QUARTA)).toBe(2);
    expect(metaConcluida(meta, 2)).toBe(true);
  });

  it("conta dias distintos de prática", () => {
    const meta = { tipo: "dias" as const, titulo: "", descricao: "", alvo: 3, bonus: 90 };
    const dados = {
      missoes: {},
      atividade: { "2026-11-09": 40, "2026-11-11": 20, "2026-11-02": 80, "2026-11-12": 0 },
    };

    expect(progressoDaMeta(meta, dados, QUARTA)).toBe(2);
  });

  it("conta revisões fechadas na semana", () => {
    const meta = { tipo: "revisoes" as const, titulo: "", descricao: "", alvo: 2, bonus: 40 };
    const dados = {
      missoes: {
        c1m1: { concluidaEm: 0, ultimaEm: new Date(2026, 10, 10).getTime(), revisoes: 1 },
        c1m2: { concluidaEm: 0, ultimaEm: new Date(2026, 10, 11).getTime(), revisoes: 0 },
      },
      atividade: {},
    };

    expect(progressoDaMeta(meta, dados, QUARTA)).toBe(1);
  });
});
