-- ============================================================
-- TABELAS QUE FALTAM NO SUPABASE — QG IA
-- Cole este SQL no Supabase > SQL Editor e clique em Run
-- ============================================================

-- 1) AUDIT LOGS — Registra toda ação de todos os agentes
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  agente      TEXT        NOT NULL DEFAULT 'sistema',
  acao        TEXT        NOT NULL,
  status      TEXT        DEFAULT 'ok',
  detalhe     TEXT,
  origem      TEXT        DEFAULT 'api',
  alvo        TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida por agente e data
CREATE INDEX IF NOT EXISTS idx_audit_logs_agente    ON audit_logs(agente);
CREATE INDEX IF NOT EXISTS idx_audit_logs_criado_em ON audit_logs(criado_em DESC);

-- 2) MEMORIAS — Usada pelo IdeaOrganizer (fabrica-ia-api) para memória dos agentes
CREATE TABLE IF NOT EXISTS memorias (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  agente      TEXT,
  conteudo    TEXT,
  categoria   TEXT        DEFAULT 'geral',
  projeto_rel TEXT,
  criado      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_memorias_agente      ON memorias(agente);
CREATE INDEX IF NOT EXISTS idx_memorias_projeto_rel ON memorias(projeto_rel);
CREATE INDEX IF NOT EXISTS idx_memorias_criado       ON memorias(criado DESC);

-- ✅ Pronto! Confirme que apareceu "Success" abaixo.
