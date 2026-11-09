export const AUTOR = {
  nome: "Gabriel Telles",
  github: "https://github.com/gabrieldtelles",
  linkedin: "https://www.linkedin.com/in/gabrieldtelles",
  instagram: "https://www.instagram.com/gabrieldtelles",
} as const;

export const REDES = [
  { rotulo: "GitHub", href: AUTOR.github },
  { rotulo: "LinkedIn", href: AUTOR.linkedin },
  { rotulo: "Instagram", href: AUTOR.instagram },
] as const;
