"use client";

import Link from "next/link";
import { plural } from "@/lib/plural";
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
              : `${plural(item.local.revisoes, "revisão feita", "revisões feitas")}`}
          </p>
        </div>

        <div className="text-right">
          <p className={`font-mono text-sm ${vencida ? "text-warn" : "text-muted"}`}>
            {vencida ? "pronta para revisar" : `em ${plural(item.diasRestantes, "dia", "dias")}`}
          </p>
          <p className="font-mono text-xs text-lime">+{item.xp} XP</p>
        </div>
      </Link>
    </li>
  );
}

export function AgendaDeTreino() {
  const { vencidas, agendadas, total } = useAgendaDeRevisoes();

  return (
    <section className="mt-14 border-t border-line pt-10">
      <h2 className="text-lg font-bold">Treino espaçado</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Comando que você usa uma vez só não gruda. Cada missão concluída volta aqui em intervalos
        crescentes — {INTERVALOS_EM_DIAS.join(", ")} dias — para você refazer do zero e confirmar que
        ainda sabe. Revisão paga 30% do XP da missão.
      </p>

      {total === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Nenhuma missão concluída ainda. Assim que você terminar a primeira, ela volta aqui em dois
          dias.
        </p>
      )}

      {vencidas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-warn">
            Esperando por você ({vencidas.length})
          </h3>
          <ul className="mt-4 space-y-3">
            {vencidas.map((item) => (
              <Cartao key={item.mission.id} item={item} vencida />
            ))}
          </ul>
        </div>
      )}

      {agendadas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted">Agendadas</h3>
          <ul className="mt-4 space-y-3">
            {agendadas.map((item) => (
              <Cartao key={item.mission.id} item={item} vencida={false} />
            ))}
          </ul>
        </div>
      )}

      {total > 0 && (
        <p className="mt-6 text-xs text-muted">
          A agenda de hoje foi calculada em {formato.format(new Date())}. Revisões só contam XP
          quando a data chega — refazer antes vale como treino, não como pontos.
        </p>
      )}
    </section>
  );
}
