import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import { ErroDeRegra, registrarReview } from "@/server/prs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

const envio = z.object({
  veredito: z.enum(["aprovado", "mudancas"]),
  resumo: z.string().max(1000),
  comentarios: z
    .array(z.object({ arquivo: z.string().max(120), linha: z.number().int().min(0).max(5000), texto: z.string().max(400) }))
    .max(20)
    .default([]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await auth();
  const contaId = sessao?.user?.contaId;

  if (!contaId) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  if (!dentroDoLimite(`review:${contaId}`, 20)) {
    return NextResponse.json({ erro: "muitos envios seguidos" }, { status: 429, headers: semCache });
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
    const resultado = await registrarReview(
      id,
      {
        contaId,
        apelido: sessao.user.login ?? sessao.user.name ?? "jogador",
        avatar: sessao.user.image ?? null,
      },
      dados.data,
    );

    return NextResponse.json(resultado, { status: 201, headers: semCache });
  } catch (erro) {
    const regra = erro instanceof ErroDeRegra;
    return NextResponse.json(
      { erro: regra ? erro.message : "não foi possível enviar o review" },
      { status: regra ? erro.status : 503, headers: semCache },
    );
  }
}
