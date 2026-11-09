import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { ListaDeRevisoes } from "@/components/revisoes/lista";

export const metadata: Metadata = {
  title: "Revisões",
  description: "A agenda de revisão espaçada das missões que você já concluiu no CommitRun.",
};

export default function RevisoesPage() {
  return (
    <>
      <Cabecalho />
      <main>
        <ListaDeRevisoes />
      </main>
    </>
  );
}
