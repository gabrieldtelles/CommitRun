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

  const sessao = await auth();
  const contaId = sessao?.user?.contaId;
  const apelido = sessao?.user?.login ?? sessao?.user?.name ?? "";

  if (!contaId || !apelido) {
    return NextResponse.json(
      { erro: "entre com o GitHub para participar do ranking" },
      { status: 401, headers: semCache },
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
    apelido,
    xp,
    missoes: validas,
    verificado: true,
    atualizadoEm: Date.now(),
  };

  try {
    await salvarPontuacao(pontuacao, `github:${contaId}`);
    const ranking = await listarRanking(LIMITE_DA_LISTA);
    const posicao = ranking.findIndex((item) => item.apelido === apelido) + 1;

    return NextResponse.json({ pontuacao, posicao: posicao || null, ranking }, { status: 201, headers: semCache });
  } catch {
    return NextResponse.json({ erro: "não foi possível registrar agora" }, { status: 503, headers: semCache });
  }
}
