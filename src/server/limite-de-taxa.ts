const janelas = new Map<string, { inicio: number; total: number }>();

export function dentroDoLimite(chave: string, maximo = 10, janelaMs = 60_000): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);

  if (!atual || agora - atual.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, total: 1 });
    return true;
  }

  if (atual.total >= maximo) return false;

  atual.total += 1;
  return true;
}
