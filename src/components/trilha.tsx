"use client";

import Link from "next/link";
import { chapters, missions } from "@/content/missions";
import { estaDesbloqueada, percentualConcluido, proximaMissao } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";

export function Trilha() {
  const missoes = useProgresso((estado) => estado.missoes);
  const xp = useProgresso((estado) => estado.xp);
  const reiniciar = useProgresso((estado) => estado.reiniciar);

  const progresso = { xp, missoes };
  const seguinte = proximaMissao(progresso);
  const percentual = percentualConcluido(progresso);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Trilha de missões</h1>
          <p className="mt-2 text-muted">
            {Object.keys(missoes).length} de {missions.length} missões concluídas · {percentual}%
          </p>
        </div>

        {seguinte && (
          <Link
            href={`/missao/${seguinte.slug}`}
            className="rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
          >
            Continuar: {seguinte.title}
          </Link>
        )}
      </div>

      <div className="mt-10 space-y-12">
        {chapters.map((capitulo) => {
          const doCapitulo = missions
            .filter((mission) => mission.chapter === capitulo.number)
            .sort((a, b) => a.order - b.order);

          return (
            <section key={capitulo.number} aria-labelledby={`capitulo-${capitulo.number}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-sm text-lime">
                  capítulo {capitulo.number}
                </span>
                <h2 id={`capitulo-${capitulo.number}`} className="text-xl font-bold">
                  {capitulo.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted">{capitulo.subtitle}</p>
              <p className="mt-1 font-mono text-xs text-muted/70">{capitulo.topics}</p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {doCapitulo.map((mission) => {
                  const feita = Boolean(missoes[mission.id]);
                  const liberada = estaDesbloqueada(mission, progresso);

                  if (!liberada) {
                    return (
                      <li
                        key={mission.id}
                        className="rounded-xl border border-line bg-surface/40 p-4 opacity-50"
                      >
                        <p className="font-mono text-xs text-muted">
                          missão {mission.order} · bloqueada
                        </p>
                        <p className="mt-1 font-semibold">{mission.title}</p>
                        <p className="mt-1 text-sm text-muted">
                          Conclua a missão anterior para liberar.
                        </p>
                      </li>
                    );
                  }

                  return (
                    <li key={mission.id}>
                      <Link
                        href={`/missao/${mission.slug}`}
                        className={`block h-full rounded-xl border p-4 transition-colors ${
                          feita
                            ? "border-lime/40 bg-lime/5 hover:border-lime"
                            : "border-line bg-surface hover:border-lime/60"
                        }`}
                      >
                        <p className="flex items-center justify-between font-mono text-xs text-muted">
                          <span>missão {mission.order}</span>
                          <span className={feita ? "text-lime" : "text-sky"}>
                            {feita ? `✓ ${mission.xp} XP` : `${mission.xp} XP`}
                          </span>
                        </p>
                        <p className="mt-1 font-semibold">{mission.title}</p>
                        <p className="mt-1 text-sm text-muted">{mission.summary}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {Object.keys(missoes).length > 0 && (
        <div className="mt-14 border-t border-line pt-6">
          <button
            type="button"
            onClick={reiniciar}
            className="text-sm text-muted underline-offset-4 transition-colors hover:text-danger hover:underline"
          >
            Zerar meu progresso
          </button>
        </div>
      )}
    </div>
  );
}
