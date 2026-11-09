import { describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import { xpDeRevisao } from "@/lib/revisao";
import { chaveDoDia } from "@/lib/temporada";
import { lerProgresso, resumoDoProgresso, sincronizarProgresso } from "./progresso-do-usuario";

const UM_DIA = 86_400_000;
const primeira = missions[0]!;
const segunda = missions[1]!;

let sequencial = 0;
const novaConta = () => `conta-${(sequencial += 1)}`;

describe("progresso salvo no servidor", () => {
  it("grava a missão concluída e calcula o xp pelo catálogo", async () => {
    const conta = novaConta();
    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id }]);

    expect(Object.keys(progresso.missoes)).toEqual([primeira.id]);
    expect(progresso.xp).toBe(primeira.xp);
  });

  it("ignora identificadores que não existem", async () => {
    const conta = novaConta();
    const progresso = await sincronizarProgresso(conta, [{ id: "c9m9" }, { id: "../etc" }]);

    expect(progresso.missoes).toEqual({});
    expect(progresso.xp).toBe(0);
  });

  it("nunca remove missões já conquistadas", async () => {
    const conta = novaConta();
    await sincronizarProgresso(conta, [{ id: primeira.id }, { id: segunda.id }]);
    const progresso = await sincronizarProgresso(conta, []);

    expect(Object.keys(progresso.missoes).sort()).toEqual([primeira.id, segunda.id].sort());
  });

  it("recusa revisão antes da data agendada", async () => {
    const conta = novaConta();
    const agora = Date.now();
    await sincronizarProgresso(conta, [{ id: primeira.id }], agora);

    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id, revisoes: 9 }], agora);

    expect(progresso.missoes[primeira.id]?.revisoes).toBe(0);
    expect(progresso.xp).toBe(primeira.xp);
  });

  it("aceita uma revisão por vez quando a agenda vence", async () => {
    const conta = novaConta();
    const inicio = Date.now();
    await sincronizarProgresso(conta, [{ id: primeira.id }], inicio);

    const vencida = inicio + 3 * UM_DIA;
    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id, revisoes: 50 }], vencida);

    expect(progresso.missoes[primeira.id]?.revisoes).toBe(1);
    expect(progresso.xp).toBe(primeira.xp + xpDeRevisao(primeira));
  });

  it("registra o xp ganho no dia para alimentar sequência e temporada", async () => {
    const conta = novaConta();
    const agora = Date.now();
    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id }], agora);

    expect(progresso.atividade[chaveDoDia(agora)]).toBe(primeira.xp);
    expect(resumoDoProgresso(progresso, agora).sequencia.atual).toBe(1);
  });

  it("migra o formato antigo de lista de identificadores", async () => {
    const conta = novaConta();
    const { obterDeposito } = await import("./deposito");
    await obterDeposito().definirCampo(
      "commitrun:progresso",
      conta,
      JSON.stringify({ missoes: [primeira.id, "inexistente"], xp: 99999 }),
    );

    const progresso = await lerProgresso(conta);

    expect(Object.keys(progresso.missoes)).toEqual([primeira.id]);
    expect(progresso.xp).toBe(primeira.xp);
  });
});

describe("xp e dicas", () => {
  it("desconta o xp conforme as dicas usadas", async () => {
    const conta = novaConta();
    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id, dicas: 2 }]);

    expect(progresso.xp).toBe(Math.round(primeira.xp * 0.8));
  });

  it("não deixa apagar as dicas para inflar o xp depois", async () => {
    const conta = novaConta();
    await sincronizarProgresso(conta, [{ id: primeira.id, dicas: 3 }]);

    const progresso = await sincronizarProgresso(conta, [{ id: primeira.id, dicas: 0 }]);

    expect(progresso.missoes[primeira.id]?.dicas).toBe(3);
    expect(progresso.xp).toBe(Math.round(primeira.xp * 0.7));
  });
});
