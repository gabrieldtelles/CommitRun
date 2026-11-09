"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  caminho: string;
  conteudo: string;
  onSalvar: (conteudo: string) => void;
  onFechar: () => void;
};

export function EditorArquivo({ caminho, conteudo, onSalvar, onFechar }: Props) {
  const [texto, setTexto] = useState(conteudo);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Editando ${caminho}`}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-mono text-sm text-sky">{caminho}</p>
          <p className="hidden text-xs text-muted sm:block">esc para sair sem salvar</p>
        </header>

        <label htmlFor="editor-conteudo" className="sr-only">
          Conteúdo de {caminho}
        </label>
        <textarea
          id="editor-conteudo"
          ref={areaRef}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          spellCheck={false}
          rows={14}
          className="flex-1 resize-none bg-[#0d1017] p-4 font-mono text-[13px] leading-6 text-ink outline-none"
        />

        <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSalvar(texto)}
            className="rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-lime-soft"
          >
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
}
