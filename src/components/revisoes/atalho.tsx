"use client";

import Link from "next/link";
import { useAgendaDeRevisoes } from "./use-agenda";

export function AtalhoDeRevisoes() {
  const { vencidas, agendadas, total } = useAgendaDeRevisoes();

  if (total === 0) {
    return (
      <section aria-label="Revisões" className="rounded-xl border border-line bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">revisões</p>
        <p className="mt-2 text-sm text-muted">
          Depois da primeira missão, ela volta aqui em dois dias para você não esquecer o comando.
        </p>
      </section>
    );
  }

  const proxima = agendadas[0];

  return (
    <section
      aria-label="Revisões"
      className={`rounded-xl border p-5 ${vencidas.length > 0 ? "border-warn/40 bg-warn/5" : "border-line bg-surface"}`}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-warn">revisões</p>

      {vencidas.length > 0 ? (
        <>
          <p className="mt-2 text-2xl font-bold">
            {vencidas.length} {vencidas.length === 1 ? "missão" : "missões"} esperando
          </p>
          <p className="mt-1 text-sm text-muted">
            Refaça para fixar o que aprendeu e garantir XP extra.
          </p>
          <Link
            href="/revisoes"
            className="mt-4 inline-block rounded-lg bg-warn px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:brightness-110"
          >
            Revisar agora
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm">Nada vencido por enquanto.</p>
          {proxima && (
            <p className="mt-1 text-sm text-muted">
              A próxima é <strong className="font-medium text-ink">{proxima.mission.title}</strong>,
              em {proxima.diasRestantes} {proxima.diasRestantes === 1 ? "dia" : "dias"}.
            </p>
          )}
          <Link
            href="/revisoes"
            className="mt-4 inline-block text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Ver agenda completa
          </Link>
        </>
      )}
    </section>
  );
}
