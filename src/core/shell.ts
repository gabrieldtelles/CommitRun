import {
  cloneNode,
  exists,
  getNode,
  isDir,
  listDir,
  mkdirp,
  readFile,
  remove,
  writeFile,
  type VDir,
} from "./fs";
import { basename, dirname, resolve } from "./path";
import { GIT_DIR } from "./repo";
import type { CommandResult, Machine } from "./types";

const HELP = `comandos do terminal:

  pwd                     mostra a pasta atual
  ls [-a] [pasta]         lista o conteúdo da pasta
  cd <pasta>              entra em uma pasta
  cat <arquivo>           mostra o conteúdo de um arquivo
  echo "texto" > arquivo  escreve em um arquivo (>> adiciona ao final)
  touch <arquivo>         cria um arquivo vazio
  mkdir [-p] <pasta>      cria uma pasta
  rm [-r] <alvo>          apaga arquivo ou pasta
  cp / mv <origem> <alvo> copia ou move
  edit <arquivo>          abre o editor
  clear                   limpa a tela
  git ...                 comandos git (veja: git help)

no jogo:
  missao                  mostra o objetivo atual
  validar                 confere se a missão foi cumprida
  dica                    pede uma dica`;

export function parseLine(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let hasContent = false;

  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      hasContent = true;
      continue;
    }
    if (char === " ") {
      if (current || hasContent) tokens.push(current);
      current = "";
      hasContent = false;
      continue;
    }
    current += char;
  }

  if (current || hasContent) tokens.push(current);
  return tokens;
}

function ok(output = ""): CommandResult {
  return { output };
}

function fail(output: string): CommandResult {
  return { output, error: true };
}

function displayPath(machine: Machine, path: string): string {
  return path === machine.cwd ? "." : path;
}

export function runShell(machine: Machine, command: string, args: string[]): CommandResult {
  switch (command) {
    case "help":
      return ok(HELP);

    case "clear":
      return { output: "", effect: { type: "clear" } };

    case "pwd":
      return ok(machine.cwd);

    case "ls":
      return listing(machine, args);

    case "cd": {
      const target = resolve(machine.cwd, args[0] ?? "/");
      if (!exists(machine.fs, target)) return fail(`cd: ${args[0]}: pasta não encontrada`);
      if (!isDir(machine.fs, target)) return fail(`cd: ${args[0]}: não é uma pasta`);
      machine.cwd = target;
      return ok();
    }

    case "cat": {
      if (!args[0]) return fail("cat: informe um arquivo");
      const target = resolve(machine.cwd, args[0]);
      const content = readFile(machine.fs, target);
      if (content === null) return fail(`cat: ${args[0]}: arquivo não encontrado`);
      return ok(content);
    }

    case "echo":
      return echo(machine, args);

    case "touch": {
      if (!args[0]) return fail("touch: informe um arquivo");
      for (const arg of args) {
        const target = resolve(machine.cwd, arg);
        if (!exists(machine.fs, target)) writeFile(machine.fs, target, "");
      }
      return ok();
    }

    case "mkdir": {
      const names = args.filter((arg) => !arg.startsWith("-"));
      if (names.length === 0) return fail("mkdir: informe o nome da pasta");
      for (const name of names) {
        const target = resolve(machine.cwd, name);
        if (!args.includes("-p") && !exists(machine.fs, dirname(target))) {
          return fail(`mkdir: ${name}: pasta anterior não existe (use -p)`);
        }
        if (exists(machine.fs, target)) return fail(`mkdir: ${name}: já existe`);
        mkdirp(machine.fs, target);
      }
      return ok();
    }

    case "rm": {
      const recursive = args.includes("-r") || args.includes("-rf");
      const names = args.filter((arg) => !arg.startsWith("-"));
      if (names.length === 0) return fail("rm: informe o que apagar");
      for (const name of names) {
        const target = resolve(machine.cwd, name);
        if (!exists(machine.fs, target)) return fail(`rm: ${name}: não encontrado`);
        if (isDir(machine.fs, target) && !recursive) return fail(`rm: ${name}: é uma pasta (use -r)`);
        remove(machine.fs, target);
      }
      return ok();
    }

    case "cp":
    case "mv":
      return transfer(machine, command, args);

    case "edit": {
      if (!args[0]) return fail("edit: informe um arquivo");
      const target = resolve(machine.cwd, args[0]);
      if (!exists(machine.fs, target)) writeFile(machine.fs, target, "");
      if (isDir(machine.fs, target)) return fail(`edit: ${args[0]}: é uma pasta`);
      return { output: "", effect: { type: "edit", path: target } };
    }

    default:
      return fail(`${command}: comando não encontrado. Digite help para ver a lista.`);
  }
}

function listing(machine: Machine, args: string[]): CommandResult {
  const showAll = args.includes("-a");
  const target = resolve(machine.cwd, args.find((arg) => !arg.startsWith("-")) ?? ".");

  if (!exists(machine.fs, target)) return fail(`ls: ${displayPath(machine, target)}: não encontrado`);
  if (!isDir(machine.fs, target)) return ok(basename(target));

  const entries = listDir(machine.fs, target)
    .filter((name) => showAll || !name.startsWith("."))
    .filter((name) => showAll || name !== GIT_DIR)
    .map((name) => (isDir(machine.fs, `${target}/${name}`) ? `${name}/` : name));

  return ok(entries.join("  "));
}

function echo(machine: Machine, args: string[]): CommandResult {
  const redirect = args.findIndex((arg) => arg === ">" || arg === ">>");
  const text = (redirect === -1 ? args : args.slice(0, redirect)).join(" ");

  if (redirect === -1) return ok(text);

  const file = args[redirect + 1];
  if (!file) return fail("echo: informe o arquivo de destino");

  const target = resolve(machine.cwd, file);
  const append = args[redirect] === ">>";
  const previous = append ? (readFile(machine.fs, target) ?? "") : "";
  const content = append && previous ? `${previous}\n${text}` : text;

  writeFile(machine.fs, target, content);
  return ok();
}

function transfer(machine: Machine, command: "cp" | "mv", args: string[]): CommandResult {
  const names = args.filter((arg) => !arg.startsWith("-"));
  const [from, to] = names;
  if (!from || !to) return fail(`${command}: informe origem e destino`);

  const source = resolve(machine.cwd, from);
  const node = getNode(machine.fs, source);
  if (!node) return fail(`${command}: ${from}: não encontrado`);

  const destination = resolve(machine.cwd, to);
  const intoDir = isDir(machine.fs, destination);
  const finalPath = intoDir ? `${destination}/${basename(source)}` : destination;

  const parent = mkdirp(machine.fs, dirname(finalPath)) as VDir;
  parent.children[basename(finalPath)] = cloneNode(node);

  if (command === "mv") remove(machine.fs, source);
  return ok();
}
