export function chaveDoDia(data: Date | number): string {
  const dia = typeof data === "number" ? new Date(data) : data;
  return [
    dia.getFullYear(),
    String(dia.getMonth() + 1).padStart(2, "0"),
    String(dia.getDate()).padStart(2, "0"),
  ].join("-");
}

export function inicioDaSemana(data: Date | number = Date.now()): Date {
  const dia = typeof data === "number" ? new Date(data) : new Date(data);
  const diaDaSemana = (dia.getDay() + 6) % 7;
  dia.setHours(0, 0, 0, 0);
  dia.setDate(dia.getDate() - diaDaSemana);
  return dia;
}

export function fimDaSemana(data: Date | number = Date.now()): Date {
  const fim = inicioDaSemana(data);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

export function diasDaSemana(data: Date | number = Date.now()): string[] {
  const inicio = inicioDaSemana(data);
  return Array.from({ length: 7 }, (_, posicao) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + posicao);
    return chaveDoDia(dia);
  });
}

export function xpDaSemana(atividade: Record<string, number>, agora: Date | number = Date.now()): number {
  return diasDaSemana(agora).reduce((soma, dia) => soma + (atividade[dia] ?? 0), 0);
}

export type Sequencia = { atual: number; recorde: number };

export function calcularSequencia(
  atividade: Record<string, number>,
  agora: Date | number = Date.now(),
): Sequencia {
  const dias = Object.entries(atividade)
    .filter(([, xp]) => xp > 0)
    .map(([dia]) => dia)
    .sort();

  if (dias.length === 0) return { atual: 0, recorde: 0 };

  const conjunto = new Set(dias);
  let recorde = 0;
  let corrente = 0;
  let anterior: string | null = null;

  for (const dia of dias) {
    corrente = anterior && diaSeguinte(anterior) === dia ? corrente + 1 : 1;
    anterior = dia;
    recorde = Math.max(recorde, corrente);
  }

  const hoje = chaveDoDia(agora);
  let cursor = conjunto.has(hoje) ? hoje : diaAnterior(hoje);
  let atual = 0;

  while (conjunto.has(cursor)) {
    atual += 1;
    cursor = diaAnterior(cursor);
  }

  return { atual, recorde: Math.max(recorde, atual) };
}

function deslocar(dia: string, passo: number): string {
  const [ano, mes, data] = dia.split("-").map(Number);
  const referencia = new Date(ano ?? 1970, (mes ?? 1) - 1, data ?? 1);
  referencia.setDate(referencia.getDate() + passo);
  return chaveDoDia(referencia);
}

export function diaSeguinte(dia: string): string {
  return deslocar(dia, 1);
}

export function diaAnterior(dia: string): string {
  return deslocar(dia, -1);
}
