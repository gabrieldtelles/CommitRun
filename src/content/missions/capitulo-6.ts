import type { Mission } from "../types";
import { commits, fileOf, isClean, sequence, usedCommand } from "../checks";
import { ESTILO, INDEX, README } from "./cenarios";

const ESTILO_EM_ANDAMENTO = `${ESTILO}\n\n.galeria {\n  /* parei no meio */\n}`;

export const capitulo6: Mission[] = [
  {
    id: "c6m1",
    slug: "guardar-para-a-emergencia",
    chapter: 6,
    order: 1,
    title: "Guardar para a emergência",
    summary: "Ponha o trabalho pela metade na gaveta, resolva o urgente e volte para ele.",
    xp: 120,
    commands: ["git stash", "git stash pop"],
    briefing: [
      "Você está no meio da galeria do site, com o estilo.css pela metade, quando chega um recado: o e-mail de contato está errado no ar.",
      "Commitar código inacabado só para liberar a mão é como esconder sujeira embaixo do tapete.",
      "Guarde o que está em andamento, corrija o e-mail, comite só a correção e depois traga seu trabalho de volta.",
    ],
    objectives: [
      "Guarde as mudanças em andamento com git stash",
      "Corrija o e-mail no contato.html para contato@telleslab.dev e comite só isso",
      "Traga o trabalho guardado de volta com git stash pop",
    ],
    hints: [
      "git stash guarda o que ainda não foi commitado e devolve a pasta ao último commit.",
      "Com a pasta limpa, edite o contato.html, use git add e git commit normalmente.",
      "No fim, git stash pop devolve o estilo.css pela metade para você continuar.",
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": README,
        "index.html": INDEX,
        "estilo.css": ESTILO_EM_ANDAMENTO,
        "contato.html": "<h1>Fale com o TellesLab</h1>\n<p>contato@telleslabs.studio</p>",
      },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: {
              "README.md": README,
              "index.html": INDEX,
              "estilo.css": ESTILO,
              "contato.html": "<h1>Fale com o TellesLab</h1>\n<p>contato@telleslabs.studio</p>",
            },
          },
        ],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const contato = fileOf(state.machine, "contato.html") ?? "";
      const estilo = fileOf(state.machine, "estilo.css") ?? "";
      const ultimo = commits(state.machine)[0];

      return sequence(
        [usedCommand(state, /^git\s+stash/), "Comece guardando o trabalho em andamento com git stash."],
        [contato.includes("contato@telleslab.dev"), "O e-mail do contato.html ainda está errado."],
        [commits(state.machine).length >= 2, "A correção do e-mail ainda não virou commit."],
        [
          !(ultimo?.snapshot && Object.keys(ultimo.snapshot).length === 0) &&
            !estiloNoCommit(state.machine, ESTILO_EM_ANDAMENTO),
          "O commit levou junto o estilo.css pela metade — ele devia ficar na gaveta.",
        ],
        [estilo.includes("galeria"), "Falta devolver o trabalho guardado com git stash pop."],
        [(repo?.stash.length ?? 0) === 0, "Ainda tem coisa esquecida na gaveta do stash."],
      );
    },
  },
  {
    id: "c6m2",
    slug: "a-gaveta-etiquetada",
    chapter: 6,
    order: 2,
    title: "A gaveta etiquetada",
    summary: "Guarde com uma mensagem que explique o que ficou pela metade.",
    xp: 100,
    commands: ["git stash -m", "git stash list"],
    briefing: [
      "Gaveta sem etiqueta vira caixa de bagunça: daqui a uma semana ninguém lembra o que tem em cada uma.",
      "Você vai parar o trabalho da galeria por uns dias. Guarde com uma mensagem que explique o que é, e confirme na lista.",
    ],
    objectives: [
      "Guarde as mudanças com uma mensagem descritiva usando git stash -m",
      "Confira a etiqueta com git stash list",
      "Deixe o trabalho guardado (não traga de volta agora)",
    ],
    hints: [
      'A forma é git stash -m "mensagem entre aspas".',
      "A mensagem precisa dizer o que está pela metade, não apenas wip.",
      'Exemplo: git stash -m "galeria do site pela metade" e depois git stash list.',
    ],
    seed: {
      cwd: "/telleslab",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO_EM_ANDAMENTO },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
          },
        ],
      },
    },
    validate: (state) => {
      const guardado = state.machine.repo?.stash[0];
      const mensagem = guardado?.mensagem ?? "";

      return sequence(
        [Boolean(guardado), "Nada foi guardado no stash ainda."],
        [mensagem.trim().length >= 10, "A etiqueta está curta demais para explicar o que ficou pela metade."],
        [!/^(wip|teste|asdf)$/i.test(mensagem.trim()), "Escreva uma etiqueta que explique o conteúdo."],
        [usedCommand(state, /^git\s+stash\s+list/), "Confira as gavetas com git stash list."],
        [isClean(state.machine), "A árvore de trabalho precisa ficar limpa depois de guardar."],
      );
    },
  },
];

function estiloNoCommit(machine: Parameters<typeof fileOf>[0], conteudoParcial: string): boolean {
  const repo = machine.repo;
  if (!repo) return false;

  const topo = repo.commits[repo.branches["main"] ?? ""];
  const hash = topo?.snapshot["estilo.css"];
  return hash ? repo.objects[hash] === conteudoParcial : false;
}
