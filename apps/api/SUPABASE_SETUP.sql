-- ============================================================================
-- SUPABASE_SETUP.sql — QG-IA-Nexus: Schema completo para Supabase PostgreSQL
-- Execute este script no SQL Editor do painel Supabase Dashboard
-- ============================================================================

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente TEXT NOT NULL DEFAULT 'sistema',
  acao TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'ok',
  detalhe TEXT,
  origem TEXT DEFAULT 'api',
  alvo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_agente ON audit_logs (agente);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs (status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);

-- Agent Memories (Nexus + Fábrica AgentMemory unificada)
-- Campos do Nexus: agente, categoria, conteudo, projeto
-- Campos do AgentMemory (Fábrica): agente_id, usuario_id, tipo_memoria, metadata, relevancia
CREATE TABLE IF NOT EXISTS agent_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  agente TEXT DEFAULT 'sistema',
  agente_id TEXT,
  categoria TEXT DEFAULT 'geral',
  conteudo TEXT,
  projeto TEXT,
  projeto_id TEXT,
  usuario_id TEXT,
  tipo_memoria TEXT DEFAULT 'execucao',
  metadata JSONB,
  relevancia NUMERIC(3,2) DEFAULT 1.0,
  vezes_usada INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mem_agente ON agent_memories (agente);
CREATE INDEX IF NOT EXISTS idx_mem_agente_id ON agent_memories (agente_id);
CREATE INDEX IF NOT EXISTS idx_mem_projeto ON agent_memories (projeto);
CREATE INDEX IF NOT EXISTS idx_mem_usuario ON agent_memories (usuario_id);
CREATE INDEX IF NOT EXISTS idx_mem_tipo ON agent_memories (tipo_memoria);

-- Transações Financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id SERIAL PRIMARY KEY,
  projeto TEXT,
  tipo TEXT CHECK (tipo IN ('RECEITA', 'DESPESA')),
  valor NUMERIC(10, 2),
  descricao TEXT,
  data_registro TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABELAS FÁBRICA DE IA (Epic 2)
-- ============================================================================

-- Projetos
CREATE TABLE IF NOT EXISTS projetos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  "desc" TEXT,
  emoji TEXT,
  cor TEXT,
  criado TIMESTAMPTZ DEFAULT now()
);

-- Ideias
CREATE TABLE IF NOT EXISTS ideias (
  id TEXT PRIMARY KEY,
  projeto_id TEXT,
  tipo TEXT,
  texto_original TEXT,
  titulo TEXT,
  descricao TEXT,
  detalhes JSONB,
  prioridade TEXT,
  tags JSONB,
  proximos_passos JSONB,
  conteudo JSONB,
  spec_produto JSONB,
  spec_arquitetura JSONB,
  spec_tarefas JSONB,
  criado TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideias_projeto ON ideias (projeto_id);

-- Agentes (definições)
CREATE TABLE IF NOT EXISTS agentes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  "desc" TEXT,
  system TEXT,
  emoji TEXT
);

-- Skills Hub
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  "desc" TEXT,
  prompt TEXT
);

-- Memórias de contexto (Fábrica)
CREATE TABLE IF NOT EXISTS memorias (
  id TEXT PRIMARY KEY,
  agente TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  projeto_rel TEXT,
  categoria TEXT,
  criado TIMESTAMPTZ DEFAULT now()
);

-- Projetos da Fábrica (resultados dos pipelines)
CREATE TABLE IF NOT EXISTS projetos_fabrica (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  nome TEXT,
  tipo TEXT,
  tipo_entregavel TEXT,
  ideia_original TEXT,
  status TEXT,
  score_final INT,
  iteracoes INT,
  aprovado BOOLEAN DEFAULT false,
  plano JSONB,
  arquitetura JSONB,
  codigo_sql TEXT,
  codigo_app TEXT,
  codigo_ui TEXT,
  planilha JSONB,
  documento JSONB,
  design_system JSONB,
  auditoria JSONB,
  tempo_total_ms INT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fabrica_usuario ON projetos_fabrica (usuario_id);
CREATE INDEX IF NOT EXISTS idx_fabrica_status ON projetos_fabrica (status);

-- Ideias Logs (legado)
CREATE TABLE IF NOT EXISTS ideias_logs (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  agente TEXT,
  status TEXT DEFAULT 'capturada',
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Row Level Security (RLS) — Desabilitado para service_role key
-- ============================================================================
-- Para segurança em produção com anon key, habilite RLS e crie policies.
-- Com service_role key (nosso caso), RLS é bypassed automaticamente.
