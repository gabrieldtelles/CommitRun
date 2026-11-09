import { obterDeposito } from "./deposito";

const MAPA = "commitrun:ranking";

export type Pontuacao = {
  apelido: string;
  xp: number;
  missoes: number;
  verificado: boolean;
  atualizadoEm: number;
};

function ordenar(a: Pontuacao, b: Pontuacao): number {
  return b.xp - a.xp || a.atualizadoEm - b.atualizadoEm;
}

function converter(bruto: string): Pontuacao | null {
  try {
    const dados = JSON.parse(bruto) as Pontuacao;
    return typeof dados?.apelido === "string" ? { ...dados, verificado: Boolean(dados.verificado) } : null;
  } catch {
    return null;
  }
}

export async function listarRanking(limite: number): Promise<Pontuacao[]> {
  const valores = await obterDeposito().listarValores(MAPA);
  return valores
    .map(converter)
    .filter((item): item is Pontuacao => item !== null)
    .sort(ordenar)
    .slice(0, limite);
}

export async function salvarPontuacao(pontuacao: Pontuacao, chave: string): Promise<void> {
  const deposito = obterDeposito();
  const atual = converter((await deposito.obterCampo(MAPA, chave)) ?? "");

  if (atual && atual.xp > pontuacao.xp) return;
  await deposito.definirCampo(MAPA, chave, JSON.stringify(pontuacao));
}
