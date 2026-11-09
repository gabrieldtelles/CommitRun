"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mission } from "@/content/types";
import { xpGanho, type Conclusao } from "@/lib/progresso";

type Estado = {
  xp: number;
  concluidas: Record<string, Conclusao>;
  apelido: string;
  hidratado: boolean;
  concluir: (mission: Mission, dicas: number) => number;
  definirApelido: (apelido: string) => void;
  reiniciar: () => void;
};

export const useProgresso = create<Estado>()(
  persist(
    (set, get) => ({
      xp: 0,
      concluidas: {},
      apelido: "",
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

      definirApelido: (apelido) => set({ apelido: apelido.trim().slice(0, 24) }),

      reiniciar: () => set({ xp: 0, concluidas: {} }),
    }),
    {
      name: "commitrun:progresso",
      version: 1,
      partialize: ({ xp, concluidas, apelido }) => ({ xp, concluidas, apelido }),
      onRehydrateStorage: () => (estado) => {
        if (estado) estado.hidratado = true;
      },
    },
  ),
);
