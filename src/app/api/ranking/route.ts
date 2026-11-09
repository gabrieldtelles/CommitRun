import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { missions } from "@/content/missions";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import { apurarPontuacao } from "@/server/pontuacao";
import { listarRanking, salvarPontuacao, type Pontuacao } from "@/server/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_DA_LISTA = 20;
const semCache = { "Cache-Control": "no-store" };

const envio = z.object({
  apelido: z
    .string()
    .trim()
    .min(2, "o apelido precisa de pelo menos 2 caracteres")
    .max(24, "o apelido pode ter no máximo 24 caracteres")
    .regex(/^[\p{L}\p{N} ._-]+$/u, "use apenas letras, números, espaço, ponto, hífen ou sublinhado")
    .optional(),
  missoes: z.array(z.string().max(16)).max(missions.length),
});

function identificar(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
}

export async function GET() {
  try {
    return NextResponse.json({ ranking: await listarRanking(LIMITE_DA_LISTA) }, { headers: semCache });
  } catch {
    return NextResponse.json({ erro: "ranking indisponível no momento" }, { status: 503, headers: semCache });
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

  const sessao = await auth();
  const contaId = sessao?.user?.contaId;
  const apelido = contaId ? (sessao?.user?.login ?? sessao?.user?.name ?? "") : dados.data.apelido;

  if (!apelido) {
    return NextResponse.json(
      { erro: "informe um apelido ou entre com o GitHub" },
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
    apelido,
    xp,
    missoes: validas,
    verificado: Boolean(contaId),
    atualizadoEm: Date.now(),
  };

  try {
    await salvarPontuacao(pontuacao, contaId ? `github:${contaId}` : `anonimo:${apelido}`);
    const ranking = await listarRanking(LIMITE_DA_LISTA);
    const posicao = ranking.findIndex((item) => item.apelido === apelido) + 1;

    return NextResponse.json({ pontuacao, posicao: posicao || null, ranking }, { status: 201, headers: semCache });
  } catch {
    return NextResponse.json({ erro: "não foi possível registrar agora" }, { status: 503, headers: semCache });
  }
}
