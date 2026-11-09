import type { Mission } from "../types";
import { branchOf, fileOf, isClean, sequence, usedCommand } from "../checks";
import { ESTILO, INDEX, README } from "./cenarios";

export const capitulo7: Mission[] = [
  {
    id: "c7m1",
    slug: "trazer-so-a-correcao",
    chapter: 7,
    order: 1,
    title: "Trazer só a correção",
    summary: "Pegue um commit específico de outra branch sem levar o resto junto.",
    xp: 130,
    commands: ["git cherry-pick", "git log"],
    briefing: [
      "A branch experimento tem duas coisas: a correção do link quebrado do menu e um teste de layout que ninguém aprovou.",
      "A correção precisa entrar na main hoje. O teste de layout, não.",
      "Um merge traria as duas. Você quer só um commit.",
    ],
    objectives: [
      "Descubra o hash do commit que corrige o link",
      "Traga só esse commit para a main com git cherry-pick",
      "Deixe o teste de layout fora da main",
    ],
    hints: [
      "git log experimento --oneline mostra os commits da outra branch com o hash curto.",
      "Com o hash em mãos, o comando é git cherry-pick <hash>, rodado de dentro da main.",
      "Confira depois com ls: o layout-novo.css não pode aparecer na main.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
          },
        ],
        branches: [
          {
            name: "experimento",
            commits: [
              {
                message: "corrige link quebrado do menu",
                files: { "menu.html": '<a href="/contato">Contato</a>' },
              },
              {
                message: "testa layout novo",
                files: { "layout-novo.css": ".grid { display: grid; }" },
              },
            ],
          },
        ],
      },
    },
    validate: (state) =>
      sequence(
        [branchOf(state.machine) === "main", "Você precisa estar na main para trazer o commit."],
        [usedCommand(state, /^git\s+cherry-pick/), "Use git cherry-pick para trazer só um commit."],
        [Boolean(fileOf(state.machine, "menu.html")), "A correção do menu ainda não chegou na main."],
        [
          !fileOf(state.machine, "layout-novo.css"),
          "O teste de layout veio junto — ele não devia entrar na main.",
        ],
        [isClean(state.machine), "Sobrou mudança pendente na árvore de trabalho."],
      ),
  },
  {
    id: "c7m2",
    slug: "linha-do-tempo-reta",
    chapter: 7,
    order: 2,
    title: "Linha do tempo reta",
    summary: "Reaplique seus commits sobre a main para entregar um histórico sem desvios.",
    xp: 150,
    commands: ["git rebase"],
    briefing: [
      "Você abriu a branch legenda há dois dias. Nesse meio tempo a main andou e agora as duas linhas divergiram.",
      "Dá para resolver com merge, mas isso deixa um nó no histórico por causa de uma mudança pequena.",
      "Como a sua branch ainda não foi publicada, você pode reaplicar seus commits em cima da main e entregar uma linha reta.",
    ],
    objectives: [
      "Fique na branch legenda",
      "Reaplique seus commits sobre a main com git rebase",
      "Termine com a legenda e o texto da main no mesmo lugar",
    ],
    hints: [
      "O rebase roda a partir da branch que vai ser movida: entre nela primeiro com git switch legenda.",
      "O comando pede o destino: git rebase main.",
      "Confira o resultado com git log --oneline: nenhum commit de merge deve aparecer.",
    ],
    seed: {
      cwd: "/pulso",
      files: {
        "README.md": README,
        "index.html": `${INDEX}\n<p>Novidades em breve.</p>`,
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
          },
        ],
        branches: [
          {
            name: "legenda",
            commits: [
              { message: "adiciona legenda nas fotos", files: { "legenda.js": "export const legenda = true;" } },
            ],
          },
          {
            name: "main",
            from: "main",
            commits: [
              { message: "atualiza texto da home", files: { "index.html": `${INDEX}\n<p>Novidades em breve.</p>` } },
            ],
          },
        ],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const topo = repo ? repo.commits[repo.branches["legenda"] ?? ""] : null;
      const pai = topo?.parents[0] ? repo?.commits[topo.parents[0]] : null;

      return sequence(
        [branchOf(state.machine) === "legenda", "Fique na branch legenda para fazer o rebase."],
        [usedCommand(state, /^git\s+rebase/), "Use git rebase main para reaplicar os commits."],
        [(topo?.parents.length ?? 0) === 1, "O histórico ainda tem um commit de merge."],
        [
          pai?.message === "atualiza texto da home",
          "Os seus commits ainda não estão em cima do topo da main.",
        ],
        [
          (fileOf(state.machine, "index.html") ?? "").includes("Novidades em breve"),
          "O texto novo da home precisa estar na sua branch depois do rebase.",
        ],
        [Boolean(fileOf(state.machine, "legenda.js")), "O seu trabalho da legenda sumiu no caminho."],
      );
    },
  },
];
