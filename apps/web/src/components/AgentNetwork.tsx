/**
 * AgentNetwork — Blueprint completo do QG IA
 * Grafo n8n detalhado: providers, agentes, sub-agentes, projetos, infra
 * Com animações contínuas, pulsação e fluxo de dados em tempo real
 */

import { useState, useEffect, useCallback } from 'react'

// ─── Tipos ─────────────────────────────────────────────────────────────────
type TipoNo = 'orquestrador' | 'fabrica' | 'especialista' | 'suporte' | 'provider' | 'infra' | 'projeto'
type StatusNo = 'ativo' | 'idle' | 'trabalhando' | 'offline'

interface No {
  id: string; label: string; icone: string; cor: string
  x: number; y: number; tipo: TipoNo
  descricao?: string; providers?: string[]
  status?: StatusNo; projeto?: string
}

interface Aresta {
  de: string; para: string; label?: string
  tipo?: 'principal' | 'fabrica' | 'suporte' | 'provider' | 'infra'
  dashed?: boolean; bidirecional?: boolean
}

// ─── Nós do grafo ──────────────────────────────────────────────────────────
// ViewBox: 1500 × 780
const NOS: No[] = [
  // ── PROVEDORES DE IA (coluna esquerda) ──
  { id: 'gem',   label: 'Gemini',    icone: '◈', cor: '#4285F4', x: 95,  y: 130, tipo: 'provider', descricao: 'Gemini 2.0 Flash — principal', status: 'ativo' },
  { id: 'groq',  label: 'Groq',      icone: '⚡', cor: '#F97316', x: 95,  y: 220, tipo: 'provider', descricao: 'llama-3.3-70b-versatile', status: 'ativo' },
  { id: 'crbr',  label: 'Cerebras',  icone: '🧠', cor: '#A78BFA', x: 95,  y: 310, tipo: 'provider', descricao: 'llama-3.3-70b — ultra-rápido', status: 'idle' },
  { id: 'sbvn',  label: 'SambaNova', icone: '🌊', cor: '#06B6D4', x: 95,  y: 400, tipo: 'provider', descricao: 'Meta-Llama-3.3-70B', status: 'idle' },
  { id: 'xai',   label: 'xAI',       icone: '✕',  cor: '#D1D5DB', x: 95,  y: 490, tipo: 'provider', descricao: 'Grok-3-mini', status: 'idle' },
  { id: 'dsk',   label: 'DeepSeek',  icone: '⊘',  cor: '#6B7280', x: 95,  y: 580, tipo: 'provider', descricao: 'Sem crédito (402)', status: 'offline' },

  // ── ORQUESTRADOR CENTRAL ──
  { id: 'nexus', label: 'NEXUS CLAW', icone: '🦂', cor: '#1EE0E0', x: 560, y: 90, tipo: 'orquestrador',
    descricao: 'CEO Supremo — orquestra todos os agentes, projetos e providers',
    providers: ['Gemini','Groq','Cerebras','SambaNova'], status: 'ativo' },

  // ── AGENTES ESPECIALISTAS ──
  { id: 'scout',     label: 'Scout',          icone: '🔎', cor: '#F59E0B', x: 310, y: 220, tipo: 'especialista', descricao: 'Pesquisa na web + coleta de dados', status: 'idle' },
  { id: 'gemcode',   label: 'GeminiCode',     icone: '💠', cor: '#A78BFA', x: 560, y: 220, tipo: 'especialista', descricao: 'Análise e revisão de código', status: 'idle' },
  { id: 'openclaw',  label: 'OpenClawBR',     icone: '🌐', cor: '#22D3EE', x: 800, y: 220, tipo: 'especialista', descricao: 'UI/UX e desenvolvimento web', status: 'idle' },

  // ── SERVIÇOS DE APRENDIZADO ──
  { id: 'evolution', label: 'Auto-Aprend.',   icone: '📚', cor: '#22C55E', x: 1010, y: 120, tipo: 'suporte', descricao: 'Ciclo de estudo a cada 6h → salva no Supabase', status: 'trabalhando' },
  { id: 'research',  label: 'Research',       icone: '🔬', cor: '#34D399', x: 1010, y: 240, tipo: 'suporte', descricao: 'Pesquisa autônoma — arXiv, web, síntese', status: 'idle' },
  { id: 'autocorr',  label: 'AutoCorreção',   icone: '🔄', cor: '#FCD34D', x: 1010, y: 360, tipo: 'suporte', descricao: 'Cron a cada 12h — analisa erros e corrige', status: 'idle' },

  // ── FÁBRICA DE IA (pipeline) ──
  { id: 'analista',   label: 'Analista',    icone: '📋', cor: '#EF4444', x: 200, y: 490, tipo: 'fabrica', descricao: 'Analisa requisitos e cria PRD' },
  { id: 'comandante', label: 'Comandante',  icone: '⚔️',  cor: '#F97316', x: 360, y: 490, tipo: 'fabrica', descricao: 'Define estratégia e divide tarefas' },
  { id: 'arquiteto',  label: 'Arquiteto',   icone: '🏗️',  cor: '#EAB308', x: 520, y: 490, tipo: 'fabrica', descricao: 'Projeta arquitetura técnica + DB' },
  { id: 'coder',      label: 'CoderChief',  icone: '💻', cor: '#84CC16', x: 680, y: 490, tipo: 'fabrica', descricao: 'Gera código + orquestra sub-agentes' },
  { id: 'auditor',    label: 'Auditor',     icone: '⚖️',  cor: '#22C55E', x: 840, y: 490, tipo: 'fabrica', descricao: 'Valida, testa e aprova o resultado' },

  // ── SUB-AGENTES DO CODER ──
  { id: 'sub1', label: 'Sub-Backend',  icone: '⚡', cor: '#6366F1', x: 580, y: 620, tipo: 'fabrica', descricao: 'APIs, lógica de negócio, integrações' },
  { id: 'sub2', label: 'Sub-Frontend', icone: '⚡', cor: '#6366F1', x: 700, y: 620, tipo: 'fabrica', descricao: 'React, componentes, rotas, UI' },
  { id: 'sub3', label: 'Sub-Infra',    icone: '⚡', cor: '#6366F1', x: 820, y: 620, tipo: 'fabrica', descricao: 'Banco de dados, Docker, deploy' },

  // ── PROJETOS ATIVOS ──
  { id: 'qgia',      label: 'QG IA Nexus',  icone: '🏰', cor: '#1EE0E0', x: 1180, y: 100,  tipo: 'projeto', descricao: 'Plataforma central — chat, fábrica, memória, whatsapp' },
  { id: 'agromacro', label: 'AgroMacro',    icone: '🐄', cor: '#4ADE80', x: 1320, y: 220,  tipo: 'projeto', descricao: 'PWA 27 módulos — rebanho, pasto, financeiro, IA consultora' },
  { id: 'gestcort',  label: 'GestCort',     icone: '🌾', cor: '#86EFAC', x: 1320, y: 380,  tipo: 'projeto', descricao: 'App gestão gado de corte — lotes, pasto, fluxo de caixa' },
  { id: 'frigogest', label: 'FrigoGest',    icone: '🥩', cor: '#FCA5A5', x: 1180, y: 490,  tipo: 'projeto', descricao: 'Frigorífico — 16 agentes IA em 5 tiers de automação' },

  // ── INFRAESTRUTURA ──
  { id: 'supabase',  label: 'Supabase',  icone: '🗄', cor: '#3ECF8E', x: 340, y: 690, tipo: 'infra', descricao: 'Banco primário — agent_memories + audit_logs (500MB free)' },
  { id: 'mysql',     label: 'MySQL',     icone: '🐬', cor: '#00758F', x: 520, y: 690, tipo: 'infra', descricao: 'Hostinger backup — async, não-bloqueante' },
  { id: 'whatsapp',  label: 'WhatsApp',  icone: '📱', cor: '#25D366', x: 700, y: 690, tipo: 'infra', descricao: 'Gateway WhatsApp via Baileys — aguardando QR', status: 'idle' },
  { id: 'hostinger', label: 'Hostinger', icone: '🌍', cor: '#FF6B35', x: 880, y: 690, tipo: 'infra', descricao: 'Servidor Node.js — porta 3000, SSL' },
]

// ─── Arestas ───────────────────────────────────────────────────────────────
const ARESTAS: Aresta[] = [
  // Providers → Nexus
  { de: 'gem',  para: 'nexus', tipo: 'provider' },
  { de: 'groq', para: 'nexus', tipo: 'provider' },
  { de: 'crbr', para: 'nexus', tipo: 'provider' },
  { de: 'sbvn', para: 'nexus', tipo: 'provider' },
  { de: 'xai',  para: 'nexus', tipo: 'provider' },
  { de: 'dsk',  para: 'nexus', tipo: 'provider', dashed: true },

  // Nexus → especialistas
  { de: 'nexus', para: 'scout',    label: 'pesquisa', tipo: 'suporte' },
  { de: 'nexus', para: 'gemcode',  label: 'código',   tipo: 'suporte' },
  { de: 'nexus', para: 'openclaw', label: 'web/UI',   tipo: 'suporte' },

  // Nexus → aprendizado
  { de: 'nexus',    para: 'evolution', label: 'aprende', tipo: 'suporte' },
  { de: 'nexus',    para: 'autocorr',  label: 'monitora', tipo: 'suporte' },
  { de: 'research', para: 'evolution', tipo: 'suporte' },
  { de: 'evolution', para: 'nexus',   label: 'memória', tipo: 'suporte', dashed: true, bidirecional: false },
  { de: 'autocorr',  para: 'nexus',   label: 'correção', tipo: 'suporte', dashed: true },

  // Nexus → projetos
  { de: 'nexus', para: 'qgia',      tipo: 'principal' },
  { de: 'nexus', para: 'agromacro', tipo: 'principal' },
  { de: 'nexus', para: 'gestcort',  tipo: 'principal' },
  { de: 'nexus', para: 'frigogest', tipo: 'principal' },

  // Nexus → Fábrica
  { de: 'nexus', para: 'analista', label: 'ideia', tipo: 'fabrica' },

  // Pipeline fábrica
  { de: 'analista',   para: 'comandante', tipo: 'fabrica' },
  { de: 'comandante', para: 'arquiteto',  tipo: 'fabrica' },
  { de: 'arquiteto',  para: 'coder',      tipo: 'fabrica' },
  { de: 'coder',      para: 'auditor',    tipo: 'fabrica' },
  { de: 'auditor',    para: 'coder',      label: 'revisão', tipo: 'fabrica', dashed: true },

  // CoderChief → sub-agentes
  { de: 'coder', para: 'sub1', tipo: 'fabrica' },
  { de: 'coder', para: 'sub2', tipo: 'fabrica' },
  { de: 'coder', para: 'sub3', tipo: 'fabrica' },

  // Fábrica entrega projetos
  { de: 'auditor', para: 'agromacro', tipo: 'fabrica' },
  { de: 'auditor', para: 'gestcort',  tipo: 'fabrica' },
  { de: 'auditor', para: 'frigogest', tipo: 'fabrica' },

  // → Infraestrutura
  { de: 'nexus',     para: 'supabase',  tipo: 'infra' },
  { de: 'evolution', para: 'supabase',  tipo: 'infra' },
  { de: 'nexus',     para: 'mysql',     tipo: 'infra', dashed: true },
  { de: 'nexus',     para: 'whatsapp',  tipo: 'infra' },
  { de: 'nexus',     para: 'hostinger', tipo: 'infra' },
]

// ─── Cores das arestas ─────────────────────────────────────────────────────
const ARESTA_COR: Record<string, string> = {
  fabrica:   '#F59E0B',
  suporte:   '#1EE0E0',
  principal: '#8B5CF6',
  provider:  '#4B5563',
  infra:     '#22C55E',
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function pontoNoBordo(a: No, b: No, raio: number): [number, number, number, number] {
  const dx = b.x - a.x, dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / len, ny = dy / len
  return [a.x + nx * raio, a.y + ny * raio, b.x - nx * raio, b.y - ny * raio]
}

function raioNo(tipo: TipoNo): number {
  if (tipo === 'orquestrador') return 38
  if (tipo === 'projeto') return 32
  if (tipo === 'provider') return 24
  return 26
}

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_COR: Record<string, string> = {
  ativo:       '#22C55E',
  trabalhando: '#F59E0B',
  idle:        '#4B5563',
  offline:     '#374151',
}

const STATUS_LABEL: Record<string, string> = {
  ativo:       '● ATIVO',
  trabalhando: '◉ PROCESS.',
  idle:        '○ IDLE',
  offline:     '✕ OFFLINE',
}

// ─── Componente principal ──────────────────────────────────────────────────
export function AgentNetwork() {
  const [selecionado, setSelecionado] = useState<No | null>(null)
  const [pulsando, setPulsando] = useState<Set<string>>(new Set(['nexus', 'gem', 'groq', 'evolution']))
  const [simulando, setSimulando] = useState(false)
  const [etapaAtiva, setEtapaAtiva] = useState<string | null>(null)
  const [particulas, setParticulas] = useState<Array<{ id: string; de: string; para: string; progresso: number }>>([])
  const [tempo, setTempo] = useState(0)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pulsação contínua — rotaciona entre nós ativos
  useEffect(() => {
    const nos_ativos = NOS.filter(n => n.status === 'ativo' || n.status === 'trabalhando').map(n => n.id)
    let idx = 0
    const timer = setInterval(() => {
      const grupo = new Set([
        'nexus',
        nos_ativos[idx % nos_ativos.length],
        nos_ativos[(idx + 1) % nos_ativos.length],
      ])
      setPulsando(grupo)
      idx++
    }, 1200)
    return () => clearInterval(timer)
  }, [])

  // Animação de partículas nas arestas ativas
  useEffect(() => {
    const timer = setInterval(() => {
      setTempo(t => t + 1)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  const simularPipeline = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const pipeline = ['nexus', 'analista', 'comandante', 'arquiteto', 'coder', 'sub1', 'sub2', 'sub3', 'auditor', 'gestcort']
    pipeline.forEach((id, i) => {
      setTimeout(() => {
        setEtapaAtiva(id)
        setPulsando(new Set([id, 'nexus']))
      }, i * 700)
    })
    setTimeout(() => {
      setEtapaAtiva(null)
      setSimulando(false)
      setPulsando(new Set(['nexus', 'gem', 'groq', 'evolution']))
    }, pipeline.length * 700 + 500)
  }, [simulando])

  const simularAprendizado = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const fluxo = ['nexus', 'research', 'evolution', 'supabase', 'nexus']
    fluxo.forEach((id, i) => {
      setTimeout(() => {
        setEtapaAtiva(id)
        setPulsando(new Set([id, 'supabase']))
      }, i * 800)
    })
    setTimeout(() => {
      setEtapaAtiva(null)
      setSimulando(false)
      setPulsando(new Set(['nexus', 'gem', 'groq', 'evolution']))
    }, fluxo.length * 800 + 500)
  }, [simulando])

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* CSS keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0%   { r: 4; opacity: 0.9; }
          50%  { r: 8; opacity: 0.4; }
          100% { r: 12; opacity: 0; }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes flow-dash {
          from { stroke-dashoffset: 40; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .agent-ativo circle.anel  { animation: pulse-ring 1.4s ease-out infinite; }
        .aresta-fluxo              { animation: flow-dash 1.2s linear infinite; }
        .status-blink              { animation: blink-dot 1.2s ease-in-out infinite; }
        .info-card                 { animation: fade-in 0.2s ease; }
      `}</style>

      {/* Barra de controles */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 14,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button
          onClick={simularPipeline} disabled={simulando}
          style={{
            padding: '7px 16px', background: simulando ? '#1F2937' : '#F59E0B',
            border: 'none', borderRadius: 7, color: simulando ? '#6B7280' : '#000',
            fontWeight: 700, fontSize: 12, cursor: simulando ? 'not-allowed' : 'pointer',
          }}
        >▶ Simular Pipeline</button>

        <button
          onClick={simularAprendizado} disabled={simulando}
          style={{
            padding: '7px 16px', background: simulando ? '#1F2937' : '#22C55E',
            border: 'none', borderRadius: 7, color: simulando ? '#6B7280' : '#000',
            fontWeight: 700, fontSize: 12, cursor: simulando ? 'not-allowed' : 'pointer',
          }}
        >📚 Simular Aprendizado</button>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#9CA3AF', marginLeft: 8, flexWrap: 'wrap' }}>
          {[
            { cor: '#4285F4', label: 'Providers' },
            { cor: '#1EE0E0', label: 'Orquestrador' },
            { cor: '#F59E0B', label: 'Fábrica' },
            { cor: '#8B5CF6', label: 'Projetos' },
            { cor: '#22C55E', label: 'Infra/Learn' },
          ].map(({ cor, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: cor, display: 'inline-block' }} />
              {label}
            </span>
          ))}
          <span style={{ color: '#6B7280' }}>● Clique num nó para detalhes</span>
        </div>
      </div>

      {/* Canvas do grafo */}
      <div style={{
        background: '#070B0F',
        border: '1px solid #1F2937',
        borderRadius: 12,
        overflow: 'auto',
      }}>
        <svg
          viewBox="0 0 1500 760"
          style={{ width: '100%', minHeight: 380, display: 'block' }}
          onClick={() => setSelecionado(null)}
        >
          <defs>
            {/* Gradiente de fundo */}
            <radialGradient id="bg-glow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#0F1A2A" />
              <stop offset="100%" stopColor="#070B0F" />
            </radialGradient>
            {/* Marcadores de seta */}
            {Object.entries(ARESTA_COR).map(([tipo, cor]) => (
              <marker key={tipo} id={`arr-${tipo}`} markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L0,5 L7,2.5 z" fill={cor} opacity="0.9" />
              </marker>
            ))}
            {/* Filtro de glow */}
            <filter id="glow-sm">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-lg">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Fundo */}
          <rect width="1500" height="760" fill="url(#bg-glow)" />

          {/* Grade sutil */}
          <defs>
            <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.6" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>
          <rect width="1500" height="760" fill="url(#grid-dots)" />

          {/* ── Zonas de fundo ────────────────────────────────────── */}
          {/* Providers */}
          <rect x="40" y="90" width="120" height="530" rx="10"
            fill="rgba(66,133,244,0.04)" stroke="rgba(66,133,244,0.12)" strokeWidth="1" strokeDasharray="5,4" />
          <text x="100" y="82" textAnchor="middle" fill="#4285F4" fontSize="9" fontWeight="700" opacity="0.7">PROVIDERS DE IA</text>

          {/* Fábrica */}
          <rect x="150" y="450" width="750" height="200" rx="10"
            fill="rgba(245,158,11,0.04)" stroke="rgba(245,158,11,0.14)" strokeWidth="1" strokeDasharray="6,4" />
          <text x="170" y="470" fill="#F59E0B" fontSize="9" fontWeight="700" opacity="0.7">FÁBRICA DE IA — PIPELINE MULTI-AGENTE</text>

          {/* Aprendizado */}
          <rect x="960" y="80" width="170" height="320" rx="10"
            fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.12)" strokeWidth="1" strokeDasharray="5,4" />
          <text x="1045" y="73" textAnchor="middle" fill="#22C55E" fontSize="9" fontWeight="700" opacity="0.7">APRENDIZADO</text>

          {/* Projetos */}
          <rect x="1130" y="60" width="340" height="470" rx="10"
            fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.14)" strokeWidth="1" strokeDasharray="6,4" />
          <text x="1300" y="52" textAnchor="middle" fill="#8B5CF6" fontSize="9" fontWeight="700" opacity="0.7">PROJETOS ATIVOS</text>

          {/* Infra */}
          <rect x="270" y="650" width="680" height="90" rx="10"
            fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.1)" strokeWidth="1" strokeDasharray="5,4" />
          <text x="290" y="643" fill="#22C55E" fontSize="9" fontWeight="700" opacity="0.6">INFRAESTRUTURA</text>

          {/* ── Arestas ───────────────────────────────────────────── */}
          {ARESTAS.map((a, i) => {
            const noA = NOS.find(n => n.id === a.de)
            const noB = NOS.find(n => n.id === a.para)
            if (!noA || !noB) return null
            const raioA = raioNo(noA.tipo), raioB = raioNo(noB.tipo)
            const [x1, y1, x2, y2] = pontoNoBordo(noA, noB, (raioA + raioB) / 2 + 2)
            const cor = ARESTA_COR[a.tipo || 'suporte']
            const ativo = etapaAtiva === a.de || etapaAtiva === a.para || pulsando.has(a.de)
            const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2

            return (
              <g key={i}>
                {/* Linha base (sempre visível, opaca) */}
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={cor + (ativo ? 'CC' : '30')}
                  strokeWidth={ativo ? 1.8 : 0.8}
                  strokeDasharray={a.dashed ? '6,4' : undefined}
                  markerEnd={`url(#arr-${a.tipo || 'suporte'})`}
                  style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
                />
                {/* Linha animada quando ativo */}
                {ativo && !a.dashed && (
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={cor}
                    strokeWidth={2}
                    strokeDasharray="8,16"
                    className="aresta-fluxo"
                    opacity="0.7"
                  />
                )}
                {/* Label da aresta */}
                {a.label && (
                  <g>
                    <rect
                      x={midX - a.label.length * 3 - 3} y={midY - 9}
                      width={a.label.length * 6 + 6} height={12}
                      rx="3" fill="#070B0F" opacity="0.85"
                    />
                    <text x={midX} y={midY} textAnchor="middle"
                      fill={cor} fontSize="8.5" fontWeight="600" opacity="0.9">
                      {a.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* ── Nós ──────────────────────────────────────────────── */}
          {NOS.map(no => {
            const ativo = etapaAtiva === no.id
            const pulsaAqui = pulsando.has(no.id)
            const sel = selecionado?.id === no.id
            const r = raioNo(no.tipo)
            const isOffline = no.status === 'offline'

            return (
              <g
                key={no.id}
                className={pulsaAqui || ativo ? 'agent-ativo' : ''}
                onClick={e => { e.stopPropagation(); setSelecionado(sel ? null : no) }}
                style={{ cursor: 'pointer' }}
              >
                {/* Anel de glow externo (ativo/selecionado) */}
                {(ativo || sel) && (
                  <circle cx={no.x} cy={no.y} r={r + 16}
                    fill={no.cor + '18'} stroke={no.cor + '44'} strokeWidth="1"
                    filter="url(#glow-lg)" />
                )}
                {/* Anel pulsante */}
                {pulsaAqui && !ativo && (
                  <circle cx={no.x} cy={no.y} r={r + 8}
                    fill="none" stroke={no.cor + '55'} strokeWidth="1"
                    className="anel" />
                )}

                {/* Círculo principal */}
                <circle
                  cx={no.x} cy={no.y} r={r}
                  fill={isOffline ? '#111' : sel ? no.cor + '25' : ativo ? no.cor + '20' : '#0D1117'}
                  stroke={isOffline ? '#374151' : (sel || ativo) ? no.cor : no.cor + '70'}
                  strokeWidth={sel ? 2.5 : ativo ? 2 : 1.5}
                  filter={ativo ? 'url(#glow-sm)' : undefined}
                  style={{ transition: 'all 0.25s' }}
                />

                {/* Ícone */}
                <text
                  x={no.x} y={no.y - (r > 30 ? 6 : 3)}
                  textAnchor="middle"
                  fontSize={no.tipo === 'orquestrador' ? 20 : r > 28 ? 15 : 13}
                  opacity={isOffline ? 0.35 : 1}
                >
                  {no.icone}
                </text>

                {/* Label */}
                <text
                  x={no.x} y={no.y + (no.tipo === 'orquestrador' ? 18 : r > 28 ? 16 : 13)}
                  textAnchor="middle"
                  fill={isOffline ? '#6B7280' : no.cor}
                  fontSize={no.tipo === 'orquestrador' ? 10 : no.tipo === 'provider' ? 8 : 8.5}
                  fontWeight="700"
                  opacity={isOffline ? 0.4 : 1}
                >
                  {no.label}
                </text>

                {/* Indicador de status (dot) */}
                {no.status && (
                  <circle
                    cx={no.x + r - 5} cy={no.y - r + 5} r="4"
                    fill={STATUS_COR[no.status]}
                    stroke="#070B0F" strokeWidth="1.5"
                    className={no.status === 'ativo' || no.status === 'trabalhando' ? 'status-blink' : ''}
                  />
                )}

                {/* Projeto badge (para nós de projeto) */}
                {no.tipo === 'projeto' && (
                  <rect
                    x={no.x - r} y={no.y + r + 2}
                    width={r * 2} height={13}
                    rx="4" fill={no.cor + '22'} stroke={no.cor + '55'} strokeWidth="0.8"
                  />
                )}
              </g>
            )
          })}

          {/* Título do grafo */}
          <text x="560" y="30" textAnchor="middle" fill="#1EE0E0" fontSize="13" fontWeight="800" opacity="0.8" letterSpacing="3">
            QG IA — MAPA DE AGENTES
          </text>
          <text x="560" y="44" textAnchor="middle" fill="#4B5563" fontSize="8.5" letterSpacing="2">
            NEXUS CLAW · FÁBRICA · PROJETOS · INFRAESTRUTURA
          </text>
        </svg>
      </div>

      {/* ── Painel de detalhes ──────────────────────────────────── */}
      {selecionado && (
        <div className="info-card" style={{
          marginTop: 12,
          background: selecionado.cor + '0E',
          border: `1px solid ${selecionado.cor}40`,
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>{selecionado.icone}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: selecionado.cor, fontSize: 15 }}>{selecionado.label}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 12,
                background: selecionado.cor + '18',
                border: `1px solid ${selecionado.cor}44`,
                color: selecionado.cor, fontWeight: 600, letterSpacing: 0.5,
              }}>{selecionado.tipo.toUpperCase()}</span>
              {selecionado.status && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 12,
                  background: STATUS_COR[selecionado.status] + '20',
                  border: `1px solid ${STATUS_COR[selecionado.status]}50`,
                  color: STATUS_COR[selecionado.status], fontWeight: 700,
                }}>
                  {STATUS_LABEL[selecionado.status]}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 5, lineHeight: 1.5 }}>
              {selecionado.descricao}
            </div>
            {selecionado.providers && selecionado.providers.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: '#6B7280' }}>Providers:</span>
                {selecionado.providers.map(p => (
                  <span key={p} style={{
                    fontSize: 10, padding: '2px 8px',
                    background: '#1EE0E011', border: '1px solid #1EE0E033',
                    borderRadius: 4, color: '#1EE0E0',
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setSelecionado(null)}
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 18, padding: 0 }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
