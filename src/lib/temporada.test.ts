import { describe, expect, it } from "vitest";
import { calcularSequencia, chaveDoDia, diasDaSemana, inicioDaSemana, xpDaSemana } from "./temporada";

const SEGUNDA = new Date(2026, 10, 9, 15, 0, 0);
const QUARTA = new Date(2026, 10, 11, 9, 0, 0);
const DOMINGO = new Date(2026, 10, 15, 23, 0, 0);

describe("temporada semanal", () => {
  it("abre a semana na segunda-feira", () => {
    expect(chaveDoDia(inicioDaSemana(SEGUNDA))).toBe("2026-11-09");
    expect(chaveDoDia(inicioDaSemana(QUARTA))).toBe("2026-11-09");
    expect(chaveDoDia(inicioDaSemana(DOMINGO))).toBe("2026-11-09");
  });

  it("lista os sete dias da semana corrente", () => {
    expect(diasDaSemana(QUARTA)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
  });

  it("soma apenas o xp ganho dentro da semana", () => {
    const atividade = { "2026-11-08": 100, "2026-11-09": 40, "2026-11-11": 60, "2026-11-16": 999 };
    expect(xpDaSemana(atividade, QUARTA)).toBe(100 - 100 + 40 + 60);
  });
});

describe("sequência de dias", () => {
  it("conta dias seguidos terminando hoje", () => {
    const atividade = { "2026-11-09": 10, "2026-11-10": 10, "2026-11-11": 10 };
    expect(calcularSequencia(atividade, QUARTA)).toEqual({ atual: 3, recorde: 3 });
  });

  it("mantém a sequência viva se o último dia foi ontem", () => {
    const atividade = { "2026-11-09": 10, "2026-11-10": 10 };
    expect(calcularSequencia(atividade, QUARTA).atual).toBe(2);
  });

  it("zera a sequência quando houve buraco de dois dias", () => {
    const atividade = { "2026-11-05": 10, "2026-11-06": 10 };
    const sequencia = calcularSequencia(atividade, QUARTA);
    expect(sequencia.atual).toBe(0);
    expect(sequencia.recorde).toBe(2);
  });

  it("guarda o recorde mesmo depois de quebrar a sequência", () => {
    const atividade = {
      "2026-11-01": 10,
      "2026-11-02": 10,
      "2026-11-03": 10,
      "2026-11-04": 10,
      "2026-11-11": 10,
    };
    expect(calcularSequencia(atividade, QUARTA)).toEqual({ atual: 1, recorde: 4 });
  });

  it("ignora dias sem xp", () => {
    expect(calcularSequencia({ "2026-11-11": 0 }, QUARTA)).toEqual({ atual: 0, recorde: 0 });
  });
});
