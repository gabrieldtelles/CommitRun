"use client";

import Link from "next/link";
import type { Mission } from "@/content/types";
import { xpGanho } from "@/lib/progresso";

type Props = {
  mission: Mission;
  proxima: Mission | null;
  ganho: number;
  dicasUsadas: number;
  onFechar: () => void;
};

function textoDoGanho(mission: Mission, ganho: number, dicasUsadas: number): string {
  if (ganho === 0) {
    return `Você já tinha concluído esta missão. XP original mantido: ${xpGanho(mission, 0)}.`;
  }
  if (dicasUsadas === 0) return `+${ganho} XP`;
  return `+${ganho} XP (${dicasUsadas} dica${dicasUsadas > 1 ? "s" : ""} usada${dicasUsadas > 1 ? "s" : ""})`;
}

export function ModalConclusao({ mission, proxima, ganho, dicasUsadas, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base/85 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-conclusao"
        className="w-full max-w-md rounded-xl border border-lime/40 bg-surface p-6 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-lime">missão concluída</p>
        <h2 id="titulo-conclusao" className="mt-2 text-2xl font-bold">
          {mission.title}
        </h2>
        <p className="mt-3 text-sm text-muted">{textoDoGanho(mission, ganho, dicasUsadas)}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-muted"
          >
            Continuar no terminal
          </button>
          <Link
            href={proxima ? `/missao/${proxima.slug}` : "/missoes"}
            className="flex-1 rounded-lg bg-lime px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
          >
            {proxima ? "Próxima missão" : "Ver a trilha"}
          </Link>
        </div>
      </div>
    </div>
  );
}
