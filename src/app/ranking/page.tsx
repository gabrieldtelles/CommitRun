import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { Ranking } from "@/components/ranking";

export const metadata: Metadata = {
  title: "Ranking",
  description: "Quem avançou mais nas missões de git do CommitRun.",
};

export default function RankingPage() {
  return (
    <Pagina>
      <Ranking />
    </Pagina>
  );
}
