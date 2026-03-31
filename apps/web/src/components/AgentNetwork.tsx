/**
 * AgentNetwork — Estilo n8n exato
 * Nós principais: retângulos (main flow)
 * Sub-nós: círculos com ícone dentro + label abaixo (providers, memory, tools, projetos)
 * Conexões bezier com labels, atividade em tempo real (polling 3s)
 */

import { useState, useEffect, useCallback } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Node {
  id: string
  label: string
  subtitle?: string
  icone: string
  cor: string
  descricao?: string
  // Card rect: x,y = top-left
  tipo: 'card'
  x: number; y: number; w?: number; h?: number
  portLeft?: boolean; portRight?: boolean; portTop?: boolean; portBottom?: boolean
}

interface CircleNode {
  id: string
  label: string
  subtitle?: string
  icone: string
  cor: string
  descricao?: string
  // Circle: cx,cy = center
  tipo: 'circle'
  x: number; y: number; r?: number
}

type AnyNode = Node | CircleNode

interface Conn {
  de: string; para: string; label?: string; dashed?: boolean
  saida?: 'right' | 'bottom' | 'left' | 'top'
  entrada?: 'left' | 'top' | 'right' | 'bottom'
}

interface AtividadeAPI {
  agenteId: string; status: 'trabalhando' | 'monitorando' | string; projeto: string | null
  descricao: string; iaUsada: string | null; desde: number
  detalhes?: unknown
  aprendizado?: unknown
  artefatos?: unknown
  atualizadoEm?: number
}

interface ActivityEvent {
  id: string
  ts: number
  tipo: string
  agenteId: string
  status: string
  projeto?: string | null
  descricao?: string
  iaUsada?: string | null
  detalhes?: unknown
  aprendizado?: unknown
  artefatos?: unknown
}

interface MemoriaItem {
  id?: string | number
  agente?: string
  categoria?: string
  conteudo?: string
  created_at?: string
}

interface DeepAgentData {
  agenteId: string
  atividadeAtual: AtividadeAPI | null
  eventos: ActivityEvent[]
  aprendizados: MemoriaItem[]
}

// ── Constantes de tamanho ──────────────────────────────────────────────────
const W = 168, H = 56

// ── Nós ────────────────────────────────────────────────────────────────────
const NODES: AnyNode[] = [
  // ─── ENTRADA (retângulos) ───
  { tipo:'card', id:'chat', label:'Chat Web',    subtitle:'Mensagem recebida', icone:'💬', cor:'#6366F1', x:30, y:195, portRight:true, descricao:'Interface web — usuário envia mensagem' },
  { tipo:'card', id:'zap',  label:'WhatsApp',    subtitle:'Mensagem recebida', icone:'📱', cor:'#25D366', x:30, y:280, portRight:true, descricao:'Gateway WhatsApp via Baileys' },

  // ─── ORQUESTRADOR (retângulo principal) ───
  { tipo:'card', id:'nexus', label:'NEXUS CLAW', subtitle:'Tools Agent · CEO Supremo', icone:'🦂', cor:'#1EE0E0',
    x:295, y:210, w:198, h:68, portLeft:true, portRight:true, portBottom:true,
    descricao:'Orquestra todos os agentes, projetos e providers' },

  // ─── RESPOSTA (retângulo) ───
  { tipo:'card', id:'resp', label:'Resposta SSE', subtitle:'Stream token a token', icone:'📡', cor:'#8B5CF6',
    x:608, y:224, portLeft:true, descricao:'Envia resposta via Server-Sent Events' },

  // ─── MODEL* (círculos) ───
  { tipo:'circle', id:'gem',  label:'Gemini',    subtitle:'Principal',      icone:'◈',  cor:'#4285F4', x:110, cy:450, r:30, descricao:'Google Gemini — provider principal' } as unknown as CircleNode,
  { tipo:'circle', id:'groq', label:'Groq',      subtitle:'llama-3.3-70b',  icone:'⚡', cor:'#F97316', x:245, y:450, r:30, descricao:'Groq — backup ultra-rápido' } as unknown as CircleNode,
  { tipo:'circle', id:'crbr', label:'Cerebras',  subtitle:'llama-3.3-70b',  icone:'🧠', cor:'#A78BFA', x:385, y:450, r:30, descricao:'Cerebras — fallback' } as unknown as CircleNode,
  { tipo:'circle', id:'sbvn', label:'SambaNova',  subtitle:'Llama-3.3-70B', icone:'🌊', cor:'#06B6D4', x:525, y:450, r:30, descricao:'SambaNova — último fallback' } as unknown as CircleNode,

  // ─── MEMORY (círculos) ───
  { tipo:'circle', id:'supa',  label:'Supabase', subtitle:'Memórias · Audit', icone:'🗄', cor:'#3ECF8E', x:420, y:590, r:30, descricao:'Banco primário — memória persistente' } as unknown as CircleNode,
  { tipo:'circle', id:'mysql', label:'MySQL',    subtitle:'Backup · Hostinger',icone:'🐬', cor:'#00758F', x:570, y:590, r:30, descricao:'Backup não-bloqueante' } as unknown as CircleNode,

  // ─── TOOLS (círculos) ───
  { tipo:'circle', id:'scout',    label:'Scout',       subtitle:'Pesquisa web',    icone:'🔎', cor:'#F59E0B', x:870, y:155, r:30, descricao:'Coleta dados e pesquisa na internet' } as unknown as CircleNode,
  { tipo:'circle', id:'research', label:'Research',    subtitle:'Ciclo 6h · arXiv',icone:'🔬', cor:'#34D399', x:870, y:265, r:30, descricao:'Pesquisa autônoma + síntese' } as unknown as CircleNode,
  { tipo:'circle', id:'autocorr', label:'AutoCorreção',subtitle:'Ciclo 12h',       icone:'🔄', cor:'#FCD34D', x:870, y:375, r:30, descricao:'Analisa logs e corrige automaticamente' } as unknown as CircleNode,
  { tipo:'circle', id:'fabrica',  label:'Fábrica IA',  subtitle:'Multi-agente',    icone:'🏭', cor:'#EF4444', x:870, y:490, r:32, descricao:'Gera apps completos com pipeline de 5 agentes' } as unknown as CircleNode,

  // ─── PROJETOS (círculos) ───
  { tipo:'circle', id:'qgia',      label:'QG IA Nexus', subtitle:'Plataforma',   icone:'🏰', cor:'#1EE0E0', x:1100, y:155, r:28, descricao:'Chat + Fábrica + Memória + WhatsApp' } as unknown as CircleNode,
  { tipo:'circle', id:'agromacro', label:'AgroMacro',   subtitle:'PWA 27 módulos',icone:'🐄', cor:'#4ADE80', x:1100, y:265, r:28, descricao:'Gestão de fazenda completa' } as unknown as CircleNode,
  { tipo:'circle', id:'gestcort',  label:'GestCort',    subtitle:'Gado de corte', icone:'🌾', cor:'#86EFAC', x:1100, y:375, r:28, descricao:'App gestão pecuária + financeiro' } as unknown as CircleNode,
  { tipo:'circle', id:'frigogest', label:'FrigoGest',   subtitle:'16 agentes',    icone:'🥩', cor:'#FCA5A5', x:1100, y:490, r:28, descricao:'Automação de frigorífico com IA' } as unknown as CircleNode,

  // ─── PIPELINE FÁBRICA (retângulos) ───
  { tipo:'card', id:'analista',   label:'Analista',    subtitle:'Requisitos · PRD',    icone:'📋', cor:'#EF4444', x:655,  y:640, portLeft:true, portRight:true, descricao:'Analisa a ideia e cria documento de requisitos' },
  { tipo:'card', id:'comandante', label:'Comandante',  subtitle:'Estratégia · Tarefas',icone:'⚔️', cor:'#F97316', x:855,  y:640, portLeft:true, portRight:true, descricao:'Define estratégia e divide em tarefas' },
  { tipo:'card', id:'arquiteto',  label:'Arquiteto',   subtitle:'Arquitetura · DB',    icone:'🏗️', cor:'#EAB308', x:1055, y:640, portLeft:true, portRight:true, descricao:'Projeta a arquitetura técnica completa' },
  { tipo:'card', id:'coder',      label:'CoderChief',  subtitle:'Código · Sub-agentes',icone:'💻', cor:'#84CC16', x:1255, y:640, portLeft:true, portRight:true, portBottom:true, descricao:'Gera código e coordena sub-agentes' },
  { tipo:'card', id:'auditor',    label:'Auditor',     subtitle:'Valida · Aprova',     icone:'⚖️', cor:'#22C55E', x:1455, y:640, portLeft:true, descricao:'Testa e aprova o resultado final' },

  // ─── SUB-AGENTES (círculos) ───
  { tipo:'circle', id:'sub1', label:'Sub-Backend',  subtitle:'APIs · Lógica',        icone:'⚡', cor:'#6366F1', x:1195, y:775, r:24, descricao:'Sub-agente: backend e integrações' } as unknown as CircleNode,
  { tipo:'circle', id:'sub2', label:'Sub-Frontend', subtitle:'React · UI',           icone:'⚡', cor:'#6366F1', x:1345, y:775, r:24, descricao:'Sub-agente: interface e componentes' } as unknown as CircleNode,
  { tipo:'circle', id:'sub3', label:'Sub-Infra',    subtitle:'DB · Docker · Deploy', icone:'⚡', cor:'#6366F1', x:1500, y:775, r:24, descricao:'Sub-agente: infraestrutura e deploy' } as unknown as CircleNode,
]

// Corrigir o campo x/y dos círculos (cy foi typo)
;(NODES as AnyNode[]).forEach(n => {
  if (n.tipo === 'circle') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = n as any
    if (c.cy !== undefined) { c.y = c.cy; delete c.cy }
  }
})

// ── Conexões ───────────────────────────────────────────────────────────────
const CONNS: Conn[] = [
  // Entradas → Nexus
  { de:'chat', para:'nexus', label:'prompt' },
  { de:'zap',  para:'nexus', label:'zap' },
  // Nexus → Resposta
  { de:'nexus', para:'resp', label:'stream' },
  // Nexus → Model* (dashed, bottom→top para círculos)
  { de:'nexus', para:'gem',  label:'Model*', dashed:true, saida:'bottom', entrada:'top' },
  { de:'nexus', para:'groq', label:'Model*', dashed:true, saida:'bottom', entrada:'top' },
  { de:'nexus', para:'crbr', label:'Model',  dashed:true, saida:'bottom', entrada:'top' },
  { de:'nexus', para:'sbvn', label:'Model',  dashed:true, saida:'bottom', entrada:'top' },
  // Nexus → Memory
  { de:'nexus', para:'supa',  label:'Memory', dashed:true, saida:'bottom', entrada:'top' },
  { de:'nexus', para:'mysql', label:'Memory', dashed:true, saida:'bottom', entrada:'top' },
  // Nexus → Tools
  { de:'nexus', para:'scout',    label:'Tool', dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'research', label:'Tool', dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'autocorr', label:'Tool', dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'fabrica',  label:'Tool', dashed:true, saida:'right', entrada:'left' },
  // Nexus → Projetos
  { de:'nexus', para:'qgia',      dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'agromacro', dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'gestcort',  dashed:true, saida:'right', entrada:'left' },
  { de:'nexus', para:'frigogest', dashed:true, saida:'right', entrada:'left' },
  // Research → Supabase
  { de:'research', para:'supa', label:'salva', dashed:true, saida:'bottom', entrada:'top' },
  // Fábrica → Pipeline
  { de:'fabrica',    para:'analista',   saida:'bottom', entrada:'left' },
  { de:'analista',   para:'comandante' },
  { de:'comandante', para:'arquiteto' },
  { de:'arquiteto',  para:'coder' },
  { de:'coder',      para:'auditor' },
  // Coder → Sub-agentes
  { de:'coder', para:'sub1', saida:'bottom', entrada:'top' },
  { de:'coder', para:'sub2', saida:'bottom', entrada:'top' },
  { de:'coder', para:'sub3', saida:'bottom', entrada:'top' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function nodePort(n: AnyNode, porta: 'right' | 'left' | 'bottom' | 'top'): [number, number] {
  if (n.tipo === 'circle') {
    const r = (n as CircleNode).r ?? 28
    if (porta === 'right')  return [n.x + r, n.y]
    if (porta === 'left')   return [n.x - r, n.y]
    if (porta === 'bottom') return [n.x, n.y + r]
    return [n.x, n.y - r]
  }
  const c = n as Node
  const w = c.w ?? W, h = c.h ?? H
  if (porta === 'right')  return [c.x + w, c.y + h / 2]
  if (porta === 'left')   return [c.x,     c.y + h / 2]
  if (porta === 'bottom') return [c.x + w / 2, c.y + h]
  return [c.x + w / 2, c.y]
}

function bezier(x1: number, y1: number, x2: number, y2: number, saida: string, entrada: string): string {
  if (saida === 'bottom' || entrada === 'top') {
    const dy = Math.abs(y2 - y1) * 0.55
    return `M ${x1} ${y1} C ${x1} ${y1+dy}, ${x2} ${y2-dy}, ${x2} ${y2}`
  }
  const cx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
}

// ── Componente: Card retangular ────────────────────────────────────────────
function NCard({ node, ativo, trabalhando, sel, onClick }: { node: Node; ativo: boolean; trabalhando: boolean; sel: boolean; onClick: () => void }) {
  const w = node.w ?? W, h = node.h ?? H
  const iSz = h - 20
  const dotColor = trabalhando ? '#F59E0B' : '#3B82F6'
  return (
    <g onClick={onClick} style={{ cursor:'pointer' }}>
      {ativo && <rect x={node.x-4} y={node.y-4} width={w+8} height={h+8} rx="14"
        fill={trabalhando ? node.cor+'18' : node.cor+'0A'}
        stroke={trabalhando ? node.cor+'55' : node.cor+'25'} strokeWidth="1.5" />}
      <rect x={node.x} y={node.y} width={w} height={h} rx="10"
        fill={sel ? '#1a2035' : '#111827'}
        stroke={trabalhando ? node.cor : ativo ? node.cor+'55' : sel ? node.cor+'99' : '#1f2937'}
        strokeWidth={trabalhando ? 2 : ativo ? 1.5 : sel ? 1.5 : 1}
        style={{ transition:'stroke 0.3s' }} />
      <rect x={node.x+8} y={node.y+10} width={iSz} height={iSz} rx="7"
        fill={node.cor+(trabalhando?'EE':ativo?'77':'55')} />
      <text x={node.x+8+iSz/2} y={node.y+10+iSz/2+5} textAnchor="middle" fontSize={iSz*0.52}>{node.icone}</text>
      <text x={node.x+iSz+18} y={node.y+h/2-(node.subtitle?4:-1)}
        fontSize="11.5" fontWeight="700" fill={trabalhando?'#fff':ativo?'#cbd5e1':'#94a3b8'}>{node.label}</text>
      {node.subtitle && <text x={node.x+iSz+18} y={node.y+h/2+11}
        fontSize="9" fill={trabalhando?node.cor+'CC':ativo?node.cor+'66':'#475569'}>{node.subtitle}</text>}
      {node.portLeft  && <circle cx={node.x}     cy={node.y+h/2} r="5" fill="#0f172a" stroke={ativo?node.cor+'88':'#374151'} strokeWidth="1.5"/>}
      {node.portRight && <circle cx={node.x+w}   cy={node.y+h/2} r="5" fill="#0f172a" stroke={ativo?node.cor+'88':'#374151'} strokeWidth="1.5"/>}
      {node.portBottom&& <circle cx={node.x+w/2} cy={node.y+h}   r="5" fill="#0f172a" stroke={ativo?node.cor+'88':'#374151'} strokeWidth="1.5"/>}
      {node.portTop   && <circle cx={node.x+w/2} cy={node.y}     r="5" fill="#0f172a" stroke={ativo?node.cor+'88':'#374151'} strokeWidth="1.5"/>}
      {ativo && <circle cx={node.x+w-8} cy={node.y+8} r="4" fill={dotColor}>
        {trabalhando && <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite"/>}
      </circle>}
    </g>
  )
}

// ── Componente: Nó círculo (sub-ferramenta) ────────────────────────────────
function NCircle({ node, ativo, trabalhando, sel, onClick }: { node: CircleNode; ativo: boolean; trabalhando: boolean; sel: boolean; onClick: () => void }) {
  const r = node.r ?? 28
  const dotColor = trabalhando ? '#F59E0B' : '#3B82F6'
  return (
    <g onClick={onClick} style={{ cursor:'pointer' }}>
      {/* Glow/pulso */}
      {ativo && <>
        <circle cx={node.x} cy={node.y} r={r+6} fill={node.cor+(trabalhando?'15':'08')} stroke={node.cor+(trabalhando?'40':'20')} strokeWidth="1"/>
        {trabalhando && <circle cx={node.x} cy={node.y} r={r+3} fill="none" stroke={node.cor} strokeWidth="1.5" opacity="0.4">
          <animate attributeName="r" values={`${r+3};${r+12};${r+3}`} dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" repeatCount="indefinite"/>
        </circle>}
      </>}
      {/* Corpo */}
      <circle cx={node.x} cy={node.y} r={r}
        fill={sel ? '#1a2035' : '#111827'}
        stroke={trabalhando ? node.cor : ativo ? node.cor+'55' : sel ? node.cor+'99' : '#1f2937'}
        strokeWidth={trabalhando ? 2.5 : ativo ? 1.5 : sel ? 1.5 : 1.2}
        style={{ transition:'stroke 0.3s' }}/>
      {/* Ícone */}
      <text x={node.x} y={node.y+(r*0.38)} textAnchor="middle" fontSize={r*0.72} dominantBaseline="middle">{node.icone}</text>
      {/* Label abaixo */}
      <text x={node.x} y={node.y+r+14} textAnchor="middle" fontSize="10" fontWeight="700"
        fill={trabalhando?'#fff':ativo?'#cbd5e1':'#64748b'}>{node.label}</text>
      {node.subtitle && <text x={node.x} y={node.y+r+25} textAnchor="middle" fontSize="8"
        fill={trabalhando?node.cor+'DD':ativo?node.cor+'66':'#374151'}>{node.subtitle}</text>}
      {/* Porta de conexão */}
      <circle cx={node.x} cy={node.y-r} r="4" fill="#0f172a" stroke={ativo?node.cor+'88':'#374151'} strokeWidth="1.5"/>
      {/* Dot de status */}
      {ativo && <circle cx={node.x+r-4} cy={node.y-r+4} r="4" fill={dotColor}>
        {trabalhando && <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite"/>}
      </circle>}
    </g>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export function AgentNetwork() {
  const [sel, setSel] = useState<AnyNode | null>(null)
  const [simulando, setSimulando] = useState(false)
  const [etapasAtivas, setEtapasAtivas] = useState<Set<string>>(new Set())
  const [atividadesReais, setAtividadesReais] = useState<AtividadeAPI[]>([])
  const [ativosReais, setAtivosReais] = useState<Set<string>>(new Set())
  const [trabalhandoReais, setTrabalhandoReais] = useState<Set<string>>(new Set())
  const [ultimaAt, setUltimaAt] = useState<Date | null>(null)
  const [clockMs, setClockMs] = useState(0)
  const [eventosRecentes, setEventosRecentes] = useState<ActivityEvent[]>([])
  const [deepData, setDeepData] = useState<DeepAgentData | null>(null)
  const [deepLoading, setDeepLoading] = useState(false)
  const [fullView, setFullView] = useState<{ titulo: string; conteudo: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('qg_auth_token') || ''
    async function poll() {
      try {
        const res = await fetch('/api/agents/activity', { headers: { 'X-QG-Token': token } })
        if (!res.ok) return
        const data = await res.json()
        setAtividadesReais(data.detalhes || [])
        setAtivosReais(new Set(data.ativos || []))
        setTrabalhandoReais(new Set(data.trabalhando || []))
        setUltimaAt(new Date())
        const h = await fetch('/api/agents/activity/history?limit=300', { headers: { 'X-QG-Token': token } })
        if (h.ok) {
          const hd = await h.json()
          setEventosRecentes(hd.eventos || [])
        }
      } catch { /* ignora */ }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setClockMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const ativos = simulando ? etapasAtivas : ativosReais
  const trabalhando = simulando ? etapasAtivas : trabalhandoReais

  const simularChat = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const seq = ['chat','nexus','gem','groq','supa','resp']
    seq.forEach((id, i) => setTimeout(() => setEtapasAtivas(new Set([id])), i*600))
    setTimeout(() => { setSimulando(false); setEtapasAtivas(new Set()) }, seq.length*600+400)
  }, [simulando])

  const simularPipeline = useCallback(() => {
    if (simulando) return
    setSimulando(true)
    const seq = ['nexus','fabrica','analista','comandante','arquiteto','coder','sub1','sub2','sub3','auditor']
    seq.forEach((id, i) => setTimeout(() => setEtapasAtivas(new Set([id,'nexus'])), i*700))
    setTimeout(() => { setSimulando(false); setEtapasAtivas(new Set()) }, seq.length*700+500)
  }, [simulando])

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]))

  const toText = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    try { return JSON.stringify(value, null, 2) } catch { return String(value) }
  }

  useEffect(() => {
    if (!sel) {
      setDeepData(null)
      return
    }
    const token = localStorage.getItem('qg_auth_token') || ''
    let abort = false
    async function loadDeep() {
      setDeepLoading(true)
      try {
        const res = await fetch(`/api/agents/activity/deep/${sel.id}?limitEventos=300&limitMemorias=300`, {
          headers: { 'X-QG-Token': token }
        })
        if (!res.ok) {
          if (!abort) setDeepData(null)
          return
        }
        const data = await res.json()
        if (!abort) setDeepData(data)
      } catch {
        if (!abort) setDeepData(null)
      } finally {
        if (!abort) setDeepLoading(false)
      }
    }
    loadDeep()
    return () => { abort = true }
  }, [sel])

  return (
    <div style={{ userSelect:'none' }}>
      <style>{`
        @keyframes flowDash { from { stroke-dashoffset:24; } to { stroke-dashoffset:0; } }
        .conn-flow { animation: flowDash 0.8s linear infinite; }
      `}</style>

      {/* Controles */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <button onClick={simularChat} disabled={simulando} style={{
          padding:'7px 14px', background: simulando?'#1f2937':'#6366F1',
          border:'none', borderRadius:7, color: simulando?'#6b7280':'#fff', fontWeight:700, fontSize:11, cursor: simulando?'not-allowed':'pointer' }}>
          💬 Simular Chat
        </button>
        <button onClick={simularPipeline} disabled={simulando} style={{
          padding:'7px 14px', background: simulando?'#1f2937':'#EF4444',
          border:'none', borderRadius:7, color: simulando?'#6b7280':'#fff', fontWeight:700, fontSize:11, cursor: simulando?'not-allowed':'pointer' }}>
          🏭 Simular Pipeline
        </button>
        <div style={{ display:'flex', gap:12, fontSize:10, color:'#64748b', marginLeft:8, flexWrap:'wrap' }}>
          {[['#1EE0E0','Nexus'],['#4285F4','Providers'],['#EF4444','Fábrica'],['#3ECF8E','Memória'],['#4ADE80','Projetos'],['#F59E0B','Tools']].map(([c,l]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }}/>{l}
            </span>
          ))}
        </div>
        {ativosReais.size > 0 && (
          <span style={{ marginLeft:'auto', fontSize:10, color:'#22C55E', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }}/>
            {ativosReais.size} ativo(s) agora
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ background:'#080d14', border:'1px solid #1e2433', borderRadius:12, overflow:'auto' }}>
        <svg viewBox="0 0 1620 840" style={{ width:'100%', minHeight:420, display:'block' }}
          onClick={() => setSel(null)}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#374151"/>
            </marker>
            <marker id="arr-a" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#1EE0E0"/>
            </marker>
            <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="0.7" fill="rgba(255,255,255,0.06)"/>
            </pattern>
          </defs>

          <rect width="1620" height="840" fill="#080d14"/>
          <rect width="1620" height="840" fill="url(#dots)"/>

          {/* Rótulos de zona */}
          <text x="32"   y="148" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">ENTRADA</text>
          <text x="295"  y="170" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">ORQUESTRADOR</text>
          <text x="90"   y="395" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">MODEL*</text>
          <text x="380"  y="535" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">MEMORY</text>
          <text x="840"  y="105" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">TOOLS</text>
          <text x="1070" y="105" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">PROJETOS</text>
          <text x="655"  y="610" fill="#2d3748" fontSize="9" fontWeight="700" letterSpacing="1.5">FÁBRICA — PIPELINE MULTI-AGENTE</text>

          {/* ── Conexões ───────────────────────────── */}
          {CONNS.map((conn, i) => {
            const a = nodeMap[conn.de], b = nodeMap[conn.para]
            if (!a || !b) return null
            const saida  = conn.saida  || 'right'
            const entrada = conn.entrada || 'left'
            const [x1, y1] = nodePort(a, saida)
            const [x2, y2] = nodePort(b, entrada)
            const path = bezier(x1, y1, x2, y2, saida, entrada)
            const ativoConn = ativos.has(conn.de) || ativos.has(conn.para)
            const cor = ativoConn ? '#1EE0E0' : '#1e2433'
            const midX = (x1+x2)/2, midY = (y1+y2)/2
            return (
              <g key={i}>
                <path d={path} fill="none"
                  stroke={cor} strokeWidth={ativoConn?2:1.2}
                  strokeDasharray={conn.dashed?'6,4':undefined}
                  markerEnd={`url(#arr${ativoConn?'-a':''})`}
                  style={{ transition:'stroke 0.3s' }}/>
                {ativoConn && !conn.dashed && (
                  <path d={path} fill="none" stroke="#1EE0E0" strokeWidth="2.5"
                    strokeDasharray="8,16" opacity="0.5" className="conn-flow"/>
                )}
                {conn.label && (
                  <g>
                    <rect x={midX-conn.label.length*3.5-5} y={midY-9}
                      width={conn.label.length*7+10} height={14} rx="5"
                      fill="#080d14" stroke="#1e2433" strokeWidth="1"/>
                    <text x={midX} y={midY+1} textAnchor="middle"
                      fill={ativoConn?'#1EE0E0':'#4b5563'} fontSize="9" fontWeight="700">
                      {conn.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* ── Nós ────────────────────────────────── */}
          {NODES.map(node => {
            const isAtivo = ativos.has(node.id)
            const isTrab  = trabalhando.has(node.id)
            const isSel = sel?.id === node.id
            const click = (e?: React.MouseEvent) => { e?.stopPropagation?.(); setSel(sel?.id===node.id ? null : node) }
            if (node.tipo === 'circle') {
              return <NCircle key={node.id} node={node as CircleNode} ativo={isAtivo} trabalhando={isTrab} sel={isSel} onClick={click}/>
            }
            return <NCard key={node.id} node={node as Node} ativo={isAtivo} trabalhando={isTrab} sel={isSel} onClick={click}/>
          })}
        </svg>
      </div>

      {/* ── Feed de atividade ──────────────────────────── */}
      <div style={{ marginTop:10, background:'#0a0f18', border:'1px solid #1e2433', borderRadius:10, padding:'10px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:1 }}>ATIVIDADE EM TEMPO REAL</span>
          {ultimaAt && <span style={{ fontSize:9, color:'#1e2433' }}>↻ {ultimaAt.toLocaleTimeString('pt-BR')}</span>}
          <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, display:'flex', gap:10 }}>
            {trabalhandoReais.size > 0 && <span style={{ color:'#F59E0B' }}>⚡ {trabalhandoReais.size} trabalhando</span>}
            <span style={{ color: ativosReais.size>0?'#3B82F6':'#374151' }}>● {ativosReais.size} online</span>
          </span>
        </div>
        {atividadesReais.length === 0 ? (
          <p style={{ fontSize:11, color:'#374151', fontStyle:'italic', margin:0 }}>
            Nenhum agente ativo. Mande uma mensagem no chat para ver a atividade aqui.
          </p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {atividadesReais.map(atv => {
              const no = nodeMap[atv.agenteId]
              const cor = no?.cor || '#6b7280'
              return (
                <div key={atv.agenteId} style={{
                  display:'flex', alignItems:'center', gap:10,
                  background:cor+'0D', border:`1px solid ${cor}33`, borderRadius:7, padding:'6px 10px', cursor:'pointer' }}
                  onClick={() => setSel((nodeMap[atv.agenteId] as AnyNode) || null)}>
                  <span style={{ fontSize:18 }}>{no?.icone || '●'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:cor }}>{no?.label || atv.agenteId}</span>
                      {atv.projeto && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:cor+'18', color:cor, border:`1px solid ${cor}44` }}>{atv.projeto}</span>}
                      {atv.iaUsada && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:'#F59E0B18', color:'#F59E0B', border:'1px solid #F59E0B44' }}>⚡ {atv.iaUsada}</span>}
                    </div>
                    <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{atv.descricao}</div>
                  </div>
                  <span style={{ fontSize:9, color:'#374151' }}>{Math.max(0, Math.round(((clockMs || atv.desde)-atv.desde)/1000))}s</span>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:atv.status==='trabalhando'?'#F59E0B':'#3B82F6', flexShrink:0 }}/>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detalhes do nó clicado ─────────────────────── */}
      <div style={{ marginTop:10, background:'#0a0f18', border:'1px solid #1e2433', borderRadius:10, padding:'10px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:1, marginBottom:8 }}>HISTORICO GLOBAL (REAL)</div>
        <div style={{ maxHeight:180, overflowY:'auto', display:'grid', gap:6 }}>
          {eventosRecentes.length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>Sem eventos registrados.</div>}
          {eventosRecentes.slice(0, 120).map((ev) => (
            <div key={ev.id} style={{ border:'1px solid #1f2937', borderRadius:6, padding:'7px 8px', background:'#0b1220' }}>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{new Date(ev.ts).toLocaleString('pt-BR')} - {ev.agenteId} - {ev.tipo}</div>
              <div style={{ fontSize:12, color:'#e5e7eb', marginTop:3 }}>{ev.descricao || '(sem descricao)'}</div>
              {(toText(ev.detalhes) || toText(ev.artefatos) || toText(ev.aprendizado)) && (
                <button
                  onClick={() => setFullView({ titulo: `${ev.agenteId} - evento completo`, conteudo: [
                    `tipo=${ev.tipo}`,
                    `status=${ev.status}`,
                    `descricao=${ev.descricao || ''}`,
                    '',
                    'detalhes:',
                    toText(ev.detalhes),
                    '',
                    'artefatos:',
                    toText(ev.artefatos),
                    '',
                    'aprendizado:',
                    toText(ev.aprendizado),
                  ].join('\n') })}
                  style={{ marginTop:6, fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}
                >
                  Abrir completo
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div style={{ marginTop:10, background:sel.cor+'0D', border:`1px solid ${sel.cor}44`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:14, flexDirection:'column' }}>
          <div style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:14 }}>
            <span style={{ fontSize:36 }}>{sel.icone}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:sel.cor, fontSize:15 }}>{sel.label}</div>
              {'subtitle' in sel && sel.subtitle && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sel.subtitle}</div>}
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:6, lineHeight:1.5 }}>{sel.descricao}</div>
            </div>
            <button onClick={()=>setSel(null)} style={{ background:'none',border:'none',color:'#374151',cursor:'pointer',fontSize:18,padding:0 }}>X</button>
          </div>

          <div style={{ width:'100%', borderTop:'1px solid #1f2937', paddingTop:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:8 }}>TRABALHO REAL DESTE AGENTE</div>
            {deepLoading && <div style={{ fontSize:12, color:'#64748b' }}>Carregando...</div>}
            {!deepLoading && deepData && (
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ background:'#080d14', border:'1px solid #1f2937', borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#e5e7eb', marginBottom:6 }}>Atividade atual</div>
                  {deepData.atividadeAtual ? (
                    <>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>{deepData.atividadeAtual.descricao || '(sem descricao)'}</div>
                      {!!toText(deepData.atividadeAtual.detalhes) && (
                        <button onClick={() => setFullView({ titulo: `${sel.label} - atividade atual`, conteudo: toText(deepData.atividadeAtual?.detalhes) })}
                          style={{ marginTop:8, fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}>
                          Abrir detalhes completos
                        </button>
                      )}
                    </>
                  ) : <div style={{ fontSize:12, color:'#64748b' }}>Sem atividade no momento.</div>}
                </div>

                <div style={{ background:'#080d14', border:'1px solid #1f2937', borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#e5e7eb', marginBottom:6 }}>Historico do agente</div>
                  <div style={{ maxHeight:220, overflowY:'auto', display:'grid', gap:6 }}>
                    {(deepData.eventos || []).length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>Sem eventos.</div>}
                    {(deepData.eventos || []).map((ev) => (
                      <div key={ev.id} style={{ border:'1px solid #1f2937', borderRadius:6, padding:'7px 8px', background:'#0b1220' }}>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{new Date(ev.ts).toLocaleString('pt-BR')} - {ev.tipo} - {ev.status}</div>
                        <div style={{ fontSize:12, color:'#e5e7eb', marginTop:3 }}>{ev.descricao || '(sem descricao)'}</div>
                        <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
                          {!!toText(ev.detalhes) && <button onClick={() => setFullView({ titulo: `${sel.label} - detalhes`, conteudo: toText(ev.detalhes) })} style={{ fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}>Ver detalhes</button>}
                          {!!toText(ev.artefatos) && <button onClick={() => setFullView({ titulo: `${sel.label} - codigos/artefatos`, conteudo: toText(ev.artefatos) })} style={{ fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}>Ver codigo</button>}
                          {!!toText(ev.aprendizado) && <button onClick={() => setFullView({ titulo: `${sel.label} - aprendizado`, conteudo: toText(ev.aprendizado) })} style={{ fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}>Ver aprendizado</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background:'#080d14', border:'1px solid #1f2937', borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#e5e7eb', marginBottom:6 }}>Aprendizados salvos na memoria</div>
                  <div style={{ maxHeight:220, overflowY:'auto', display:'grid', gap:6 }}>
                    {(deepData.aprendizados || []).length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>Sem memorias encontradas.</div>}
                    {(deepData.aprendizados || []).map((m, idx) => (
                      <div key={String(m.id || idx)} style={{ border:'1px solid #1f2937', borderRadius:6, padding:'7px 8px', background:'#0b1220' }}>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{m.agente || sel.id} - {m.categoria || 'geral'} - {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : 'sem data'}</div>
                        <button onClick={() => setFullView({ titulo: `${sel.label} - memoria completa`, conteudo: toText(m.conteudo) })}
                          style={{ marginTop:6, fontSize:11, padding:'4px 8px', border:'1px solid #334155', borderRadius:6, background:'#111827', color:'#cbd5e1', cursor:'pointer' }}>
                          Abrir leitura completa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {fullView && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.82)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center', padding:18 }}
          onClick={() => setFullView(null)}>
          <div style={{ width:'min(1100px, 95vw)', maxHeight:'90vh', background:'#020617', border:'1px solid #1f2937', borderRadius:10, padding:14, display:'flex', flexDirection:'column' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0' }}>{fullView.titulo}</div>
              <button onClick={() => setFullView(null)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:16 }}>X</button>
            </div>
            <pre style={{ margin:0, padding:12, border:'1px solid #1f2937', borderRadius:8, background:'#0b1220', color:'#cbd5e1', fontSize:12, lineHeight:1.5, overflow:'auto', whiteSpace:'pre-wrap' }}>
              {fullView.conteudo || '(vazio)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
