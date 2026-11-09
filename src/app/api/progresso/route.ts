import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { missions } from "@/content/missions";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import { lerProgresso, unirProgresso } from "@/server/progresso-do-usuario";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

const envio = z.object({
  missoes: z.array(z.string().max(16)).max(missions.length),
});

async function contaAtual(): Promise<string | null> {
  const sessao = await auth();
  return sessao?.user?.contaId ?? null;
}

export async function GET() {
  const contaId = await contaAtual();
  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  try {
    return NextResponse.json({ progresso: await lerProgresso(contaId) }, { headers: semCache });
  } catch {
    return NextResponse.json({ erro: "não foi possível ler o progresso" }, { status: 503, headers: semCache });
  }
}

export async function POST(request: Request) {
  const contaId = await contaAtual();
  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  if (!dentroDoLimite(`progresso:${contaId}`, 30)) {
    return NextResponse.json({ erro: "muitas gravações seguidas" }, { status: 429, headers: semCache });
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

  try {
    const progresso = await unirProgresso(contaId, dados.data.missoes);
    return NextResponse.json({ progresso }, { headers: semCache });
  } catch {
    return NextResponse.json({ erro: "não foi possível salvar o progresso" }, { status: 503, headers: semCache });
  }
}
