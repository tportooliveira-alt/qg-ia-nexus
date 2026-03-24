import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface Agent {
  nome: string
  icone?: string
  papel?: string
  descricao?: string
}

export function AgentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<{ agentes: Agent[] }>('/agentes'),
  })

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🤖 Agentes</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Todos os agentes declarativos do QG IA</p>
      </div>

      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Carregando agentes...</p>}
      {error && <p style={{ color: 'var(--color-error)' }}>Erro: {(error as Error).message}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {data?.agentes?.map((agent) => (
          <div key={agent.nome} style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{agent.icone || '🤖'}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.nome}</div>
            {agent.papel && <div style={{ fontSize: 12, color: 'var(--color-primary-400)', marginTop: 4 }}>{agent.papel}</div>}
            {agent.descricao && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>{agent.descricao}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
