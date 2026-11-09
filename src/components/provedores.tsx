"use client";

import { SessionProvider } from "next-auth/react";
import { Sincronizador } from "./sincronizador";

export function Provedores({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Sincronizador />
      {children}
    </SessionProvider>
  );
}
