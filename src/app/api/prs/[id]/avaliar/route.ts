import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ErroDeRegra, avaliarReview } from "@/server/prs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

const envio = z.object({ reviewId: z.string().max(40), nota: z.number().int().min(1).max(5) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth();
  const contaId = sessao?.user?.contaId;

  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400, headers: semCache });
  }

  const dados = envio.safeParse(corpo);
  if (!dados.success) {
    return NextResponse.json({ erro: "dados inválidos" }, { status: 400, headers: semCache });
  }

  const { id } = await params;

  try {
    const pr = await avaliarReview(id, dados.data.reviewId, contaId, dados.data.nota);
    return NextResponse.json({ pr }, { headers: semCache });
  } catch (erro) {
    const regra = erro instanceof ErroDeRegra;
    return NextResponse.json(
      { erro: regra ? erro.message : "não foi possível avaliar" },
      { status: regra ? erro.status : 503, headers: semCache },
    );
  }
}
