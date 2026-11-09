"use client";

import { useSyncExternalStore } from "react";

const UM_MINUTO = 60_000;

export function useAgora(intervalo = UM_MINUTO): number {
  return useSyncExternalStore(
    (notificar) => {
      const temporizador = setInterval(notificar, intervalo);
      return () => clearInterval(temporizador);
    },
    () => Math.floor(Date.now() / intervalo) * intervalo,
    () => 0,
  );
}
