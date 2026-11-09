export type Pontuacao = {
  apelido: string;
  xp: number;
  missoes: number;
  atualizadoEm: number;
};

export interface Armazenamento {
  listar(limite: number): Promise<Pontuacao[]>;
  salvar(pontuacao: Pontuacao): Promise<void>;
}

const CHAVE = "commitrun:ranking";

class ArmazenamentoMemoria implements Armazenamento {
  private registros = new Map<string, Pontuacao>();

  async listar(limite: number): Promise<Pontuacao[]> {
    return [...this.registros.values()].sort(ordenar).slice(0, limite);
  }

  async salvar(pontuacao: Pontuacao): Promise<void> {
    const atual = this.registros.get(pontuacao.apelido);
    if (!atual || pontuacao.xp >= atual.xp) this.registros.set(pontuacao.apelido, pontuacao);
  }
}

class ArmazenamentoUpstash implements Armazenamento {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async comando(partes: (string | number)[]): Promise<unknown> {
    const resposta = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partes),
      cache: "no-store",
    });

    if (!resposta.ok) throw new Error(`armazenamento indisponível (${resposta.status})`);
    const dados = (await resposta.json()) as { result?: unknown };
    return dados.result;
  }

  async listar(limite: number): Promise<Pontuacao[]> {
    const resultado = (await this.comando(["HGETALL", CHAVE])) as string[] | null;
    if (!Array.isArray(resultado)) return [];

    const pontuacoes: Pontuacao[] = [];
    for (let i = 1; i < resultado.length; i += 2) {
      try {
        pontuacoes.push(JSON.parse(resultado[i] as string) as Pontuacao);
      } catch {
        continue;
      }
    }

    return pontuacoes.sort(ordenar).slice(0, limite);
  }

  async salvar(pontuacao: Pontuacao): Promise<void> {
    const bruto = (await this.comando(["HGET", CHAVE, pontuacao.apelido])) as string | null;
    const atual = bruto ? (JSON.parse(bruto) as Pontuacao) : null;
    if (atual && atual.xp > pontuacao.xp) return;

    await this.comando(["HSET", CHAVE, pontuacao.apelido, JSON.stringify(pontuacao)]);
  }
}

function ordenar(a: Pontuacao, b: Pontuacao): number {
  return b.xp - a.xp || a.atualizadoEm - b.atualizadoEm;
}

let instancia: Armazenamento | null = null;

export function obterArmazenamento(): Armazenamento {
  if (instancia) return instancia;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  instancia = url && token ? new ArmazenamentoUpstash(url, token) : new ArmazenamentoMemoria();
  return instancia;
}
