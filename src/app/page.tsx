import Link from "next/link";
import { Suspense } from "react";
import { Pagina } from "@/components/pagina";
import { CtaContinuar } from "@/components/cta-continuar";
import { Vitrine } from "@/components/vitrine";
import { chapters, missions, totalXp } from "@/content/missions";

const CICLO = [
  {
    numero: "01",
    titulo: "Chega um problema, não um exercício",
    texto:
      "A pasta já está quebrada quando você entra: mensagem de commit que não explica nada, arquivo " +
      "que nunca devia ter sido versionado, branch que ninguém sabe fundir. O briefing de TellesDev " +
      "diz o que o time precisa ver resolvido — o caminho é você quem escolhe.",
  },
  {
    numero: "02",
    titulo: "Você digita git, não escolhe alternativa",
    texto:
      "São 23 comandos escritos do zero para este jogo, de merge de três vias a rebase, stash e " +
      "reflog. O repositório responde como o git responde, inclusive quando você erra.",
  },
  {
    numero: "03",
    titulo: "A validação diz o que ainda falta",
    texto:
      "Cada objetivo é conferido no estado real do repositório, e no lugar de um “errado” você " +
      "recebe a frase da pendência. Pedir dica é opcional e cobra 10% do XP da missão.",
  },
  {
    numero: "04",
    titulo: "Semanas depois, a missão volta",
    texto:
      "O que você concluiu entra na fila de revisão em 2, 7, 21 e 60 dias, valendo 30% do XP, até " +
      "sair de recém-aprendido para dominado. E o seu diff pode virar pull request para alguém revisar.",
  },
];

export default function HomePage() {
  return (
    <Pagina>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
          <p className="font-mono text-sm text-lime">git sem decoreba</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Você só aprende git quebrando (e consertando) um repositório.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            CommitRun são {missions.length} missões curtas num terminal simulado. Você entra no time
            de engenharia de um estúdio fictício e resolve os problemas que aparecem de verdade:
            commit mal escrito, arquivo que não devia estar no repositório, branch que precisa voltar
            pra main e conflito que ninguém quer resolver.
          </p>

          <div className="mt-10">
            <Suspense
              fallback={
                <span
                  className="block h-12 w-64 animate-pulse rounded-lg bg-surface-2"
                  aria-hidden="true"
                />
              }
            >
              <CtaContinuar />
            </Suspense>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-line pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Missões</dt>
              <dd className="mt-1 font-mono text-2xl text-lime">{missions.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Capítulos</dt>
              <dd className="mt-1 font-mono text-2xl text-lime">{chapters.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">XP total</dt>
              <dd className="mt-1 font-mono text-2xl text-lime">{totalXp}</dd>
            </div>
          </dl>
          </div>

          <Vitrine />
        </section>

        <section
          aria-labelledby="como-funciona"
          className="border-y border-line bg-surface/40 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="como-funciona" className="text-2xl font-bold tracking-tight sm:text-3xl">
              O ciclo não termina no commit
            </h2>
            <p className="mt-3 text-muted">Quatro passos por missão. O último acontece semanas depois.</p>

            <ol className="mt-10">
              {CICLO.map((etapa, indice) => (
                <li key={etapa.numero} className="relative flex gap-5 pb-8 last:pb-0">
                  {indice < CICLO.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-4 top-9 w-px -translate-x-1/2 bg-line"
                    />
                  )}
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-xs text-lime">
                    {etapa.numero}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold leading-8">{etapa.titulo}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{etapa.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="capitulos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="capitulos" className="text-2xl font-bold tracking-tight sm:text-3xl">
            O caminho até trabalhar em time
          </h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {chapters.map((capitulo) => (
              <li key={capitulo.number} className="rounded-xl border border-line bg-surface p-6">
                <p className="font-mono text-sm text-lime">capítulo {capitulo.number}</p>
                <h3 className="mt-2 text-lg font-semibold">{capitulo.title}</h3>
                <p className="mt-1 text-sm text-muted">{capitulo.subtitle}</p>
                <p className="mt-3 font-mono text-xs text-sky">{capitulo.topics}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/hangar"
              className="inline-block rounded-lg bg-lime px-6 py-3 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
            >
              Abrir a campanha
            </Link>
          </div>
        </section>
    </Pagina>
  );
}
