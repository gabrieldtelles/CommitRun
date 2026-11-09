"use client";

import { useState } from "react";
import type { ArquivoDoPr, ComentarioDeReview } from "@/lib/pull-request";

type Props = {
  arquivos: ArquivoDoPr[];
  comentarios: ComentarioDeReview[];
  onComentar?: (comentario: ComentarioDeReview) => void;
};

function corDaLinha(linha: string): string {
  if (linha.startsWith("+")) return "bg-ok/10 text-ok";
  if (linha.startsWith("-")) return "bg-danger/10 text-danger";
  if (linha.startsWith("@@")) return "text-sky";
  if (linha.startsWith("diff --git")) return "text-muted/60";
  return "text-muted";
}

export function VisorDeDiff({ arquivos, comentarios, onComentar }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  const confirmar = (arquivo: string, linha: number) => {
    if (texto.trim() && onComentar) onComentar({ arquivo, linha, texto: texto.trim() });
    setEditando(null);
    setTexto("");
  };

  return (
    <div className="space-y-4">
      {arquivos.map((arquivo) => (
        <div key={arquivo.caminho} className="overflow-hidden rounded-xl border border-line bg-[#0d1017]">
          <p className="border-b border-line bg-surface px-4 py-2 font-mono text-sm text-sky">
            {arquivo.caminho}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[13px]">
              <caption className="sr-only">Diferenças em {arquivo.caminho}</caption>
              <tbody>
                {arquivo.diff.split("\n").map((linha, indice) => {
                  const chave = `${arquivo.caminho}:${indice}`;
                  const daLinha = comentarios.filter(
                    (item) => item.arquivo === arquivo.caminho && item.linha === indice,
                  );

                  return (
                    <tr key={indice} className="group align-top">
                      <td className="w-10 select-none border-r border-line px-2 py-0.5 text-right text-muted/40">
                        {indice + 1}
                      </td>
                      <td className={`px-3 py-0.5 ${corDaLinha(linha)}`}>
                        <span className="whitespace-pre-wrap break-all">{linha || " "}</span>

                        {onComentar && editando !== chave && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditando(chave);
                              setTexto("");
                            }}
                            className="ml-2 rounded border border-line px-1.5 text-[11px] text-muted opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                          >
                            comentar
                          </button>
                        )}

                        {daLinha.map((comentario, posicao) => (
                          <span
                            key={posicao}
                            className="mt-1 block rounded border border-warn/40 bg-warn/5 px-2 py-1 font-sans text-xs text-ink"
                          >
                            {comentario.texto}
                          </span>
                        ))}

                        {editando === chave && (
                          <span className="mt-2 block font-sans">
                            <label htmlFor={`comentario-${chave}`} className="sr-only">
                              Comentário para a linha {indice + 1} de {arquivo.caminho}
                            </label>
                            <textarea
                              id={`comentario-${chave}`}
                              value={texto}
                              autoFocus
                              rows={2}
                              onChange={(evento) => setTexto(evento.target.value)}
                              placeholder="O que precisa mudar nesta linha e por quê."
                              className="w-full rounded border border-line bg-base p-2 text-xs text-ink outline-none focus:border-lime"
                            />
                            <span className="mt-1 flex gap-2">
                              <button
                                type="button"
                                onClick={() => confirmar(arquivo.caminho, indice)}
                                className="rounded bg-lime px-3 py-1 text-xs font-semibold text-base"
                              >
                                Adicionar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditando(null)}
                                className="rounded border border-line px-3 py-1 text-xs text-muted"
                              >
                                Cancelar
                              </button>
                            </span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
