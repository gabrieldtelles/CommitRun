import Link from "next/link";
import { Suspense } from "react";
import { Pagina } from "@/components/pagina";
import { CtaContinuar } from "@/components/cta-continuar";
import { Vitrine } from "@/components/vitrine";
import { chapters, missions, totalXp } from "@/content/missions";

const ETAPAS = [
  {
    numero: "01",
    titulo: "Briefing",
    texto: "TellesDev explica o problema do time e o que precisa estar versionado no fim da missão.",
  },
  {
    numero: "02",
    titulo: "Terminal",
    texto: "Você resolve com git de verdade, em um repositório simulado que roda no navegador.",
  },
  {
    numero: "03",
    titulo: "Validação",
    texto: "O estado do repositório é conferido comando a comando. Passou, ganha XP e libera a próxima.",
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
              Cada missão, do briefing ao commit
            </h2>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {ETAPAS.map((etapa) => (
                <li key={etapa.numero} className="rounded-xl border border-line bg-surface p-6">
                  <p className="font-mono text-sm text-lime">{etapa.numero}</p>
                  <h3 className="mt-3 text-lg font-semibold">{etapa.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{etapa.texto}</p>
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
