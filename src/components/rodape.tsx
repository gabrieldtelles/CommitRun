import Image from "next/image";
import Link from "next/link";
import { AUTOR, REDES } from "@/content/autor";

const PAGINAS = [
  { href: "/hangar", rotulo: "Hangar" },
  { href: "/revisoes", rotulo: "Code review" },
  { href: "/ranking", rotulo: "Ranking" },
];

export function Rodape() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-16">
        <div className="max-w-sm">
          <Image
            src="/logo.svg"
            alt="CommitRun"
            width={885}
            height={256}
            unoptimized
            className="h-6 w-auto"
          />
          <p className="mt-3 text-sm text-muted">
            Um jogo para aprender git praticando: missões curtas num terminal simulado.
          </p>
        </div>

        <nav aria-labelledby="rodape-paginas">
          <h2 id="rodape-paginas" className="text-xs uppercase tracking-wider text-muted/70">
            Jogo
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {PAGINAS.map((pagina) => (
              <li key={pagina.href}>
                <Link href={pagina.href} className="text-muted transition-colors hover:text-ink">
                  {pagina.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="rodape-redes">
          <h2 id="rodape-redes" className="text-xs uppercase tracking-wider text-muted/70">
            Contato
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {REDES.map((rede) => (
              <li key={rede.rotulo}>
                <a
                  href={rede.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition-colors hover:text-lime"
                >
                  {rede.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Feito por{" "}
            <a
              href={AUTOR.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              {AUTOR.nome}
            </a>
          </p>
          <p>O repositório das missões é simulado no navegador — nada do seu computador é acessado.</p>
        </div>
      </div>
    </footer>
  );
}
