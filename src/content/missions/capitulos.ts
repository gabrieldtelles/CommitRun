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
  {
    number: 5,
    title: "Consertar sem apagar",
    subtitle: "Erro que já é público se corrige, não se esconde.",
    topics: "revert · reflog",
  },
  {
    number: 6,
    title: "Trabalho pela metade",
    subtitle: "O urgente chegou e o seu código ainda não está pronto.",
    topics: "stash · stash list · stash pop",
  },
  {
    number: 7,
    title: "Histórico limpo",
    subtitle: "Entregar uma história que a próxima pessoa consiga ler.",
    topics: "cherry-pick · rebase",
  },
  {
    number: 8,
    title: "Hora de entregar",
    subtitle: "Fechar a versão e publicar como um time faz.",
    topics: "tag · push · release",
  },
];
