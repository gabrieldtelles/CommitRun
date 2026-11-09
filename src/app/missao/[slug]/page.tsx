import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SalaDeMissao } from "@/components/sala-de-missao";
import { missionBySlug, missions } from "@/content/missions";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return missions.map((mission) => ({ slug: mission.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mission = missionBySlug(slug);

  if (!mission) return { title: "Missão não encontrada" };

  return { title: mission.title, description: mission.summary };
}

export default async function MissaoPage({ params }: Props) {
  const { slug } = await params;
  const mission = missionBySlug(slug);

  if (!mission) notFound();

  return <SalaDeMissao slug={mission.slug} />;
}
