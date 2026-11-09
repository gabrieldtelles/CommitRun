"use client";

import type { Mission } from "@/content/types";

type Props = {
  mission: Mission;
  dicas: string[];
  onPedirDica: () => void;
};

export function Briefing({ mission, dicas, onPedirDica }: Props) {
  const restantes = mission.hints.length - dicas.length;

  return (
    <section
      aria-label="Briefing da missão"
      className="flex h-full flex-col gap-5 overflow-y-auto rounded-xl border border-line bg-surface p-5"
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime/15 font-mono text-sm font-bold text-lime"
        >
          dev
        </span>
        <div>
          <p className="text-sm font-semibold">TellesDev</p>
          <p className="text-xs text-muted">tech lead do TellesLab</p>
        </div>
      </header>

      <div className="space-y-3 text-sm leading-relaxed text-ink/90">
        {mission.briefing.map((paragrafo) => (
          <p key={paragrafo}>{paragrafo}</p>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-lime">Objetivo</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {mission.objectives.map((objetivo) => (
            <li key={objetivo} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
              <span>{objetivo}</span>
            </li>
          ))}
        </ul>
      </div>

      {mission.commands.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Comandos desta missão
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {mission.commands.map((comando) => (
              <li
                key={comando}
                className="rounded border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-sky"
              >
                {comando}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto space-y-2">
        {dicas.map((dica, indice) => (
          <p
            key={dica}
            className="rounded-lg border border-warn/30 bg-warn/5 p-3 text-sm text-ink/90"
          >
            <span className="font-semibold text-warn">Dica {indice + 1}: </span>
            {dica}
          </p>
        ))}

        <button
          type="button"
          onClick={onPedirDica}
          disabled={restantes === 0}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm font-medium transition-colors hover:border-warn hover:text-warn disabled:cursor-not-allowed disabled:opacity-40"
        >
          {restantes === 0 ? "Sem mais dicas" : `Pedir dica (${restantes} restantes)`}
        </button>
        <p className="text-center text-xs text-muted">Cada dica reduz 10% do XP da missão.</p>
      </div>
    </section>
  );
}
