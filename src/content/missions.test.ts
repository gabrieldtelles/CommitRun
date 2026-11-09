import { describe, expect, it } from "vitest";
import { createMachine, runCommand } from "@/core/machine";
import { missions } from "./missions";

const solucoes: Record<string, string[]> = {
  c1m1: ["git init", "git status"],
  c1m2: ['git config user.name "Ana Lima"', "git config user.email ana@pulso.studio"],
  c1m3: ["git add .", 'git commit -m "estrutura inicial do site"'],
  c1m4: [
    'echo "body { margin: 0; }" > estilo.css',
    "git add estilo.css",
    'git commit -m "adiciona folha de estilo"',
    "git log --oneline",
  ],
  c2m1: [
    'echo "<h1>Pulso</h1>" > index.html',
    "git diff",
    "git add index.html",
    'git commit -m "corrige nome do estudio no titulo"',
  ],
  c2m2: [
    'echo "*.log" > .gitignore',
    'echo "node_modules/" >> .gitignore',
    "git add .",
    'git commit -m "ignora arquivos gerados"',
  ],
  c2m3: ["git restore --staged rascunho.txt", "git restore estilo.css"],
  c2m4: ['git commit --amend -m "ajusta cores do cabecalho"'],
  c3m1: [
    "git switch -c rodape",
    'echo "<footer>Pulso</footer>" >> index.html',
    "git add index.html",
    'git commit -m "adiciona rodape"',
  ],
  c3m2: ["git merge rodape"],
  c3m3: [
    "git merge titulo",
    'echo "<h1>Pulso Estudio</h1>" > index.html',
    "git add index.html",
    'git commit -m "resolve conflito do titulo"',
  ],
  c4m1: ["git remote add origin https://git.pulso.studio/site.git", "git remote -v"],
  c4m2: ["git add README.md", 'git commit -m "documenta como rodar o site"', "git push -u origin main"],
};

describe("catálogo de missões", () => {
  it("não repete slug nem id", () => {
    expect(new Set(missions.map((m) => m.slug)).size).toBe(missions.length);
    expect(new Set(missions.map((m) => m.id)).size).toBe(missions.length);
  });

  it("tem briefing, objetivos e três dicas em todas as missões", () => {
    for (const mission of missions) {
      expect(mission.briefing.length).toBeGreaterThan(0);
      expect(mission.objectives.length).toBeGreaterThan(0);
      expect(mission.hints).toHaveLength(3);
      expect(mission.xp).toBeGreaterThan(0);
    }
  });

  it.each(missions.map((mission) => [mission.id, mission.title] as const))(
    "%s (%s) recusa o estado inicial e aceita a solução",
    (id) => {
      const mission = missions.find((item) => item.id === id);
      if (!mission) throw new Error(`missão ${id} não encontrada`);

      const inicial = createMachine(mission.seed);
      expect(mission.validate({ machine: inicial, history: [] }).ok).toBe(false);

      const machine = createMachine(mission.seed);
      const history: string[] = [];
      for (const linha of solucoes[id] ?? []) {
        runCommand(machine, linha);
        history.push(linha);
      }

      const resultado = mission.validate({ machine, history });
      expect(resultado.message).toBeTruthy();
      expect(resultado.ok).toBe(true);
    },
  );
});
