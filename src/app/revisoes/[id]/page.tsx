import type { Metadata } from "next";
import { Pagina } from "@/components/pagina";
import { TelaDeReview } from "@/components/revisoes/tela-de-review";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Pagina>
      <TelaDeReview id={id} />
    </Pagina>
  );
}
