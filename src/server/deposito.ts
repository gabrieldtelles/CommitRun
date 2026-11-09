export interface Deposito {
  obterCampo(mapa: string, campo: string): Promise<string | null>;
  definirCampo(mapa: string, campo: string, valor: string): Promise<void>;
  listarValores(mapa: string): Promise<string[]>;
}

class DepositoMemoria implements Deposito {
  private mapas = new Map<string, Map<string, string>>();

  private mapa(nome: string): Map<string, string> {
    const existente = this.mapas.get(nome);
    if (existente) return existente;

    const novo = new Map<string, string>();
    this.mapas.set(nome, novo);
    return novo;
  }

  async obterCampo(mapa: string, campo: string): Promise<string | null> {
    return this.mapa(mapa).get(campo) ?? null;
  }

  async definirCampo(mapa: string, campo: string, valor: string): Promise<void> {
    this.mapa(mapa).set(campo, valor);
  }

  async listarValores(mapa: string): Promise<string[]> {
    return [...this.mapa(mapa).values()];
  }
}

class DepositoUpstash implements Deposito {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async comando(partes: string[]): Promise<unknown> {
    const resposta = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(partes),
      cache: "no-store",
    });

    if (!resposta.ok) throw new Error(`armazenamento indisponível (${resposta.status})`);
    const dados = (await resposta.json()) as { result?: unknown };
    return dados.result;
  }

  async obterCampo(mapa: string, campo: string): Promise<string | null> {
    const resultado = await this.comando(["HGET", mapa, campo]);
    return typeof resultado === "string" ? resultado : null;
  }

  async definirCampo(mapa: string, campo: string, valor: string): Promise<void> {
    await this.comando(["HSET", mapa, campo, valor]);
  }

  async listarValores(mapa: string): Promise<string[]> {
    const resultado = await this.comando(["HGETALL", mapa]);
    if (!Array.isArray(resultado)) return [];
    return resultado.filter((_, indice) => indice % 2 === 1).map(String);
  }
}

let instancia: Deposito | null = null;

export function obterDeposito(): Deposito {
  if (instancia) return instancia;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  instancia = url && token ? new DepositoUpstash(url, token) : new DepositoMemoria();
  return instancia;
}

export function depositoPersistente(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
