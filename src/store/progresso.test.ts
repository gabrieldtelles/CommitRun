import { beforeEach, describe, expect, it } from "vitest";
import { missions } from "@/content/missions";
import { useProgresso } from "./progresso";

const primeira = missions[0]!;

describe("store de progresso", () => {
  beforeEach(() => {
    useProgresso.setState({ xp: 0, concluidas: {}, conta: null });
  });

  it("guarda a missão concluída e o xp ganho", () => {
    const ganho = useProgresso.getState().concluir(primeira, 0);
    expect(ganho).toBe(primeira.xp);
    expect(useProgresso.getState().xp).toBe(primeira.xp);
  });

  it("não paga xp duas vezes pela mesma missão", () => {
    useProgresso.getState().concluir(primeira, 0);
    expect(useProgresso.getState().concluir(primeira, 0)).toBe(0);
    expect(useProgresso.getState().xp).toBe(primeira.xp);
  });

  it("apaga o progresso ao sair da conta", () => {
    useProgresso.setState({ conta: "123" });
    useProgresso.getState().concluir(primeira, 0);

    useProgresso.getState().adotarConta(null);

    expect(useProgresso.getState().xp).toBe(0);
    expect(useProgresso.getState().concluidas).toEqual({});
    expect(useProgresso.getState().conta).toBeNull();
  });

  it("apaga progresso órfão criado antes de existir login", () => {
    useProgresso.setState({ conta: null, xp: 220, concluidas: { c1m1: { xp: 220, dicas: 0, concluidaEm: 1 } } });

    useProgresso.getState().adotarConta(null);

    expect(useProgresso.getState().xp).toBe(0);
    expect(useProgresso.getState().concluidas).toEqual({});
  });

  it("não mistura o progresso de duas contas no mesmo navegador", () => {
    useProgresso.getState().adotarConta("conta-a");
    useProgresso.getState().concluir(primeira, 0);

    useProgresso.getState().adotarConta("conta-b");

    expect(useProgresso.getState().xp).toBe(0);
    expect(useProgresso.getState().conta).toBe("conta-b");
  });

  it("mantém o progresso ao reconfirmar a mesma conta", () => {
    useProgresso.getState().adotarConta("conta-a");
    useProgresso.getState().concluir(primeira, 0);

    useProgresso.getState().adotarConta("conta-a");

    expect(useProgresso.getState().xp).toBe(primeira.xp);
  });
});
