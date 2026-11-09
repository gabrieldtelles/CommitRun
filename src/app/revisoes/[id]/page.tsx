import type { Metadata } from "next";
import { Cabecalho } from "@/components/cabecalho";
import { TelaDeReview } from "@/components/revisoes/tela-de-review";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <Cabecalho />
      <main>
        <TelaDeReview id={id} />
      </main>
    </>
  );
}
