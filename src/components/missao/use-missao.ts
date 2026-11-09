"use client";

import { useCallback, useMemo, useState } from "react";
import { createMachine, prompt as montarPrompt, runCommand } from "@/core/machine";
import type { Machine } from "@/core/types";
import type { Mission } from "@/content/types";
import { ordenadas } from "@/lib/progresso";
import { useProgresso } from "@/store/progresso";
import type { LinhaTerminal } from "../terminal";

const COMANDOS_DO_JOGO = ["missao", "validar", "dica"];

export function useMissao(mission: Mission) {
  const [jogo, setJogo] = useState<{ machine: Machine; versao: number }>(() => ({
    machine: createMachine(mission.seed),
    versao: 0,
  }));
  const [historico, setHistorico] = useState<string[]>([]);
  const [dicas, setDicas] = useState<string[]>([]);
  const [concluida, setConcluida] = useState(false);
  const [ganho, setGanho] = useState(0);
  const [foiRevisao, setFoiRevisao] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaTerminal[]>(() => [
    { id: 0, tipo: "mentora", texto: `${mission.title}. Digite missao para rever o objetivo.` },
  ]);

  const machine = jogo.machine;
  const concluir = useProgresso((estado) => estado.concluir);
  const revisar = useProgresso((estado) => estado.revisar);
  const registro = useProgresso((estado) => estado.missoes[mission.id]);

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

  const atualizar = useCallback(() => {
    setJogo((anterior) => ({ ...anterior, versao: anterior.versao + 1 }));
  }, []);

  const validar = useCallback(() => {
    const resultado = mission.validate({ machine, history: historico });

    if (!resultado.ok) {
      escrever([{ tipo: "erro", texto: resultado.message }]);
      return;
    }

    escrever([{ tipo: "mentora", texto: resultado.message }]);

    const revisao = Boolean(registro);
    const premio = revisao ? revisar(mission) : concluir(mission, dicas.length);

    setFoiRevisao(revisao);
    setGanho(premio);
    setConcluida(true);
  }, [concluir, dicas.length, escrever, historico, machine, mission, registro, revisar]);

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
      escrever([{ tipo: "comando", texto: comando, prompt: montarPrompt(machine) }]);
      const [primeiro] = comando.trim().split(/\s+/);

      if (primeiro && COMANDOS_DO_JOGO.includes(primeiro)) {
        if (primeiro === "missao") {
          escrever([
            { tipo: "mentora", texto: mission.summary },
            ...mission.objectives.map((objetivo) => ({
              tipo: "saida" as const,
              texto: `- ${objetivo}`,
            })),
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
        atualizar();
        return;
      }

      if (resultado.effect?.type === "edit") setEditando(resultado.effect.path);
      if (resultado.output) {
        escrever([{ tipo: resultado.error ? "erro" : "saida", texto: resultado.output }]);
      }

      atualizar();
    },
    [atualizar, escrever, machine, mission.objectives, mission.summary, pedirDica, validar],
  );

  const reiniciar = useCallback(() => {
    setJogo({ machine: createMachine(mission.seed), versao: 0 });
    setHistorico([]);
    setConcluida(false);
    setGanho(0);
    setLinhas([
      { id: 0, tipo: "mentora", texto: "Cenário reiniciado. Comece de novo quando quiser." },
    ]);
  }, [mission.seed]);

  return {
    machine,
    linhas,
    dicas,
    concluida,
    ganho,
    foiRevisao,
    jaConcluida: Boolean(registro),
    editando,
    proxima,
    prompt: montarPrompt(machine),
    executar,
    validar,
    pedirDica,
    reiniciar,
    atualizar,
    escrever,
    fecharConclusao: useCallback(() => setConcluida(false), []),
    fecharEditor: useCallback(() => setEditando(null), []),
  };
}
