import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import { useNavigate } from 'react-router-dom'

interface Agent {
  nome: string
  icone?: string
  papel?: string
  descricao?: string
  ordemPreferencial?: string[]
  capacidades?: string[]
  ferramentas?: string[]
}

interface ProviderResult {
  nome: string
  status: 'ok' | 'erro'
  latencia_ms: number
  resposta?: string
  erro?: string
}

interface ProvidersStatus {
  providers_ok: number
  providers_total: number
  resultados: ProviderResult[]
  testado_em: string
}

const PROVIDER_ICONS: Record<string, string> = {
  Gemini: '✨', Groq: '⚡', Cerebras: '🧠', DeepSeek: '🔵',
  SambaNova: '🦅', xAI: '🤖', Anthropic: '🔶', OpenAI: '🟢',
}

export function AgentsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Agent | null>(null)
  const [testando, setTestando] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<{ agentes: Agent[] }>('/agentes'),
  })

  const { data: providersData, refetch: refetchProviders } = useQuery({
    queryKey: ['providers-status'],
    queryFn: () => apiFetch<ProvidersStatus>('/providers/status'),
    enabled: false, // só carrega quando o usuário clicar
    staleTime: 0,
  })

  const testarMutation = useMutation({
    mutationFn: () => apiFetch<ProvidersStatus>('/providers/status'),
    onMutate: () => setTestando(true),
    onSettled: () => { setTestando(false); refetchProviders() },
  })

  function chatWithAgent(agent: Agent) {
    setSelected(null)
    navigate('/chat', { state: { agente: agent.nome, icone: agent.icone, papel: agent.papel } })
  }

  const provRes: ProviderResult[] = providersData?.resultados || testarMutation.data?.resultados || []

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Agentes & Provedores de IA</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {data?.agentes?.length || 0} agentes registrados — clique para conversar
        </p>
      </div>

      {/* ── Painel de Saúde dos Providers ── */}
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10, padding: 20, marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Status dos Provedores de IA</div>
            {provRes.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {provRes.filter(r => r.status === 'ok').length}/{provRes.length} online
                {providersData?.testado_em && ` · testado ${new Date(providersData.testado_em).toLocaleTimeString('pt-BR')}`}
              </div>
            )}
          </div>
          <button
            onClick={() => testarMutation.mutate()}
            disabled={testando}
            style={{
              padding: '8px 18px',
              background: testando ? 'var(--color-border)' : 'var(--color-primary-500)',
              border: 'none', borderRadius: 6,
              color: 'white', fontWeight: 600, fontSize: 12,
              cursor: testando ? 'not-allowed' : 'pointer',
            }}
          >
            {testando ? '⏳ Testando...' : '🔬 Testar Todos'}
          </button>
        </div>

        {provRes.length === 0 && !testando && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
            Clique em "Testar Todos" para verificar quais IAs estão respondendo agora.
          </p>
        )}

        {testando && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
            Testando 8 providers em paralelo... aguarde até ~15s
          </p>
        )}

        {provRes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {provRes.map(pr => (
              <div key={pr.nome} style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: pr.status === 'ok' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${pr.status === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{PROVIDER_ICONS[pr.nome] || '🔹'}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{pr.nome}</span>
                  <div style={{
                    marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                    background: pr.status === 'ok' ? '#22C55E' : '#EF4444',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {pr.status === 'ok'
                    ? `✅ ${pr.latencia_ms}ms`
                    : `❌ ${pr.erro?.slice(0, 50) || 'erro'}`}
                </div>
                {pr.status === 'ok' && pr.resposta && (
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{pr.resposta}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Grid de Agentes ── */}
      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Carregando agentes...</p>}
      {error && <p style={{ color: 'var(--color-error)' }}>Erro: {(error as Error).message}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        {data?.agentes?.map((agent) => (
          <div
            key={agent.nome}
            onClick={() => setSelected(agent)}
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10, padding: 16,
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = 'var(--color-primary-400)'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 4px 20px rgba(30,224,224,0.1)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = 'var(--color-border)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{agent.icone || '🤖'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{agent.nome}</div>
            {agent.papel && (
              <div style={{ fontSize: 11, color: 'var(--color-primary-400)', marginBottom: 8, fontWeight: 500 }}>
                {agent.papel}
              </div>
            )}
            {agent.descricao && (
              <div style={{
                fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {agent.descricao}
              </div>
            )}
            {agent.ordemPreferencial && agent.ordemPreferencial.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {agent.ordemPreferencial.slice(0, 3).map(p => (
                  <span key={p} style={{
                    fontSize: 10, padding: '2px 6px',
                    background: 'rgba(30,224,224,0.08)',
                    border: '1px solid rgba(30,224,224,0.2)',
                    borderRadius: 4, color: 'var(--color-primary-400)',
                  }}>
                    {PROVIDER_ICONS[p] || ''} {p}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-primary-400)', opacity: 0.6 }}>
              Clique para conversar →
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal de detalhe do agente ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 14, padding: 32,
              maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 12 }}>{selected.icone || '🤖'}</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{selected.nome}</h3>
            {selected.papel && (
              <p style={{ fontSize: 13, color: 'var(--color-primary-400)', textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>
                {selected.papel}
              </p>
            )}
            {selected.descricao && (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                {selected.descricao}
              </p>
            )}

            {selected.capacidades && selected.capacidades.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Capacidades</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.capacidades.map(c => (
                    <span key={c} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--color-text-muted)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.ordemPreferencial && selected.ordemPreferencial.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Provedores de IA</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.ordemPreferencial.map((p, i) => {
                    const provOk = provRes.find(r => r.nome === p)
                    const cor = provOk?.status === 'ok' ? '#22C55E' : provOk?.status === 'erro' ? '#EF4444' : '#64748B'
                    return (
                      <span key={p} style={{
                        fontSize: 12, padding: '4px 10px',
                        background: 'rgba(30,224,224,0.06)',
                        border: `1px solid ${cor}44`,
                        borderRadius: 6, color: cor,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ fontSize: 9, opacity: 0.7 }}>#{i + 1}</span>
                        {PROVIDER_ICONS[p] || ''} {p}
                        {provOk?.status === 'ok' && <span style={{ fontSize: 9 }}>✅</span>}
                        {provOk?.status === 'erro' && <span style={{ fontSize: 9 }}>❌</span>}
                      </span>
                    )
                  })}
                </div>
                {provRes.length === 0 && (
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>
                    Clique em "Testar Todos" para ver quais estão online
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => chatWithAgent(selected)}
                style={{
                  flex: 1, padding: '13px 0',
                  background: 'var(--color-primary-500)',
                  border: 'none', borderRadius: 8,
                  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                  boxShadow: 'var(--shadow-glow-primary)',
                }}
              >
                💬 Conversar com {selected.nome}
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  padding: '13px 18px', background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, color: 'var(--color-text-muted)',
                  cursor: 'pointer', fontSize: 14,
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
