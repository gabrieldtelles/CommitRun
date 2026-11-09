function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function hashContent(input: string): string {
  const seeds = [0x811c9dc5, 0x1000193, 0x7feb352d, 0x846ca68b, 0x2545f491];
  return seeds
    .map((seed) => fnv1a(input, seed).toString(16).padStart(8, "0"))
    .join("")
    .slice(0, 40);
}

export function shortHash(hash: string): string {
  return hash.slice(0, 7);
}
