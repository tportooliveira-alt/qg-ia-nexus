import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import { useNavigate } from 'react-router-dom'

interface Agent {
  nome: string
  icone?: string
  papel?: string
  descricao?: string
}

export function AgentsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Agent | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<{ agentes: Agent[] }>('/agentes'),
  })

  function chatWithAgent(agent: Agent) {
    setSelected(null)
    navigate('/chat', { state: { agente: agent.nome } })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Agentes</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Todos os agentes declarativos do QG IA — clique para ver detalhes
        </p>
      </div>

      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Carregando agentes...</p>}
      {error && <p style={{ color: 'var(--color-error)' }}>Erro: {(error as Error).message}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {data?.agentes?.map((agent) => (
          <div
            key={agent.nome}
            onClick={() => setSelected(agent)}
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary-400)'
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
              ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{agent.icone || '🤖'}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.nome}</div>
            {agent.papel && <div style={{ fontSize: 12, color: 'var(--color-primary-400)', marginTop: 4 }}>{agent.papel}</div>}
            {agent.descricao && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {agent.descricao}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-primary-400)', opacity: 0.7 }}>
              Clique para ver detalhes →
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 32,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12, textAlign: 'center' }}>{selected.icone || '🤖'}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{selected.nome}</h3>
            {selected.papel && (
              <p style={{ fontSize: 13, color: 'var(--color-primary-400)', textAlign: 'center', marginBottom: 16 }}>
                {selected.papel}
              </p>
            )}
            {selected.descricao && (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                {selected.descricao}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => chatWithAgent(selected)}
                style={{
                  flex: 1, padding: '12px 0',
                  background: 'var(--color-primary-500)',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}
              >
                💬 Conversar com este agente
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  padding: '12px 16px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14,
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
