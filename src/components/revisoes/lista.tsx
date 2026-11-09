"use client";

import Link from "next/link";
import { INTERVALOS_EM_DIAS } from "@/lib/revisao";
import { useAgendaDeRevisoes, type ItemDeRevisao } from "./use-agenda";

const formato = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function Cartao({ item, vencida }: { item: ItemDeRevisao; vencida: boolean }) {
  return (
    <li>
      <Link
        href={`/missao/${item.mission.slug}?revisao=1`}
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
          vencida ? "border-warn/40 bg-warn/5 hover:border-warn" : "border-line bg-surface hover:border-muted"
        }`}
      >
        <div className="min-w-0">
          <p className="font-medium">{item.mission.title}</p>
          <p className="text-sm text-muted">
            capítulo {item.mission.chapter} · {item.dominio} ·{" "}
            {item.local.revisoes === 0
              ? "nunca revisada"
              : `${item.local.revisoes} revisão(ões) feitas`}
          </p>
        </div>

        <div className="text-right">
          <p className={`font-mono text-sm ${vencida ? "text-warn" : "text-muted"}`}>
            {vencida ? "pronta para revisar" : `em ${item.diasRestantes} dia(s)`}
          </p>
          <p className="font-mono text-xs text-lime">+{item.xp} XP</p>
        </div>
      </Link>
    </li>
  );
}

export function ListaDeRevisoes() {
  const { vencidas, agendadas, total } = useAgendaDeRevisoes();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Revisões</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Comando que você usa uma vez só não gruda. Cada missão concluída volta aqui em intervalos
        crescentes — {INTERVALOS_EM_DIAS.join(", ")} dias — para você refazer do zero e confirmar que
        ainda sabe. Revisão paga 30% do XP da missão.
      </p>

      {total === 0 && (
        <p className="mt-10 rounded-xl border border-line bg-surface p-6 text-sm text-muted">
          Nenhuma missão concluída ainda. Assim que você terminar a primeira, ela aparece aqui para
          revisão em dois dias.
        </p>
      )}

      {vencidas.length > 0 && (
        <section className="mt-10" aria-labelledby="vencidas">
          <h2 id="vencidas" className="text-lg font-bold">
            Esperando por você ({vencidas.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {vencidas.map((item) => (
              <Cartao key={item.mission.id} item={item} vencida />
            ))}
          </ul>
        </section>
      )}

      {agendadas.length > 0 && (
        <section className="mt-10" aria-labelledby="agendadas">
          <h2 id="agendadas" className="text-lg font-bold">
            Agendadas
          </h2>
          <ul className="mt-4 space-y-3">
            {agendadas.map((item) => (
              <Cartao key={item.mission.id} item={item} vencida={false} />
            ))}
          </ul>
        </section>
      )}

      {total > 0 && (
        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
          A agenda de hoje foi calculada em {formato.format(new Date())}. Revisões só contam XP
          quando a data chega — refazer antes vale como treino, não como pontos.
        </p>
      )}
    </div>
  );
}
