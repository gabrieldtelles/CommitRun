import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { Ranking } from "@/components/ranking";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Quem avançou mais nas missões de git do CommitRun.",
};

export default function RankingPage() {
  return (
    <>
      <Cabecalho />
      <main>
        <Ranking />
      </main>
    </>
  );
}
