import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { PainelDeRevisoes } from "@/components/revisoes/painel";

export const metadata: Metadata = {
  title: "Code review",
  description: "Abra pull requests das suas missões e revise o código de outros jogadores.",
};

export default function RevisoesPage() {
  return (
    <Pagina>
      <PainelDeRevisoes />
    </Pagina>
  );
}
