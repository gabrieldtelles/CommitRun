import type { Metadata } from "next";
import { auth } from "@/auth";
import { Campanha } from "@/components/hangar/campanha";
import { MetaDaSemana } from "@/components/hangar/meta-da-semana";
import { PainelDoJogador } from "@/components/hangar/painel-do-jogador";
import { ProximaMissao } from "@/components/hangar/proxima-missao";
import { Pagina } from "@/components/pagina";
import { AtalhoDeRevisoes } from "@/components/revisoes/atalho";

export const metadata: Metadata = {
  title: "Hangar",
  description: "Seu progresso, a meta da semana e a campanha completa do CommitRun.",
};

export default async function HangarPage() {
  const sessao = await auth();
  const apelido = sessao?.user?.login ?? sessao?.user?.name ?? "jogador";

  return (
    <Pagina>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <PainelDoJogador apelido={apelido} />
        <ProximaMissao />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Campanha />

          <aside className="space-y-6">
            <MetaDaSemana />
            <AtalhoDeRevisoes />
          </aside>
        </div>
      </div>
    </Pagina>
  );
}
