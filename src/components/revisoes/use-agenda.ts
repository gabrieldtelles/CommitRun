"use client";

import { useMemo } from "react";
import { missions } from "@/content/missions";
import type { Mission } from "@/content/types";
import { diasAteRevisao, dominio, estaVencida, xpDeRevisao } from "@/lib/revisao";
import { useAgora } from "@/lib/use-agora";
import { useProgresso, type MissaoLocal } from "@/store/progresso";

export type ItemDeRevisao = {
  mission: Mission;
  local: MissaoLocal;
  vencida: boolean;
  diasRestantes: number;
  xp: number;
  dominio: string;
};

export function useAgendaDeRevisoes() {
  const missoesFeitas = useProgresso((estado) => estado.missoes);
  const agora = useAgora();

  return useMemo(() => {
    const itens: ItemDeRevisao[] = [];

    for (const mission of missions) {
      const local = missoesFeitas[mission.id];
      if (!local) continue;

      itens.push({
        mission,
        local,
        vencida: estaVencida(local.revisoes, local.ultimaEm, agora),
        diasRestantes: diasAteRevisao(local.revisoes, local.ultimaEm, agora),
        xp: xpDeRevisao(mission),
        dominio: dominio(local.revisoes),
      });
    }

    const vencidas = itens
      .filter((item) => item.vencida)
      .sort((a, b) => a.local.ultimaEm - b.local.ultimaEm);

    const agendadas = itens
      .filter((item) => !item.vencida)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    return { vencidas, agendadas, total: itens.length };
  }, [missoesFeitas, agora]);
}
