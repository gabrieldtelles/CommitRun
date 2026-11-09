<div align="center">
  <img src="public/icone.svg" width="88" alt="CommitRun" />

  # CommitRun

  **Aprenda git quebrando e consertando um repositório de verdade.**

  21 missões num terminal que roda no navegador. Sem vídeo, sem decoreba, sem medo de estragar nada.

</div>

---

## O problema

Todo mundo aprende git do mesmo jeito: decora `add`, `commit`, `push` e segue a vida. Aí chega o dia do
conflito de merge, do commit que foi pro ar quebrado, do `reset --hard` que levou junto o trabalho da
tarde — e a decoreba não ajuda.

Ninguém aprende a consertar um repositório lendo sobre isso. Aprende quebrando um.

## A proposta

O CommitRun te coloca no time de engenharia de um estúdio fictício. Cada missão é um problema que
acontece de verdade no trabalho, e você resolve no terminal, com os comandos reais.

O repositório é simulado dentro do navegador: você pode rodar `git reset --hard` sem medo, errar à
vontade e reiniciar quantas vezes quiser. Nada do seu computador é tocado.

### Como funciona

| | |
|---|---|
| **1. Briefing** | A Val, tech lead do time, explica o problema que apareceu e o que precisa estar resolvido no fim |
| **2. Terminal** | Você resolve com git de verdade — `init`, `rebase`, `stash`, `cherry-pick`, o que a missão pedir |
| **3. Validação** | O estado do repositório é conferido comando a comando. Passou, ganha XP e libera a próxima |

## O que tem dentro

### A campanha — 8 capítulos, 21 missões, 2010 XP

| Capítulo | O que você aprende |
|---|---|
| 1 · Primeira semana | `init` · `config` · `status` · `add` · `commit` · `log` |
| 2 · Rotina de versionamento | `diff` · `.gitignore` · `restore` · `amend` |
| 3 · Trabalho em paralelo | `branch` · `switch` · `merge` · resolver conflitos |
| 4 · Time remoto | `remote` · `push` · `pull` |
| 5 · Consertar sem apagar | `revert` · `reflog` — inclusive recuperar commit perdido num reset |
| 6 · Trabalho pela metade | `stash` · `stash list` · `stash pop` |
| 7 · Histórico limpo | `cherry-pick` · `rebase` |
| 8 · Hora de entregar | `tag` · `push` · fechar uma release |

### Code review entre jogadores

Terminou uma missão? Abra um **pull request** com o diff do que você fez. Outras pessoas revisam o seu
código comentando linha a linha, você revisa o delas, e cada review vale XP. Quem escreve review útil
sobe de reputação — a nota é dada por quem recebeu.

### Progresso que não se perde

Nível e patente, sequência de dias seguidos, XP da semana, meta semanal com bônus e ranking entre
todos os jogadores — temporada da semana e geral. Tudo preso à sua conta do GitHub: começa no
notebook, continua no celular.

### Revisão espaçada

Comando que você usa uma vez só não gruda. Cada missão concluída volta à agenda em 2, 7, 21 e 60 dias
para você refazer do zero e confirmar que ainda sabe.

## Para quem é

- Quem está aprendendo a programar e trava no git
- Quem já usa git no automático e quer entender o que está fazendo
- Quem vai entrar num time e precisa saber abrir PR, revisar código e resolver conflito
- Professores e bootcamps que querem uma trilha prática em vez de slides

---

## Rodando localmente

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | ambiente de desenvolvimento |
| `npm run build` | build de produção |
| `npm run test` | testes do engine, das missões, do progresso e do code review |
| `npm run typecheck` | checagem de tipos |
| `npm run lint` | análise estática |
| `npm run db:migrate` | cria as tabelas no banco |

## Configuração

O login com GitHub é **obrigatório para jogar** — o progresso pertence à conta, não ao navegador.

1. Crie um OAuth App em <https://github.com/settings/developers> → aba **OAuth Apps**
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/api/auth/callback/github`
2. Copie `.env.example` para `.env.local` e preencha:

```bash
DATABASE_URL=                     # connection string do Neon
AUTH_GITHUB_ID=seu_client_id
AUTH_GITHUB_SECRET=seu_client_secret
AUTH_SECRET=                      # npx auth secret
```

Depois crie as tabelas:

```bash
npm run db:migrate
```

Sem `DATABASE_URL`, a aplicação sobe com um Postgres em memória — dá para rodar o projeto sem banco
nenhum, mas os dados somem ao reiniciar. **Em produção o banco é obrigatório**: cada instância
serverless tem a própria memória, então sem ele o progresso de todo mundo se perde.

## Deploy na Vercel

1. Importe o repositório em vercel.com/new (Next.js é detectado sozinho)
2. Crie o Postgres em Storage → Neon e cole a `DATABASE_URL` (depois rode `npm run db:migrate`)
3. Adicione `https://seu-dominio.vercel.app/api/auth/callback/github` no OAuth App
4. Configure `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET` e `AUTH_URL`

## Como foi construído

```
src/
├── core/        engine: sistema de arquivos virtual, objetos git e comandos
│   └── git/     init, add, commit, diff, branch, merge, rebase, stash, revert, reflog, tag…
├── content/     catálogo de missões, cenários iniciais e regras de validação
├── components/  terminal, grafo de commits, hangar, code review, ranking
├── lib/         XP, níveis, temporada semanal, revisão espaçada, pull requests
├── server/      camada de banco, progresso por conta, ranking e reviews
├── migrations/  schema do Postgres
├── proxy.ts     bloqueia as rotas de jogo para quem não tem sessão
└── app/         rotas do Next.js e a API
```

O engine do git é **TypeScript puro, sem React** — dá para testar cada comando isoladamente, e é isso
que os testes fazem. Entre eles, um teste executa a solução de cada uma das 21 missões e confirma duas
coisas: que o estado inicial é recusado e que a solução é aceita.

Toda regra que vale pontos é decidida no servidor: o XP é recalculado a partir do catálogo, revisão só
conta quando a agenda vence, dicas usadas não podem ser apagadas e ninguém revisa o próprio PR.

### Criar uma missão nova

Adicione um item em `src/content/missions/capitulo-N.ts`:

```ts
{
  id: "c1m5",
  slug: "nome-na-url",
  chapter: 1,
  order: 5,
  title: "Título da missão",
  summary: "Uma linha explicando o objetivo.",
  xp: 60,
  commands: ["git log"],
  briefing: ["Contexto do problema."],
  objectives: ["O que precisa estar feito no fim"],
  hints: ["dica leve", "dica média", "dica que entrega o comando"],
  seed: { cwd: "/pulso", files: { "README.md": "..." }, repo: {} },
  validate: (state) => sequence([condicao, "mensagem quando falta fazer"]),
}
```

Depois inclua a solução em `src/content/missions.test.ts` — o teste cobre todas as missões
automaticamente.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS · Zustand · Zod · Auth.js ·
Neon Postgres · Vitest

---

<div align="center">

Feito por **Gabriel Telles**

[GitHub](https://github.com/gabrieldtelles) · [LinkedIn](https://www.linkedin.com/in/gabrieldtelles) · [Instagram](https://www.instagram.com/tellesdev)

</div>
