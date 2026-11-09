"use client";

import { useCallback, useEffect, useState } from "react";
import type { PullRequest, Review } from "@/lib/pull-request";

export type Painel = {
  fila: PullRequest[];
  meus: PullRequest[];
  revisados: { pr: PullRequest; review: Review }[];
  necessarios: number;
};

const VAZIO: Painel = { fila: [], meus: [], revisados: [], necessarios: 2 };

export function usePrs() {
  const [painel, setPainel] = useState<Painel>(VAZIO);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/prs", { cache: "no-store" });
      if (!resposta.ok) throw new Error("indisponível");
      setPainel((await resposta.json()) as Painel);
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const resposta = await fetch("/api/prs", { cache: "no-store" });
        if (!resposta.ok) throw new Error("indisponível");
        const dados = (await resposta.json()) as Painel;
        if (ativo) {
          setPainel(dados);
          setEstado("pronto");
        }
      } catch {
        if (ativo) setEstado("erro");
      }
    };

    void buscar();
    return () => {
      ativo = false;
    };
  }, []);

  return { painel, estado, recarregar: carregar };
}
