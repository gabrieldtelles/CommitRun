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
├── components/  terminal, grafo de commits, briefing, editor, trilha e sessão
├── lib/         regras de XP, níveis, desbloqueio e layout do grafo
├── server/      depósito de dados, ranking, progresso por conta e limite de taxa
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

O login é opcional e usa Auth.js (NextAuth v5) com o provedor do GitHub. Sem as variáveis
configuradas o jogo funciona normalmente — o botão de entrar simplesmente não aparece, e o
progresso fica só no navegador.

Para ativar:

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

Com o login ativo, o progresso deixa de viver só no navegador: ao entrar, o que está salvo na conta
é mesclado com o que está no aparelho (união das missões concluídas) e gravado de volta pela rota
`/api/progresso`. Dá para começar no notebook e continuar no celular.

## Ranking

Sem login, o progresso do jogador fica no `localStorage` do navegador. O ranking é opcional e passa
pela API:

- `GET /api/ranking` devolve os 20 primeiros.
- `POST /api/ranking` recebe `{ apelido?, missoes: string[] }`. Com sessão ativa o apelido é
  ignorado e vale o usuário do GitHub, que aparece na lista com selo de verificado.
- `GET`/`POST /api/progresso` leem e gravam o progresso da conta logada (401 sem sessão).

O XP **não** é aceito do cliente: o servidor recalcula a pontuação a partir dos identificadores de
missão do próprio catálogo, ignorando o que não existe. Há limite de 10 envios por minuto por IP.

Por padrão o ranking usa armazenamento em memória, o que serve para desenvolvimento mas não
persiste entre instâncias serverless. Para um ranking real, configure um Redis compatível com a API
REST do Upstash:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Sem essas variáveis a aplicação continua funcionando normalmente — só o ranking fica restrito à
instância.

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
