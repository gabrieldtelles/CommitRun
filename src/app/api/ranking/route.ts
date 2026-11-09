import { NextResponse } from "next/server";
import { z } from "zod";
import { missions } from "@/content/missions";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import { obterArmazenamento, type Pontuacao } from "@/server/armazenamento";
import { apurarPontuacao } from "@/server/pontuacao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_DA_LISTA = 20;

const envio = z.object({
  apelido: z
    .string()
    .trim()
    .min(2, "o apelido precisa de pelo menos 2 caracteres")
    .max(24, "o apelido pode ter no máximo 24 caracteres")
    .regex(/^[\p{L}\p{N} ._-]+$/u, "use apenas letras, números, espaço, ponto, hífen ou sublinhado"),
  missoes: z.array(z.string().max(16)).max(missions.length),
});

const semCache = { "Cache-Control": "no-store" };

function identificar(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0]?.trim() || "desconhecido";
}

export async function GET() {
  try {
    const pontuacoes = await obterArmazenamento().listar(LIMITE_DA_LISTA);
    return NextResponse.json({ ranking: pontuacoes }, { headers: semCache });
  } catch {
    return NextResponse.json(
      { erro: "ranking indisponível no momento" },
      { status: 503, headers: semCache },
    );
  }
}

export async function POST(request: Request) {
  if (!dentroDoLimite(identificar(request))) {
    return NextResponse.json(
      { erro: "muitos envios seguidos, tente de novo em um minuto" },
      { status: 429, headers: semCache },
    );
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400, headers: semCache });
  }

  const dados = envio.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "dados inválidos" },
      { status: 400, headers: semCache },
    );
  }

  const { xp, validas } = apurarPontuacao(dados.data.missoes);
  if (validas === 0) {
    return NextResponse.json(
      { erro: "conclua pelo menos uma missão antes de entrar no ranking" },
      { status: 422, headers: semCache },
    );
  }

  const pontuacao: Pontuacao = {
    apelido: dados.data.apelido,
    xp,
    missoes: validas,
    atualizadoEm: Date.now(),
  };

  try {
    const armazenamento = obterArmazenamento();
    await armazenamento.salvar(pontuacao);
    const ranking = await armazenamento.listar(LIMITE_DA_LISTA);
    const posicao = ranking.findIndex((item) => item.apelido === pontuacao.apelido) + 1;

    return NextResponse.json(
      { pontuacao, posicao: posicao || null, ranking },
      { status: 201, headers: semCache },
    );
  } catch {
    return NextResponse.json(
      { erro: "não foi possível registrar agora" },
      { status: 503, headers: semCache },
    );
  }
}
