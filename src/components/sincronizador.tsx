"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useProgresso } from "@/store/progresso";

export function Sincronizador() {
  const { data: sessao, status } = useSession();
  const concluidas = useProgresso((estado) => estado.concluidas);
  const importar = useProgresso((estado) => estado.importar);
  const [contaBaixada, setContaBaixada] = useState<string | null>(null);

  const conta = status === "authenticated" ? (sessao?.user?.contaId ?? null) : null;
  const pronto = conta !== null && conta === contaBaixada;

  useEffect(() => {
    if (!conta || conta === contaBaixada) return;
    let ativo = true;

    const baixar = async () => {
      try {
        const resposta = await fetch("/api/progresso", { cache: "no-store" });
        if (!resposta.ok) throw new Error("progresso indisponível");
        const dados = (await resposta.json()) as { progresso: { missoes: string[] } };
        if (ativo) importar(dados.progresso.missoes);
      } catch {
        // mantém o progresso local quando o servidor não responde
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

    const missoes = Object.keys(concluidas);
    if (missoes.length === 0) return;

    const temporizador = setTimeout(() => {
      void fetch("/api/progresso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missoes }),
      }).catch(() => undefined);
    }, 800);

    return () => clearTimeout(temporizador);
  }, [pronto, concluidas]);

  return null;
}
