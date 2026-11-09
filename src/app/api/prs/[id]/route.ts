import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { lerPr } from "@/server/prs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth();
  if (!sessao?.user?.contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  const { id } = await params;
  const pr = await lerPr(id);

  if (!pr) {
    return NextResponse.json({ erro: "pull request não encontrado" }, { status: 404, headers: semCache });
  }

  return NextResponse.json({ pr, contaId: sessao.user.contaId }, { headers: semCache });
}
