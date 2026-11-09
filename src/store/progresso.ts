"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { missions } from "@/content/missions";
import type { Mission } from "@/content/types";
import { xpGanho, type Conclusao } from "@/lib/progresso";

type Estado = {
  xp: number;
  concluidas: Record<string, Conclusao>;
  conta: string | null;
  hidratado: boolean;
  concluir: (mission: Mission, dicas: number) => number;
  adotarConta: (contaId: string | null) => void;
  importar: (ids: string[]) => void;
  reiniciar: () => void;
};

export const useProgresso = create<Estado>()(
  persist(
    (set, get) => ({
      xp: 0,
      concluidas: {},
      conta: null,
      hidratado: false,

      concluir: (mission, dicas) => {
        const anterior = get().concluidas[mission.id];
        const ganho = xpGanho(mission, dicas);
        if (anterior) return 0;

        set((estado) => ({
          xp: estado.xp + ganho,
          concluidas: {
            ...estado.concluidas,
            [mission.id]: { xp: ganho, dicas, concluidaEm: Date.now() },
          },
        }));

        return ganho;
      },

      adotarConta: (contaId) =>
        set((estado) => {
          const vazio = estado.xp === 0 && Object.keys(estado.concluidas).length === 0;

          if (contaId === null) {
            return vazio && estado.conta === null ? estado : { conta: null, xp: 0, concluidas: {} };
          }

          return estado.conta === contaId ? estado : { conta: contaId, xp: 0, concluidas: {} };
        }),

      importar: (ids) =>
        set((estado) => {
          const concluidas = { ...estado.concluidas };
          const agora = Date.now();

          for (const id of ids) {
            if (concluidas[id]) continue;
            const mission = missions.find((item) => item.id === id);
            if (!mission) continue;
            concluidas[id] = { xp: mission.xp, dicas: 0, concluidaEm: agora };
          }

          const xp = Object.values(concluidas).reduce((soma, item) => soma + item.xp, 0);
          return { concluidas, xp };
        }),

      reiniciar: () => set({ xp: 0, concluidas: {} }),
    }),
    {
      name: "commitrun:progresso",
      version: 1,
      partialize: ({ xp, concluidas, conta }) => ({ xp, concluidas, conta }),
      onRehydrateStorage: () => (estado) => {
        if (estado) estado.hidratado = true;
      },
    },
  ),
);
