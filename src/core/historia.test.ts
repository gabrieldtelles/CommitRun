import { describe, expect, it } from "vitest";
import { readFile } from "./fs";
import { createMachine, runCommand } from "./machine";
import { headCommit, history } from "./repo";
import type { Machine } from "./types";

function projeto(): Machine {
  const machine = createMachine({ cwd: "/pulso", files: { "nota.txt": "linha um" } });
  rodar(machine, "git init", "git add .", 'git commit -m "base"');
  return machine;
}

function rodar(machine: Machine, ...linhas: string[]): string {
  let ultimo = "";
  for (const linha of linhas) ultimo = runCommand(machine, linha).output;
  return ultimo;
}

describe("revert", () => {
  it("cria um commit novo que desfaz o anterior", () => {
    const machine = projeto();
    rodar(machine, 'echo "linha errada" > nota.txt', "git add .", 'git commit -m "erro"');

    const saida = rodar(machine, "git revert HEAD");

    expect(saida).toContain('Revert "erro"');
    expect(readFile(machine.fs, "/pulso/nota.txt")).toBe("linha um");
    expect(history(machine.repo!, machine.repo!.branches["main"] ?? null)).toHaveLength(3);
  });

  it("recusa quando há mudança pendente", () => {
    const machine = projeto();
    rodar(machine, 'echo "pendente" > nota.txt');
    expect(runCommand(machine, "git revert HEAD").error).toBe(true);
  });
});

describe("reflog", () => {
  it("guarda por onde o HEAD passou", () => {
    const machine = projeto();
    rodar(machine, "git switch -c teste", 'echo "x" > nota.txt', "git add .", 'git commit -m "no teste"');

    const saida = rodar(machine, "git reflog");

    expect(saida).toContain("commit: no teste");
    expect(saida).toContain("checkout: moving to teste");
    expect(saida).toContain("HEAD@{0}");
  });

  it("permite voltar para um commit abandonado por reset", () => {
    const machine = projeto();
    rodar(machine, 'echo "importante" > nota.txt', "git add .", 'git commit -m "trabalho bom"');
    const perdido = headCommit(machine.repo!)!.hash;

    rodar(machine, "git reset --hard HEAD~1");
    expect(readFile(machine.fs, "/pulso/nota.txt")).toBe("linha um");

    rodar(machine, `git reset --hard ${perdido.slice(0, 7)}`);
    expect(readFile(machine.fs, "/pulso/nota.txt")).toBe("importante");
  });
});

describe("stash", () => {
  it("guarda o trabalho pela metade e devolve depois", () => {
    const machine = projeto();
    rodar(machine, 'echo "meio feito" > nota.txt');

    expect(rodar(machine, "git stash")).toContain("Saved working directory");
    expect(readFile(machine.fs, "/pulso/nota.txt")).toBe("linha um");

    expect(rodar(machine, "git stash pop")).toContain("Dropped");
    expect(readFile(machine.fs, "/pulso/nota.txt")).toBe("meio feito");
    expect(machine.repo!.stash).toHaveLength(0);
  });

  it("lista as gavetas com a mensagem escolhida", () => {
    const machine = projeto();
    rodar(machine, 'echo "a" > nota.txt', 'git stash -m "rodape pela metade"');

    expect(rodar(machine, "git stash list")).toContain("rodape pela metade");
  });

  it("avisa quando não há nada para guardar", () => {
    expect(rodar(projeto(), "git stash")).toBe("No local changes to save");
  });
});

describe("cherry-pick", () => {
  it("traz um commit de outra branch sem levar o resto", () => {
    const machine = projeto();
    rodar(machine, "git switch -c extra");
    rodar(machine, 'echo "correcao" > correcao.txt', "git add .", 'git commit -m "corrige rodape"');
    rodar(machine, 'echo "outra coisa" > outro.txt', "git add .", 'git commit -m "mexe em outra coisa"');

    const alvo = headCommit(machine.repo!)!.parents[0]!;
    rodar(machine, "git switch main", `git cherry-pick ${alvo.slice(0, 7)}`);

    expect(readFile(machine.fs, "/pulso/correcao.txt")).toBe("correcao");
    expect(readFile(machine.fs, "/pulso/outro.txt")).toBeNull();
  });
});

describe("rebase", () => {
  it("reaplica os commits da branch sobre a main", () => {
    const machine = projeto();
    rodar(machine, "git switch -c ajuste", 'echo "do ajuste" > ajuste.txt', "git add .", 'git commit -m "ajuste"');
    rodar(machine, "git switch main", 'echo "da main" > main.txt', "git add .", 'git commit -m "main andou"');
    rodar(machine, "git switch ajuste");

    const saida = rodar(machine, "git rebase main");

    expect(saida).toContain("Successfully rebased");
    expect(readFile(machine.fs, "/pulso/main.txt")).toBe("da main");
    expect(readFile(machine.fs, "/pulso/ajuste.txt")).toBe("do ajuste");
    expect(headCommit(machine.repo!)?.parents).toHaveLength(1);
  });

  it("avisa quando já está atualizada", () => {
    const machine = projeto();
    rodar(machine, "git switch -c nova");
    expect(rodar(machine, "git rebase main")).toContain("up to date");
  });
});

describe("tag", () => {
  it("cria, lista e apaga etiquetas", () => {
    const machine = projeto();

    rodar(machine, 'git tag -a v1.0 -m "primeira entrega"');
    expect(machine.repo!.tags["v1.0"]?.mensagem).toBe("primeira entrega");
    expect(rodar(machine, "git tag")).toContain("v1.0");

    expect(rodar(machine, "git tag -d v1.0")).toContain("Deleted tag");
    expect(rodar(machine, "git tag")).toBe("");
  });

  it("recusa etiqueta repetida", () => {
    const machine = projeto();
    rodar(machine, "git tag v1.0");
    expect(runCommand(machine, "git tag v1.0").error).toBe(true);
  });
});
