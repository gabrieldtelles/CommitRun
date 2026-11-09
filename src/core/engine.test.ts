import { describe, expect, it } from "vitest";
import { createMachine, runCommand } from "./machine";
import { readFile } from "./fs";
import { headCommit, status } from "./repo";
import type { Machine } from "./types";

function novaMaquina(): Machine {
  return createMachine({ cwd: "/projeto", files: { "nota.txt": "primeira linha" } });
}

function rodar(machine: Machine, ...linhas: string[]): string {
  let ultimo = "";
  for (const linha of linhas) ultimo = runCommand(machine, linha).output;
  return ultimo;
}

describe("shell", () => {
  it("lista, lê e escreve arquivos", () => {
    const machine = novaMaquina();
    expect(rodar(machine, "ls")).toContain("nota.txt");
    expect(rodar(machine, "cat nota.txt")).toBe("primeira linha");

    rodar(machine, 'echo "outra linha" > extra.txt');
    expect(rodar(machine, "cat extra.txt")).toBe("outra linha");

    rodar(machine, 'echo "mais uma" >> extra.txt');
    expect(rodar(machine, "cat extra.txt")).toBe("outra linha\nmais uma");
  });

  it("navega entre pastas", () => {
    const machine = novaMaquina();
    rodar(machine, "mkdir src", "cd src");
    expect(rodar(machine, "pwd")).toBe("/projeto/src");
    rodar(machine, "cd ..");
    expect(rodar(machine, "pwd")).toBe("/projeto");
  });

  it("recusa comando desconhecido", () => {
    const machine = novaMaquina();
    expect(runCommand(machine, "foo").error).toBe(true);
  });
});

describe("git básico", () => {
  it("exige repositório antes de usar status", () => {
    const machine = novaMaquina();
    expect(runCommand(machine, "git status").error).toBe(true);
  });

  it("cria repositório, prepara e grava commit", () => {
    const machine = novaMaquina();
    expect(rodar(machine, "git init")).toContain("Initialized empty Git repository");
    expect(rodar(machine, "git status")).toContain("nota.txt");

    rodar(machine, "git add nota.txt");
    expect(rodar(machine, "git status")).toContain("new file");

    const saida = rodar(machine, 'git commit -m "primeiro commit"');
    expect(saida).toContain("root-commit");
    expect(headCommit(machine.repo!)?.message).toBe("primeiro commit");
    expect(rodar(machine, "git log --oneline")).toContain("primeiro commit");
  });

  it("mostra diferenças antes e depois do stage", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"');
    rodar(machine, 'echo "linha nova" > nota.txt');

    expect(rodar(machine, "git diff")).toContain("+linha nova");
    rodar(machine, "git add nota.txt");
    expect(rodar(machine, "git diff")).toBe("");
    expect(rodar(machine, "git diff --staged")).toContain("+linha nova");
  });

  it("ignora arquivos listados no .gitignore", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", 'echo "*.log" > .gitignore', "touch debug.log", "git add .");
    expect(Object.keys(machine.repo!.index)).not.toContain("debug.log");
    expect(status(machine.fs, machine.repo!).untracked).not.toContain("debug.log");
  });

  it("desfaz mudanças com restore e reset", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"');

    rodar(machine, 'echo "bagunça" > nota.txt', "git restore nota.txt");
    expect(readFile(machine.fs, "/projeto/nota.txt")).toBe("primeira linha");

    rodar(machine, "touch temp.txt", "git add temp.txt", "git restore --staged temp.txt");
    expect(Object.keys(machine.repo!.index)).not.toContain("temp.txt");

    rodar(machine, 'echo "v2" > nota.txt', "git add .", 'git commit -m "v2"', "git reset --hard HEAD~1");
    expect(readFile(machine.fs, "/projeto/nota.txt")).toBe("primeira linha");
  });

  it("corrige o último commit com amend", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "mensagem errada"');
    rodar(machine, 'git commit --amend -m "mensagem certa"');

    expect(headCommit(machine.repo!)?.message).toBe("mensagem certa");
    expect(Object.keys(machine.repo!.commits)).toHaveLength(2);
  });
});

describe("branches", () => {
  it("cria branch, faz commit isolado e junta com fast-forward", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"');
    rodar(machine, "git switch -c ajuste", 'echo "ajustado" > nota.txt', "git add .", 'git commit -m "ajuste"');

    expect(rodar(machine, "git branch")).toContain("* ajuste");

    rodar(machine, "git switch main");
    expect(readFile(machine.fs, "/projeto/nota.txt")).toBe("primeira linha");

    expect(rodar(machine, "git merge ajuste")).toContain("Fast-forward");
    expect(readFile(machine.fs, "/projeto/nota.txt")).toBe("ajustado");
  });

  it("registra conflito quando as duas branches mudam o mesmo arquivo", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"');
    rodar(machine, "git switch -c rota", 'echo "versao da rota" > nota.txt', "git add .", 'git commit -m "rota"');
    rodar(machine, "git switch main", 'echo "versao da main" > nota.txt', "git add .", 'git commit -m "main"');

    const resultado = runCommand(machine, "git merge rota");
    expect(resultado.error).toBe(true);
    expect(resultado.output).toContain("CONFLICT");
    expect(readFile(machine.fs, "/projeto/nota.txt")).toContain("<<<<<<< HEAD");

    rodar(machine, 'echo "versao combinada" > nota.txt', "git add nota.txt", 'git commit -m "resolve conflito"');
    expect(machine.repo!.merge).toBeNull();
    expect(headCommit(machine.repo!)?.parents).toHaveLength(2);
  });

  it("bloqueia troca de branch com mudanças pendentes", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"', "git branch outra");
    rodar(machine, 'echo "pendente" > nota.txt');

    expect(runCommand(machine, "git switch outra").error).toBe(true);
  });
});

describe("remoto", () => {
  it("envia e recebe commits do remoto simulado", () => {
    const machine = novaMaquina();
    rodar(machine, "git init", "git add .", 'git commit -m "base"');
    rodar(machine, "git remote add origin https://exemplo.dev/repo.git");

    expect(rodar(machine, "git remote -v")).toContain("origin");
    expect(rodar(machine, "git push -u origin main")).toContain("main -> main");
    expect(rodar(machine, "git push")).toBe("Everything up-to-date");
    expect(rodar(machine, "git pull")).toContain("Already up to date.");
  });
});
