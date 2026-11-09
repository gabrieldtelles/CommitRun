"use client";

import { readFile, writeFile } from "@/core/fs";
import { missionBySlug } from "@/content/missions";
import type { Mission } from "@/content/types";
import { Briefing } from "./briefing";
import { EditorArquivo } from "./editor-arquivo";
import { GrafoCommits } from "./grafo-commits";
import { BarraDeAcoes } from "./missao/barra-de-acoes";
import { ModalConclusao } from "./missao/modal-conclusao";
import { useMissao } from "./missao/use-missao";
import { Terminal } from "./terminal";

export function SalaDeMissao({ slug }: { slug: string }) {
  const mission = missionBySlug(slug) as Mission;
  const jogo = useMissao(mission);

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeAcoes
        mission={mission}
        dicasUsadas={jogo.dicas.length}
        onReiniciar={jogo.reiniciar}
        onPedirDica={jogo.pedirDica}
        onValidar={jogo.validar}
      />

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)_340px] lg:gap-5">
        <Briefing mission={mission} dicas={jogo.dicas} onPedirDica={jogo.pedirDica} />

        <div className="min-h-[520px] lg:min-h-0">
          <Terminal linhas={jogo.linhas} prompt={jogo.prompt} onComando={jogo.executar} />
        </div>

        <div className="min-h-[320px] lg:min-h-0">
          <GrafoCommits repo={jogo.machine.repo} />
        </div>
      </main>

      {jogo.editando && (
        <EditorArquivo
          caminho={jogo.editando}
          conteudo={readFile(jogo.machine.fs, jogo.editando) ?? ""}
          onFechar={jogo.fecharEditor}
          onSalvar={(conteudo) => {
            writeFile(jogo.machine.fs, jogo.editando as string, conteudo);
            jogo.fecharEditor();
            jogo.atualizar();
            jogo.escrever([{ tipo: "saida", texto: `arquivo salvo: ${jogo.editando}` }]);
          }}
        />
      )}

      {jogo.concluida && (
        <ModalConclusao
          mission={mission}
          proxima={jogo.proxima}
          ganho={jogo.ganho}
          dicasUsadas={jogo.dicas.length}
          foiRevisao={jogo.foiRevisao}
          machine={jogo.machine}
          snapshotInicial={jogo.snapshotInicial}
          onFechar={jogo.fecharConclusao}
        />
      )}
    </div>
  );
}
