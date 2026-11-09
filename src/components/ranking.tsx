"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Pontuacao } from "@/server/ranking";
import { useProgresso } from "@/store/progresso";

type Estado = "carregando" | "pronto" | "enviando" | "indisponivel";

export function Ranking() {
  const [lista, setLista] = useState<Pontuacao[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [aviso, setAviso] = useState<string | null>(null);

  const { data: sessao, status } = useSession();
  const concluidas = useProgresso((valor) => valor.missoes);

  const logado = Boolean(sessao?.user?.contaId);
  const identidade = sessao?.user?.login ?? sessao?.user?.name ?? "";
  const total = Object.keys(concluidas).length;

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const resposta = await fetch("/api/ranking", { cache: "no-store" });
        if (!resposta.ok) throw new Error("ranking indisponível");
        const dados = (await resposta.json()) as { ranking: Pontuacao[] };
        if (ativo) {
          setLista(dados.ranking);
          setEstado("pronto");
        }
      } catch {
        if (ativo) setEstado("indisponivel");
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const enviar = async () => {
    setAviso(null);
    setEstado("enviando");

    try {
      const resposta = await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missoes: Object.keys(concluidas) }),
      });

      const dados = (await resposta.json()) as {
        erro?: string;
        ranking?: Pontuacao[];
        posicao?: number;
      };

      if (!resposta.ok) {
        setAviso(dados.erro ?? "não foi possível enviar agora");
        setEstado("pronto");
        return;
      }

      setLista(dados.ranking ?? []);
      setAviso(dados.posicao ? `Você está em ${dados.posicao}º lugar.` : "Pontuação registrada.");
      setEstado("pronto");
    } catch {
      setAviso("não foi possível falar com o servidor");
      setEstado("pronto");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ranking</h1>
      <p className="mt-2 text-muted">
        O XP é recalculado no servidor a partir das missões concluídas na sua conta — não dá para
        inventar pontuação.
      </p>

      <div className="mt-8 rounded-xl border border-line bg-surface p-4">
        {status === "loading" && <p className="text-sm text-muted">Verificando sua sessão...</p>}

        {status !== "loading" && !logado && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Entre com o GitHub para registrar seu progresso.</p>
            <button
              type="button"
              onClick={() => void signIn("github")}
              className="rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
            >
              Entrar com GitHub
            </button>
          </div>
        )}

        {logado && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Enviando como <strong className="font-semibold text-lime">{identidade}</strong> ·{" "}
              {total} missão(ões) concluída(s)
            </p>
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={total === 0 || estado === "enviando"}
              className="rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {estado === "enviando" ? "Enviando..." : "Entrar no ranking"}
            </button>
          </div>
        )}
      </div>

      {aviso && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
          {aviso}
        </p>
      )}

      <div className="mt-10">
        {estado === "carregando" && <p className="text-sm text-muted">Carregando ranking...</p>}

        {estado === "indisponivel" && (
          <p className="text-sm text-muted">O ranking não está disponível agora.</p>
        )}

        {estado !== "carregando" && estado !== "indisponivel" && lista.length === 0 && (
          <p className="text-sm text-muted">Ninguém no ranking ainda. Pode ser você.</p>
        )}

        {lista.length > 0 && (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Jogadores com mais XP</caption>
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="py-2 pr-3">#</th>
                <th scope="col" className="py-2 pr-3">Jogador</th>
                <th scope="col" className="py-2 pr-3 text-right">Missões</th>
                <th scope="col" className="py-2 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item, posicao) => (
                <tr
                  key={item.apelido}
                  className={`border-b border-line/60 ${item.apelido === identidade ? "bg-lime/5" : ""}`}
                >
                  <td className="py-3 pr-3 font-mono text-muted">{posicao + 1}</td>
                  <td className="py-3 pr-3 font-medium">{item.apelido}</td>
                  <td className="py-3 pr-3 text-right text-muted">{item.missoes}</td>
                  <td className="py-3 text-right font-mono text-lime">{item.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
