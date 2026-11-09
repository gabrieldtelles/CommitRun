"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { nivel, patente, xpNoNivel } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";
import { Sessao } from "./sessao";

export function Cabecalho() {
  const { data: sessao } = useSession();
  const xp = useProgresso((estado) => estado.xp);
  const { atual, total } = xpNoNivel(xp);
  const logado = Boolean(sessao?.user?.contaId);

  return (
    <header className="border-b border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-lime" />
          CommitRun
        </Link>

        <nav aria-label="Navegação principal" className="flex items-center gap-5 text-sm">
          <Link href="/missoes" className="text-muted transition-colors hover:text-ink">
            Trilha
          </Link>
          <Link href="/ranking" className="text-muted transition-colors hover:text-ink">
            Ranking
          </Link>

          {logado && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs text-muted">
                  nível {nivel(xp)} · {patente(xp)}
                </p>
                <p className="font-mono text-xs text-lime">{xp} XP</p>
              </div>
              <div
                role="progressbar"
                aria-valuenow={atual}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label="Progresso para o próximo nível"
                className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2"
              >
                <div
                  className="h-full rounded-full bg-lime transition-[width] duration-500"
                  style={{ width: `${(atual / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <Sessao />
        </nav>
      </div>
    </header>
  );
}
