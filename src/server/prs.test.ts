import { describe, expect, it } from "vitest";
import { XP_POR_REVIEW } from "@/lib/pull-request";
import { lerProgresso } from "./progresso-do-usuario";
import { abrirPr, avaliarReview, listarPrs, organizarPara, registrarReview } from "./prs";

let sequencial = 0;
const conta = (nome: string) => ({ contaId: `${nome}-${(sequencial += 1)}`, apelido: nome, avatar: null });

const dadosDoPr = {
  missaoId: "c1m3",
  titulo: "estrutura inicial do site",
  descricao: "primeiro commit do projeto",
  arquivos: [{ caminho: "README.md", diff: "diff --git a/README.md b/README.md\n+# Pulso" }],
};

const reviewValido = {
  veredito: "aprovado" as const,
  resumo: "O commit está coeso e a mensagem explica a mudança sem enrolação. Segue assim.",
  comentarios: [{ arquivo: "README.md", linha: 2, texto: "título claro" }],
};

describe("abrir pull request", () => {
  it("cria o pull request com os dados da missão", async () => {
    const autor = conta("ana");
    const pr = await abrirPr(autor, dadosDoPr);

    expect(pr.missaoTitulo).toBe("O primeiro commit");
    expect(pr.reviews).toEqual([]);
    expect((await listarPrs()).some((item) => item.id === pr.id)).toBe(true);
  });

  it("recusa missão inexistente, título curto e lista vazia", async () => {
    const autor = conta("ana");

    await expect(abrirPr(autor, { ...dadosDoPr, missaoId: "c9m9" })).rejects.toThrow("missão");
    await expect(abrirPr(autor, { ...dadosDoPr, titulo: "oi" })).rejects.toThrow("título");
    await expect(abrirPr(autor, { ...dadosDoPr, arquivos: [] })).rejects.toThrow("arquivo");
  });

  it("não deixa abrir dois pull requests da mesma missão", async () => {
    const autor = conta("ana");
    await abrirPr(autor, dadosDoPr);

    await expect(abrirPr(autor, dadosDoPr)).rejects.toThrow("já abriu");
  });
});

describe("revisar pull request", () => {
  it("registra o review e credita xp ao revisor", async () => {
    const autor = conta("ana");
    const revisor = conta("bruno");
    const pr = await abrirPr(autor, dadosDoPr);

    const { pr: atualizado, xp } = await registrarReview(pr.id, revisor, reviewValido);

    expect(atualizado.reviews).toHaveLength(1);
    expect(xp).toBe(XP_POR_REVIEW);
    expect((await lerProgresso(revisor.contaId)).xp).toBe(XP_POR_REVIEW);
  });

  it("impede o autor de revisar o próprio pull request", async () => {
    const autor = conta("ana");
    const pr = await abrirPr(autor, dadosDoPr);

    await expect(registrarReview(pr.id, autor, reviewValido)).rejects.toThrow("disponível");
  });

  it("exige resumo com substância e comentário em linha", async () => {
    const pr = await abrirPr(conta("ana"), dadosDoPr);
    const revisor = conta("bruno");

    await expect(
      registrarReview(pr.id, revisor, { ...reviewValido, resumo: "ok" }),
    ).rejects.toThrow("resumo");

    await expect(
      registrarReview(pr.id, revisor, { ...reviewValido, comentarios: [] }),
    ).rejects.toThrow("comentário");
  });

  it("descarta comentário em arquivo que não está no diff", async () => {
    const pr = await abrirPr(conta("ana"), dadosDoPr);
    const { pr: atualizado } = await registrarReview(pr.id, conta("bruno"), {
      ...reviewValido,
      comentarios: [
        { arquivo: "README.md", linha: 1, texto: "vale" },
        { arquivo: "/etc/passwd", linha: 1, texto: "não vale" },
      ],
    });

    expect(atualizado.reviews[0]?.comentarios).toHaveLength(1);
  });

  it("fecha o pull request quando junta os reviews necessários", async () => {
    const autor = conta("ana");
    const pr = await abrirPr(autor, dadosDoPr);

    await registrarReview(pr.id, conta("bruno"), reviewValido);
    const { pr: fechado } = await registrarReview(pr.id, conta("carla"), reviewValido);

    const quarta = conta("davi");
    expect(organizarPara([fechado], quarta.contaId).fila).toHaveLength(0);
  });
});

describe("avaliar review recebido", () => {
  it("dá bônus de xp ao revisor conforme a nota", async () => {
    const autor = conta("ana");
    const revisor = conta("bruno");
    const pr = await abrirPr(autor, dadosDoPr);
    const { pr: comReview } = await registrarReview(pr.id, revisor, reviewValido);
    const review = comReview.reviews[0]!;

    const avaliado = await avaliarReview(pr.id, review.id, autor.contaId, 5);

    expect(avaliado.reviews[0]?.nota).toBe(5);
    expect((await lerProgresso(revisor.contaId)).xp).toBe(XP_POR_REVIEW + 60);
  });

  it("só o autor avalia, e apenas uma vez", async () => {
    const autor = conta("ana");
    const pr = await abrirPr(autor, dadosDoPr);
    const { pr: comReview } = await registrarReview(pr.id, conta("bruno"), reviewValido);
    const review = comReview.reviews[0]!;

    await expect(avaliarReview(pr.id, review.id, "intruso", 5)).rejects.toThrow("autor");

    await avaliarReview(pr.id, review.id, autor.contaId, 4);
    await expect(avaliarReview(pr.id, review.id, autor.contaId, 5)).rejects.toThrow("já foi");
  });
});
