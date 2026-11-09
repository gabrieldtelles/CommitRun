import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listarRanking, type Periodo } from "@/server/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const parametro = new URL(request.url).searchParams.get("periodo");
  const periodo: Periodo = parametro === "semana" ? "semana" : "geral";

  try {
    const [ranking, sessao] = await Promise.all([listarRanking(periodo), auth()]);
    const contaId = sessao?.user?.contaId ?? null;
    const posicao = contaId
      ? ranking.findIndex((item) => item.contaId === contaId) + 1 || null
      : null;

    return NextResponse.json(
      {
        periodo,
        ranking: ranking.map(({ contaId: id, ...resto }) => ({
          ...resto,
          voce: id === contaId,
        })),
        posicao,
      },
      { headers: semCache },
    );
  } catch {
    return NextResponse.json(
      { erro: "ranking indisponível no momento" },
      { status: 503, headers: semCache },
    );
  }
}
