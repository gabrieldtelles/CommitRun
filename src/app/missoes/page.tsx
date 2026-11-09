import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { Trilha } from "@/components/trilha";

export const metadata: Metadata = {
  title: "Trilha de missões",
  description: "Todas as missões do CommitRun, do primeiro commit ao trabalho com branches e remoto.",
};

export default function MissoesPage() {
  return (
    <>
      <Cabecalho />
      <main>
        <Trilha />
      </main>
    </>
  );
}
