import type { Mission } from "../types";
import {
  commits,
  fileOf,
  isClean,
  isTracked,
  lastMessage,
  sequence,
  usedCommand,
} from "../checks";
import { README, INDEX } from "./cenarios";

export const capitulo1: Mission[] = [
  {
    id: "c1m1",
    slug: "ligar-o-controle-de-versao",
    chapter: 1,
    order: 1,
    title: "Ligar o controle de versão",
    summary: "Transforme a pasta do projeto em um repositório git.",
    xp: 40,
    commands: ["git init", "git status"],
    briefing: [
      "Bem-vinda ao time. Sou a Val, tech lead aqui no Pulso.",
      "A pasta do site existe, mas ninguém nunca versionou nada: se alguém apagar um arquivo hoje, não tem de onde voltar.",
      "Seu primeiro trabalho é ligar o git nessa pasta e olhar o que ele enxerga.",
    ],
    objectives: [
      "Crie o repositório na pasta do projeto com git init",
      "Veja o estado atual com git status",
    ],
    hints: [
      "O comando que cria o repositório é git init, sem argumento nenhum.",
      "Depois de criar, git status mostra os arquivos que ainda não estão sendo acompanhados.",
      "Digite git init e depois git status, um comando por linha.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
    },
    validate: (state) =>
      sequence(
        [Boolean(state.machine.repo), "A pasta ainda não é um repositório git. Use git init."],
        [usedCommand(state, /^git\s+status/), "Rode git status para ver o que o git está enxergando."],
      ),
  },
  {
    id: "c1m2",
    slug: "assinar-o-trabalho",
    chapter: 1,
    order: 2,
    title: "Assinar o trabalho",
    summary: "Configure quem é o autor dos commits deste repositório.",
    xp: 40,
    commands: ["git config"],
    briefing: [
      "Todo commit carrega um autor. Sem isso, daqui a seis meses ninguém sabe quem mexeu no quê.",
      "Configure seu nome e seu e-mail neste repositório antes do primeiro commit.",
    ],
    objectives: [
      'Defina seu nome com git config user.name "seu nome"',
      "Defina seu e-mail com git config user.email",
    ],
    hints: [
      "A forma é git config <chave> <valor>.",
      "As chaves são user.name e user.email.",
      'Exemplo: git config user.name "Ana Lima" e depois git config user.email ana@pulso.studio',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: { config: { "user.name": "", "user.email": "" } },
    },
    validate: (state) => {
      const config = state.machine.repo?.config ?? {};
      return sequence(
        [Boolean(config["user.name"]), "Falta configurar user.name."],
        [Boolean(config["user.email"]), "Falta configurar user.email."],
        [
          /.+@.+\..+/.test(config["user.email"] ?? ""),
          "O e-mail configurado não parece um e-mail válido.",
        ],
      );
    },
  },
  {
    id: "c1m3",
    slug: "o-primeiro-commit",
    chapter: 1,
    order: 3,
    title: "O primeiro commit",
    summary: "Prepare os arquivos e grave a primeira versão do projeto.",
    xp: 60,
    commands: ["git add", "git commit"],
    briefing: [
      "Git trabalha em duas etapas: você escolhe o que entra (add) e depois grava (commit).",
      "O que está preparado fica na área de stage; o commit transforma isso em um ponto do histórico ao qual você sempre pode voltar.",
      "Prepare os dois arquivos do projeto e grave o primeiro commit.",
    ],
    objectives: [
      "Prepare README.md e index.html com git add",
      'Grave o commit com git commit -m "mensagem"',
      "Deixe a árvore de trabalho limpa",
    ],
    hints: [
      "git add . prepara tudo que está na pasta atual.",
      'A mensagem vai entre aspas: git commit -m "estrutura inicial do site".',
      'Sequência completa: git add . e depois git commit -m "estrutura inicial do site".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: {},
    },
    validate: (state) =>
      sequence(
        [commits(state.machine).length >= 1, "Ainda não existe nenhum commit neste repositório."],
        [isTracked(state.machine, "README.md"), "O README.md não entrou no commit."],
        [isTracked(state.machine, "index.html"), "O index.html não entrou no commit."],
        [isClean(state.machine), "Sobrou mudança pendente: prepare e comite tudo."],
        [
          lastMessage(state.machine).trim().length >= 5,
          "A mensagem do commit está curta demais para explicar a mudança.",
        ],
      ),
  },
  {
    id: "c1m4",
    slug: "ler-o-historico",
    chapter: 1,
    order: 4,
    title: "Ler o histórico",
    summary: "Some um commit novo e leia a linha do tempo do projeto.",
    xp: 60,
    commands: ["git log"],
    briefing: [
      "O histórico só vale se você souber lê-lo.",
      "Crie o arquivo de estilo do site, grave um commit e depois leia a linha do tempo.",
    ],
    objectives: [
      "Crie o arquivo estilo.css com algum conteúdo",
      "Grave um commit com esse arquivo",
      "Leia o histórico com git log --oneline",
    ],
    hints: [
      "Use edit estilo.css para abrir o editor, ou echo para escrever direto.",
      "Depois de criar, é a dupla de sempre: git add e git commit -m.",
      "git log --oneline mostra um commit por linha, com o hash curto.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: { commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } }] },
    },
    validate: (state) =>
      sequence(
        [Boolean(fileOf(state.machine, "estilo.css")), "O arquivo estilo.css ainda não existe."],
        [isTracked(state.machine, "estilo.css"), "O estilo.css existe, mas não está sendo versionado."],
        [commits(state.machine).length >= 2, "Falta gravar o commit com o novo arquivo."],
        [usedCommand(state, /^git\s+log/), "Leia a linha do tempo com git log --oneline."],
      ),
  },
];
