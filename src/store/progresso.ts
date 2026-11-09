"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mission } from "@/content/types";
import { xpGanho } from "@/lib/progresso";
import { estaVencida, xpDeRevisao } from "@/lib/revisao";
import { chaveDoDia } from "@/lib/temporada";

export type MissaoLocal = {
  concluidaEm: number;
  ultimaEm: number;
  revisoes: number;
  dicas: number;
};

export type ProgressoRecebido = {
  missoes: Record<string, MissaoLocal>;
  atividade: Record<string, number>;
  xp: number;
};

type Estado = {
  xp: number;
  missoes: Record<string, MissaoLocal>;
  atividade: Record<string, number>;
  conta: string | null;
  concluir: (mission: Mission, dicas: number) => number;
  revisar: (mission: Mission) => number;
  adotarConta: (contaId: string | null) => void;
  importar: (progresso: ProgressoRecebido) => void;
  recarregar: () => Promise<void>;
  reiniciar: () => void;
};

const zerado = { xp: 0, missoes: {}, atividade: {} };

function registrarDia(atividade: Record<string, number>, ganho: number): Record<string, number> {
  if (ganho <= 0) return atividade;
  const hoje = chaveDoDia(Date.now());
  return { ...atividade, [hoje]: (atividade[hoje] ?? 0) + ganho };
}

export const useProgresso = create<Estado>()(
  persist(
    (set, get) => ({
      ...zerado,
      conta: null,

      concluir: (mission, dicas) => {
        if (get().missoes[mission.id]) return 0;

        const ganho = xpGanho(mission, dicas);
        const agora = Date.now();

        set((estado) => ({
          xp: estado.xp + ganho,
          missoes: {
            ...estado.missoes,
            [mission.id]: { concluidaEm: agora, ultimaEm: agora, revisoes: 0, dicas },
          },
          atividade: registrarDia(estado.atividade, ganho),
        }));

        return ganho;
      },

      revisar: (mission) => {
        const atual = get().missoes[mission.id];
        if (!atual || !estaVencida(atual.revisoes, atual.ultimaEm)) return 0;

        const ganho = xpDeRevisao(mission);

        set((estado) => ({
          xp: estado.xp + ganho,
          missoes: {
            ...estado.missoes,
            [mission.id]: { ...atual, revisoes: atual.revisoes + 1, ultimaEm: Date.now() },
          },
          atividade: registrarDia(estado.atividade, ganho),
        }));

        return ganho;
      },

      adotarConta: (contaId) =>
        set((estado) => {
          const vazio = estado.xp === 0 && Object.keys(estado.missoes).length === 0;

          if (contaId === null) {
            return vazio && estado.conta === null ? estado : { ...zerado, conta: null };
          }

          return estado.conta === contaId ? estado : { ...zerado, conta: contaId };
        }),

      importar: (progresso) =>
        set({
          xp: progresso.xp,
          missoes: progresso.missoes,
          atividade: progresso.atividade,
        }),

      recarregar: async () => {
        if (!get().conta) return;

        try {
          const resposta = await fetch("/api/progresso", { cache: "no-store" });
          if (!resposta.ok) return;
          const dados = (await resposta.json()) as { progresso: ProgressoRecebido };
          set({
            xp: dados.progresso.xp,
            missoes: dados.progresso.missoes,
            atividade: dados.progresso.atividade,
          });
        } catch {
          // mantém o estado atual quando o servidor não responde
        }
      },

      reiniciar: () => set({ ...zerado }),
    }),
    {
      name: "commitrun:progresso",
      version: 2,
      partialize: ({ xp, missoes, atividade, conta }) => ({ xp, missoes, atividade, conta }),
      migrate: () => ({ ...zerado, conta: null }),
    },
  ),
);
