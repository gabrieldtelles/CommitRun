"use client";

import { nivel, patente, xpNoNivel } from "@/lib/progresso";
import { calcularSequencia, xpDaSemana } from "@/lib/temporada";
import { useProgresso } from "@/store/progresso";

function Estatistica({ valor, rotulo, nota }: { valor: string | number; rotulo: string; nota?: string }) {
  return (
    <div>
      <p className="font-mono text-3xl font-bold text-ink">{valor}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted">{rotulo}</p>
      {nota && <p className="text-xs text-muted/70">{nota}</p>}
    </div>
  );
}

export function PainelDoJogador({ apelido }: { apelido: string }) {
  const xp = useProgresso((estado) => estado.xp);
  const atividade = useProgresso((estado) => estado.atividade);

  const { atual, total } = xpNoNivel(xp);
  const sequencia = calcularSequencia(atividade);
  const daSemana = xpDaSemana(atividade);

  return (
    <section aria-label="Seu progresso" className="rounded-xl border border-line bg-surface p-6">
      <p className="text-sm text-muted">{apelido}</p>

      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-5xl font-bold text-lime">{nivel(xp)}</span>
        <h1 className="text-2xl font-bold tracking-tight">{patente(xp)}</h1>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <div
            role="progressbar"
            aria-valuenow={atual}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Progresso para o próximo nível"
            className="h-2 overflow-hidden rounded-full bg-surface-2"
          >
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-500"
              style={{ width: `${(atual / total) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {atual} de {total} XP para o próximo nível
          </p>
        </div>

        <dl className="flex gap-8">
          <Estatistica
            valor={sequencia.atual}
            rotulo="dias seguidos"
            nota={`recorde: ${sequencia.recorde}`}
          />
          <Estatistica valor={daSemana} rotulo="XP da semana" />
          <Estatistica valor={xp} rotulo="XP total" />
        </dl>
      </div>
    </section>
  );
}
