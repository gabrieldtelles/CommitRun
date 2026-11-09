import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { MAX_ARQUIVOS } from "@/lib/pull-request";
import { dentroDoLimite } from "@/server/limite-de-taxa";
import { ErroDeRegra, abrirPr, listarPrs, organizarPara } from "@/server/prs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const semCache = { "Cache-Control": "no-store" };

const envio = z.object({
  missaoId: z.string().max(16),
  titulo: z.string().min(5).max(120),
  descricao: z.string().max(600).default(""),
  arquivos: z
    .array(z.object({ caminho: z.string().max(120), diff: z.string().max(8000) }))
    .min(1)
    .max(MAX_ARQUIVOS),
});

async function contaAtual() {
  const sessao = await auth();
  const contaId = sessao?.user?.contaId;
  if (!contaId) return null;

  return {
    contaId,
    apelido: sessao.user.login ?? sessao.user.name ?? "jogador",
    avatar: sessao.user.image ?? null,
  };
}

export async function GET() {
  const autor = await contaAtual();
  if (!autor) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  try {
    const prs = await listarPrs();
    return NextResponse.json(organizarPara(prs, autor.contaId), { headers: semCache });
  } catch {
    return NextResponse.json({ erro: "não foi possível listar" }, { status: 503, headers: semCache });
  }
}

export async function POST(request: Request) {
  const autor = await contaAtual();
  if (!autor) {
    return NextResponse.json({ erro: "não autenticado" }, { status: 401, headers: semCache });
  }

  if (!dentroDoLimite(`pr:${autor.contaId}`, 10)) {
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
    return NextResponse.json(
      { erro: dados.error.issues[0]?.message ?? "dados inválidos" },
      { status: 400, headers: semCache },
    );
  }

  try {
    const pr = await abrirPr(autor, dados.data);
    return NextResponse.json({ pr }, { status: 201, headers: semCache });
  } catch (erro) {
    const regra = erro instanceof ErroDeRegra;
    return NextResponse.json(
      { erro: regra ? erro.message : "não foi possível abrir o pull request" },
      { status: regra ? erro.status : 503, headers: semCache },
    );
  }
}
