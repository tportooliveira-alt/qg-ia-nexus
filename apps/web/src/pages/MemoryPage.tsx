import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface Memory {
  id: string
  agente: string
  categoria: string
  conteudo: string
  projeto?: string
  criado_em?: string
}

export function MemoryPage() {
  const [agente, setAgente] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['memories', agente],
    queryFn: () => apiFetch<{ memorias: Memory[] }>(`/agent/memory?limit=50${agente ? `&agente=${agente}` : ''}`),
  })

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🧠 Memória Persistente</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Supabase — últimas 50 entradas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={agente}
            onChange={(e) => setAgente(e.target.value)}
            placeholder="filtrar por agente..."
            style={{ padding: '6px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }}
          />
          <button onClick={() => refetch()} style={{ padding: '6px 14px', background: 'var(--color-primary-500)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', fontSize: 13 }}>↻</button>
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Carregando memórias...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data?.memorias?.map((m) => (
          <div key={m.id} style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--color-primary-400)', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{m.agente}</span>
              <span style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-accent-400)', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{m.categoria}</span>
              {m.projeto && <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{m.projeto}</span>}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{m.conteudo?.slice(0, 300)}{m.conteudo?.length > 300 ? '...' : ''}</p>
            {m.criado_em && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>{new Date(m.criado_em).toLocaleString('pt-BR')}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
