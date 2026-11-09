import type { Mission } from "../types";
import {
  allCommits,
  branchOf,
  fileOf,
  sequence,
  usedCommand,
} from "../checks";
import { README, INDEX, ESTILO } from "./cenarios";

export const capitulo3: Mission[] = [
  {
    id: "c3m1",
    slug: "abrir-uma-branch",
    chapter: 3,
    order: 1,
    title: "Abrir uma branch",
    summary: "Isole uma mudança em uma linha de trabalho separada.",
    xp: 90,
    commands: ["git branch", "git switch -c"],
    briefing: [
      "Pediram um rodapé novo no site, mas a main precisa continuar publicável enquanto você trabalha.",
      "Abra uma branch, faça a mudança lá dentro e grave o commit sem tocar na main.",
    ],
    objectives: [
      "Crie e entre na branch rodape",
      "Adicione um rodapé ao index.html",
      "Grave o commit dentro da branch rodape",
    ],
    hints: [
      "git switch -c <nome> cria a branch e já entra nela.",
      "Confira onde você está com git branch: a branch atual aparece com asterisco.",
      'Depois de editar o index.html: git add index.html e git commit -m "adiciona rodape".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      return sequence(
        [Boolean(repo?.branches["rodape"]), "A branch rodape ainda não existe."],
        [branchOf(state.machine) === "rodape", "Você precisa estar na branch rodape."],
        [/footer|rodape/i.test(conteudo), "O index.html ainda não tem rodapé."],
        [allCommits(state.machine).length >= 2, "A mudança ainda não virou commit."],
        [
          repo?.branches["rodape"] !== repo?.branches["main"],
          "O commit precisa ficar na branch rodape, não na main.",
        ],
      );
    },
  },
  {
    id: "c3m2",
    slug: "juntar-o-trabalho",
    chapter: 3,
    order: 2,
    title: "Juntar o trabalho",
    summary: "Traga a branch pronta de volta para a main.",
    xp: 90,
    commands: ["git merge"],
    briefing: [
      "O rodapé foi aprovado. Agora ele precisa entrar na main.",
      "Volte para a main e junte a branch. Como a main não andou, o git resolve isso no modo mais simples possível.",
    ],
    objectives: [
      "Volte para a branch main",
      "Junte a branch rodape na main",
      "Confirme que o rodapé está no arquivo da main",
    ],
    hints: [
      "git switch main leva você de volta.",
      "O merge sempre roda a partir da branch que vai receber: git merge rodape.",
      "Depois confira com cat index.html e git log --oneline.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        branches: [
          {
            name: "rodape",
            commits: [
              {
                message: "adiciona rodape",
                files: { "index.html": `${INDEX}\n<footer>Pulso 2026</footer>` },
              },
            ],
          },
        ],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      return sequence(
        [branchOf(state.machine) === "main", "Volte para a branch main antes de juntar."],
        [
          repo?.branches["main"] === repo?.branches["rodape"],
          "A main ainda não recebeu os commits da branch rodape.",
        ],
        [/footer/i.test(fileOf(state.machine, "index.html") ?? ""), "O rodapé não apareceu no arquivo da main."],
      );
    },
  },
  {
    id: "c3m3",
    slug: "resolver-um-conflito",
    chapter: 3,
    order: 3,
    title: "Resolver um conflito",
    summary: "Duas branches mudaram a mesma linha. Decida como fica.",
    xp: 120,
    commands: ["git merge", "git add", "git commit"],
    briefing: [
      "Você e o Rafa mexeram no mesmo título do site, cada um na sua branch.",
      "O git não tem como adivinhar qual versão vale: ele marca o conflito no arquivo e espera uma decisão sua.",
      "Junte a branch titulo na main, escolha o texto final e feche o merge.",
    ],
    objectives: [
      "Rode o merge da branch titulo na main",
      "Edite o index.html deixando um título só, sem marcadores de conflito",
      "Prepare o arquivo resolvido e feche o merge com um commit",
    ],
    hints: [
      "Comece com git merge titulo. O git vai avisar do conflito e marcar o arquivo.",
      "Abra com edit index.html: apague as linhas <<<<<<<, ======= e >>>>>>> e deixe só o título que vale.",
      'Depois de resolver: git add index.html e git commit -m "resolve conflito do titulo".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": "<h1>Pulso ao vivo</h1>\n<p>Em construcao.</p>", "estilo.css": ESTILO },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": "<h1>Pulso</h1>\n<p>Em construcao.</p>", "estilo.css": ESTILO },
          },
        ],
        branches: [
          {
            name: "titulo",
            commits: [
              {
                message: "usa nome completo no titulo",
                files: { "index.html": "<h1>Pulso Estudio</h1>\n<p>Em construcao.</p>" },
              },
            ],
          },
          {
            name: "main",
            from: "main",
            commits: [
              {
                message: "destaca shows no titulo",
                files: { "index.html": "<h1>Pulso ao vivo</h1>\n<p>Em construcao.</p>" },
              },
            ],
          },
        ],
      },
    },
    validate: (state) => {
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      const repo = state.machine.repo;
      const head = repo ? repo.commits[repo.branches["main"] ?? ""] : null;
      return sequence(
        [usedCommand(state, /^git\s+merge/), "Comece rodando git merge titulo."],
        [!/<<<<<<<|=======|>>>>>>>/.test(conteudo), "O index.html ainda tem marcadores de conflito."],
        [/<h1>.+<\/h1>/.test(conteudo), "O index.html precisa ter um título."],
        [repo?.merge === null, "O merge ainda está aberto: prepare o arquivo e grave o commit."],
        [(head?.parents.length ?? 0) === 2, "Falta o commit que fecha o merge."],
      );
    },
  },
];
