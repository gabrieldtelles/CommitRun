import type { Chapter } from "../types";

export const chapters: Chapter[] = [
  {
    number: 1,
    title: "Primeira semana",
    subtitle: "Você entrou no time e o projeto ainda não tem histórico.",
    topics: "init · config · status · add · commit · log",
  },
  {
    number: 2,
    title: "Rotina de versionamento",
    subtitle: "Commits pequenos, revisados e fáceis de desfazer.",
    topics: "diff · .gitignore · restore · amend",
  },
  {
    number: 3,
    title: "Trabalho em paralelo",
    subtitle: "Duas pessoas mexendo no mesmo projeto ao mesmo tempo.",
    topics: "branch · switch · merge · conflitos",
  },
  {
    number: 4,
    title: "Time remoto",
    subtitle: "O código precisa sair da sua máquina.",
    topics: "remote · push · pull",
  },
];
