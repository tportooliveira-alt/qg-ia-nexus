import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

// Mapeamento de tipo de evento → etapa (0-5)
const TIPO_PARA_ETAPA: Record<string, number> = {
  analista_iniciado: 0, analista_concluido: 0,
  comandante_iniciado: 1, comandante_concluido: 1,
  arquiteto_iniciado: 2, arquiteto_concluido: 2,
  designer_iniciado: 3, designer_concluido: 3,
  coder_iniciado: 4, coder_chief_iniciado: 4, coder_chief_concluido: 4,
  sub_agentes_spawn: 4, sub_agentes_concluido: 4, agente_concluido: 4,
  auditoria_iniciada: 5, auditoria_resultado: 5,
  pipeline_concluido: 5,
}

const ETAPAS = ['Analista', 'Comandante', 'Arquiteto', 'Designer', 'Coder', 'Auditor']

const COR_ETAPA: Record<number, string> = {
  0: '#F59E0B', 1: '#8B5CF6', 2: '#06B6D4', 3: '#EC4899', 4: '#10B981', 5: '#EF4444',
}

interface MensagemLog {
  tipo: string
  etapa: number
  msg: string
  ts: number
}

interface NoGrafico {
  id: string
  label: string
  cor: string
  x: number
  y: number
}

interface ArestaGrafico {
  de: string
  para: string
  label?: string
}

// Grafo de conversas entre agentes baseado nos eventos recebidos
function GraficoAgentes({ mensagens }: { mensagens: MensagemLog[] }) {
  const agentesVistos = new Set<number>()
  const arestas: ArestaGrafico[] = []
  let ultimo = -1

  for (const m of mensagens) {
    const e = m.etapa
    if (e >= 0 && e !== ultimo) {
      if (ultimo >= 0 && !arestas.find(a => a.de === String(ultimo) && a.para === String(e))) {
        arestas.push({ de: String(ultimo), para: String(e) })
      }
      agentesVistos.add(e)
      ultimo = e
    }
  }

  const nos: NoGrafico[] = ETAPAS.map((label, i) => ({
    id: String(i),
    label,
    cor: agentesVistos.has(i) ? COR_ETAPA[i] : '#374151',
    x: 60 + i * 110,
    y: 60,
  }))

  // Sub-agentes (coder) se apareceram
  const subAgentes = mensagens.filter(m => m.tipo === 'agente_concluido').length
  const subNos: NoGrafico[] = []
  if (subAgentes > 0) {
    for (let i = 0; i < Math.min(subAgentes, 4); i++) {
      subNos.push({ id: `sub_${i}`, label: `Sub-${i + 1}`, cor: '#10B981', x: 360 + (i - 1.5) * 70, y: 130 })
    }
  }

  const todosNos = [...nos, ...subNos]
  const todasArestas = [...arestas]
  subNos.forEach(sn => {
    todasArestas.push({ de: '4', para: sn.id, label: '' })
  })

  const svgW = 720
  const svgH = subNos.length > 0 ? 200 : 110

  return (
    <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-muted)' }}>
        Grafo de Conversas entre Agentes
      </div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6B7280" />
          </marker>
        </defs>
        {/* Arestas */}
        {todasArestas.map((a, i) => {
          const deNo = todosNos.find(n => n.id === a.de)
          const paraNo = todosNos.find(n => n.id === a.para)
          if (!deNo || !paraNo) return null
          const dx = paraNo.x - deNo.x
          const dy = paraNo.y - deNo.y
          const len = Math.sqrt(dx * dx + dy * dy)
          const nx = dx / len; const ny = dy / len
          const x1 = deNo.x + nx * 28; const y1 = deNo.y + ny * 18
          const x2 = paraNo.x - nx * 28; const y2 = paraNo.y - ny * 18
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={deNo.cor !== '#374151' ? deNo.cor : '#4B5563'}
              strokeWidth={1.5} strokeDasharray={a.label === '' ? '4,3' : 'none'}
              markerEnd="url(#arrow)" opacity={0.7} />
          )
        })}
        {/* Nós */}
        {todosNos.map(no => (
          <g key={no.id}>
            <rect x={no.x - 44} y={no.y - 18} width={88} height={36}
              rx={6} fill={no.cor + '22'} stroke={no.cor} strokeWidth={1.5} />
            <text x={no.x} y={no.y + 5} textAnchor="middle"
              fill={no.cor} fontSize={11} fontWeight={600}>{no.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function FabricaPage() {
  const [ideia, setIdeia] = useState('')
  const [mensagens, setMensagens] = useState<MensagemLog[]>([])
  const [running, setRunning] = useState(false)
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [etapa, setEtapa] = useState(-1)
  const [concluido, setConcluido] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const { data: status } = useQuery({
    queryKey: ['fabrica-status'],
    queryFn: () => apiFetch<{ status: string; fabricaAtiva: boolean }>('/fabrica/status'),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [mensagens])

  function adicionarMsg(tipo: string, msg: string, etapaNum: number) {
    setMensagens(prev => [...prev, { tipo, msg, etapa: etapaNum, ts: Date.now() }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ideia.trim() || running) return
    setRunning(true)
    setMensagens([])
    setEtapa(0)
    setConcluido(false)

    try {
      const data = await apiFetch<{ pipelineId: string; stream_url?: string }>('/fabrica/pipeline/iniciar', {
        method: 'POST',
        body: JSON.stringify({ ideia }),
      })
      const pid = data.pipelineId
      setPipelineId(pid)
      adicionarMsg('sistema', `Pipeline iniciado: ${pid}`, -1)

      const token = localStorage.getItem('qg_auth_token') || ''
      const evtSource = new EventSource(`/api/fabrica/pipeline/${pid}/stream?token=${token}`)

      evtSource.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data)
          const tipo: string = ev.tipo || ''

          // Fim do stream
          if (tipo === 'stream_encerrado' || tipo === 'pipeline_concluido' || tipo === 'pipeline_nao_encontrado') {
            evtSource.close()
            setRunning(false)
            setConcluido(true)
            setEtapa(5)
            adicionarMsg(tipo, ev.mensagem || '✅ Pipeline concluído!', 5)
            return
          }

          if (tipo === 'erro') {
            evtSource.close()
            setRunning(false)
            adicionarMsg('erro', `❌ ${ev.mensagem || ev.message || 'Erro no pipeline'}`, -1)
            return
          }

          // Descobrir etapa pelo tipo de evento
          const etapaNum = TIPO_PARA_ETAPA[tipo] ?? -1
          if (etapaNum >= 0) setEtapa(etapaNum)

          // Montar mensagem legível
          let msgLeg = ''
          if (tipo === 'sub_agentes_spawn') {
            msgLeg = `Spawnando ${ev.total || '?'} sub-agentes em paralelo`
          } else if (tipo === 'agente_concluido') {
            msgLeg = `Sub-agente ${ev.nome || ev.agente || ''} concluído`
          } else if (tipo === 'sub_agentes_concluido') {
            msgLeg = `${ev.concluidos || '?'}/${ev.total || '?'} sub-agentes em ${ev.tempo_ms || '?'}ms`
          } else if (tipo === 'auditoria_resultado') {
            const score = ev.score ?? ev.pontuacao ?? '?'
            const resultado = ev.resultado || ev.status || ''
            msgLeg = `Auditoria: ${resultado} — Score: ${score}/100`
          } else {
            msgLeg = ev.mensagem || ev.message || tipo.replace(/_/g, ' ')
          }

          adicionarMsg(tipo, msgLeg, etapaNum)
        } catch {
          adicionarMsg('raw', e.data, -1)
        }
      }

      evtSource.onerror = () => {
        evtSource.close()
        setRunning(false)
        if (!concluido) {
          adicionarMsg('sistema', '🔌 Conexão encerrada', -1)
        }
      }
    } catch (err) {
      setRunning(false)
      adicionarMsg('erro', `❌ ${(err as Error).message}`, -1)
    }
    setIdeia('')
  }

  const statusFab = String(status?.status ?? '').toLowerCase()
  const fabricaOnline = (statusFab === 'online' || statusFab === 'ok') && status?.fabricaAtiva !== false

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🏭 Fábrica de IA</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Status:{' '}
            <span style={{ color: fabricaOnline ? 'var(--color-success)' : status?.fabrica?.status ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
              {fabricaOnline ? '🟢 Online' : status?.fabrica?.status ? `🔴 ${status.fabrica.status}` : '⏳ Conectando...'}
            </span>
          </p>
        </div>
        {pipelineId && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            ID: {pipelineId}
          </div>
        )}
      </div>

      {/* Pipeline Kanban */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {ETAPAS.map((label, i) => {
          const ativo = i === etapa && running
          const feito = i < etapa || (i === etapa && concluido)
          const cor = COR_ETAPA[i]
          return (
            <div key={label} style={{
              minWidth: 100, padding: '10px 12px',
              borderRadius: 8,
              background: feito ? cor + '22' : ativo ? cor + '33' : 'var(--color-bg-surface)',
              border: `1.5px solid ${ativo || feito ? cor : 'var(--color-border)'}`,
              textAlign: 'center', fontSize: 12,
              color: feito ? cor : ativo ? cor : 'var(--color-text-muted)',
              fontWeight: ativo ? 700 : 400,
              boxShadow: ativo ? `0 0 12px ${cor}55` : 'none',
              transition: 'all 0.3s',
            }}>
              {feito ? '✓ ' : ativo ? '⏳ ' : ''}{label}
            </div>
          )
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <textarea
          value={ideia}
          onChange={(e) => setIdeia(e.target.value)}
          placeholder="Descreva sua ideia de app, sistema ou produto... (mínimo 5 caracteres)"
          rows={3}
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 8, color: 'var(--color-text-primary)',
            fontSize: 14, resize: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', marginBottom: 10,
          }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" disabled={running || ideia.trim().length < 5} style={{
            padding: '10px 24px',
            background: running || ideia.trim().length < 5 ? 'var(--color-border)' : 'var(--color-primary-500)',
            border: 'none', borderRadius: 8,
            color: 'white', fontWeight: 600,
            cursor: running || ideia.trim().length < 5 ? 'not-allowed' : 'pointer',
            boxShadow: running || ideia.trim().length < 5 ? 'none' : 'var(--shadow-glow-primary)',
          }}>
            {running ? '⏳ Processando...' : '🚀 Criar com IA'}
          </button>
          {running && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Agentes trabalhando... acompanhe abaixo
            </span>
          )}
          {concluido && (
            <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
              ✅ Pipeline concluído com sucesso!
            </span>
          )}
        </div>
      </form>

      {/* Gráfico de conversas — aparece quando há eventos */}
      {mensagens.filter(m => m.etapa >= 0).length > 0 && (
        <GraficoAgentes mensagens={mensagens} />
      )}

      {/* Log de eventos */}
      {mensagens.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8, padding: 16,
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--color-text-muted)',
          maxHeight: 320, overflowY: 'auto',
        }} ref={logRef}>
          {mensagens.map((m, i) => {
            const cor = m.etapa >= 0 ? COR_ETAPA[m.etapa] : (m.tipo === 'erro' ? '#EF4444' : '#6B7280')
            const hora = new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            return (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10 }}>
                <span style={{ color: '#4B5563', minWidth: 60 }}>{hora}</span>
                {m.etapa >= 0 && (
                  <span style={{ color: cor, minWidth: 80 }}>[{ETAPAS[m.etapa]}]</span>
                )}
                <span style={{ color: m.tipo === 'erro' ? '#EF4444' : 'var(--color-text-primary)' }}>{m.msg}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
