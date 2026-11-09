import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { PainelDeRevisoes } from "@/components/revisoes/painel";

export const metadata: Metadata = {
  title: "Code review",
  description: "Abra pull requests das suas missões e revise o código de outros jogadores.",
};

export default function RevisoesPage() {
  return (
    <>
      <Cabecalho />
      <main>
        <PainelDeRevisoes />
      </main>
    </>
  );
}
