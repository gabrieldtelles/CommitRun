import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Linha = Record<string, unknown>;
export type Consulta = <T extends Linha = Linha>(
  texto: string,
  valores?: unknown[],
) => Promise<T[]>;

let consultaAtual: Promise<Consulta> | null = null;

function lerSchema(): string {
  return readFileSync(join(process.cwd(), "migrations", "001-inicial.sql"), "utf8");
}

async function conectarNeon(url: string): Promise<Consulta> {
  const { neon } = await import("@neondatabase/serverless");
  const cliente = neon(url);

  return async <T extends Linha>(texto: string, valores: unknown[] = []) =>
    (await cliente.query(texto, valores)) as T[];
}

async function conectarMemoria(): Promise<Consulta> {
  const { PGlite } = await import("@electric-sql/pglite");
  const banco = new PGlite();
  await banco.exec(lerSchema());

  return async <T extends Linha>(texto: string, valores: unknown[] = []) =>
    (await banco.query<T>(texto, valores)).rows;
}

export function bd(): Promise<Consulta> {
  if (consultaAtual) return consultaAtual;

  // em teste o banco é sempre o Postgres em memória: nunca toca no de verdade
  const url = process.env.NODE_ENV === "test" ? undefined : process.env.DATABASE_URL;
  consultaAtual = url ? conectarNeon(url) : conectarMemoria();
  return consultaAtual;
}

export async function consultar<T extends Linha = Linha>(
  texto: string,
  valores: unknown[] = [],
): Promise<T[]> {
  const executar = await bd();
  return executar<T>(texto, valores);
}

export async function umaLinha<T extends Linha = Linha>(
  texto: string,
  valores: unknown[] = [],
): Promise<T | null> {
  const linhas = await consultar<T>(texto, valores);
  return linhas[0] ?? null;
}

export async function migrar(): Promise<void> {
  const executar = await bd();
  for (const comando of lerSchema().split(";")) {
    const limpo = comando.trim();
    if (limpo) await executar(limpo);
  }
}

export function reiniciarConexao(): void {
  consultaAtual = null;
}
