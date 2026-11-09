# CommitRun

Jogo para aprender git praticando: 13 missões curtas em um terminal simulado que roda inteiro no
navegador. Cada missão tem um briefing, um repositório com um problema real e uma validação que
confere o estado do repositório antes de liberar a próxima.

Nada do seu computador é acessado: o sistema de arquivos e o repositório git são simulados em
memória.

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | ambiente de desenvolvimento |
| `npm run build` | build de produção |
| `npm run test` | testes do engine, das missões e do ranking |
| `npm run typecheck` | checagem de tipos |
| `npm run lint` | análise estática |

## Como funciona

```
src/
├── core/        engine: sistema de arquivos virtual, objetos git e comandos
│   └── git/     init, add, commit, log, diff, branch, merge, remote, push, pull
├── content/     catálogo de missões, cenários iniciais e regras de validação
├── components/  terminal, grafo, briefing, editor, hangar, revisões, ranking e sessão
├── lib/         XP, níveis, desbloqueio, temporada semanal, revisão e layout do grafo
├── server/      depósito de dados, ranking, progresso por conta e limite de taxa
├── proxy.ts     bloqueia as rotas de jogo para quem não tem sessão
└── app/         rotas do Next.js e a API
```

O engine é TypeScript puro e não depende do React: dá para testar cada comando git isoladamente.
Os testes garantem, entre outras coisas, que toda missão é recusada no estado inicial e aceita com
a solução esperada.

### Criar uma missão nova

Adicione um item em `src/content/missions.ts`:

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

## Login com GitHub

**O login é obrigatório para jogar.** O progresso pertence à conta, não ao navegador: `src/proxy.ts`
bloqueia `/missoes` e `/missao/*` para quem não tem sessão, redirecionando para a página inicial com
o destino original em `?entrar=`. As rotas `/` e `/ranking` continuam públicas (vitrine e leitura do
placar), e as APIs respondem 401 sem sessão.

Ao sair da conta, o progresso guardado no navegador é apagado — inclusive progresso órfão de antes
do login existir — e duas contas no mesmo navegador nunca misturam XP.

Sem as variáveis configuradas o app sobe e a página inicial carrega, mas não há como entrar nem
jogar. Para ativar:

1. Crie um OAuth App em <https://github.com/settings/developers> → **New OAuth App**
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. Copie o **Client ID** e gere um **Client Secret**.
3. Preencha o `.env.local` (crie a partir do `.env.example`):

   ```bash
   AUTH_GITHUB_ID=seu_client_id
   AUTH_GITHUB_SECRET=seu_client_secret
   AUTH_SECRET=     # npx auth secret
   ```

4. Reinicie o `npm run dev`.

Em produção, crie um segundo OAuth App (ou adicione a callback do domínio da Vercel:
`https://seu-dominio.vercel.app/api/auth/callback/github`) e configure as mesmas variáveis em
Settings → Environment Variables, mais `AUTH_URL` com a URL pública.

Ao entrar, o progresso salvo na conta é baixado pela rota `/api/progresso` e, a partir daí, cada
missão concluída é gravada de volta (união das missões, nunca remoção). Dá para começar no notebook
e continuar no celular.

## Hangar, revisões e ranking

Depois do login o jogo tem três telas, todas protegidas por sessão:

**`/hangar`** — a central. Mostra nível e patente, barra de XP para o próximo nível, sequência de
dias seguidos (com recorde), XP da semana e XP total, a próxima missão com atalho, a campanha
inteira por capítulo e, na lateral, a meta da semana e as revisões pendentes.

**`/revisoes`** — code review entre jogadores. Ao concluir uma missão você pode abrir um **pull
request** com o diff do que fez; ele entra na fila dos outros jogadores, que comentam linha a linha,
dão um veredito (aprovar ou pedir mudanças) e ganham XP por isso. O autor avalia cada review de 1 a
5, e essa nota vira XP de bônus e **reputação** para quem revisou. Um PR fecha com dois reviews.

A mesma página traz, no fim, o **treino espaçado**: cada missão concluída volta à agenda em
intervalos crescentes (2, 7, 21 e 60 dias). Refazer uma missão vencida paga 30% do XP original e
empurra a próxima revisão para o intervalo seguinte; refazer antes da data vale como treino e não
paga nada. Os níveis de domínio (recém-aprendido → fixando → consolidado → dominado) aparecem na
campanha.

**`/ranking`** — todos os jogadores, em duas abas: temporada da semana (reinicia toda segunda) e
geral. Você entra na lista automaticamente ao concluir qualquer missão, com avatar e usuário do
GitHub, e a sua linha fica destacada.

A meta da semana é gerada pelo número da semana, igual para todos os jogadores: avançar na
campanha, fechar revisões ou praticar em N dias diferentes. Vale XP de bônus.

## Ranking

O `localStorage` funciona como cache da conta; a fonte de verdade é o servidor. O ranking passa pela
API:

- `GET /api/ranking` devolve os 20 primeiros.
- `POST /api/ranking` recebe `{ missoes: string[] }` e exige sessão (401 sem login). O nome exibido
  é sempre o usuário do GitHub — não há apelido digitável, então ninguém se passa por outro.
- `GET`/`POST /api/progresso` leem e gravam o progresso da conta logada (401 sem sessão).
- `GET`/`POST /api/prs` listam e abrem pull requests; `POST /api/prs/<id>/review` registra um review
  e `POST /api/prs/<id>/avaliar` guarda a nota do autor. Todas exigem sessão.

O XP de review é creditado **pelo servidor**, nunca pelo cliente: ninguém revisa o próprio PR, nem
revisa duas vezes o mesmo, e um review só é aceito com resumo de 40+ caracteres e pelo menos um
comentário em linha do diff — comentário apontando para arquivo fora do diff é descartado.

O XP **não** é aceito do cliente: o servidor recalcula a pontuação a partir dos identificadores de
missão do próprio catálogo, ignorando o que não existe. Há limite de 10 envios por minuto por IP.

Por padrão o ranking usa armazenamento em memória, o que serve para desenvolvimento mas não
persiste entre instâncias serverless. Para um ranking real, configure um Redis compatível com a API
REST do Upstash:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Sem essas variáveis a aplicação continua funcionando — mas ranking e progresso ficam restritos à
instância em memória, ou seja, sem persistência real entre deploys.

## Deploy na Vercel

O projeto é um app Next.js padrão, sem passos extras de build.

1. Importe o repositório em vercel.com/new.
2. Framework: Next.js (detectado automaticamente). Build: `npm run build`.
3. Em Settings → Environment Variables, adicione o que for usar:
   `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET` e `AUTH_URL` para o login;
   `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` para persistir ranking e progresso.

Pela CLI:

```bash
npx vercel          # preview
npx vercel --prod   # produção
```

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS · Zustand · Zod · Auth.js · Vitest
