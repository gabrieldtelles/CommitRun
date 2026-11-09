import { ancestry } from "@/core/repo";
import type { Commit, Repo } from "@/core/types";

export type NoGrafo = {
  commit: Commit;
  lane: number;
  linha: number;
  refs: string[];
  atual: boolean;
};

export type Ligacao = { de: NoGrafo; para: NoGrafo };

export type LayoutGrafo = {
  nos: NoGrafo[];
  ligacoes: Ligacao[];
  lanes: number;
};

export function montarGrafo(repo: Repo | null): LayoutGrafo {
  if (!repo) return { nos: [], ligacoes: [], lanes: 0 };

  const nomes = Object.keys(repo.branches).sort((a, b) =>
    a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b),
  );

  const laneDe = new Map<string, number>();
  nomes.forEach((nome, indice) => {
    for (const hash of ancestry(repo, repo.branches[nome] ?? null)) {
      if (!laneDe.has(hash)) laneDe.set(hash, indice);
    }
  });

  const head = repo.head.kind === "branch" ? repo.branches[repo.head.name] : repo.head.hash;

  const commits = Object.values(repo.commits)
    .filter((commit) => laneDe.has(commit.hash))
    .sort((a, b) => b.timestamp - a.timestamp);

  const nos: NoGrafo[] = commits.map((commit, linha) => ({
    commit,
    lane: laneDe.get(commit.hash) ?? 0,
    linha,
    refs: nomes.filter((nome) => repo.branches[nome] === commit.hash),
    atual: commit.hash === head,
  }));

  const porHash = new Map(nos.map((no) => [no.commit.hash, no]));
  const ligacoes: Ligacao[] = [];

  for (const no of nos) {
    for (const parente of no.commit.parents) {
      const alvo = porHash.get(parente);
      if (alvo) ligacoes.push({ de: no, para: alvo });
    }
  }

  return { nos, ligacoes, lanes: Math.max(1, new Set(nos.map((no) => no.lane)).size) };
}
