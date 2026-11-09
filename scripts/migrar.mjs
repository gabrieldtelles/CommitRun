import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function lerUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(".env.local", "utf8");
    const linha = env.split("\n").find((item) => item.startsWith("DATABASE_URL="));
    return linha?.slice("DATABASE_URL=".length);
  } catch {
    return undefined;
  }
}

const url = lerUrl();
if (!url) {
  console.error("DATABASE_URL não encontrada (.env.local ou ambiente)");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync("migrations/001-inicial.sql", "utf8");

for (const comando of schema.split(";")) {
  const limpo = comando.trim();
  if (limpo) await sql.query(limpo);
}

const tabelas = await sql`
  SELECT table_name AS nome FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`;

console.log("tabelas criadas:", tabelas.map((t) => t.nome).join(", "));
