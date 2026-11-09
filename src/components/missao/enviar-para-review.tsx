"use client";

import { useState } from "react";
import type { Machine } from "@/core/types";
import type { Mission } from "@/content/types";
import { gerarArquivosDoPr, tituloSugerido } from "@/lib/pull-request";

type Props = {
  mission: Mission;
  machine: Machine;
  snapshotInicial: Record<string, string>;
};

export function EnviarParaReview({ mission, machine, snapshotInicial }: Props) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState(() => tituloSugerido(machine, mission));
  const [descricao, setDescricao] = useState("");
  const [estado, setEstado] = useState<"inicial" | "enviando" | "enviado">("inicial");
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    setErro(null);
    setEstado("enviando");

    const arquivos = gerarArquivosDoPr(machine, snapshotInicial);
    if (arquivos.length === 0) {
      setErro("nada mudou no repositório para abrir um pull request");
      setEstado("inicial");
      return;
    }

    try {
      const resposta = await fetch("/api/prs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missaoId: mission.id, titulo, descricao, arquivos }),
      });

      const dados = (await resposta.json()) as { erro?: string };

      if (!resposta.ok) {
        setErro(dados.erro ?? "não foi possível abrir o pull request");
        setEstado("inicial");
        return;
      }

      setEstado("enviado");
    } catch {
      setErro("não foi possível falar com o servidor");
      setEstado("inicial");
    }
  };

  if (estado === "enviado") {
    return (
      <p className="rounded-lg border border-lime/40 bg-lime/5 p-3 text-sm">
        Pull request aberto. Outros jogadores vão revisar o seu diff.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-lime hover:text-lime"
      >
        Abrir pull request desta missão
      </button>
    );
  }

  return (
    <div className="space-y-2 text-left">
      <label htmlFor="titulo-pr" className="text-xs text-muted">
        Título
      </label>
      <input
        id="titulo-pr"
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value)}
        maxLength={120}
        className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm outline-none focus:border-lime"
      />

      <label htmlFor="descricao-pr" className="text-xs text-muted">
        O que você fez (opcional)
      </label>
      <textarea
        id="descricao-pr"
        value={descricao}
        onChange={(evento) => setDescricao(evento.target.value)}
        rows={2}
        maxLength={600}
        className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm outline-none focus:border-lime"
      />

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="flex-1 rounded-lg border border-line px-4 py-2 text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={estado === "enviando" || titulo.trim().length < 5}
          className="flex-1 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-base disabled:opacity-40"
        >
          {estado === "enviando" ? "Enviando..." : "Abrir PR"}
        </button>
      </div>
    </div>
  );
}
