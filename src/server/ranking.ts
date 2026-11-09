import { obterDeposito } from "./deposito";

const MAPA = "commitrun:ranking";

export type Pontuacao = {
  contaId: string;
  apelido: string;
  avatar: string | null;
  xp: number;
  xpDaSemana: number;
  missoes: number;
  sequencia: number;
  atualizadoEm: number;
};

export type Periodo = "geral" | "semana";

function converter(bruto: string): Pontuacao | null {
  try {
    const dados = JSON.parse(bruto) as Partial<Pontuacao>;
    if (typeof dados.apelido !== "string" || typeof dados.xp !== "number") return null;
    return {
      contaId: String(dados.contaId ?? ""),
      apelido: dados.apelido,
      avatar: typeof dados.avatar === "string" ? dados.avatar : null,
      xp: dados.xp,
      xpDaSemana: Number(dados.xpDaSemana) || 0,
      missoes: Number(dados.missoes) || 0,
      sequencia: Number(dados.sequencia) || 0,
      atualizadoEm: Number(dados.atualizadoEm) || 0,
    };
  } catch {
    return null;
  }
}

export function ordenarPor(periodo: Periodo) {
  return (a: Pontuacao, b: Pontuacao): number => {
    const chave = periodo === "semana" ? "xpDaSemana" : "xp";
    return b[chave] - a[chave] || b.missoes - a.missoes || a.atualizadoEm - b.atualizadoEm;
  };
}

export async function listarRanking(periodo: Periodo = "geral"): Promise<Pontuacao[]> {
  const valores = await obterDeposito().listarValores(MAPA);
  return valores
    .map(converter)
    .filter((item): item is Pontuacao => item !== null)
    .filter((item) => (periodo === "semana" ? item.xpDaSemana > 0 : item.xp > 0))
    .sort(ordenarPor(periodo));
}

export async function registrarPontuacao(pontuacao: Pontuacao): Promise<void> {
  await obterDeposito().definirCampo(MAPA, pontuacao.contaId, JSON.stringify(pontuacao));
}
