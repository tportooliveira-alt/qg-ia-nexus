/**
 * AgentNetwork — Estilo n8n exato
 * Cards retangulares, ícone colorido, setas bezier curvas, labels nas conexões
 * Atividade em tempo real (polling 3s) + feed de status abaixo
 */

import { useState, useEffect, useCallback } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────────────
interface CardNode {
  id: string
  label: string
  subtitle?: string
  icone: string
  cor: string
  x: number
  y: number
  w?: number
  h?: number
  portLeft?: boolean
  portRight?: boolean
  portTop?: boolean
  portBottom?: boolean
  descricao?: string
}

interface Conn {
  de: string
  para: string
  label?: string
  dashed?: boolean
  // porta de saída: 'right'|'bottom' / entrada: 'left'|'top'
  saida?: 'right' | 'bottom'
  entrada?: 'left' | 'top'
}

interface AtividadeAPI {
  agenteId: string
  status: string
  projeto: string | null
  descricao: string
  iaUsada: string | null
  desde: number
}

// ── Nós ────────────────────────────────────────────────────────────────────
const W = 168, H = 58, WP = 180, HP = 62  // padrão / principal

const CARDS: CardNode[] = [
  // ─── ENTRADA ───
  { id: 'chat',    label: 'Chat Web',    subtitle: 'Quando mensagem recebida', icone: '💬', cor: '#6366F1', x: 40,   y: 190, portRight: true,  descricao: 'Interface web — usuário envia mensagem' },
  { id: 'zap',     label: 'WhatsApp',    subtitle: 'Quando mensagem recebida', icone: '📱', cor: '#25D366', x: 40,   y: 280, portRight: true,  descricao: 'Gateway WhatsApp via Baileys' },

  // ─── ORQUESTRADOR ───
  { id: 'nexus',   label: 'NEXUS CLAW',  subtitle: 'Tools Agent · CEO Supremo',icone: '🦂', cor: '#1EE0E0', x: 310,  y: 215, w: WP, h: HP, portLeft: true, portRight: true, portBottom: true, descricao: 'Orquestra todos os agentes, projetos e providers' },

  // ─── RESPOSTA ───
  { id: 'resp',    label: 'Resposta SSE',subtitle: 'Stream token a token',      icone: '📡', cor: '#8B5CF6', x: 610,  y: 225, portLeft: true,  descricao: 'Envia resposta via Server-Sent Events' },

  // ─── MODEL (providers) ───
  { id: 'gem',     label: 'Gemini',      subtitle: '2.0 Flash · Principal',    icone: '◈',  cor: '#4285F4', x: 80,   y: 420, portLeft: true, portRight: true, descricao: 'Google Gemini — provider principal' },
  { id: 'groq',    label: 'Groq',        subtitle: 'llama-3.3-70b',            icone: '⚡', cor: '#F97316', x: 280,  y: 420, portLeft: true, portRight: true, descricao: 'Groq — backup ultra-rápido' },
  { id: 'crbr',    label: 'Cerebras',    subtitle: 'llama-3.3-70b',            icone: '🧠', cor: '#A78BFA', x: 480,  y: 420, portLeft: true, portRight: true, descricao: 'Cerebras — fallback' },
  { id: 'sbvn',    label: 'SambaNova',   subtitle: 'Meta-Llama-3.3-70B',       icone: '🌊', cor: '#06B6D4', x: 680,  y: 420, portLeft: true, portRight: true, descricao: 'SambaNova — último fallback' },

  // ─── MEMORY ───
  { id: 'supa',    label: 'Supabase',    subtitle: 'Memórias · Auditoria',     icone: '🗄', cor: '#3ECF8E', x: 380,  y: 570, portLeft: true, portTop: true,   descricao: 'Banco primário — 500MB free' },
  { id: 'mysql',   label: 'MySQL',       subtitle: 'Backup async · Hostinger', icone: '🐬', cor: '#00758F', x: 570,  y: 570, portLeft: true, portTop: true,   descricao: 'Backup não-bloqueante' },

  // ─── TOOLS ───
  { id: 'scout',   label: 'Scout',       subtitle: 'Pesquisa web',             icone: '🔎', cor: '#F59E0B', x: 840,  y: 140, portLeft: true, portBottom: true, descricao: 'Coleta dados e pesquisa na internet' },
  { id: 'research',label: 'Research',    subtitle: 'Ciclo 6h · arXiv/web',     icone: '🔬', cor: '#34D399', x: 840,  y: 240, portLeft: true, portBottom: true, descricao: 'Pesquisa autônoma + síntese' },
  { id: 'autocorr',label: 'AutoCorreção',subtitle: 'Ciclo 12h · erros',        icone: '🔄', cor: '#FCD34D', x: 840,  y: 340, portLeft: true, portBottom: true, descricao: 'Analisa logs e corrige automaticamente' },
  { id: 'fabrica', label: 'Fábrica de IA',subtitle:'Pipeline multi-agente',    icone: '🏭', cor: '#EF4444', x: 840,  y: 440, portLeft: true, portBottom: true, descricao: 'Gera apps completos com pipeline de 5 agentes' },

  // ─── PIPELINE FÁBRICA ───
  { id: 'analista',   label: 'Analista',   subtitle: 'Requisitos · PRD',     icone: '📋', cor: '#EF4444', x: 680,  y: 640, portLeft: true, portRight: true,  descricao: 'Analisa a ideia e cria documento de requisitos' },
  { id: 'comandante', label: 'Comandante', subtitle: 'Estratégia · Tarefas', icone: '⚔️',  cor: '#F97316', x: 880,  y: 640, portLeft: true, portRight: true,  descricao: 'Define estratégia e divide em tarefas' },
  { id: 'arquiteto',  label: 'Arquiteto',  subtitle: 'Arquitetura · DB',     icone: '🏗️',  cor: '#EAB308', x: 1080, y: 640, portLeft: true, portRight: true,  descricao: 'Projeta a arquitetura técnica completa' },
  { id: 'coder',      label: 'CoderChief', subtitle: 'Código · Sub-agentes', icone: '💻', cor: '#84CC16', x: 1280, y: 640, portLeft: true, portRight: true, portBottom: true, descricao: 'Gera código e coordena sub-agentes' },
  { id: 'auditor',    label: 'Auditor',    subtitle: 'Valida · Aprova',      icone: '⚖️',  cor: '#22C55E', x: 1480, y: 640, portLeft: true,                   descricao: 'Testa e aprova o resultado final' },
  { id: 'sub1',       label: 'Sub-Backend',subtitle: 'APIs · Lógica',        icone: '⚡', cor: '#6366F1', x: 1180, y: 760, portTop: true,                    descricao: 'Sub-agente: backend e integrações' },
  { id: 'sub2',       label: 'Sub-Frontend',subtitle:'React · UI',           icone: '⚡', cor: '#6366F1', x: 1350, y: 760, portTop: true,                    descricao: 'Sub-agente: interface e componentes' },
  { id: 'sub3',       label: 'Sub-Infra',  subtitle: 'DB · Docker · Deploy', icone: '⚡', cor: '#6366F1', x: 1520, y: 760, portTop: true,                    descricao: 'Sub-agente: infraestrutura e deploy' },

  // ─── PROJETOS ───
  { id: 'qgia',      label: 'QG IA Nexus', subtitle: 'Plataforma central',    icone: '🏰', cor: '#1EE0E0', x: 1180, y: 130, portLeft: true, descricao: 'Chat + Fábrica + Memória + WhatsApp' },
  { id: 'agromacro', label: 'AgroMacro',   subtitle: 'PWA 27 módulos',        icone: '🐄', cor: '#4ADE80', x: 1180, y: 240, portLeft: true, descricao: 'Gestão de fazenda completa' },
  { id: 'gestcort',  label: 'GestCort',    subtitle: 'Gado de corte',         icone: '🌾', cor: '#86EFAC', x: 1180, y: 350, portLeft: true, descricao: 'App gestão pecuária + financeiro' },
  { id: 'frigogest', label: 'FrigoGest',   subtitle: '16 agentes · 5 tiers',  icone: '🥩', cor: '#FCA5A5', x: 1180, y: 460, portLeft: true, descricao: 'Automação de frigorífico com IA' },
]

// ── Conexões ───────────────────────────────────────────────────────────────
const CONNS: Conn[] = [
  // Entradas → Nexus
  { de: 'chat', para: 'nexus', label: 'prompt' },
  { de: 'zap',  para: 'nexus', label: 'zap' },
  // Nexus → Resposta
  { de: 'nexus', para: 'resp', label: 'stream' },
  // Nexus → Model* (providers)
  { de: 'nexus', para: 'gem',  label: 'Model*', dashed: true, saida: 'bottom', entrada: 'top' },
  { de: 'nexus', para: 'groq', label: 'Model*', dashed: true, saida: 'bottom', entrada: 'top' },
  { de: 'nexus', para: 'crbr', label: 'Model',  dashed: true, saida: 'bottom', entrada: 'top' },
  { de: 'nexus', para: 'sbvn', label: 'Model',  dashed: true, saida: 'bottom', entrada: 'top' },
  // Nexus → Memory
  { de: 'nexus', para: 'supa',  label: 'Memory', dashed: true, saida: 'bottom', entrada: 'top' },
  { de: 'nexus', para: 'mysql', label: 'Memory', dashed: true, saida: 'bottom', entrada: 'top' },
  // Nexus → Tools
  { de: 'nexus', para: 'scout',    label: 'Tool', dashed: true },
  { de: 'nexus', para: 'research', label: 'Tool', dashed: true },
  { de: 'nexus', para: 'autocorr', label: 'Tool', dashed: true },
  { de: 'nexus', para: 'fabrica',  label: 'Tool', dashed: true },
  // Nexus → Projetos
  { de: 'nexus', para: 'qgia',      dashed: true },
  { de: 'nexus', para: 'agromacro', dashed: true },
  { de: 'nexus', para: 'gestcort',  dashed: true },
  { de: 'nexus', para: 'frigogest', dashed: true },
  // Research → Supabase
  { de: 'research', para: 'supa', label: 'salva', dashed: true, saida: 'bottom', entrada: 'left' },
  // Fábrica → Pipeline
  { de: 'fabrica',  para: 'analista',   saida: 'bottom', entrada: 'top' },
  { de: 'analista', para: 'comandante' },
  { de: 'comandante', para: 'arquiteto' },
  { de: 'arquiteto',  para: 'coder' },
  { de: 'coder',      para: 'auditor' },
  // Coder → Sub-agentes
  { de: 'coder', para: 'sub1', saida: 'bottom', entrada: 'top' },
  { de: 'coder', para: 'sub2', saida: 'bottom', entrada: 'top' },
  { de: 'coder', para: 'sub3', saida: 'bottom', entrada: 'top' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function cardCenter(c: CardNode, porta: 'right' | 'left' | 'bottom' | 'top') {
  const w = c.w ?? W, h = c.h ?? H
  if (porta === 'right')  return [c.x + w, c.y + h / 2]
  if (porta === 'left')   return [c.x,     c.y + h / 2]
  if (porta === 'bottom') return [c.x + w / 2, c.y + h]
  if (porta === 'top')    return [c.x + w / 2, c.y]
  return [c.x + w / 2, c.y + h / 2]
}

function bezierPath(x1: number, y1: number, x2: number, y2: number, saida: string, entrada: string): string {
  if (saida === 'bottom' || entrada === 'top') {
    const cy1 = y1 + Math.abs(y2 - y1) * 0.5
    const cy2 = y2 - Math.abs(y2 - y1) * 0.5
    return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`
  }
  const cx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
}

// ── Componente Card ────────────────────────────────────────────────────────
function NCard({ node, ativo, selecionado, onClick }: {
  node: CardNode; ativo: boolean; selecionado: boolean; onClick: () => void
}) {
  const w = node.w ?? W, h = node.h ?? H
  const iconSize = h - 20
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Glow ativo */}
      {ativo && (
        <rect x={node.x - 4} y={node.y - 4} width={w + 8} height={h + 8} rx="14"
          fill={node.cor + '20'} stroke={node.cor + '60'} strokeWidth="1.5" />
      )}
      {/* Card body */}
      <rect x={node.x} y={node.y} width={w} height={h} rx="10"
        fill={selecionado ? '#1a2035' : '#111827'}
        stroke={ativo ? node.cor : selecionado ? node.cor + '99' : '#1f2937'}
        strokeWidth={ativo || selecionado ? 2 : 1}
        style={{ transition: 'stroke 0.3s' }}
      />
      {/* Icon box */}
      <rect x={node.x + 8} y={node.y + 10} width={iconSize} height={iconSize} rx="7"
        fill={node.cor + (ativo ? 'EE' : '99')} />
      <text x={node.x + 8 + iconSize / 2} y={node.y + 10 + iconSize / 2 + 6}
        textAnchor="middle" fontSize={iconSize * 0.55}>
        {node.icone}
      </text>
      {/* Label */}
      <text x={node.x + iconSize + 18} y={node.y + h / 2 - (node.subtitle ? 4 : -1)}
        fontSize="11.5" fontWeight="700"
        fill={ativo ? '#fff' : '#e2e8f0'}>
        {node.label}
      </text>
      {/* Subtitle */}
      {node.subtitle && (
        <text x={node.x + iconSize + 18} y={node.y + h / 2 + 11}
          fontSize="9" fill={ativo ? node.cor + 'CC' : '#64748b'}>
          {node.subtitle}
        </text>
      )}
      {/* Porta esquerda */}
      {node.portLeft && (
        <circle cx={node.x} cy={node.y + h / 2} r="5"
          fill="#0f172a" stroke={ativo ? node.cor : '#374151'} strokeWidth="1.5" />
      )}
      {/* Porta direita */}
      {node.portRight && (
        <circle cx={node.x + w} cy={node.y + h / 2} r="5"
          fill="#0f172a" stroke={ativo ? node.cor : '#374151'} strokeWidth="1.5" />
      )}
      {/* Porta baixo */}
      {node.portBottom && (
        <circle cx={node.x + w / 2} cy={node.y + h} r="5"
          fill="#0f172a" stroke={ativo ? node.cor : '#374151'} strokeWidth="1.5" />
      )}
      {/* Porta cima */}
      {node.portTop && (
        <circle cx={node.x + w / 2} cy={node.y} r="5"
          fill="#0f172a" stroke={ativo ? node.cor : '#374151'} strokeWidth="1.5" />
      )}
      {/* Indicador de status */}
      {ativo && (
        <circle cx={node.x + w - 8} cy={node.y + 8} r="4"
          fill="#F59E0B">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export function AgentNetwork() {
  const [selecionado, setSelecionado] = useState<CardNode | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [etapasAtivas, setEtapasAtivas] = useState<Set<string>>(new Set())
  const [atividadesReais, setAtividadesReais] = useState<AtividadeAPI[]>([])
  const [ativosReais, setAtivosReais] = useState<Set<string>>(new Set())
  const [ultimaAt, setUltimaAt] = useState<Date | null>(null)

  // Polling da atividade real
  useEffect(() => {
    const token = localStorage.getItem('qg_auth_token') || ''
    async function fetch3s() {
      try {
        const res = await fetch('/api/agents/activity', { headers: { 'X-QG-Token': token } })
        if (!res.ok) return
        const data = await res.json()
        setAtividadesReais(data.detalhes || [])
        setAtivosReais(new Set(data.ativos || []))
        setUltimaAt(new Date())
      } catch { /* ignora */ }
    }
    fetch3s()
    const t = setInterval(fetch3s, 3000)
    return () => clearInterval(t)
  }, [])

  const ativos = simulando ? etapasAtivas : ativosReais

  const simularPipeline = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const seq = ['nexus', 'fabrica', 'analista', 'comandante', 'arquiteto', 'coder', 'sub1', 'sub2', 'sub3', 'auditor']
    seq.forEach((id, i) => setTimeout(() => setEtapasAtivas(new Set([id, 'nexus'])), i * 700))
    setTimeout(() => { setSimulando(false); setEtapasAtivas(new Set()) }, seq.length * 700 + 500)
  }, [simulando])

  const simularChat = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const seq = ['chat', 'nexus', 'gem', 'groq', 'supa', 'resp']
    seq.forEach((id, i) => setTimeout(() => setEtapasAtivas(new Set([id])), i * 600))
    setTimeout(() => { setSimulando(false); setEtapasAtivas(new Set()) }, seq.length * 600 + 400)
  }, [simulando])

  return (
    <div style={{ userSelect: 'none' }}>
      <style>{`
        @keyframes flowDash { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
        .conn-flow { animation: flowDash 0.8s linear infinite; }
      `}</style>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={simularChat} disabled={simulando} style={{
          padding: '7px 14px', background: simulando ? '#1f2937' : '#6366F1',
          border: 'none', borderRadius: 7, color: simulando ? '#6b7280' : '#fff',
          fontWeight: 700, fontSize: 11, cursor: simulando ? 'not-allowed' : 'pointer',
        }}>💬 Simular Chat</button>
        <button onClick={simularPipeline} disabled={simulando} style={{
          padding: '7px 14px', background: simulando ? '#1f2937' : '#EF4444',
          border: 'none', borderRadius: 7, color: simulando ? '#6b7280' : '#fff',
          fontWeight: 700, fontSize: 11, cursor: simulando ? 'not-allowed' : 'pointer',
        }}>🏭 Simular Pipeline</button>
        {/* Legenda */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748b', marginLeft: 8, flexWrap: 'wrap' }}>
          {[['#1EE0E0','Orquestrador'],['#4285F4','Providers'],['#EF4444','Fábrica'],['#3ECF8E','Memória'],['#4ADE80','Projetos']].map(([c,l]) => (
            <span key={l} style={{ display:'flex',alignItems:'center',gap:4 }}>
              <span style={{ width:10,height:10,borderRadius:3,background:c,display:'inline-block' }} />{l}
            </span>
          ))}
        </div>
        {ativosReais.size > 0 && (
          <span style={{ marginLeft:'auto',fontSize:10,color:'#22C55E',fontWeight:700,display:'flex',alignItems:'center',gap:5 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#22C55E',display:'inline-block', animation:'flowDash 1s linear infinite' }} />
            {ativosReais.size} ativo(s) agora
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ background: '#080d14', border: '1px solid #1e2433', borderRadius: 12, overflow: 'auto' }}>
        <svg viewBox="0 0 1720 860" style={{ width: '100%', minHeight: 400, display: 'block' }}
          onClick={() => setSelecionado(null)}>
          <defs>
            {/* Marcador de seta */}
            <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
            </marker>
            <marker id="arr-ativo" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#1EE0E0" />
            </marker>
            {/* Grid de pontos */}
            <pattern id="n8n-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="0.7" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>

          {/* Fundo */}
          <rect width="1720" height="860" fill="#080d14" />
          <rect width="1720" height="860" fill="url(#n8n-dots)" />

          {/* Labels de zona */}
          <text x="42" y="140" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">ENTRADA</text>
          <text x="310" y="170" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">ORQUESTRADOR</text>
          <text x="80" y="390" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">MODEL*</text>
          <text x="380" y="540" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">MEMORY</text>
          <text x="840" y="100" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">TOOLS</text>
          <text x="1180" y="100" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">PROJETOS</text>
          <text x="680" y="610" fill="#374151" fontSize="9" fontWeight="700" letterSpacing="1.5">FÁBRICA — PIPELINE MULTI-AGENTE</text>

          {/* ── Conexões ──────────────────────────────────── */}
          {CONNS.map((conn, i) => {
            const a = CARDS.find(c => c.id === conn.de)
            const b = CARDS.find(c => c.id === conn.para)
            if (!a || !b) return null
            const saida  = conn.saida  || 'right'
            const entrada = conn.entrada || 'left'
            const [x1, y1] = cardCenter(a, saida)
            const [x2, y2] = cardCenter(b, entrada)
            const path = bezierPath(x1, y1, x2, y2, saida, entrada)
            const ativoConn = ativos.has(conn.de) || ativos.has(conn.para)
            const cor = ativoConn ? '#1EE0E0' : '#1e2433'
            const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2
            return (
              <g key={i}>
                {/* Linha base */}
                <path d={path} fill="none"
                  stroke={cor} strokeWidth={ativoConn ? 2 : 1.2}
                  strokeDasharray={conn.dashed ? '6,4' : undefined}
                  markerEnd={`url(#arr${ativoConn ? '-ativo' : ''})`}
                  style={{ transition: 'stroke 0.3s' }}
                />
                {/* Linha animada quando ativo */}
                {ativoConn && !conn.dashed && (
                  <path d={path} fill="none"
                    stroke="#1EE0E0" strokeWidth="2.5"
                    strokeDasharray="8,16"
                    opacity="0.5"
                    className="conn-flow"
                  />
                )}
                {/* Label da conexão */}
                {conn.label && (
                  <g>
                    <rect x={midX - conn.label.length * 3.5 - 5} y={midY - 9}
                      width={conn.label.length * 7 + 10} height={14} rx="5"
                      fill="#080d14" stroke="#1e2433" strokeWidth="1" />
                    <text x={midX} y={midY + 1} textAnchor="middle"
                      fill={ativoConn ? '#1EE0E0' : '#4b5563'}
                      fontSize="9" fontWeight="700">
                      {conn.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* ── Cards ─────────────────────────────────────── */}
          {CARDS.map(node => (
            <NCard key={node.id} node={node}
              ativo={ativos.has(node.id)}
              selecionado={selecionado?.id === node.id}
              onClick={(e?: React.MouseEvent) => { e?.stopPropagation?.(); setSelecionado(selecionado?.id === node.id ? null : node) }}
            />
          ))}
        </svg>
      </div>

      {/* ── Feed de atividade ─────────────────────────── */}
      <div style={{ marginTop: 10, background: '#0a0f18', border: '1px solid #1e2433', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>ATIVIDADE EM TEMPO REAL</span>
          {ultimaAt && <span style={{ fontSize: 9, color: '#1e2433' }}>↻ {ultimaAt.toLocaleTimeString('pt-BR')}</span>}
          <span style={{ marginLeft:'auto', fontSize:10, color: ativosReais.size > 0 ? '#22C55E' : '#374151', fontWeight:700 }}>
            {ativosReais.size > 0 ? `${ativosReais.size} agente(s) trabalhando` : 'Aguardando...'}
          </span>
        </div>
        {atividadesReais.length === 0 ? (
          <p style={{ fontSize: 11, color: '#374151', fontStyle: 'italic', margin: 0 }}>
            Nenhum agente ativo agora. Mande uma mensagem no chat para ver a atividade aqui.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {atividadesReais.map(atv => {
              const no = CARDS.find(n => n.id === atv.agenteId)
              const cor = no?.cor || '#6b7280'
              return (
                <div key={atv.agenteId} style={{
                  display:'flex', alignItems:'center', gap:10,
                  background: cor+'0D', border:`1px solid ${cor}33`, borderRadius:7, padding:'6px 10px',
                }}>
                  <span style={{ fontSize:18 }}>{no?.icone || '●'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:cor }}>{no?.label || atv.agenteId}</span>
                      {atv.projeto && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:cor+'18', color:cor, border:`1px solid ${cor}44` }}>{atv.projeto}</span>}
                      {atv.iaUsada && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:'#F59E0B18', color:'#F59E0B', border:'1px solid #F59E0B44' }}>⚡ {atv.iaUsada}</span>}
                    </div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{atv.descricao}</div>
                  </div>
                  <span style={{ fontSize:9, color:'#374151' }}>{Math.round((Date.now()-atv.desde)/1000)}s</span>
                  <span style={{ width:6, height:6, borderRadius:'50%', background: atv.status==='trabalhando' ? '#F59E0B' : '#22C55E', flexShrink:0 }}>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detalhes do card clicado ───────────────────── */}
      {selecionado && (
        <div style={{
          marginTop:10, background: selecionado.cor+'0D',
          border:`1px solid ${selecionado.cor}44`, borderRadius:10, padding:'14px 18px',
          display:'flex', alignItems:'flex-start', gap:14,
          animation:'fadeIn 0.15s ease',
        }}>
          <span style={{ fontSize:36 }}>{selecionado.icone}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, color:selecionado.cor, fontSize:15 }}>{selecionado.label}</div>
            {selecionado.subtitle && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{selecionado.subtitle}</div>}
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:6, lineHeight:1.5 }}>{selecionado.descricao}</div>
          </div>
          <button onClick={()=>setSelecionado(null)} style={{ background:'none',border:'none',color:'#374151',cursor:'pointer',fontSize:18,padding:0 }}>✕</button>
        </div>
      )}
    </div>
  )
}
