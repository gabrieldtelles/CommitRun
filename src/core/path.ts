export function normalize(path: string): string {
  const absolute = path.startsWith("/");
  const parts: string[] = [];

  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (parts.length > 0 && parts[parts.length - 1] !== "..") parts.pop();
      else if (!absolute) parts.push("..");
      continue;
    }
    parts.push(part);
  }

  return (absolute ? "/" : "") + parts.join("/");
}

export function resolve(cwd: string, path: string): string {
  return normalize(path.startsWith("/") ? path : `${cwd}/${path}`);
}

export function dirname(path: string): string {
  const normalized = normalize(path);
  const index = normalized.lastIndexOf("/");
  if (index <= 0) return normalized.startsWith("/") ? "/" : ".";
  return normalized.slice(0, index);
}

export function basename(path: string): string {
  const normalized = normalize(path);
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

export function relative(base: string, path: string): string {
  const root = normalize(base);
  const target = normalize(path);
  if (target === root) return "";
  if (!target.startsWith(`${root}/`)) return target;
  return target.slice(root.length + 1);
}
