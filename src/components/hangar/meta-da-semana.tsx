"use client";

import { metaConcluida, metaDaSemana, progressoDaMeta } from "@/lib/meta-semanal";
import { fimDaSemana, inicioDaSemana } from "@/lib/temporada";
import { useProgresso } from "@/store/progresso";

const formato = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function MetaDaSemana() {
  const missoes = useProgresso((estado) => estado.missoes);
  const atividade = useProgresso((estado) => estado.atividade);

  const meta = metaDaSemana();
  const feito = progressoDaMeta(meta, { missoes, atividade });
  const completa = metaConcluida(meta, feito);
  const percentual = Math.min(100, Math.round((feito / meta.alvo) * 100));

  return (
    <section
      aria-label="Meta da semana"
      className={`rounded-xl border p-5 ${completa ? "border-lime/40 bg-lime/5" : "border-line bg-surface"}`}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-lime">meta da semana</p>
      <h2 className="mt-2 text-lg font-bold">{meta.titulo}</h2>
      <p className="mt-1 text-sm text-muted">{meta.descricao}</p>

      <div className="mt-4">
        <div
          role="progressbar"
          aria-valuenow={feito}
          aria-valuemin={0}
          aria-valuemax={meta.alvo}
          className="h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="mt-2 flex items-center justify-between text-xs">
          <span className="font-mono text-muted">
            {feito}/{meta.alvo}
          </span>
          <span className={completa ? "font-semibold text-lime" : "text-muted"}>
            {completa ? `meta batida · +${meta.bonus} XP de bônus` : `+${meta.bonus} XP ao concluir`}
          </span>
        </p>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-muted/70">
        Temporada de {formato.format(inicioDaSemana())} a {formato.format(fimDaSemana())} · reinicia
        toda segunda.
      </p>
    </section>
  );
}
