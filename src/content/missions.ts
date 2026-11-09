import type { Chapter, Mission } from "./types";
import {
  allCommits,
  branchOf,
  commits,
  fileOf,
  isClean,
  isTracked,
  lastMessage,
  sequence,
  usedCommand,
} from "./checks";

export const chapters: Chapter[] = [
  {
    number: 1,
    title: "Primeira semana",
    subtitle: "Você entrou no time e o projeto ainda não tem histórico.",
    topics: "init · config · status · add · commit · log",
  },
  {
    number: 2,
    title: "Rotina de versionamento",
    subtitle: "Commits pequenos, revisados e fáceis de desfazer.",
    topics: "diff · .gitignore · restore · amend",
  },
  {
    number: 3,
    title: "Trabalho em paralelo",
    subtitle: "Duas pessoas mexendo no mesmo projeto ao mesmo tempo.",
    topics: "branch · switch · merge · conflitos",
  },
  {
    number: 4,
    title: "Time remoto",
    subtitle: "O código precisa sair da sua máquina.",
    topics: "remote · push · pull",
  },
];

const README = "# Pulso\n\nSite do estudio Pulso.";
const INDEX = "<h1>Pulso</h1>\n<p>Em construcao.</p>";
const ESTILO = "body {\n  background: #0a0c10;\n  color: #e7ecf3;\n}";

export const missions: Mission[] = [
  {
    id: "c1m1",
    slug: "ligar-o-controle-de-versao",
    chapter: 1,
    order: 1,
    title: "Ligar o controle de versão",
    summary: "Transforme a pasta do projeto em um repositório git.",
    xp: 40,
    commands: ["git init", "git status"],
    briefing: [
      "Bem-vinda ao time. Sou a Val, tech lead aqui no Pulso.",
      "A pasta do site existe, mas ninguém nunca versionou nada: se alguém apagar um arquivo hoje, não tem de onde voltar.",
      "Seu primeiro trabalho é ligar o git nessa pasta e olhar o que ele enxerga.",
    ],
    objectives: [
      "Crie o repositório na pasta do projeto com git init",
      "Veja o estado atual com git status",
    ],
    hints: [
      "O comando que cria o repositório é git init, sem argumento nenhum.",
      "Depois de criar, git status mostra os arquivos que ainda não estão sendo acompanhados.",
      "Digite git init e depois git status, um comando por linha.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
    },
    validate: (state) =>
      sequence(
        [Boolean(state.machine.repo), "A pasta ainda não é um repositório git. Use git init."],
        [usedCommand(state, /^git\s+status/), "Rode git status para ver o que o git está enxergando."],
      ),
  },
  {
    id: "c1m2",
    slug: "assinar-o-trabalho",
    chapter: 1,
    order: 2,
    title: "Assinar o trabalho",
    summary: "Configure quem é o autor dos commits deste repositório.",
    xp: 40,
    commands: ["git config"],
    briefing: [
      "Todo commit carrega um autor. Sem isso, daqui a seis meses ninguém sabe quem mexeu no quê.",
      "Configure seu nome e seu e-mail neste repositório antes do primeiro commit.",
    ],
    objectives: [
      'Defina seu nome com git config user.name "seu nome"',
      "Defina seu e-mail com git config user.email",
    ],
    hints: [
      "A forma é git config <chave> <valor>.",
      "As chaves são user.name e user.email.",
      'Exemplo: git config user.name "Ana Lima" e depois git config user.email ana@pulso.studio',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: { config: { "user.name": "", "user.email": "" } },
    },
    validate: (state) => {
      const config = state.machine.repo?.config ?? {};
      return sequence(
        [Boolean(config["user.name"]), "Falta configurar user.name."],
        [Boolean(config["user.email"]), "Falta configurar user.email."],
        [
          /.+@.+\..+/.test(config["user.email"] ?? ""),
          "O e-mail configurado não parece um e-mail válido.",
        ],
      );
    },
  },
  {
    id: "c1m3",
    slug: "o-primeiro-commit",
    chapter: 1,
    order: 3,
    title: "O primeiro commit",
    summary: "Prepare os arquivos e grave a primeira versão do projeto.",
    xp: 60,
    commands: ["git add", "git commit"],
    briefing: [
      "Git trabalha em duas etapas: você escolhe o que entra (add) e depois grava (commit).",
      "O que está preparado fica na área de stage; o commit transforma isso em um ponto do histórico ao qual você sempre pode voltar.",
      "Prepare os dois arquivos do projeto e grave o primeiro commit.",
    ],
    objectives: [
      "Prepare README.md e index.html com git add",
      'Grave o commit com git commit -m "mensagem"',
      "Deixe a árvore de trabalho limpa",
    ],
    hints: [
      "git add . prepara tudo que está na pasta atual.",
      'A mensagem vai entre aspas: git commit -m "estrutura inicial do site".',
      'Sequência completa: git add . e depois git commit -m "estrutura inicial do site".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: {},
    },
    validate: (state) =>
      sequence(
        [commits(state.machine).length >= 1, "Ainda não existe nenhum commit neste repositório."],
        [isTracked(state.machine, "README.md"), "O README.md não entrou no commit."],
        [isTracked(state.machine, "index.html"), "O index.html não entrou no commit."],
        [isClean(state.machine), "Sobrou mudança pendente: prepare e comite tudo."],
        [
          lastMessage(state.machine).trim().length >= 5,
          "A mensagem do commit está curta demais para explicar a mudança.",
        ],
      ),
  },
  {
    id: "c1m4",
    slug: "ler-o-historico",
    chapter: 1,
    order: 4,
    title: "Ler o histórico",
    summary: "Some um commit novo e leia a linha do tempo do projeto.",
    xp: 60,
    commands: ["git log"],
    briefing: [
      "O histórico só vale se você souber lê-lo.",
      "Crie o arquivo de estilo do site, grave um commit e depois leia a linha do tempo.",
    ],
    objectives: [
      "Crie o arquivo estilo.css com algum conteúdo",
      "Grave um commit com esse arquivo",
      "Leia o histórico com git log --oneline",
    ],
    hints: [
      "Use edit estilo.css para abrir o editor, ou echo para escrever direto.",
      "Depois de criar, é a dupla de sempre: git add e git commit -m.",
      "git log --oneline mostra um commit por linha, com o hash curto.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX },
      repo: { commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } }] },
    },
    validate: (state) =>
      sequence(
        [Boolean(fileOf(state.machine, "estilo.css")), "O arquivo estilo.css ainda não existe."],
        [isTracked(state.machine, "estilo.css"), "O estilo.css existe, mas não está sendo versionado."],
        [commits(state.machine).length >= 2, "Falta gravar o commit com o novo arquivo."],
        [usedCommand(state, /^git\s+log/), "Leia a linha do tempo com git log --oneline."],
      ),
  },
  {
    id: "c2m1",
    slug: "revisar-antes-de-commitar",
    chapter: 2,
    order: 1,
    title: "Revisar antes de commitar",
    summary: "Use o diff para conferir a mudança antes de gravá-la.",
    xp: 70,
    commands: ["git diff", "git diff --staged"],
    briefing: [
      "Commit que ninguém revisou é bug que ninguém viu chegar.",
      "O título do site está errado: trocaram o nome do estúdio. Corrija o index.html, confira a mudança com git diff e só então grave.",
    ],
    objectives: [
      "Troque Pulsos por Pulso no index.html",
      "Confira a mudança com git diff antes de preparar",
      "Prepare e grave o commit da correção",
    ],
    hints: [
      "edit index.html abre o editor do terminal.",
      "git diff mostra o que mudou na pasta e ainda não foi preparado; git diff --staged mostra o que já está no stage.",
      'Depois de corrigir: git diff, git add index.html, git commit -m "corrige nome do estudio no titulo".',
    ],
    seed: {
      cwd: "/pulso",
      files: {
        "README.md": README,
        "index.html": "<h1>Pulsos</h1>\n<p>Em construcao.</p>",
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": "<h1>Pulsos</h1>\n<p>Em construcao.</p>" } },
          { message: "adiciona folha de estilo", files: { "estilo.css": ESTILO } },
        ],
      },
    },
    validate: (state) => {
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      return sequence(
        [conteudo.includes("<h1>Pulso</h1>"), "O título do index.html ainda não está como <h1>Pulso</h1>."],
        [usedCommand(state, /^git\s+diff/), "Confira a mudança com git diff antes de commitar."],
        [commits(state.machine).length >= 3, "A correção ainda não virou commit."],
        [isClean(state.machine), "Ficou mudança pendente fora do commit."],
      );
    },
  },
  {
    id: "c2m2",
    slug: "o-que-nao-entra-no-repositorio",
    chapter: 2,
    order: 2,
    title: "O que não entra no repositório",
    summary: "Mantenha log e dependências fora do histórico com .gitignore.",
    xp: 70,
    commands: [".gitignore"],
    briefing: [
      "Alguém rodou o projeto e a pasta encheu de arquivo gerado: log de execução e dependências instaladas.",
      "Isso não pode entrar no repositório. Crie um .gitignore que descarte esses arquivos e comite só o que importa.",
    ],
    objectives: [
      "Crie um .gitignore que ignore arquivos .log e a pasta node_modules",
      "Prepare tudo com git add .",
      "Grave o commit sem levar junto os arquivos ignorados",
    ],
    hints: [
      'Uma linha por regra. Para extensões: *.log. Para pastas: node_modules/.',
      'Você pode escrever direto: echo "*.log" > .gitignore e depois echo "node_modules/" >> .gitignore.',
      "Depois do .gitignore pronto, git add . e git commit normalmente. Confira com git status que os ignorados sumiram.",
    ],
    seed: {
      cwd: "/pulso",
      files: {
        "README.md": README,
        "index.html": INDEX,
        "estilo.css": ESTILO,
        "servidor.log": "iniciado em 09:12\nrequisicao /\n",
        "node_modules/pacote.js": "module.exports = {};",
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) => {
      const ignore = fileOf(state.machine, ".gitignore") ?? "";
      return sequence(
        [ignore.trim().length > 0, "O arquivo .gitignore ainda não existe ou está vazio."],
        [/\*\.log|servidor\.log/.test(ignore), "O .gitignore não cobre os arquivos .log."],
        [/node_modules/.test(ignore), "O .gitignore não cobre a pasta node_modules."],
        [isTracked(state.machine, ".gitignore"), "Falta versionar o próprio .gitignore."],
        [!isTracked(state.machine, "servidor.log"), "O servidor.log entrou no repositório sem querer."],
        [!isTracked(state.machine, "node_modules/pacote.js"), "A pasta node_modules entrou no repositório."],
        [commits(state.machine).length >= 2, "Falta gravar o commit com o .gitignore."],
      );
    },
  },
  {
    id: "c2m3",
    slug: "desfazer-sem-medo",
    chapter: 2,
    order: 3,
    title: "Desfazer sem medo",
    summary: "Volte um arquivo bagunçado e tire do stage o que não deveria estar lá.",
    xp: 80,
    commands: ["git restore", "git restore --staged"],
    briefing: [
      "Duas coisas saíram do lugar: o estilo.css foi sobrescrito por um teste e o rascunho.txt foi preparado por engano.",
      "Nada disso virou commit ainda, então dá para voltar atrás sem reescrever a história.",
    ],
    objectives: [
      "Tire o rascunho.txt da área de stage",
      "Devolva o estilo.css ao conteúdo do último commit",
      "Deixe o repositório sem mudanças preparadas",
    ],
    hints: [
      "git restore --staged <arquivo> tira do stage sem apagar o arquivo.",
      "git restore <arquivo> devolve o conteúdo que está no último commit.",
      "São dois comandos: git restore --staged rascunho.txt e git restore estilo.css.",
    ],
    seed: {
      cwd: "/pulso",
      files: {
        "README.md": README,
        "index.html": INDEX,
        "estilo.css": "body { background: red; }",
        "rascunho.txt": "ideias soltas",
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        staged: ["rascunho.txt"],
      },
    },
    validate: (state) =>
      sequence(
        [!isTracked(state.machine, "rascunho.txt"), "O rascunho.txt continua na área de stage."],
        [fileOf(state.machine, "estilo.css") === ESTILO, "O estilo.css ainda não voltou ao conteúdo do último commit."],
        [Boolean(fileOf(state.machine, "rascunho.txt")), "O rascunho.txt era para sair do stage, não ser apagado."],
        [commits(state.machine).length === 1, "Não era para criar commit nesta missão."],
      ),
  },
  {
    id: "c2m4",
    slug: "corrigir-o-ultimo-commit",
    chapter: 2,
    order: 4,
    title: "Corrigir o último commit",
    summary: "Conserte a mensagem do commit que acabou de sair errado.",
    xp: 80,
    commands: ["git commit --amend"],
    briefing: [
      "O último commit foi gravado com a mensagem asdf. Ninguém vai entender isso daqui a um mês.",
      "O commit ainda não saiu da sua máquina, então pode ser reescrito.",
    ],
    objectives: [
      "Reescreva a mensagem do último commit para algo descritivo",
      "Mantenha a quantidade de commits do histórico",
    ],
    hints: [
      "O comando que refaz o último commit é git commit --amend.",
      'Você pode passar a mensagem nova direto: git commit --amend -m "...".',
      'Exemplo: git commit --amend -m "ajusta cores do cabecalho".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [
          { message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX } },
          { message: "asdf", files: { "estilo.css": ESTILO } },
        ],
      },
    },
    validate: (state) => {
      const mensagem = lastMessage(state.machine).trim();
      return sequence(
        [mensagem !== "asdf", "A mensagem do último commit continua sendo asdf."],
        [mensagem.length >= 10, "A mensagem nova precisa explicar a mudança."],
        [commits(state.machine).length === 2, "O histórico deveria continuar com dois commits."],
        [isTracked(state.machine, "estilo.css"), "O estilo.css precisa continuar no commit."],
      );
    },
  },
  {
    id: "c3m1",
    slug: "abrir-uma-branch",
    chapter: 3,
    order: 1,
    title: "Abrir uma branch",
    summary: "Isole uma mudança em uma linha de trabalho separada.",
    xp: 90,
    commands: ["git branch", "git switch -c"],
    briefing: [
      "Pediram um rodapé novo no site, mas a main precisa continuar publicável enquanto você trabalha.",
      "Abra uma branch, faça a mudança lá dentro e grave o commit sem tocar na main.",
    ],
    objectives: [
      "Crie e entre na branch rodape",
      "Adicione um rodapé ao index.html",
      "Grave o commit dentro da branch rodape",
    ],
    hints: [
      "git switch -c <nome> cria a branch e já entra nela.",
      "Confira onde você está com git branch: a branch atual aparece com asterisco.",
      'Depois de editar o index.html: git add index.html e git commit -m "adiciona rodape".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      return sequence(
        [Boolean(repo?.branches["rodape"]), "A branch rodape ainda não existe."],
        [branchOf(state.machine) === "rodape", "Você precisa estar na branch rodape."],
        [/footer|rodape/i.test(conteudo), "O index.html ainda não tem rodapé."],
        [allCommits(state.machine).length >= 2, "A mudança ainda não virou commit."],
        [
          repo?.branches["rodape"] !== repo?.branches["main"],
          "O commit precisa ficar na branch rodape, não na main.",
        ],
      );
    },
  },
  {
    id: "c3m2",
    slug: "juntar-o-trabalho",
    chapter: 3,
    order: 2,
    title: "Juntar o trabalho",
    summary: "Traga a branch pronta de volta para a main.",
    xp: 90,
    commands: ["git merge"],
    briefing: [
      "O rodapé foi aprovado. Agora ele precisa entrar na main.",
      "Volte para a main e junte a branch. Como a main não andou, o git resolve isso no modo mais simples possível.",
    ],
    objectives: [
      "Volte para a branch main",
      "Junte a branch rodape na main",
      "Confirme que o rodapé está no arquivo da main",
    ],
    hints: [
      "git switch main leva você de volta.",
      "O merge sempre roda a partir da branch que vai receber: git merge rodape.",
      "Depois confira com cat index.html e git log --oneline.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        branches: [
          {
            name: "rodape",
            commits: [
              {
                message: "adiciona rodape",
                files: { "index.html": `${INDEX}\n<footer>Pulso 2026</footer>` },
              },
            ],
          },
        ],
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      return sequence(
        [branchOf(state.machine) === "main", "Volte para a branch main antes de juntar."],
        [
          repo?.branches["main"] === repo?.branches["rodape"],
          "A main ainda não recebeu os commits da branch rodape.",
        ],
        [/footer/i.test(fileOf(state.machine, "index.html") ?? ""), "O rodapé não apareceu no arquivo da main."],
      );
    },
  },
  {
    id: "c3m3",
    slug: "resolver-um-conflito",
    chapter: 3,
    order: 3,
    title: "Resolver um conflito",
    summary: "Duas branches mudaram a mesma linha. Decida como fica.",
    xp: 120,
    commands: ["git merge", "git add", "git commit"],
    briefing: [
      "Você e o Rafa mexeram no mesmo título do site, cada um na sua branch.",
      "O git não tem como adivinhar qual versão vale: ele marca o conflito no arquivo e espera uma decisão sua.",
      "Junte a branch titulo na main, escolha o texto final e feche o merge.",
    ],
    objectives: [
      "Rode o merge da branch titulo na main",
      "Edite o index.html deixando um título só, sem marcadores de conflito",
      "Prepare o arquivo resolvido e feche o merge com um commit",
    ],
    hints: [
      "Comece com git merge titulo. O git vai avisar do conflito e marcar o arquivo.",
      "Abra com edit index.html: apague as linhas <<<<<<<, ======= e >>>>>>> e deixe só o título que vale.",
      'Depois de resolver: git add index.html e git commit -m "resolve conflito do titulo".',
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": "<h1>Pulso ao vivo</h1>\n<p>Em construcao.</p>", "estilo.css": ESTILO },
      repo: {
        commits: [
          {
            message: "estrutura inicial do site",
            files: { "README.md": README, "index.html": "<h1>Pulso</h1>\n<p>Em construcao.</p>", "estilo.css": ESTILO },
          },
        ],
        branches: [
          {
            name: "titulo",
            commits: [
              {
                message: "usa nome completo no titulo",
                files: { "index.html": "<h1>Pulso Estudio</h1>\n<p>Em construcao.</p>" },
              },
            ],
          },
          {
            name: "main",
            from: "main",
            commits: [
              {
                message: "destaca shows no titulo",
                files: { "index.html": "<h1>Pulso ao vivo</h1>\n<p>Em construcao.</p>" },
              },
            ],
          },
        ],
      },
    },
    validate: (state) => {
      const conteudo = fileOf(state.machine, "index.html") ?? "";
      const repo = state.machine.repo;
      const head = repo ? repo.commits[repo.branches["main"] ?? ""] : null;
      return sequence(
        [usedCommand(state, /^git\s+merge/), "Comece rodando git merge titulo."],
        [!/<<<<<<<|=======|>>>>>>>/.test(conteudo), "O index.html ainda tem marcadores de conflito."],
        [/<h1>.+<\/h1>/.test(conteudo), "O index.html precisa ter um título."],
        [repo?.merge === null, "O merge ainda está aberto: prepare o arquivo e grave o commit."],
        [(head?.parents.length ?? 0) === 2, "Falta o commit que fecha o merge."],
      );
    },
  },
  {
    id: "c4m1",
    slug: "conectar-o-remoto",
    chapter: 4,
    order: 1,
    title: "Conectar o remoto",
    summary: "Aponte o repositório local para o servidor do time.",
    xp: 90,
    commands: ["git remote add", "git remote -v"],
    briefing: [
      "Enquanto o repositório existir só na sua máquina, o trabalho do time está a um café derramado de sumir.",
      "O servidor do estúdio já tem um repositório vazio esperando. Conecte o seu a ele com o nome origin.",
    ],
    objectives: [
      "Adicione o remoto origin apontando para https://git.pulso.studio/site.git",
      "Confirme a conexão com git remote -v",
    ],
    hints: [
      "A forma é git remote add <nome> <url>.",
      "O nome padrão do remoto principal é origin.",
      "git remote add origin https://git.pulso.studio/site.git e depois git remote -v.",
    ],
    seed: {
      cwd: "/pulso",
      files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
      },
    },
    validate: (state) =>
      sequence(
        [Boolean(state.machine.repo?.remote), "Nenhum remoto foi adicionado ainda."],
        [state.machine.repo?.remote?.name === "origin", "O remoto precisa se chamar origin."],
        [
          (state.machine.repo?.remote?.url ?? "").includes("git.pulso.studio/site.git"),
          "A URL do remoto não é a do repositório do estúdio.",
        ],
        [usedCommand(state, /^git\s+remote\s+-v/), "Confirme a conexão com git remote -v."],
      ),
  },
  {
    id: "c4m2",
    slug: "publicar-o-trabalho",
    chapter: 4,
    order: 2,
    title: "Publicar o trabalho",
    summary: "Envie os commits locais para o repositório do time.",
    xp: 110,
    commands: ["git push"],
    briefing: [
      "O remoto está conectado, mas ainda não recebeu nada.",
      "Grave o ajuste que ficou pendente no README e publique a branch main no origin.",
    ],
    objectives: [
      "Comite a mudança pendente do README.md",
      "Publique a branch main no origin com git push -u origin main",
    ],
    hints: [
      "Comece por git status para ver o que está pendente.",
      "Prepare e comite normalmente antes de publicar.",
      "Na primeira vez, o push leva -u: git push -u origin main.",
    ],
    seed: {
      cwd: "/pulso",
      files: {
        "README.md": `${README}\n\n## Como rodar\n\nAbra o index.html no navegador.`,
        "index.html": INDEX,
        "estilo.css": ESTILO,
      },
      repo: {
        commits: [{ message: "estrutura inicial do site", files: { "README.md": README, "index.html": INDEX, "estilo.css": ESTILO } }],
        remote: { name: "origin", url: "https://git.pulso.studio/site.git" },
      },
    },
    validate: (state) => {
      const repo = state.machine.repo;
      return sequence(
        [isClean(state.machine), "Ainda há mudança pendente: comite antes de publicar."],
        [commits(state.machine).length >= 2, "A mudança do README ainda não virou commit."],
        [
          Boolean(repo?.remote?.branches["main"]),
          "O remoto ainda não recebeu a branch main. Use git push -u origin main.",
        ],
        [
          repo?.remote?.branches["main"] === repo?.branches["main"],
          "O remoto está desatualizado: publique os commits mais recentes.",
        ],
      );
    },
  },
];

export const missionBySlug = (slug: string): Mission | undefined =>
  missions.find((mission) => mission.slug === slug);

export const missionsOfChapter = (chapter: number): Mission[] =>
  missions.filter((mission) => mission.chapter === chapter).sort((a, b) => a.order - b.order);

export const totalXp = missions.reduce((sum, mission) => sum + mission.xp, 0);
