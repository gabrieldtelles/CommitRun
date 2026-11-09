"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { readFile, writeFile } from "@/core/fs";
import { createMachine, prompt as montarPrompt, runCommand } from "@/core/machine";
import type { Machine } from "@/core/types";
import { missionBySlug } from "@/content/missions";
import type { Mission } from "@/content/types";
import { ordenadas, xpGanho } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";
import { Briefing } from "./briefing";
import { EditorArquivo } from "./editor-arquivo";
import { GrafoCommits } from "./grafo-commits";
import { Terminal, type LinhaTerminal } from "./terminal";

const COMANDOS_DO_JOGO = ["missao", "validar", "dica"];

export function SalaDeMissao({ slug }: { slug: string }) {
  const mission = missionBySlug(slug) as Mission;
  const machineRef = useRef<Machine>(createMachine(mission.seed));
  const [, setVersao] = useState(0);
  const [historico, setHistorico] = useState<string[]>([]);
  const [dicas, setDicas] = useState<string[]>([]);
  const [concluida, setConcluida] = useState(false);
  const [ganho, setGanho] = useState(0);
  const [editando, setEditando] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaTerminal[]>(() => [
    { id: 0, tipo: "mentora", texto: `${mission.title}. Digite missao para rever o objetivo.` },
  ]);

  const concluir = useProgresso((estado) => estado.concluir);
  const jaConcluida = useProgresso((estado) => Boolean(estado.concluidas[mission.id]));

  const proxima = useMemo(() => {
    const lista = ordenadas();
    const posicao = lista.findIndex((item) => item.id === mission.id);
    return posicao >= 0 ? (lista[posicao + 1] ?? null) : null;
  }, [mission.id]);

  const escrever = useCallback((novas: Omit<LinhaTerminal, "id">[]) => {
    setLinhas((anteriores) => {
      const base = anteriores.length > 0 ? (anteriores[anteriores.length - 1]?.id ?? 0) + 1 : 0;
      return [...anteriores, ...novas.map((linha, indice) => ({ ...linha, id: base + indice }))];
    });
  }, []);

  const validar = useCallback(() => {
    const resultado = mission.validate({ machine: machineRef.current, history: historico });

    if (!resultado.ok) {
      escrever([{ tipo: "erro", texto: resultado.message }]);
      return;
    }

    escrever([{ tipo: "mentora", texto: resultado.message }]);
    setConcluida(true);
    setGanho(jaConcluida ? 0 : concluir(mission, dicas.length));
  }, [concluir, dicas.length, escrever, historico, jaConcluida, mission]);

  const pedirDica = useCallback(() => {
    setDicas((anteriores) => {
      const proximaDica = mission.hints[anteriores.length];
      if (!proximaDica) return anteriores;
      escrever([{ tipo: "aviso", texto: `dica ${anteriores.length + 1}: ${proximaDica}` }]);
      return [...anteriores, proximaDica];
    });
  }, [escrever, mission.hints]);

  const executar = useCallback(
    (comando: string) => {
      const machine = machineRef.current;
      const prompt = montarPrompt(machine);
      escrever([{ tipo: "comando", texto: comando, prompt }]);

      const [primeiro] = comando.trim().split(/\s+/);

      if (primeiro && COMANDOS_DO_JOGO.includes(primeiro)) {
        if (primeiro === "missao") {
          escrever([
            { tipo: "mentora", texto: mission.summary },
            ...mission.objectives.map((objetivo) => ({ tipo: "saida" as const, texto: `- ${objetivo}` })),
          ]);
        }
        if (primeiro === "validar") validar();
        if (primeiro === "dica") pedirDica();
        return;
      }

      const resultado = runCommand(machine, comando);
      setHistorico((anteriores) => [...anteriores, comando]);

      if (resultado.effect?.type === "clear") {
        setLinhas([]);
        setVersao((valor) => valor + 1);
        return;
      }

      if (resultado.effect?.type === "edit") setEditando(resultado.effect.path);
      if (resultado.output) {
        escrever([{ tipo: resultado.error ? "erro" : "saida", texto: resultado.output }]);
      }

      setVersao((valor) => valor + 1);
    },
    [escrever, mission.objectives, mission.summary, pedirDica, validar],
  );

  const reiniciar = useCallback(() => {
    machineRef.current = createMachine(mission.seed);
    setHistorico([]);
    setConcluida(false);
    setGanho(0);
    setLinhas([
      { id: 0, tipo: "mentora", texto: "Cenário reiniciado. Comece de novo quando quiser." },
    ]);
    setVersao((valor) => valor + 1);
  }, [mission.seed]);

  const machine = machineRef.current;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface/60 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted">
              <Link href="/missoes" className="hover:text-lime">
                trilha
              </Link>{" "}
              / capítulo {mission.chapter} / missão {mission.order} / {mission.xp} XP
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {mission.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={reiniciar}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-muted"
            >
              Reiniciar
            </button>
            <button
              type="button"
              onClick={pedirDica}
              disabled={dicas.length >= mission.hints.length}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-warn hover:text-warn disabled:cursor-not-allowed disabled:opacity-40"
            >
              Dica {dicas.length}/{mission.hints.length}
            </button>
            <button
              type="button"
              onClick={validar}
              className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
            >
              Validar missão
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)_340px] lg:gap-5">
        <Briefing mission={mission} dicas={dicas} onPedirDica={pedirDica} />

        <div className="min-h-[520px] lg:min-h-0">
          <Terminal
            linhas={linhas}
            prompt={montarPrompt(machine)}
            onComando={executar}
          />
        </div>

        <div className="min-h-[320px] lg:min-h-0">
          <GrafoCommits repo={machine.repo} />
        </div>
      </main>

      {editando && (
        <EditorArquivo
          caminho={editando}
          conteudo={readFile(machine.fs, editando) ?? ""}
          onFechar={() => setEditando(null)}
          onSalvar={(conteudo) => {
            writeFile(machine.fs, editando, conteudo);
            setEditando(null);
            setVersao((valor) => valor + 1);
            escrever([{ tipo: "saida", texto: `arquivo salvo: ${editando}` }]);
          }}
        />
      )}

      {concluida && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-base/85 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-conclusao"
            className="w-full max-w-md rounded-xl border border-lime/40 bg-surface p-6 text-center"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-lime">missão concluída</p>
            <h2 id="titulo-conclusao" className="mt-2 text-2xl font-bold">
              {mission.title}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {ganho > 0
                ? `+${ganho} XP${dicas.length > 0 ? ` (${dicas.length} dica${dicas.length > 1 ? "s" : ""} usada${dicas.length > 1 ? "s" : ""})` : ""}`
                : `Você já tinha concluído esta missão. XP original mantido: ${xpGanho(mission, 0)}.`}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setConcluida(false)}
                className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:border-muted"
              >
                Continuar no terminal
              </button>
              {proxima ? (
                <Link
                  href={`/missao/${proxima.slug}`}
                  className="flex-1 rounded-lg bg-lime px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
                >
                  Próxima missão
                </Link>
              ) : (
                <Link
                  href="/missoes"
                  className="flex-1 rounded-lg bg-lime px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
                >
                  Ver a trilha
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
