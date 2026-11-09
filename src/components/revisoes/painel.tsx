"use client";

import Link from "next/link";
import { REVIEWS_NECESSARIOS, reputacaoDe } from "@/lib/pull-request";
import { plural } from "@/lib/plural";
import { AgendaDeTreino } from "./agenda-de-treino";
import { usePrs } from "./use-prs";

const formato = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function Vazio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
      {texto}
    </p>
  );
}

export function PainelDeRevisoes() {
  const { painel, estado } = usePrs();
  const meusReviews = painel.revisados.map((item) => item.review);
  const reputacao = reputacaoDe(meusReviews);
  const avaliados = meusReviews.filter((review) => review.nota !== null).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Code review</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Terminou uma missão? Abra um pull request com o que você fez. Outros jogadores revisam o seu
        diff, você revisa o deles, e cada review vale XP. Quem escreve review útil sobe de reputação.
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-4 rounded-xl border border-line bg-surface p-5">
        <div>
          <dd className="font-mono text-3xl font-bold text-lime">{reputacao}</dd>
          <dt className="mt-1 text-xs uppercase tracking-wider text-muted">reputação</dt>
        </div>
        <div>
          <dd className="font-mono text-3xl font-bold">{meusReviews.length}</dd>
          <dt className="mt-1 text-xs uppercase tracking-wider text-muted">reviews feitos</dt>
        </div>
        <div>
          <dd className="font-mono text-3xl font-bold">{avaliados}</dd>
          <dt className="mt-1 text-xs uppercase tracking-wider text-muted">avaliados</dt>
        </div>
      </dl>

      {estado === "erro" && (
        <p className="mt-8 text-sm text-muted">Os pull requests não estão disponíveis agora.</p>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold">Para revisar ({painel.fila.length})</h2>
        <div className="mt-4 space-y-3">
          {estado === "carregando" && <p className="text-sm text-muted">Carregando...</p>}

          {estado === "pronto" && painel.fila.length === 0 && (
            <Vazio texto="Nenhum pull request esperando por você. Quando alguém abrir um, ele aparece aqui." />
          )}

          {painel.fila.map((pr) => (
            <Link
              key={pr.id}
              href={`/revisoes/${pr.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-lime"
            >
              <div className="min-w-0">
                <p className="font-medium">{pr.titulo}</p>
                <p className="text-sm text-muted">
                  {pr.autorApelido} · {pr.missaoTitulo} ·{" "}
                  {plural(pr.arquivos.length, "arquivo", "arquivos")}
                </p>
              </div>
              <span className="font-mono text-xs text-lime">
                {pr.reviews.length}/{REVIEWS_NECESSARIOS} reviews
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Seus pull requests ({painel.meus.length})</h2>
        <div className="mt-4 space-y-3">
          {estado === "pronto" && painel.meus.length === 0 && (
            <Vazio texto="Você ainda não abriu nenhum. Termine uma missão e envie o resultado para review." />
          )}

          {painel.meus.map((pr) => {
            const pendentes = pr.reviews.filter((review) => review.nota === null).length;

            return (
              <Link
                key={pr.id}
                href={`/revisoes/${pr.id}`}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                  pendentes > 0 ? "border-warn/40 bg-warn/5 hover:border-warn" : "border-line bg-surface hover:border-muted"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium">{pr.titulo}</p>
                  <p className="text-sm text-muted">
                    aberto em {formato.format(pr.criadoEm)} ·{" "}
                    {plural(pr.reviews.length, "review recebido", "reviews recebidos")}
                  </p>
                </div>
                {pendentes > 0 && (
                  <span className="font-mono text-xs text-warn">avalie {pendentes}</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Seu histórico de revisor</h2>
        <div className="mt-4 space-y-3">
          {estado === "pronto" && painel.revisados.length === 0 && (
            <Vazio texto="Nenhum review enviado ainda." />
          )}

          {painel.revisados.map(({ pr, review }) => (
            <Link
              key={review.id}
              href={`/revisoes/${pr.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-muted"
            >
              <div className="min-w-0">
                <p className="font-medium">{pr.titulo}</p>
                <p className="text-sm text-muted">
                  {review.veredito === "aprovado" ? "você aprovou" : "você pediu mudanças"} ·{" "}
                  {plural(review.comentarios.length, "comentário", "comentários")}
                </p>
              </div>
              <span className="font-mono text-xs text-lime">
                {review.nota === null ? `+${review.xp} XP` : `nota ${review.nota}/5 · ${review.xp} XP`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <AgendaDeTreino />
    </div>
  );
}
