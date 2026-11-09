"use client";

import Link from "next/link";
import { proximaMissao } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";

export function ProximaMissao() {
  const xp = useProgresso((estado) => estado.xp);
  const missoes = useProgresso((estado) => estado.missoes);
  const seguinte = proximaMissao({ xp, missoes });

  if (!seguinte) {
    return (
      <section className="rounded-xl border border-lime/40 bg-lime/5 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-lime">campanha completa</p>
        <p className="mt-2 text-sm">
          Você terminou todas as missões. Agora é manter o que aprendeu nas revisões.
        </p>
        <Link
          href="/revisoes"
          className="mt-4 inline-block rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
        >
          Ver revisões
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">próxima missão</p>
        <p className="mt-1 truncate text-lg font-bold">{seguinte.title}</p>
        <p className="truncate text-sm text-muted">{seguinte.summary}</p>
      </div>

      <Link
        href={`/missao/${seguinte.slug}`}
        className="rounded-lg bg-lime px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
      >
        Continuar
      </Link>
    </section>
  );
}
