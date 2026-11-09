import type { MachineSeed } from "@/core/machine";
import type { Machine } from "@/core/types";

export type MissionState = { machine: Machine; history: string[] };

export type MissionCheck = { ok: boolean; message: string };

export type Mission = {
  id: string;
  slug: string;
  chapter: number;
  order: number;
  title: string;
  summary: string;
  xp: number;
  commands: string[];
  briefing: string[];
  objectives: string[];
  hints: string[];
  seed: MachineSeed;
  validate: (state: MissionState) => MissionCheck;
};

export type Chapter = {
  number: number;
  title: string;
  subtitle: string;
  topics: string;
};
