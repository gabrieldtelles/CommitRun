import type { Mission } from "../types";
import { capitulo1 } from "./capitulo-1";
import { capitulo2 } from "./capitulo-2";
import { capitulo3 } from "./capitulo-3";
import { capitulo4 } from "./capitulo-4";
import { capitulo5 } from "./capitulo-5";
import { capitulo6 } from "./capitulo-6";
import { capitulo7 } from "./capitulo-7";
import { capitulo8 } from "./capitulo-8";

export { chapters } from "./capitulos";

export const missions: Mission[] = [
  ...capitulo1,
  ...capitulo2,
  ...capitulo3,
  ...capitulo4,
  ...capitulo5,
  ...capitulo6,
  ...capitulo7,
  ...capitulo8,
];

export function missionBySlug(slug: string): Mission | undefined {
  return missions.find((mission) => mission.slug === slug);
}

export function missionsOfChapter(chapter: number): Mission[] {
  return missions
    .filter((mission) => mission.chapter === chapter)
    .sort((a, b) => a.order - b.order);
}

export const totalXp = missions.reduce((soma, mission) => soma + mission.xp, 0);
