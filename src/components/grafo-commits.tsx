"use client";

import { shortHash } from "@/core/hash";
import { montarGrafo } from "@/lib/grafo";
import type { Repo } from "@/core/types";

const ALTURA_LINHA = 46;
const LARGURA_LANE = 22;
const CORES = ["#a3e635", "#c084fc", "#38bdf8", "#fbbf24"];

function cor(lane: number): string {
  return CORES[lane % CORES.length] as string;
}

export function GrafoCommits({ repo }: { repo: Repo | null }) {
  const { nos, ligacoes, lanes } = montarGrafo(repo);
  const branch = repo?.head.kind === "branch" ? repo.head.name : null;
  const larguraSvg = lanes * LARGURA_LANE + 12;

  return (
    <section
      aria-label="Linha do tempo do repositório"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface"
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Linha do tempo</h2>
        <span className="font-mono text-xs text-muted">
          {repo ? (branch ? `HEAD → ${branch}` : "HEAD solto") : "sem repositório"}
        </span>
      </header>

      {nos.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
          {repo
            ? "Nenhum commit ainda. O primeiro aparece aqui."
            : "Esta pasta ainda não é um repositório git."}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-3">
            <svg
              aria-hidden="true"
              width={larguraSvg}
              height={nos.length * ALTURA_LINHA}
              className="shrink-0"
            >
              {ligacoes.map(({ de, para }, indice) => {
                const x1 = de.lane * LARGURA_LANE + 8;
                const y1 = de.linha * ALTURA_LINHA + 14;
                const x2 = para.lane * LARGURA_LANE + 8;
                const y2 = para.linha * ALTURA_LINHA + 14;
                const meio = (y1 + y2) / 2;

                return (
                  <path
                    key={`${de.commit.hash}-${para.commit.hash}-${indice}`}
                    d={`M ${x1} ${y1} C ${x1} ${meio}, ${x2} ${meio}, ${x2} ${y2}`}
                    fill="none"
                    stroke={cor(Math.min(de.lane, para.lane))}
                    strokeOpacity={0.5}
                    strokeWidth={2}
                  />
                );
              })}

              {nos.map((no) => (
                <circle
                  key={no.commit.hash}
                  cx={no.lane * LARGURA_LANE + 8}
                  cy={no.linha * ALTURA_LINHA + 14}
                  r={no.atual ? 6 : 4.5}
                  fill={no.atual ? cor(no.lane) : "#11141b"}
                  stroke={cor(no.lane)}
                  strokeWidth={2}
                />
              ))}
            </svg>

            <ol className="min-w-0 flex-1">
              {nos.map((no) => (
                <li key={no.commit.hash} style={{ height: ALTURA_LINHA }} className="min-w-0">
                  <p className="truncate text-sm text-ink">{no.commit.message}</p>
                  <p className="flex items-center gap-2 font-mono text-xs text-muted">
                    <span>{shortHash(no.commit.hash)}</span>
                    {no.refs.map((ref) => (
                      <span
                        key={ref}
                        className="rounded border border-line px-1.5 py-px text-[11px]"
                        style={{ color: cor(no.lane) }}
                      >
                        {ref}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
