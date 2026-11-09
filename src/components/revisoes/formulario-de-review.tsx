"use client";

import { useState } from "react";
import type { ComentarioDeReview, Veredito } from "@/lib/pull-request";

type Props = {
  comentarios: ComentarioDeReview[];
  enviando: boolean;
  erro: string | null;
  onRemoverComentario: (posicao: number) => void;
  onEnviar: (veredito: Veredito, resumo: string) => void;
};

export function FormularioDeReview({
  comentarios,
  enviando,
  erro,
  onRemoverComentario,
  onEnviar,
}: Props) {
  const [veredito, setVeredito] = useState<Veredito>("aprovado");
  const [resumo, setResumo] = useState("");

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        onEnviar(veredito, resumo);
      }}
      className="rounded-xl border border-line bg-surface p-5"
    >
      <h2 className="font-bold">Seu review</h2>

      <fieldset className="mt-4">
        <legend className="text-sm text-muted">Veredito</legend>
        <div className="mt-2 flex gap-2">
          {(
            [
              ["aprovado", "Aprovar"],
              ["mudancas", "Pedir mudanças"],
            ] as const
          ).map(([valor, rotulo]) => (
            <label
              key={valor}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                veredito === valor ? "border-lime bg-lime/10 text-lime" : "border-line text-muted"
              }`}
            >
              <input
                type="radio"
                name="veredito"
                value={valor}
                checked={veredito === valor}
                onChange={() => setVeredito(valor)}
                className="sr-only"
              />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="resumo" className="text-sm text-muted">
          Resumo (mínimo 40 caracteres)
        </label>
        <textarea
          id="resumo"
          value={resumo}
          onChange={(evento) => setResumo(evento.target.value)}
          rows={4}
          placeholder="O que está bom, o que precisa mudar e por quê."
          className="mt-1 w-full rounded-lg border border-line bg-base p-3 text-sm outline-none transition-colors focus:border-lime"
        />
        <p className="mt-1 text-xs text-muted">{resumo.trim().length}/40</p>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted">
          Comentários em linha ({comentarios.length}) — clique em uma linha do diff para adicionar.
        </p>
        <ul className="mt-2 space-y-2">
          {comentarios.map((comentario, posicao) => (
            <li
              key={posicao}
              className="flex items-start justify-between gap-3 rounded-lg border border-line bg-base p-2 text-sm"
            >
              <span>
                <span className="font-mono text-xs text-sky">
                  {comentario.arquivo}:{comentario.linha + 1}
                </span>
                <span className="mt-0.5 block">{comentario.texto}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemoverComentario(posicao)}
                className="shrink-0 text-xs text-muted transition-colors hover:text-danger"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      {erro && <p className="mt-4 rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 w-full rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enviando ? "Enviando..." : "Enviar review"}
      </button>
    </form>
  );
}
