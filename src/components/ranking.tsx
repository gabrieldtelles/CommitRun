"use client";

import { useCallback, useEffect, useState } from "react";
import type { Pontuacao } from "@/server/armazenamento";
import { useProgresso } from "@/store/progresso";

type Estado = "carregando" | "pronto" | "enviando" | "indisponivel";

export function Ranking() {
  const [lista, setLista] = useState<Pontuacao[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [aviso, setAviso] = useState<string | null>(null);

  const apelido = useProgresso((valor) => valor.apelido);
  const definirApelido = useProgresso((valor) => valor.definirApelido);
  const concluidas = useProgresso((valor) => valor.concluidas);

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/ranking", { cache: "no-store" });
      if (!resposta.ok) throw new Error();
      const dados = (await resposta.json()) as { ranking: Pontuacao[] };
      setLista(dados.ranking);
      setEstado("pronto");
    } catch {
      setEstado("indisponivel");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setAviso(null);
    setEstado("enviando");

    try {
      const resposta = await fetch("/api/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apelido, missoes: Object.keys(concluidas) }),
      });

      const dados = (await resposta.json()) as { erro?: string; ranking?: Pontuacao[]; posicao?: number };

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

  const total = Object.keys(concluidas).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ranking</h1>
      <p className="mt-2 text-muted">
        Entre com um apelido para registrar suas missões concluídas. O XP é recalculado no servidor a
        partir das missões — não dá para inventar pontuação.
      </p>

      <form onSubmit={enviar} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="apelido" className="sr-only">
            Seu apelido no ranking
          </label>
          <input
            id="apelido"
            value={apelido}
            onChange={(evento) => definirApelido(evento.target.value)}
            maxLength={24}
            placeholder="seu apelido"
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-lime"
          />
        </div>
        <button
          type="submit"
          disabled={apelido.trim().length < 2 || total === 0 || estado === "enviando"}
          className="rounded-lg bg-lime px-5 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {estado === "enviando" ? "Enviando..." : `Enviar ${total} missão(ões)`}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted">
        O apelido enviado fica visível para quem abrir esta página.
      </p>

      {aviso && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
          {aviso}
        </p>
      )}

      <div className="mt-10">
        {estado === "carregando" && <p className="text-sm text-muted">Carregando ranking...</p>}

        {estado === "indisponivel" && (
          <p className="text-sm text-muted">
            O ranking não está disponível agora. Seu progresso continua salvo neste navegador.
          </p>
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
                <th scope="col" className="py-2 pr-3">Apelido</th>
                <th scope="col" className="py-2 pr-3 text-right">Missões</th>
                <th scope="col" className="py-2 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item, posicao) => (
                <tr key={item.apelido} className="border-b border-line/60">
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
