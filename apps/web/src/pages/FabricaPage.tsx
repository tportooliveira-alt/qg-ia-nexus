import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface MensagemLog {
  tipo: string
  etapa: number
  msg: string
  ts: number
  conteudo?: string
}

interface EstadoAgente {
  status: 'idle' | 'working' | 'done' | 'error'
  output: string[]
  iniciouEm?: number
  concluiuEm?: number
}

interface ChaveConfig {
  env_var: string
  configurada: boolean
  mascara: string
}

interface ConfigApiKeys {
  chaves: Record<string, ChaveConfig>
  token_volume: string
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const ETAPAS = [
  { id: 'analista',   label: 'Analista',   emoji: '🔍', cor: '#F59E0B' },
  { id: 'comandante', label: 'Comandante', emoji: '⚔️',  cor: '#8B5CF6' },
  { id: 'arquiteto',  label: 'Arquiteto',  emoji: '🏗️',  cor: '#06B6D4' },
  { id: 'designer',   label: 'Designer',   emoji: '🎨',  cor: '#EC4899' },
  { id: 'coder',      label: 'CoderChief', emoji: '💻',  cor: '#10B981' },
  { id: 'auditor',    label: 'Auditor',    emoji: '🔎',  cor: '#EF4444' },
]

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

const PROVIDERS = [
  { id: 'gemini',    label: 'Gemini',     placeholder: 'AIza...' },
  { id: 'groq',      label: 'Groq',       placeholder: 'gsk_...' },
  { id: 'cerebras',  label: 'Cerebras',   placeholder: 'csk-...' },
  { id: 'sambanovo', label: 'SambaNova',  placeholder: 'SB-...' },
  { id: 'deepseek',  label: 'DeepSeek',   placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic',  placeholder: 'sk-ant-...' },
  { id: 'openai',    label: 'OpenAI',     placeholder: 'sk-...' },
  { id: 'xai',       label: 'xAI / Grok', placeholder: 'xai-...' },
]

// ─── Estado inicial dos agentes ─────────────────────────────────────────────

function estadoInicial(): Record<string, EstadoAgente> {
  const e: Record<string, EstadoAgente> = {}
  for (const ag of ETAPAS) e[ag.id] = { status: 'idle', output: [] }
  return e
}

// ─── Componente: Card de Agente ──────────────────────────────────────────────

function CardAgente({
  etapa, estado
}: {
  etapa: typeof ETAPAS[0]
  estado: EstadoAgente
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardRef.current) cardRef.current.scrollTop = cardRef.current.scrollHeight
  }, [estado.output])

  const duracao = estado.iniciouEm && estado.concluiuEm
    ? `${((estado.concluiuEm - estado.iniciouEm) / 1000).toFixed(1)}s`
    : estado.iniciouEm && estado.status === 'working'
    ? '...'
    : null

  const corStatus = {
    idle:    'var(--color-border)',
    working: etapa.cor,
    done:    etapa.cor,
    error:   '#EF4444',
  }[estado.status]

  const bgCard = estado.status === 'working'
    ? `${etapa.cor}18`
    : estado.status === 'done'
    ? `${etapa.cor}10`
    : 'var(--color-bg-surface)'

  return (
    <div style={{
      borderRadius: 12,
      border: `1.5px solid ${estado.status !== 'idle' ? etapa.cor : 'var(--color-border)'}`,
      background: bgCard,
      boxShadow: estado.status === 'working' ? `0 0 16px ${etapa.cor}44` : 'none',
      transition: 'all 0.3s',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 160,
      overflow: 'hidden',
    }}>
      {/* Header do card */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${estado.status !== 'idle' ? etapa.cor + '33' : 'var(--color-border)'}`,
        background: estado.status !== 'idle' ? etapa.cor + '15' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{etapa.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: estado.status !== 'idle' ? etapa.cor : 'var(--color-text-muted)' }}>
            {etapa.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {duracao && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{duracao}</span>
          )}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: corStatus,
            boxShadow: estado.status === 'working' ? `0 0 8px ${etapa.cor}` : 'none',
            animation: estado.status === 'working' ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
          }} />
        </div>
      </div>

      {/* Output do agente */}
      <div
        ref={cardRef}
        style={{
          flex: 1,
          padding: '10px 14px',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.6,
          overflowY: 'auto',
          maxHeight: 140,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {estado.status === 'idle' && (
          <span style={{ opacity: 0.4, fontStyle: 'italic' }}>aguardando...</span>
        )}
        {estado.status === 'working' && estado.output.length === 0 && (
          <span style={{ color: etapa.cor }}>⏳ trabalhando...</span>
        )}
        {estado.output.map((linha, i) => (
          <div key={i} style={{
            marginBottom: 2,
            color: i === estado.output.length - 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
          }}>
            {linha}
          </div>
        ))}
        {estado.status === 'done' && (
          <div style={{ color: etapa.cor, fontWeight: 700, marginTop: 4 }}>✓ concluído</div>
        )}
        {estado.status === 'error' && (
          <div style={{ color: '#EF4444', marginTop: 4 }}>✗ erro</div>
        )}
      </div>
    </div>
  )
}

// ─── Componente: Painel de Configurações ─────────────────────────────────────

function PainelConfiguracoes() {
  const queryClient = useQueryClient()
  const [editando, setEditando] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [volume, setVolume] = useState<string>('normal')

  const { data: configData, isLoading } = useQuery({
    queryKey: ['config-api-keys'],
    queryFn: () => apiFetch<ConfigApiKeys>('/config/api-keys'),
  })

  useEffect(() => {
    if (configData?.token_volume) setVolume(configData.token_volume)
  }, [configData])

  async function salvarChave(provider: string) {
    const novaChave = (editando[provider] || '').trim()
    if (!novaChave) return
    setSalvando(provider)
    try {
      await apiFetch('/config/api-key', {
        method: 'POST',
        body: JSON.stringify({ provider, chave: novaChave }),
      })
      setFeedback(prev => ({ ...prev, [provider]: { ok: true, msg: '✅ Salvo!' } }))
      setEditando(prev => ({ ...prev, [provider]: '' }))
      queryClient.invalidateQueries({ queryKey: ['config-api-keys'] })
    } catch (err) {
      setFeedback(prev => ({ ...prev, [provider]: { ok: false, msg: `❌ ${(err as Error).message}` } }))
    } finally {
      setSalvando(null)
      setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[provider]; return n }), 3000)
    }
  }

  async function salvarVolume(v: string) {
    try {
      await apiFetch('/config/token-volume', { method: 'POST', body: JSON.stringify({ volume: v }) })
      setVolume(v)
      setFeedback(prev => ({ ...prev, volume: { ok: true, msg: '✅ Salvo!' } }))
    } catch (err) {
      setFeedback(prev => ({ ...prev, volume: { ok: false, msg: `❌ ${(err as Error).message}` } }))
    } finally {
      setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n['volume']; return n }), 3000)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚙️ Configurações</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Atualize as chaves de API sem precisar de terminal. As mudanças entram em vigor imediatamente.
      </p>

      {/* Token Volume */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 20,
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          🎚️ Volume de Tokens por Chamada
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['eco', 'normal', 'power'] as const).map(v => (
            <button
              key={v}
              onClick={() => salvarVolume(v)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: `1.5px solid ${volume === v ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                background: volume === v ? 'var(--color-primary-500)' : 'var(--color-bg-elevated)',
                color: volume === v ? 'white' : 'var(--color-text-muted)',
                fontWeight: volume === v ? 700 : 400,
                cursor: 'pointer',
                fontSize: 13,
                textTransform: 'capitalize',
              }}
            >
              {v === 'eco' ? '🌱 eco' : v === 'normal' ? '⚡ normal' : '🔥 power'}
            </button>
          ))}
          {feedback['volume'] && (
            <span style={{ fontSize: 12, color: feedback['volume'].ok ? 'var(--color-success)' : '#EF4444' }}>
              {feedback['volume'].msg}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, marginBottom: 0 }}>
          eco = menos tokens (mais rápido, mais barato) · power = mais tokens (melhor qualidade)
        </p>
      </div>

      {/* API Keys */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '16px 20px',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>
          🔑 Chaves de API dos Provedores de IA
        </div>

        {isLoading ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROVIDERS.map(prov => {
              const info = (configData as ConfigApiKeys | undefined)?.chaves?.[prov.id]
              const estaEditando = !!(editando[prov.id] || '').trim()
              const fb = feedback[prov.id]
              return (
                <div key={prov.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: 10,
                  alignItems: 'center',
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  {/* Label + status */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{prov.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      {info?.configurada ? (
                        <span style={{ color: 'var(--color-success)' }}>● {info.mascara}</span>
                      ) : (
                        <span style={{ color: '#EF4444' }}>● não configurada</span>
                      )}
                    </div>
                  </div>

                  {/* Input */}
                  <input
                    type="password"
                    value={editando[prov.id] || ''}
                    onChange={e => setEditando(prev => ({ ...prev, [prov.id]: e.target.value }))}
                    placeholder={info?.configurada ? `Nova chave (atual: ${info.mascara})` : prov.placeholder}
                    onKeyDown={e => { if (e.key === 'Enter') salvarChave(prov.id) }}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--color-bg-elevated)',
                      border: `1px solid ${estaEditando ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                      borderRadius: 8,
                      color: 'var(--color-text-primary)',
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />

                  {/* Botão salvar + feedback */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <button
                      disabled={!estaEditando || salvando === prov.id}
                      onClick={() => salvarChave(prov.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: estaEditando && salvando !== prov.id
                          ? 'var(--color-primary-500)'
                          : 'var(--color-border)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: estaEditando && salvando !== prov.id ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {salvando === prov.id ? '...' : 'Salvar'}
                    </button>
                    {fb && (
                      <span style={{ fontSize: 11, color: fb.ok ? 'var(--color-success)' : '#EF4444' }}>
                        {fb.msg}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 16, marginBottom: 0 }}>
          💡 As chaves são salvas no <code>.env</code> do servidor e ficam ativas imediatamente (sem reiniciar).
        </p>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────────────────────

export function FabricaPage() {
  const [aba, setAba] = useState<'pipeline' | 'config'>('pipeline')
  const [ideia, setIdeia] = useState('')
  const [mensagens, setMensagens] = useState<MensagemLog[]>([])
  const [running, setRunning] = useState(false)
  const [pipelineId, setPipelineId] = useState<string | null>(null)
  const [_etapaAtual, setEtapaAtual] = useState(-1)
  const [concluido, setConcluido] = useState(false)
  const [agentes, setAgentes] = useState<Record<string, EstadoAgente>>(estadoInicial())
  const logRef = useRef<HTMLDivElement>(null)
  const concluidoRef = useRef(false)

  const { data: status } = useQuery({
    queryKey: ['fabrica-status'],
    queryFn: () => apiFetch<{ status: string; fabricaAtiva: boolean }>('/fabrica/status'),
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [mensagens])

  function adicionarMsg(tipo: string, msg: string, etapaNum: number, conteudo?: string) {
    setMensagens(prev => [...prev, { tipo, msg, etapa: etapaNum, ts: Date.now(), conteudo }])
  }

  function atualizarAgente(etapaIdx: number, update: Partial<EstadoAgente> & { appendOutput?: string }) {
    const etapa = ETAPAS[etapaIdx]
    if (!etapa) return
    setAgentes(prev => {
      const atual = { ...prev[etapa.id] }
      if (update.status) atual.status = update.status
      if (update.iniciouEm) atual.iniciouEm = update.iniciouEm
      if (update.concluiuEm) atual.concluiuEm = update.concluiuEm
      if (update.appendOutput) atual.output = [...atual.output, update.appendOutput]
      return { ...prev, [etapa.id]: atual }
    })
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ideia.trim() || running) return
    setRunning(true)
    setMensagens([])
    setEtapaAtual(0)
    setConcluido(false)
    concluidoRef.current = false
    setAgentes(estadoInicial())

    try {
      const data = await apiFetch<{ pipelineId: string; stream_url?: string }>('/fabrica/pipeline/iniciar', {
        method: 'POST',
        body: JSON.stringify({ ideia }),
      })
      const pid = data.pipelineId
      setPipelineId(pid)
      adicionarMsg('sistema', `Pipeline ${pid} iniciado`, -1)

      const token = localStorage.getItem('qg_auth_token') || ''
      const evtSource = new EventSource(`/api/fabrica/pipeline/${pid}/stream?token=${token}`)

      evtSource.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data)
          const tipo: string = ev.tipo || ''

          if (tipo === 'stream_encerrado' || tipo === 'pipeline_concluido' || tipo === 'pipeline_nao_encontrado') {
            evtSource.close()
            setRunning(false)
            setConcluido(true)
            concluidoRef.current = true
            setEtapaAtual(5)
            atualizarAgente(5, { status: 'done', concluiuEm: Date.now() })
            adicionarMsg(tipo, ev.mensagem || '✅ Pipeline concluído!', 5)
            return
          }

          if (tipo === 'erro') {
            evtSource.close()
            setRunning(false)
            adicionarMsg('erro', `❌ ${ev.mensagem || ev.message || 'Erro no pipeline'}`, -1)
            return
          }

          const etapaNum = TIPO_PARA_ETAPA[tipo] ?? -1
          if (etapaNum >= 0) setEtapaAtual(etapaNum)

          // Atualizar estado do card do agente
          if (tipo.endsWith('_iniciado')) {
            atualizarAgente(etapaNum, { status: 'working', iniciouEm: Date.now() })
          } else if (tipo.endsWith('_concluido') || tipo === 'auditoria_resultado') {
            atualizarAgente(etapaNum, { status: 'done', concluiuEm: Date.now() })
          }

          // Montar mensagem para o card e para o log
          let msgLeg = ''
          let conteudoCard = ''

          if (tipo === 'sub_agentes_spawn') {
            msgLeg = `Spawnando ${ev.total || '?'} sub-agentes em paralelo`
            conteudoCard = msgLeg
          } else if (tipo === 'agente_concluido') {
            msgLeg = `Sub-agente ${ev.nome || ev.agente || ''} concluído`
            conteudoCard = msgLeg
          } else if (tipo === 'sub_agentes_concluido') {
            msgLeg = `${ev.concluidos || '?'}/${ev.total || '?'} sub-agentes em ${ev.tempo_ms || '?'}ms`
            conteudoCard = msgLeg
          } else if (tipo === 'auditoria_resultado') {
            const score = ev.score ?? ev.pontuacao ?? '?'
            const resultado = ev.resultado || ev.status || ''
            msgLeg = `Auditoria: ${resultado} — Score: ${score}/100`
            conteudoCard = msgLeg
          } else {
            msgLeg = ev.mensagem || ev.message || tipo.replace(/_/g, ' ')
            // Conteúdo rico do agente (resultado, análise, etc)
            conteudoCard = ev.resultado || ev.analise || ev.estrutura || ev.arquitetura || ev.design || ev.codigo || ev.mensagem || ev.message || ''
          }

          // Adiciona output ao card do agente
          if (etapaNum >= 0 && conteudoCard) {
            const truncado = conteudoCard.length > 200 ? conteudoCard.slice(0, 200) + '...' : conteudoCard
            atualizarAgente(etapaNum, { appendOutput: truncado })
          }

          adicionarMsg(tipo, msgLeg, etapaNum, conteudoCard)
        } catch {
          adicionarMsg('raw', e.data, -1)
        }
      }

      evtSource.onerror = () => {
        evtSource.close()
        setRunning(false)
        if (!concluidoRef.current) {
          adicionarMsg('sistema', '🔌 Conexão encerrada', -1)
        }
      }
    } catch (err) {
      setRunning(false)
      adicionarMsg('erro', `❌ ${(err as Error).message}`, -1)
    }
    setIdeia('')
  }, [ideia, running])

  const statusFab = String(status?.status ?? '').toLowerCase()
  const fabricaOnline = (statusFab === 'online' || statusFab === 'ok') && status?.fabricaAtiva !== false

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* CSS animation para o dot pulsante */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🏭 Fábrica de IA</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Status:{' '}
            <span style={{ color: fabricaOnline ? 'var(--color-success)' : status?.status ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
              {fabricaOnline ? '🟢 Online' : status?.status ? `🔴 ${status.status}` : '⏳ Conectando...'}
            </span>
          </p>
        </div>
        {/* Abas */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pipeline', 'config'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAba(a)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: `1.5px solid ${aba === a ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                background: aba === a ? 'var(--color-primary-500)' : 'var(--color-bg-elevated)',
                color: aba === a ? 'white' : 'var(--color-text-muted)',
                fontWeight: aba === a ? 700 : 400,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {a === 'pipeline' ? '🏭 Pipeline' : '⚙️ Config'}
            </button>
          ))}
        </div>
      </div>

      {/* ABA: Configurações */}
      {aba === 'config' && <PainelConfiguracoes />}

      {/* ABA: Pipeline */}
      {aba === 'pipeline' && (
        <>
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
                boxSizing: 'border-box',
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
                  Agentes trabalhando... veja os cards abaixo
                </span>
              )}
              {concluido && (
                <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
                  ✅ Pipeline concluído!
                </span>
              )}
              {pipelineId && (
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                  ID: {pipelineId}
                </span>
              )}
            </div>
          </form>

          {/* Cards dos Agentes — grid 3x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}>
            {ETAPAS.map((etapa) => (
              <CardAgente
                key={etapa.id}
                etapa={etapa}
                estado={agentes[etapa.id]}
              />
            ))}
          </div>

          {/* Log de eventos compacto */}
          {mensagens.length > 0 && (
            <div style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}>
              <div style={{
                padding: '8px 16px',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>📋 Log de Eventos</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                  {mensagens.length} eventos
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--color-text-muted)',
                  maxHeight: 200, overflowY: 'auto',
                  padding: '8px 16px',
                }}
                ref={logRef}
              >
                {mensagens.map((m, i) => {
                  const cor = m.etapa >= 0 ? ETAPAS[m.etapa]?.cor : (m.tipo === 'erro' ? '#EF4444' : '#6B7280')
                  const hora = new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  return (
                    <div key={i} style={{
                      padding: '2px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex', gap: 10,
                    }}>
                      <span style={{ color: '#4B5563', minWidth: 58 }}>{hora}</span>
                      {m.etapa >= 0 && (
                        <span style={{ color: cor, minWidth: 78 }}>[{ETAPAS[m.etapa]?.label}]</span>
                      )}
                      <span style={{ color: m.tipo === 'erro' ? '#EF4444' : 'var(--color-text-primary)' }}>
                        {m.msg}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
