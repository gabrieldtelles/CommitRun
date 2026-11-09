import { basename, dirname, normalize } from "./path";

export type VFile = { kind: "file"; content: string };
export type VDir = { kind: "dir"; children: Record<string, VNode> };
export type VNode = VFile | VDir;

export function createRoot(): VDir {
  return { kind: "dir", children: {} };
}

export function getNode(root: VDir, path: string): VNode | null {
  const normalized = normalize(path);
  if (normalized === "/" || normalized === "") return root;

  let current: VNode = root;
  for (const part of normalized.split("/").filter(Boolean)) {
    if (current.kind !== "dir") return null;
    const next: VNode | undefined = current.children[part];
    if (!next) return null;
    current = next;
  }
  return current;
}

export function exists(root: VDir, path: string): boolean {
  return getNode(root, path) !== null;
}

export function isDir(root: VDir, path: string): boolean {
  return getNode(root, path)?.kind === "dir";
}

export function isFile(root: VDir, path: string): boolean {
  return getNode(root, path)?.kind === "file";
}

export function readFile(root: VDir, path: string): string | null {
  const node = getNode(root, path);
  return node?.kind === "file" ? node.content : null;
}

export function mkdirp(root: VDir, path: string): VDir {
  let current = root;
  for (const part of normalize(path).split("/").filter(Boolean)) {
    const next: VNode | undefined = current.children[part];
    if (next?.kind === "file") throw new Error(`${path}: não é um diretório`);
    if (!next) current.children[part] = { kind: "dir", children: {} };
    current = current.children[part] as VDir;
  }
  return current;
}

export function writeFile(root: VDir, path: string, content: string): void {
  const parent = mkdirp(root, dirname(path));
  parent.children[basename(path)] = { kind: "file", content };
}

export function remove(root: VDir, path: string): boolean {
  const parent = getNode(root, dirname(path));
  if (parent?.kind !== "dir") return false;
  const name = basename(path);
  if (!(name in parent.children)) return false;
  delete parent.children[name];
  return true;
}

export function listDir(root: VDir, path: string): string[] {
  const node = getNode(root, path);
  if (node?.kind !== "dir") return [];
  return Object.keys(node.children).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function listFiles(root: VDir, base: string): string[] {
  const node = getNode(root, base);
  if (node?.kind !== "dir") return [];

  const files: string[] = [];
  const walk = (dir: VDir, prefix: string) => {
    for (const name of Object.keys(dir.children).sort()) {
      const child = dir.children[name];
      if (!child) continue;
      const childPath = prefix ? `${prefix}/${name}` : name;
      if (child.kind === "file") files.push(childPath);
      else walk(child, childPath);
    }
  };

  walk(node, "");
  return files;
}

export function cloneNode<T extends VNode>(node: T): T {
  if (node.kind === "file") return { kind: "file", content: node.content } as T;
  const children: Record<string, VNode> = {};
  for (const [name, child] of Object.entries(node.children)) children[name] = cloneNode(child);
  return { kind: "dir", children } as T;
}
