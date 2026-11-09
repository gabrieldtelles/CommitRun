import type { Mission } from "../types";
import { commits, isClean, sequence, usedCommand } from "../checks";
import { ESTILO, INDEX, README } from "./cenarios";

export const capitulo8: Mission[] = [
  {
    id: "c8m1",
    slug: "marcar-a-versao",
    chapter: 8,
    order: 1,
    title: "Marcar a versão",
    summary: "Dê um nome à entrega para conseguir voltar nela daqui a seis meses.",
    xp: 110,
    commands: ["git tag -a", "git tag"],
    briefing: [
      "O site vai ao ar hoje. Daqui a seis meses, quando alguém perguntar o que exatamente foi entregue nesta data, hash de commit não responde.",
      "Uma tag anotada dá nome e recado à versão: fica fácil comparar, voltar e publicar a partir dela.",
    ],
    objectives: [
      "Crie a tag anotada v1.0.0 apontando para o último commit",
      "Escreva uma mensagem que explique o que entrou na versão",
      "Confira a lista com git tag",
    ],
    hints: [
      "Tag anotada leva -a e uma mensagem com -m.",
      "Sem informar commit, a tag aponta para onde o HEAD está agora.",
      'O comando é git tag -a v1.0.0 -m "primeira versao do site no ar".',
    ],
    seed: {
      cwd: "/telleslab",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } },
          { message: "adiciona folha de estilo", files: { "estilo.css": ESTILO } },
        ],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const tag = repo?.tags["v1.0.0"];
      const topo = repo?.branches["main"];

      return sequence(
        [Boolean(tag), "A tag v1.0.0 ainda não existe."],
        [Boolean(tag?.mensagem), "A tag precisa ser anotada: use -a com uma mensagem em -m."],
        [(tag?.mensagem ?? "").trim().length >= 10, "A mensagem da tag está curta demais."],
        [tag?.hash === topo, "A tag não está apontando para o último commit da main."],
        [usedCommand(state, /^git\s+tag\s*$/), "Confira a lista de tags com git tag."],
      );
    },
  },
  {
    id: "c8m2",
    slug: "fechar-a-entrega",
    chapter: 8,
    order: 2,
    title: "Fechar a entrega",
    summary: "Comite o que falta, marque a versão e publique tudo no repositório do time.",
    xp: 160,
    commands: ["git status", "git commit", "git tag -a", "git push"],
    briefing: [
      "Última etapa da viagem. Ficou um ajuste no README sem commitar, a versão nova não está marcada e o servidor ainda não recebeu nada disso.",
      "Feche a entrega do jeito que um time espera: árvore limpa, versão marcada, tudo publicado.",
    ],
    objectives: [
      "Comite o ajuste pendente do README.md",
      "Crie a tag anotada v1.1.0 no último commit",
      "Publique a branch main no origin",
    ],
    hints: [
      "Comece com git status para ver exatamente o que está pendente.",
      'Depois do commit, marque com git tag -a v1.1.0 -m "...".',
      "Para publicar: git push -u origin main.",
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": `${README}\n\n## Como rodar\n\nAbra o index.html no navegador.`,
        "index.html": INDEX,
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
          },
        ],
        remote: { name: "origin", url: "https://git.telleslab.dev/site.git" },
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const tag = repo?.tags["v1.1.0"];

      return sequence(
        [isClean(state.machine), "Ainda há mudança pendente: comite antes de fechar a entrega."],
        [commits(state.machine).length >= 2, "O ajuste do README ainda não virou commit."],
        [Boolean(tag), "Falta criar a tag v1.1.0."],
        [Boolean(tag?.mensagem), "A tag v1.1.0 precisa ser anotada com uma mensagem."],
        [tag?.hash === repo?.branches["main"], "A tag não está no último commit da main."],
        [
          Boolean(repo?.remote?.branches["main"]),
          "O remoto ainda não recebeu a branch main. Use git push -u origin main.",
        ],
        [
          repo?.remote?.branches["main"] === repo?.branches["main"],
          "O remoto está desatualizado: publique o commit mais recente.",
        ],
      );
    },
  },
];
