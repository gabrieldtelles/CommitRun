"use client";

import Link from "next/link";
import { chapters, missions } from "@/content/missions";
import { estaDesbloqueada } from "@/lib/progresso";
import { dominio } from "@/lib/revisao";
import { useProgresso } from "@/store/progresso";

export function Campanha() {
  const xp = useProgresso((estado) => estado.xp);
  const missoesFeitas = useProgresso((estado) => estado.missoes);
  const progresso = { xp, missoes: missoesFeitas };

  return (
    <section aria-label="Campanha" className="space-y-10">
      <h2 className="text-xl font-bold tracking-tight">Campanha</h2>

      {chapters.map((capitulo) => {
        const doCapitulo = missions
          .filter((mission) => mission.chapter === capitulo.number)
          .sort((a, b) => a.order - b.order);
        const feitas = doCapitulo.filter((mission) => missoesFeitas[mission.id]).length;

        return (
          <div key={capitulo.number}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-2xl font-bold text-lime">{capitulo.number}</span>
                <div>
                  <h3 className="font-bold">{capitulo.title}</h3>
                  <p className="text-sm text-muted">{capitulo.subtitle}</p>
                </div>
              </div>
              <p className="font-mono text-xs text-muted">
                {feitas}/{doCapitulo.length} concluídas
              </p>
            </div>

            <ol className="mt-4 border-l border-line pl-5">
              {doCapitulo.map((mission) => {
                const feita = missoesFeitas[mission.id];
                const liberada = estaDesbloqueada(mission, progresso);

                return (
                  <li key={mission.id} className="relative py-2">
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[26px] top-4 h-2.5 w-2.5 rounded-full border-2 ${
                        feita
                          ? "border-lime bg-lime"
                          : liberada
                            ? "border-lime bg-base"
                            : "border-line bg-base"
                      }`}
                    />

                    {liberada ? (
                      <Link
                        href={`/missao/${mission.slug}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
                      >
                        <span className="flex items-center gap-2">
                          <span className={feita ? "text-muted" : "font-medium"}>
                            {mission.title}
                          </span>
                          {feita && (
                            <span className="font-mono text-[11px] text-lime">
                              {dominio(feita.revisoes)}
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-muted">{mission.xp} XP</span>
                      </Link>
                    ) : (
                      <p className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 text-muted/50">
                        <span>
                          {mission.title}{" "}
                          <span className="font-mono text-[11px]">(bloqueada)</span>
                        </span>
                        <span className="font-mono text-xs">{mission.xp} XP</span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
