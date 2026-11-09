"use client";

import Link from "next/link";
import type { Mission } from "@/content/types";

type Props = {
  mission: Mission;
  dicasUsadas: number;
  onReiniciar: () => void;
  onPedirDica: () => void;
  onValidar: () => void;
};

export function BarraDeAcoes({
  mission,
  dicasUsadas,
  onReiniciar,
  onPedirDica,
  onValidar,
}: Props) {
  return (
    <header className="border-b border-line bg-surface/60 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted">
            <Link href="/hangar" className="hover:text-lime">
              hangar
            </Link>{" "}
            / capítulo {mission.chapter} / missão {mission.order} / {mission.xp} XP
          </p>
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{mission.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReiniciar}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-muted"
          >
            Reiniciar
          </button>
          <button
            type="button"
            onClick={onPedirDica}
            disabled={dicasUsadas >= mission.hints.length}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-warn hover:text-warn disabled:cursor-not-allowed disabled:opacity-40"
          >
            Dica {dicasUsadas}/{mission.hints.length}
          </button>
          <button
            type="button"
            onClick={onValidar}
            className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
          >
            Validar missão
          </button>
        </div>
      </div>
    </header>
  );
}
