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
import { README, INDEX, ESTILO } from "./cenarios";

export const capitulo2: Mission[] = [
  {
    id: "c2m1",
    slug: "revisar-antes-de-commitar",
    chapter: 2,
    order: 1,
    title: "Revisar antes de commitar",
    summary: "Use o diff para conferir a mudança antes de gravá-la.",
    xp: 70,
    commands: ["git diff", "git diff --staged"],
    briefing: [
      "Commit que ninguém revisou é bug que ninguém viu chegar.",
      "O título do site está errado: trocaram o nome do estúdio. Corrija o index.html, confira a mudança com git diff e só então grave.",
    ],
    objectives: [
      "Troque TellesLabs por TellesLab no index.html",
      "Confira a mudança com git diff antes de preparar",
      "Prepare e grave o commit da correção",
    ],
    hints: [
      "edit index.html abre o editor do terminal.",
      "git diff mostra o que mudou na pasta e ainda não foi preparado; git diff --staged mostra o que já está no stage.",
      'Depois de corrigir: git diff, git add index.html, git commit -m "corrige nome do estudio no titulo".',
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": README,
        "index.html": "<h1>TellesLabs</h1>\n<p>Em construcao.</p>",
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": "<h1>TellesLabs</h1>\n<p>Em construcao.</p>" } },
          { message: "adiciona folha de estilo", files: { "estilo.css": ESTILO } },
        ],
      },
    },
    validate: (state) => {
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      return sequence(
        [conteudo.includes("<h1>TellesLab</h1>"), "O título do index.html ainda não está como <h1>TellesLab</h1>."],
        [usedCommand(state, /^git\s+diff/), "Confira a mudança com git diff antes de commitar."],
        [commits(state.machine).length >= 3, "A correção ainda não virou commit."],
        [isClean(state.machine), "Ficou mudança pendente fora do commit."],
      );
    },
  },
  {
    id: "c2m2",
    slug: "o-que-nao-entra-no-repositorio",
    chapter: 2,
    order: 2,
    title: "O que não entra no repositório",
    summary: "Mantenha log e dependências fora do histórico com .gitignore.",
    xp: 70,
    commands: [".gitignore"],
    briefing: [
      "Alguém rodou o projeto e a pasta encheu de arquivo gerado: log de execução e dependências instaladas.",
      "Isso não pode entrar no repositório. Crie um .gitignore que descarte esses arquivos e comite só o que importa.",
    ],
    objectives: [
      "Crie um .gitignore que ignore arquivos .log e a pasta node_modules",
      "Prepare tudo com git add .",
      "Grave o commit sem levar junto os arquivos ignorados",
    ],
    hints: [
      'Uma linha por regra. Para extensões: *.log. Para pastas: node_modules/.',
      'Você pode escrever direto: echo "*.log" > .gitignore e depois echo "node_modules/" >> .gitignore.',
      "Depois do .gitignore pronto, git add . e git commit normalmente. Confira com git status que os ignorados sumiram.",
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": README,
        "index.html": INDEX,
        "estilo.css": ESTILO,
        "servidor.log": "iniciado em 09:12\nrequisicao /\n",
        "node_modules/pacote.js": "module.exports = {};",
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) => {
      const ignore = fileOf(state.machine, ".gitignore") ?? "";
      return sequence(
        [ignore.trim().length > 0, "O arquivo .gitignore ainda não existe ou está vazio."],
        [/\*\.log|servidor\.log/.test(ignore), "O .gitignore não cobre os arquivos .log."],
        [/node_modules/.test(ignore), "O .gitignore não cobre a pasta node_modules."],
        [isTracked(state.machine, ".gitignore"), "Falta versionar o próprio .gitignore."],
        [!isTracked(state.machine, "servidor.log"), "O servidor.log entrou no repositório sem querer."],
        [!isTracked(state.machine, "node_modules/pacote.js"), "A pasta node_modules entrou no repositório."],
        [commits(state.machine).length >= 2, "Falta gravar o commit com o .gitignore."],
      );
    },
  },
  {
    id: "c2m3",
    slug: "desfazer-sem-medo",
    chapter: 2,
    order: 3,
    title: "Desfazer sem medo",
    summary: "Volte um arquivo bagunçado e tire do stage o que não deveria estar lá.",
    xp: 80,
    commands: ["git restore", "git restore --staged"],
    briefing: [
      "Duas coisas saíram do lugar: o estilo.css foi sobrescrito por um teste e o rascunho.txt foi preparado por engano.",
      "Nada disso virou commit ainda, então dá para voltar atrás sem reescrever a história.",
    ],
    objectives: [
      "Tire o rascunho.txt da área de stage",
      "Devolva o estilo.css ao conteúdo do último commit",
      "Deixe o repositório sem mudanças preparadas",
    ],
    hints: [
      "git restore --staged <arquivo> tira do stage sem apagar o arquivo.",
      "git restore <arquivo> devolve o conteúdo que está no último commit.",
      "São dois comandos: git restore --staged rascunho.txt e git restore estilo.css.",
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": README,
        "index.html": INDEX,
        "estilo.css": "body { background: red; }",
        "rascunho.txt": "ideias soltas",
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        staged: ["rascunho.txt"],
      },
    },
    validate: (state) =>
      sequence(
        [!isTracked(state.machine, "rascunho.txt"), "O rascunho.txt continua na área de stage."],
        [fileOf(state.machine, "estilo.css") === ESTILO, "O estilo.css ainda não voltou ao conteúdo do último commit."],
        [Boolean(fileOf(state.machine, "rascunho.txt")), "O rascunho.txt era para sair do stage, não ser apagado."],
        [commits(state.machine).length === 1, "Não era para criar commit nesta missão."],
      ),
  },
  {
    id: "c2m4",
    slug: "corrigir-o-ultimo-commit",
    chapter: 2,
    order: 4,
    title: "Corrigir o último commit",
    summary: "Conserte a mensagem do commit que acabou de sair errado.",
    xp: 80,
    commands: ["git commit --amend"],
    briefing: [
      "O último commit foi gravado com a mensagem asdf. Ninguém vai entender isso daqui a um mês.",
      "O commit ainda não saiu da sua máquina, então pode ser reescrito.",
    ],
    objectives: [
      "Reescreva a mensagem do último commit para algo descritivo",
      "Mantenha a quantidade de commits do histórico",
    ],
    hints: [
      "O comando que refaz o último commit é git commit --amend.",
      'Você pode passar a mensagem nova direto: git commit --amend -m "...".',
      'Exemplo: git commit --amend -m "ajusta cores do cabecalho".',
    ],
    seed: {
      cwd: "/telleslab",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } },
          { message: "asdf", files: { "estilo.css": ESTILO } },
        ],
      },
    },
    validate: (state) => {
      const mensagem = lastMessage(state.machine).trim();
      return sequence(
        [mensagem !== "asdf", "A mensagem do último commit continua sendo asdf."],
        [mensagem.length >= 10, "A mensagem nova precisa explicar a mudança."],
        [commits(state.machine).length === 2, "O histórico deveria continuar com dois commits."],
        [isTracked(state.machine, "estilo.css"), "O estilo.css precisa continuar no commit."],
      );
    },
  },
];
