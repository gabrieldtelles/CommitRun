"use client";

import { useState } from "react";
import type { PullRequest } from "@/lib/pull-request";

type Props = {
  pr: PullRequest;
  contaId: string | null;
  aoAvaliar: (pr: PullRequest) => void;
};

export function ListaDeReviews({ pr, contaId, aoAvaliar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const souAutor = pr.autorId === contaId;

  const avaliar = async (reviewId: string, nota: number) => {
    setErro(null);

    try {
      const resposta = await fetch(`/api/prs/${pr.id}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, nota }),
      });

      const dados = (await resposta.json()) as { pr?: PullRequest; erro?: string };
      if (!resposta.ok || !dados.pr) {
        setErro(dados.erro ?? "não foi possível avaliar");
        return;
      }

      aoAvaliar(dados.pr);
    } catch {
      setErro("não foi possível falar com o servidor");
    }
  };

  if (pr.reviews.length === 0) {
    return (
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-bold">Reviews</h2>
        <p className="mt-2 text-sm text-muted">Nenhum review ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-bold">Reviews ({pr.reviews.length})</h2>

      {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

      <ul className="mt-4 space-y-4">
        {pr.reviews.map((review) => (
          <li key={review.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
            <p className="flex items-center justify-between gap-2">
              <span className="font-medium">{review.revisorApelido}</span>
              <span
                className={`font-mono text-xs ${review.veredito === "aprovado" ? "text-ok" : "text-warn"}`}
              >
                {review.veredito === "aprovado" ? "aprovou" : "pediu mudanças"}
              </span>
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">{review.resumo}</p>

            {review.comentarios.length > 0 && (
              <ul className="mt-2 space-y-1">
                {review.comentarios.map((comentario, posicao) => (
                  <li key={posicao} className="text-xs text-muted">
                    <span className="font-mono text-sky">
                      {comentario.arquivo}:{comentario.linha + 1}
                    </span>{" "}
                    {comentario.texto}
                  </li>
                ))}
              </ul>
            )}

            {souAutor && review.nota === null && (
              <div className="mt-3">
                <p className="text-xs text-muted">Este review te ajudou? (vira XP para quem revisou)</p>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button
                      key={nota}
                      type="button"
                      onClick={() => void avaliar(review.id, nota)}
                      className="h-8 w-8 rounded border border-line text-sm transition-colors hover:border-lime hover:text-lime"
                    >
                      {nota}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {review.nota !== null && (
              <p className="mt-2 font-mono text-xs text-lime">
                nota {review.nota}/5 · {review.xp} XP para {review.revisorApelido}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
