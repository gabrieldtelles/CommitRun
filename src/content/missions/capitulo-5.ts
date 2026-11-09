import type { Mission } from "../types";
import { commits, fileOf, isClean, sequence, usedCommand } from "../checks";
import { ESTILO, INDEX, README } from "./cenarios";

const RODAPE_BOM = `${INDEX}\n<footer>Pulso · 2026</footer>`;
const RODAPE_QUEBRADO = `${INDEX}\n<footer>undefined undefined</footer>`;

export const capitulo5: Mission[] = [
  {
    id: "c5m1",
    slug: "desfazer-o-que-ja-foi-publicado",
    chapter: 5,
    order: 1,
    title: "Desfazer o que já foi publicado",
    summary: "Reverta um commit que já saiu da sua máquina, sem reescrever o histórico.",
    xp: 110,
    commands: ["git revert"],
    briefing: [
      "O último commit subiu para o servidor e quebrou o rodapé do site: está aparecendo undefined para todo mundo.",
      "Como esse commit já é público, apagá-lo faria o histórico de todo mundo divergir do seu.",
      "O caminho certo é criar um commit novo que desfaz o estrago, deixando o erro registrado na história.",
    ],
    objectives: [
      "Desfaça o último commit com git revert",
      "Deixe o rodapé do index.html de volta como estava",
      "Mantenha os commits anteriores no histórico",
    ],
    hints: [
      "git revert não apaga nada: ele cria um commit novo que inverte outro.",
      "Você pode se referir ao último commit como HEAD.",
      "O comando é git revert HEAD.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": RODAPE_QUEBRADO, "estilo.css": ESTILO },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } },
          { message: "adiciona rodape", files: { "index.html": RODAPE_BOM } },
          { message: "quebra o rodape sem querer", files: { "index.html": RODAPE_QUEBRADO } },
        ],
        remote: { name: "origin", url: "https://git.pulso.studio/site.git", synced: true },
      },
    },
    validate: (state) => {
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      const lista = commits(state.machine);
      return sequence(
        [usedCommand(state, /^git\s+revert/), "Use git revert para desfazer o commit publicado."],
        [!conteudo.includes("undefined"), "O rodapé ainda está quebrado no index.html."],
        [lista.length >= 4, "O revert precisa virar um commit novo no histórico."],
        [
          lista.some((commit) => /^Revert/i.test(commit.message)),
          "Não encontrei o commit de revert no histórico.",
        ],
        [isClean(state.machine), "Ficou mudança pendente fora do commit."],
      );
    },
  },
  {
    id: "c5m2",
    slug: "achar-o-que-sumiu",
    chapter: 5,
    order: 2,
    title: "Achar o que sumiu",
    summary: "Recupere com o reflog um commit que um reset apagou da branch.",
    xp: 130,
    commands: ["git reflog", "git reset"],
    briefing: [
      "O Rafa rodou um git reset --hard para limpar a área de trabalho e levou junto o commit da página de contato.",
      "O commit não foi destruído: ele só ficou sem ninguém apontando para ele.",
      "O reflog guarda por onde o HEAD passou. Use isso para achar o commit e trazer a branch de volta.",
    ],
    objectives: [
      "Liste o histórico do HEAD com git reflog",
      "Traga a branch de volta para o commit perdido",
      "Confirme que o contato.html voltou para a pasta",
    ],
    hints: [
      "git reflog mostra cada posição do HEAD com o hash curto ao lado.",
      "Achou o hash do commit perdido? git reset --hard <hash> leva a branch até ele.",
      "A sequência é: git reflog, copiar o hash do commit da página de contato, e git reset --hard <hash>.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } },
          { message: "adiciona folha de estilo", files: { "estilo.css": ESTILO } },
        ],
        descartado: {
          message: "adiciona pagina de contato",
          files: { "contato.html": "<h1>Fale com o Pulso</h1>\n<p>contato@pulso.studio</p>" },
        },
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const topo = repo ? repo.commits[repo.branches["main"] ?? ""] : null;
      return sequence(
        [usedCommand(state, /^git\s+reflog/), "Comece olhando o git reflog."],
        [Boolean(fileOf(state.machine, "contato.html")), "O contato.html ainda não voltou para a pasta."],
        [
          topo?.message === "adiciona pagina de contato",
          "A branch main ainda não aponta para o commit recuperado.",
        ],
        [isClean(state.machine), "Sobrou mudança pendente na árvore de trabalho."],
      );
    },
  },
];
