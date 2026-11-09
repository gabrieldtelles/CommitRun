import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PROTEGIDAS = ["/missoes", "/missao"];

const COOKIES_DE_SESSAO = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const protegida = ROTAS_PROTEGIDAS.some(
    (rota) =>
      request.nextUrl.pathname === rota || request.nextUrl.pathname.startsWith(`${rota}/`),
  );

  if (!protegida) return NextResponse.next();

  const temSessao = COOKIES_DE_SESSAO.some((nome) => request.cookies.has(nome));
  if (temSessao) return NextResponse.next();

  const destino = new URL("/", request.url);
  destino.searchParams.set("entrar", request.nextUrl.pathname);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/missoes/:path*", "/missao/:path*"],
};
