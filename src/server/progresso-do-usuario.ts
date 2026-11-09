import { obterDeposito } from "./deposito";
import { apurarPontuacao } from "./pontuacao";

const MAPA = "commitrun:progresso";

export type ProgressoSalvo = { missoes: string[]; xp: number; atualizadoEm: number };

function normalizar(bruto: string | null): ProgressoSalvo | null {
  if (!bruto) return null;

  try {
    const dados = JSON.parse(bruto) as Partial<ProgressoSalvo>;
    if (!Array.isArray(dados.missoes)) return null;
    return {
      missoes: dados.missoes.filter((item): item is string => typeof item === "string"),
      xp: typeof dados.xp === "number" ? dados.xp : 0,
      atualizadoEm: typeof dados.atualizadoEm === "number" ? dados.atualizadoEm : 0,
    };
  } catch {
    return null;
  }
}

export async function lerProgresso(contaId: string): Promise<ProgressoSalvo> {
  const salvo = normalizar(await obterDeposito().obterCampo(MAPA, contaId));
  return salvo ?? { missoes: [], xp: 0, atualizadoEm: 0 };
}

export async function unirProgresso(
  contaId: string,
  missoesEnviadas: string[],
): Promise<ProgressoSalvo> {
  const atual = await lerProgresso(contaId);
  const unidas = [...new Set([...atual.missoes, ...missoesEnviadas])];
  const { xp, validas } = apurarPontuacao(unidas);

  const atualizado: ProgressoSalvo = {
    missoes: unidas.filter((id) => apurarPontuacao([id]).validas === 1),
    xp,
    atualizadoEm: Date.now(),
  };

  if (validas !== atual.missoes.length || xp !== atual.xp) {
    await obterDeposito().definirCampo(MAPA, contaId, JSON.stringify(atualizado));
  }

  return atualizado;
}
