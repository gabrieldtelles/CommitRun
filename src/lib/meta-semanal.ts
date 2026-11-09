import { chaveDoDia, diasDaSemana, inicioDaSemana } from "./temporada";

export type TipoDeMeta = "missoes" | "revisoes" | "dias";

export type MetaSemanal = {
  tipo: TipoDeMeta;
  titulo: string;
  descricao: string;
  alvo: number;
  bonus: number;
};

const MODELOS: Record<TipoDeMeta, (alvo: number) => Omit<MetaSemanal, "tipo" | "alvo">> = {
  missoes: (alvo) => ({
    titulo: "Avançar na campanha",
    descricao: `Conclua ${alvo} missões novas até domingo.`,
    bonus: alvo * 25,
  }),
  revisoes: (alvo) => ({
    titulo: "Manter o que aprendeu",
    descricao: `Feche ${alvo} revisões agendadas nesta semana.`,
    bonus: alvo * 20,
  }),
  dias: (alvo) => ({
    titulo: "Pegar o ritmo",
    descricao: `Pratique em ${alvo} dias diferentes da semana.`,
    bonus: alvo * 30,
  }),
};

const TIPOS: TipoDeMeta[] = ["missoes", "revisoes", "dias"];
const ALVOS: Record<TipoDeMeta, number[]> = {
  missoes: [2, 3, 4],
  revisoes: [2, 3, 5],
  dias: [3, 4, 5],
};

export function numeroDaSemana(data: Date | number = Date.now()): number {
  const inicio = inicioDaSemana(data);
  const origem = new Date(2026, 0, 5);
  return Math.max(0, Math.round((inicio.getTime() - origem.getTime()) / (7 * 86_400_000)));
}

export function metaDaSemana(data: Date | number = Date.now()): MetaSemanal {
  const semana = numeroDaSemana(data);
  const tipo = TIPOS[semana % TIPOS.length] as TipoDeMeta;
  const opcoes = ALVOS[tipo];
  const alvo = opcoes[Math.floor(semana / TIPOS.length) % opcoes.length] as number;

  return { tipo, alvo, ...MODELOS[tipo](alvo) };
}

export type DadosDaMeta = {
  missoes: Record<string, { concluidaEm: number; ultimaEm: number; revisoes: number }>;
  atividade: Record<string, number>;
};

export function progressoDaMeta(
  meta: MetaSemanal,
  dados: DadosDaMeta,
  agora: Date | number = Date.now(),
): number {
  const dias = new Set(diasDaSemana(agora));

  if (meta.tipo === "dias") {
    return Object.entries(dados.atividade).filter(([dia, xp]) => dias.has(dia) && xp > 0).length;
  }

  if (meta.tipo === "missoes") {
    return Object.values(dados.missoes).filter((item) => dias.has(chaveDoDia(item.concluidaEm)))
      .length;
  }

  return Object.values(dados.missoes).filter(
    (item) => item.revisoes > 0 && dias.has(chaveDoDia(item.ultimaEm)),
  ).length;
}

export function metaConcluida(meta: MetaSemanal, feito: number): boolean {
  return feito >= meta.alvo;
}
