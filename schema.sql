CREATE TABLE IF NOT EXISTS checkins (
  id              SERIAL PRIMARY KEY,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  data            DATE NOT NULL,
  turno           TEXT NOT NULL,
  operador        TEXT NOT NULL,
  empilhadeira    TEXT NOT NULL,
  itens           JSONB NOT NULL,        -- { "pneus": "ok" | "nok" | "na", ... }
  irregularidade  BOOLEAN NOT NULL,
  descricao       TEXT,
  resultado       TEXT NOT NULL CHECK (resultado IN ('APROVADA','REPROVADA')),
  observacoes     TEXT,
  assinatura      TEXT,                  -- imagem PNG (data URL)
  inspecao_em     TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS checkins_criado_idx ON checkins (criado_em DESC);
CREATE INDEX IF NOT EXISTS checkins_emp_idx ON checkins (empilhadeira);
