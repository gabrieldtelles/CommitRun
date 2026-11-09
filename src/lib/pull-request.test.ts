import { describe, expect, it } from "vitest";
import { createMachine, runCommand } from "@/core/machine";
import { missions } from "@/content/missions";
import {
  gerarArquivosDoPr,
  podeRevisar,
  qualidadeDoReview,
  reputacaoDe,
  xpDaAvaliacao,
  type PullRequest,
  type Review,
} from "./pull-request";

function prFalso(parcial: Partial<PullRequest> = {}): PullRequest {
  return {
    id: "pr1",
    autorId: "ana",
    autorApelido: "ana",
    autorAvatar: null,
    missaoId: "c1m3",
    missaoTitulo: "O primeiro commit",
    titulo: "estrutura inicial",
    descricao: "",
    arquivos: [],
    criadoEm: 0,
    reviews: [],
    ...parcial,
  };
}

function reviewFalso(parcial: Partial<Review> = {}): Review {
  return {
    id: "r1",
    revisorId: "bruno",
    revisorApelido: "bruno",
    revisorAvatar: null,
    veredito: "aprovado",
    resumo: "",
    comentarios: [],
    criadoEm: 0,
    nota: null,
    xp: 60,
    ...parcial,
  };
}

describe("diff do pull request", () => {
  it("monta o diff a partir do que a missão mudou no repositório", () => {
    const mission = missions.find((item) => item.id === "c1m3")!;
    const machine = createMachine(mission.seed);

    runCommand(machine, "git init");
    runCommand(machine, "git add .");
    runCommand(machine, 'git commit -m "estrutura inicial do site"');

    const arquivos = gerarArquivosDoPr(machine, {});

    expect(arquivos.length).toBeGreaterThan(0);
    expect(arquivos.map((item) => item.caminho)).toContain("README.md");
    expect(arquivos[0]?.diff).toContain("diff --git");
  });

  it("devolve lista vazia quando não há repositório", () => {
    const machine = createMachine({ cwd: "/telleslab", files: { "a.txt": "a" } });
    expect(gerarArquivosDoPr(machine, {})).toEqual([]);
  });
});

describe("regras de revisão", () => {
  it("impede revisar o próprio pull request", () => {
    expect(podeRevisar(prFalso(), "ana")).toBe(false);
    expect(podeRevisar(prFalso(), "bruno")).toBe(true);
  });

  it("impede revisar duas vezes o mesmo pull request", () => {
    const pr = prFalso({ reviews: [reviewFalso({ revisorId: "bruno" })] });
    expect(podeRevisar(pr, "bruno")).toBe(false);
    expect(podeRevisar(pr, "carla")).toBe(true);
  });

  it("fecha o pull request depois de dois reviews", () => {
    const pr = prFalso({
      reviews: [reviewFalso({ revisorId: "bruno" }), reviewFalso({ id: "r2", revisorId: "carla" })],
    });
    expect(podeRevisar(pr, "davi")).toBe(false);
  });

  it("exige resumo e comentário em linha", () => {
    expect(qualidadeDoReview("curto", [])).toHaveLength(2);
    expect(
      qualidadeDoReview("Este resumo explica com calma o que precisa mudar no commit.", [
        { arquivo: "README.md", linha: 3, texto: "faltou contexto" },
      ]),
    ).toEqual([]);
  });
});

describe("reputação do revisor", () => {
  it("começa neutra quando não há avaliações", () => {
    expect(reputacaoDe([])).toBe(100);
    expect(reputacaoDe([reviewFalso({ nota: null })])).toBe(100);
  });

  it("sobe com notas altas e cai com notas baixas", () => {
    expect(reputacaoDe([reviewFalso({ nota: 5 })])).toBe(180);
    expect(reputacaoDe([reviewFalso({ nota: 1 })])).toBe(20);
    expect(reputacaoDe([reviewFalso({ nota: 3 })])).toBe(100);
  });

  it("converte a nota do autor em xp de bônus", () => {
    expect(xpDaAvaliacao(1)).toBe(0);
    expect(xpDaAvaliacao(5)).toBe(60);
    expect(xpDaAvaliacao(3)).toBe(30);
  });
});
