import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import {
  diasAteRevisao,
  dominio,
  estaVencida,
  intervaloDe,
  proximaRevisaoEm,
  xpDeRevisao,
} from "./revisao";

const UM_DIA = 86_400_000;
const AGORA = new Date(2026, 10, 11).getTime();

describe("agenda de revisão", () => {
  it("espaça cada revisão mais que a anterior", () => {
    expect(intervaloDe(0)).toBe(2);
    expect(intervaloDe(1)).toBe(7);
    expect(intervaloDe(2)).toBe(21);
    expect(intervaloDe(3)).toBe(60);
    expect(intervaloDe(99)).toBe(60);
  });

  it("vence a primeira revisão dois dias depois da conclusão", () => {
    const concluida = AGORA - 2 * UM_DIA;
    expect(proximaRevisaoEm(0, concluida)).toBe(AGORA);
    expect(estaVencida(0, concluida, AGORA)).toBe(true);
    expect(estaVencida(0, AGORA - UM_DIA, AGORA)).toBe(false);
  });

  it("informa quantos dias faltam para a próxima revisão", () => {
    expect(diasAteRevisao(0, AGORA, AGORA)).toBe(2);
    expect(diasAteRevisao(1, AGORA - 3 * UM_DIA, AGORA)).toBe(4);
    expect(diasAteRevisao(0, AGORA - 10 * UM_DIA, AGORA)).toBe(0);
  });

  it("paga menos xp na revisão do que na primeira vez", () => {
    const mission = missions[0]!;
    expect(xpDeRevisao(mission)).toBeLessThan(mission.xp);
    expect(xpDeRevisao(mission)).toBe(Math.round(mission.xp * 0.3));
  });

  it("sobe o nível de domínio conforme as revisões", () => {
    expect(dominio(0)).toBe("recém-aprendido");
    expect(dominio(3)).toBe("dominado");
    expect(dominio(50)).toBe("dominado");
  });
});
