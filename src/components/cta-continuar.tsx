"use client";

import Link from "next/link";
import { missions } from "@/content/missions";
import { proximaMissao } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";

export function CtaContinuar() {
  const xp = useProgresso((estado) => estado.xp);
  const concluidas = useProgresso((estado) => estado.concluidas);

  const feitas = Object.keys(concluidas).length;
  const seguinte = proximaMissao({ xp, concluidas }) ?? missions[0];
  const comecou = feitas > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={seguinte ? `/missao/${seguinte.slug}` : "/missoes"}
        className="rounded-lg bg-lime px-6 py-3 text-center text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
      >
        {comecou ? "Continuar de onde parei" : "Começar a primeira missão"}
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
