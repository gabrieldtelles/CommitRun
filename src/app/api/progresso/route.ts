import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { missions } from "@/content/missions";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import {
  lerProgresso,
  resumoDoProgresso,
  sincronizarProgresso,
} from "@/server/progresso-do-usuario";
import { registrarPontuacao } from "@/server/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

const envio = z.object({
  missoes: z
    .array(z.object({ id: z.string().max(16), revisoes: z.number().int().min(0).max(99).optional() }))
    .max(missions.length),
});

export async function GET() {
  const sessao = await auth();
  const contaId = sessao?.user?.contaId;

  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  try {
    const progresso = await lerProgresso(contaId);
    return NextResponse.json(
      { progresso, resumo: resumoDoProgresso(progresso) },
      { headers: semCache },
    );
  } catch {
    return NextResponse.json(
      { erro: "não foi possível ler o progresso" },
      { status: 503, headers: semCache },
    );
  }
}

export async function POST(request: Request) {
  const sessao = await auth();
  const contaId = sessao?.user?.contaId;

  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  if (!dentroDoLimite(`progresso:${contaId}`, 40)) {
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
    const progresso = await sincronizarProgresso(contaId, dados.data.missoes);
    const resumo = resumoDoProgresso(progresso);

    await registrarPontuacao({
      contaId,
      apelido: sessao.user.login ?? sessao.user.name ?? "jogador",
      avatar: sessao.user.image ?? null,
      xp: resumo.xp,
      xpDaSemana: resumo.xpDaSemana,
      missoes: resumo.missoes,
      sequencia: resumo.sequencia.atual,
      atualizadoEm: Date.now(),
    });

    return NextResponse.json({ progresso, resumo }, { headers: semCache });
  } catch {
    return NextResponse.json(
      { erro: "não foi possível salvar o progresso" },
      { status: 503, headers: semCache },
    );
  }
}
