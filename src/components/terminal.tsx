"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type LinhaTerminal = {
  id: number;
  tipo: "comando" | "saida" | "erro" | "aviso" | "mentora";
  texto: string;
  prompt?: string;
};

const ESTILO: Record<LinhaTerminal["tipo"], string> = {
  comando: "text-ink",
  saida: "text-muted",
  erro: "text-danger",
  aviso: "text-warn",
  mentora: "text-lime",
};

type Props = {
  linhas: LinhaTerminal[];
  prompt: string;
  bloqueado?: boolean;
  onComando: (texto: string) => void;
};

export function Terminal({ linhas, prompt, bloqueado = false, onComando }: Props) {
  const [texto, setTexto] = useState("");
  const [historico, setHistorico] = useState<string[]>([]);
  const [posicao, setPosicao] = useState(-1);
  const entradaRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [linhas]);

  const enviar = () => {
    const comando = texto.trim();
    if (!comando) return;

    setHistorico((anterior) => [comando, ...anterior].slice(0, 50));
    setPosicao(-1);
    setTexto("");
    onComando(comando);
  };

  const navegar = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      enviar();
      return;
    }

    if (evento.key === "ArrowUp" || evento.key === "ArrowDown") {
      if (historico.length === 0) return;
      evento.preventDefault();

      const proxima =
        evento.key === "ArrowUp"
          ? Math.min(posicao + 1, historico.length - 1)
          : Math.max(posicao - 1, -1);

      setPosicao(proxima);
      setTexto(proxima === -1 ? "" : (historico[proxima] ?? ""));
    }
  };

  return (
    <section
      aria-label="Terminal da missão"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-[#0d1017]"
      onClick={() => entradaRef.current?.focus()}
    >
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
        <span className="ml-2 font-mono text-xs text-muted">terminal</span>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-6"
      >
        {linhas.map((linha) => (
          <p key={linha.id} className={`whitespace-pre-wrap break-words ${ESTILO[linha.tipo]}`}>
            {linha.tipo === "comando" && (
              <span className="text-sky">{linha.prompt ?? prompt}$ </span>
            )}
            {linha.tipo === "mentora" && <span className="font-semibold">val: </span>}
            {linha.texto}
          </p>
        ))}
        <div ref={fimRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-line px-4 py-3 font-mono text-[13px]">
        <label htmlFor="entrada-terminal" className="sr-only">
          Digite um comando
        </label>
        <span aria-hidden="true" className="text-sky">
          {prompt}$
        </span>
        <input
          id="entrada-terminal"
          ref={entradaRef}
          value={texto}
          disabled={bloqueado}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={navegar}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={bloqueado ? "missão concluída" : "digite help para ver os comandos"}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted/60 disabled:cursor-not-allowed"
        />
      </div>
    </section>
  );
}
