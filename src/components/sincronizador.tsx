"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useProgresso, type ProgressoRecebido } from "@/store/progresso";

export function Sincronizador() {
  const { data: sessao, status } = useSession();
  const missoes = useProgresso((estado) => estado.missoes);
  const importar = useProgresso((estado) => estado.importar);
  const adotarConta = useProgresso((estado) => estado.adotarConta);
  const [contaBaixada, setContaBaixada] = useState<string | null>(null);

  const conta = status === "authenticated" ? (sessao?.user?.contaId ?? null) : null;
  const pronto = conta !== null && conta === contaBaixada;

  useEffect(() => {
    if (status === "loading") return;
    adotarConta(conta);
  }, [status, conta, adotarConta]);

  useEffect(() => {
    if (!conta || conta === contaBaixada) return;
    let ativo = true;

    const baixar = async () => {
      try {
        const resposta = await fetch("/api/progresso", { cache: "no-store" });
        if (!resposta.ok) throw new Error("progresso indisponível");
        const dados = (await resposta.json()) as { progresso: ProgressoRecebido };
        if (ativo) importar(dados.progresso);
      } catch {
        // mantém o que está em memória quando o servidor não responde
      } finally {
        if (ativo) setContaBaixada(conta);
      }
    };

    void baixar();
    return () => {
      ativo = false;
    };
  }, [conta, contaBaixada, importar]);

  useEffect(() => {
    if (!pronto) return;

    const lista = Object.entries(missoes).map(([id, dados]) => ({
      id,
      revisoes: dados.revisoes,
      dicas: dados.dicas,
    }));

    if (lista.length === 0) return;

    const temporizador = setTimeout(() => {
      void fetch("/api/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missoes: lista }),
      }).catch(() => undefined);
    }, 800);

    return () => clearTimeout(temporizador);
  }, [pronto, missoes]);

  return null;
}
