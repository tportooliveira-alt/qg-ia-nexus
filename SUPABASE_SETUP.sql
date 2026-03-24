-- ============================================================
-- QG IA Nexus — Setup Supabase (PostgreSQL)
-- Rodar no Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabela de memórias dos agentes (aprendizado persistente)
CREATE TABLE IF NOT EXISTS agent_memories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente      TEXT NOT NULL DEFAULT 'sistema',
  categoria   TEXT NOT NULL DEFAULT 'geral',
  conteudo    TEXT,
  projeto     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_agente    ON agent_memories (agente);
CREATE INDEX IF NOT EXISTS idx_memories_categoria ON agent_memories (categoria);
CREATE INDEX IF NOT EXISTS idx_memories_projeto   ON agent_memories (projeto);
CREATE INDEX IF NOT EXISTS idx_memories_created   ON agent_memories (created_at DESC);

-- Tabela de audit logs (trilha de auditoria do sistema)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente     TEXT NOT NULL DEFAULT 'sistema',
  acao       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'ok',
  detalhe    TEXT,
  origem     TEXT DEFAULT 'api',
  alvo       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_agente  ON audit_logs (agente);
CREATE INDEX IF NOT EXISTS idx_audit_status  ON audit_logs (status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

-- RLS: desabilitar (acesso via service key — backend only)
ALTER TABLE agent_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     DISABLE ROW LEVEL SECURITY;

-- Verificação
SELECT
  'agent_memories' AS tabela, COUNT(*) AS registros FROM agent_memories
UNION ALL
SELECT
  'audit_logs',    COUNT(*) FROM audit_logs;
