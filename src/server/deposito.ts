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

class DepositoArquivo implements Deposito {
  private cache: Record<string, Record<string, string>> | null = null;

  constructor(private readonly caminho: string) {}

  private async ler(): Promise<Record<string, Record<string, string>>> {
    if (this.cache) return this.cache;

    try {
      const { readFile } = await import("node:fs/promises");
      this.cache = JSON.parse(await readFile(this.caminho, "utf8")) as Record<
        string,
        Record<string, string>
      >;
    } catch {
      this.cache = {};
    }

    return this.cache;
  }

  private async gravar(): Promise<void> {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { dirname } = await import("node:path");

    await mkdir(dirname(this.caminho), { recursive: true });
    await writeFile(this.caminho, JSON.stringify(this.cache ?? {}, null, 2), "utf8");
  }

  async obterCampo(mapa: string, campo: string): Promise<string | null> {
    return (await this.ler())[mapa]?.[campo] ?? null;
  }

  async definirCampo(mapa: string, campo: string, valor: string): Promise<void> {
    const dados = await this.ler();
    dados[mapa] = { ...dados[mapa], [campo]: valor };
    await this.gravar();
  }

  async listarValores(mapa: string): Promise<string[]> {
    return Object.values((await this.ler())[mapa] ?? {});
  }
}

let instancia: Deposito | null = null;

export function obterDeposito(): Deposito {
  if (instancia) return instancia;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    instancia = new DepositoUpstash(url, token);
    return instancia;
  }

  const emDesenvolvimento =
    process.env.NODE_ENV === "development" && process.env.NEXT_RUNTIME === "nodejs";

  instancia = emDesenvolvimento
    ? new DepositoArquivo(".commitrun/dados.json")
    : new DepositoMemoria();

  return instancia;
}

export function depositoPersistente(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
