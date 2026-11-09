"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { missions } from "@/content/missions";
import { proximaMissao } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";

export function CtaContinuar() {
  const { data: sessao, status } = useSession();
  const parametros = useSearchParams();
  const xp = useProgresso((estado) => estado.xp);
  const missoes = useProgresso((estado) => estado.missoes);

  const logado = Boolean(sessao?.user?.contaId);
  const bloqueado = parametros.get("entrar");

  if (status === "loading") {
    return <span className="block h-12 w-64 animate-pulse rounded-lg bg-surface-2" aria-hidden="true" />;
  }

  if (!logado) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void signIn("github", { callbackUrl: bloqueado ?? "/missoes" })}
          className="rounded-lg bg-lime px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
        >
          Entrar com GitHub e começar
        </button>
        <p className="text-sm text-muted">
          {bloqueado
            ? "As missões ficam salvas na sua conta — entre para continuar de onde parou."
            : "O progresso fica salvo na sua conta do GitHub, em qualquer aparelho."}
        </p>
      </div>
    );
  }

  const feitas = Object.keys(missoes).length;
  const seguinte = proximaMissao({ xp, missoes }) ?? missions[0];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={seguinte ? `/missao/${seguinte.slug}` : "/missoes"}
        className="rounded-lg bg-lime px-6 py-3 text-center text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
      >
        {feitas > 0 ? "Continuar de onde parei" : "Começar a primeira missão"}
      </Link>
      <Link
        href="/missoes"
        className="rounded-lg border border-line px-6 py-3 text-center text-sm font-semibold transition-colors hover:border-lime hover:text-lime"
      >
        Ver a trilha completa
      </Link>
    </div>
  );
}
