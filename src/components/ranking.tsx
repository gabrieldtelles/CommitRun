"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { plural } from "@/lib/plural";
import { fimDaSemana, inicioDaSemana } from "@/lib/temporada";

type Linha = {
  apelido: string;
  avatar: string | null;
  xp: number;
  xpDaSemana: number;
  missoes: number;
  sequencia: number;
  voce: boolean;
};

type Periodo = "semana" | "geral";

const formato = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function Ranking() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [posicao, setPosicao] = useState<number | null>(null);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const resposta = await fetch(`/api/ranking?periodo=${periodo}`, { cache: "no-store" });
        if (!resposta.ok) throw new Error("ranking indisponível");
        const dados = (await resposta.json()) as { ranking: Linha[]; posicao: number | null };
        if (!ativo) return;
        setLinhas(dados.ranking);
        setPosicao(dados.posicao);
        setEstado("pronto");
      } catch {
        if (ativo) setEstado("erro");
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, [periodo]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ranking</h1>

      <div role="tablist" aria-label="Período do ranking" className="mt-6 flex gap-1 rounded-lg border border-line bg-surface p-1">
        {(["semana", "geral"] as const).map((opcao) => (
          <button
            key={opcao}
            role="tab"
            aria-selected={periodo === opcao}
            type="button"
            onClick={() => setPeriodo(opcao)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              periodo === opcao ? "bg-lime text-base" : "text-muted hover:text-ink"
            }`}
          >
            {opcao === "semana" ? "Temporada da semana" : "Geral"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted">
        {periodo === "semana"
          ? `De ${formato.format(inicioDaSemana())} a ${formato.format(fimDaSemana())}. Reinicia toda segunda.`
          : "Todo o XP acumulado desde que você entrou."}
        {posicao && <span className="ml-1 text-lime">Você está em {posicao}º.</span>}
      </p>

      <div className="mt-8">
        {estado === "carregando" && <p className="text-sm text-muted">Carregando...</p>}

        {estado === "erro" && (
          <p className="text-sm text-muted">O ranking não está disponível agora.</p>
        )}

        {estado === "pronto" && linhas.length === 0 && (
          <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
            {periodo === "semana"
              ? "Ninguém pontuou nesta semana ainda. Conclua uma missão e abra a temporada."
              : "Ninguém no ranking ainda. Pode ser você."}
          </p>
        )}

        {linhas.length > 0 && (
          <ol className="space-y-2">
            {linhas.map((linha, indice) => (
              <li
                key={linha.apelido}
                className={`flex items-center gap-4 rounded-xl border p-3 ${
                  linha.voce ? "border-lime/50 bg-lime/5" : "border-line bg-surface"
                }`}
              >
                <span className="w-8 shrink-0 text-center font-mono text-sm text-muted">
                  {indice + 1}
                </span>

                {linha.avatar ? (
                  <Image
                    src={linha.avatar}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 shrink-0 rounded-full border border-line"
                  />
                ) : (
                  <span className="h-8 w-8 shrink-0 rounded-full border border-line bg-surface-2" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {linha.apelido}
                    {linha.voce && <span className="ml-2 text-xs text-lime">você</span>}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {plural(linha.missoes, "missão", "missões")}
                    {linha.sequencia > 0 &&
                      ` · ${plural(linha.sequencia, "dia seguido", "dias seguidos")}`}
                  </p>
                </div>

                <p className="shrink-0 text-right font-mono text-lime">
                  {periodo === "semana" ? linha.xpDaSemana : linha.xp} XP
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
