import type { Mission } from "../types";
import {
  commits,
  isClean,
  sequence,
  usedCommand,
} from "../checks";
import { README, INDEX, ESTILO } from "./cenarios";

export const capitulo4: Mission[] = [
  {
    id: "c4m1",
    slug: "conectar-o-remoto",
    chapter: 4,
    order: 1,
    title: "Conectar o remoto",
    summary: "Aponte o repositório local para o servidor do time.",
    xp: 90,
    commands: ["git remote add", "git remote -v"],
    briefing: [
      "Enquanto o repositório existir só na sua máquina, o trabalho do time está a um café derramado de sumir.",
      "O servidor do estúdio já tem um repositório vazio esperando. Conecte o seu a ele com o nome origin.",
    ],
    objectives: [
      "Adicione o remoto origin apontando para https://git.telleslab.dev/site.git",
      "Confirme a conexão com git remote -v",
    ],
    hints: [
      "A forma é git remote add <nome> <url>.",
      "O nome padrão do remoto principal é origin.",
      "git remote add origin https://git.telleslab.dev/site.git e depois git remote -v.",
    ],
    seed: {
      cwd: "/telleslab",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) =>
      sequence(
        [Boolean(state.machine.repo?.remote), "Nenhum remoto foi adicionado ainda."],
        [state.machine.repo?.remote?.name === "origin", "O remoto precisa se chamar origin."],
        [
          (state.machine.repo?.remote?.url ?? "").includes("git.telleslab.dev/site.git"),
          "A URL do remoto não é a do repositório do estúdio.",
        ],
        [usedCommand(state, /^git\s+remote\s+-v/), "Confirme a conexão com git remote -v."],
      ),
  },
  {
    id: "c4m2",
    slug: "publicar-o-trabalho",
    chapter: 4,
    order: 2,
    title: "Publicar o trabalho",
    summary: "Envie os commits locais para o repositório do time.",
    xp: 110,
    commands: ["git push"],
    briefing: [
      "O remoto está conectado, mas ainda não recebeu nada.",
      "Grave o ajuste que ficou pendente no README e publique a branch main no origin.",
    ],
    objectives: [
      "Comite a mudança pendente do README.md",
      "Publique a branch main no origin com git push -u origin main",
    ],
    hints: [
      "Comece por git status para ver o que está pendente.",
      "Prepare e comite normalmente antes de publicar.",
      "Na primeira vez, o push leva -u: git push -u origin main.",
    ],
    seed: {
      cwd: "/telleslab",
      files: {
        "README.md": `${README}\n\n## Como rodar\n\nAbra o index.html no navegador.`,
        "index.html": INDEX,
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        remote: { name: "origin", url: "https://git.telleslab.dev/site.git" },
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      return sequence(
        [isClean(state.machine), "Ainda há mudança pendente: comite antes de publicar."],
        [commits(state.machine).length >= 2, "A mudança do README ainda não virou commit."],
        [
          Boolean(repo?.remote?.branches["main"]),
          "O remoto ainda não recebeu a branch main. Use git push -u origin main.",
        ],
        [
          repo?.remote?.branches["main"] === repo?.branches["main"],
          "O remoto está desatualizado: publique os commits mais recentes.",
        ],
      );
    },
  },
];
