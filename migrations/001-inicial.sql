CREATE TABLE IF NOT EXISTS jogadores (
  conta_id      TEXT PRIMARY KEY,
  apelido       TEXT NOT NULL,
  avatar        TEXT,
  xp            INTEGER NOT NULL DEFAULT 0,
  xp_extra      INTEGER NOT NULL DEFAULT 0,
  total_missoes INTEGER NOT NULL DEFAULT 0,
  sequencia     INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missoes_feitas (
  conta_id     TEXT NOT NULL REFERENCES jogadores(conta_id) ON DELETE CASCADE,
  missao_id    TEXT NOT NULL,
  revisoes     INTEGER NOT NULL DEFAULT 0,
  dicas        INTEGER NOT NULL DEFAULT 0,
  concluida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conta_id, missao_id)
);

CREATE TABLE IF NOT EXISTS atividade (
  conta_id TEXT NOT NULL REFERENCES jogadores(conta_id) ON DELETE CASCADE,
  dia      DATE NOT NULL,
  xp       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (conta_id, dia)
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id         TEXT PRIMARY KEY,
  autor_id   TEXT NOT NULL REFERENCES jogadores(conta_id) ON DELETE CASCADE,
  missao_id  TEXT NOT NULL,
  titulo     TEXT NOT NULL,
  descricao  TEXT NOT NULL DEFAULT '',
  arquivos   JSONB NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (autor_id, missao_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  pr_id       TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
  revisor_id  TEXT NOT NULL REFERENCES jogadores(conta_id) ON DELETE CASCADE,
  veredito    TEXT NOT NULL CHECK (veredito IN ('aprovado', 'mudancas')),
  resumo      TEXT NOT NULL,
  comentarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  nota        INTEGER CHECK (nota BETWEEN 1 AND 5),
  xp          INTEGER NOT NULL DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pr_id, revisor_id)
);

CREATE INDEX IF NOT EXISTS idx_jogadores_xp ON jogadores (xp DESC);
CREATE INDEX IF NOT EXISTS idx_atividade_conta_dia ON atividade (conta_id, dia);
CREATE INDEX IF NOT EXISTS idx_prs_criado ON pull_requests (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_pr ON reviews (pr_id);
