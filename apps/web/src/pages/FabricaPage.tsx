import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch, apiStream } from '../api/client'

const ETAPAS = ['Analista', 'Comandante', 'Arquiteto', 'Coder', 'Designer', 'Auditor']

export function FabricaPage() {
  const [ideia, setIdeia] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [_pipelineId, setPipelineId] = useState<string | null>(null)
  const [etapa, setEtapa] = useState(-1)

  const { data: status } = useQuery({
    queryKey: ['fabrica-status'],
    queryFn: () => apiFetch<{ fabrica: { status: string } }>('/fabrica/status'),
    refetchInterval: 30000,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ideia.trim() || running) return
    setRunning(true)
    setLog([])
    setEtapa(0)

    try {
      const data = await apiFetch<{ pipelineId: string }>('/fabrica/orquestrar', {
        method: 'POST',
        body: JSON.stringify({ ideia }),
      })
      const pid = data.pipelineId
      setPipelineId(pid)
      setLog((l) => [...l, `✅ Pipeline iniciado: ${pid}`])

      // Stream de progresso
      apiStream(
        `/fabrica/pipeline/${pid}/stream`,
        {},
        (chunk) => {
          try {
            const ev = JSON.parse(chunk)
            if (ev.etapa) { setEtapa(ETAPAS.findIndex((e) => e.toLowerCase() === ev.etapa.toLowerCase())); setLog((l) => [...l, `▶ ${ev.etapa}: ${ev.mensagem || ''}`]) }
            if (ev.mensagem) setLog((l) => [...l, ev.mensagem])
          } catch { setLog((l) => [...l, chunk]) }
        },
        () => { setRunning(false); setLog((l) => [...l, '🎉 Pipeline concluído!']) },
        (err) => { setRunning(false); setLog((l) => [...l, `❌ Erro: ${err}`]) }
      )
    } catch (err) {
      setRunning(false)
      setLog((l) => [...l, `❌ ${(err as Error).message}`])
    }
    setIdeia('')
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🏭 Fábrica de IA</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Status:{' '}
            <span style={{ color: status?.fabrica?.status === 'online' ? 'var(--color-success)' : status?.fabrica?.status ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
              {status?.fabrica?.status === 'online' ? 'Online' : status?.fabrica?.status ? `Offline — ${status.fabrica.status}` : 'Conectando...'}
            </span>
          </p>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {ETAPAS.map((e, i) => (
          <div key={e} style={{
            minWidth: 110,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: i < etapa ? 'rgba(34,197,94,0.15)' : i === etapa ? 'rgba(124,58,237,0.25)' : 'var(--color-bg-surface)',
            border: `1px solid ${i === etapa ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
            textAlign: 'center',
            fontSize: 12,
            color: i < etapa ? 'var(--color-success)' : i === etapa ? 'var(--color-primary-400)' : 'var(--color-text-muted)',
            fontWeight: i === etapa ? 700 : 400,
            boxShadow: i === etapa ? 'var(--shadow-glow-primary)' : 'none',
          }}>
            {i < etapa ? '✓' : i === etapa && running ? '⏳' : ''} {e}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <textarea
          value={ideia}
          onChange={(e) => setIdeia(e.target.value)}
          placeholder="Descreva sua ideia de app, sistema ou produto..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-primary)',
            fontSize: 14,
            resize: 'none',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            marginBottom: 10,
          }}
        />
        <button type="submit" disabled={running || !ideia.trim()} style={{
          padding: '10px 24px',
          background: running || !ideia.trim() ? 'var(--color-border)' : 'var(--color-primary-500)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'white',
          fontWeight: 600,
          cursor: running || !ideia.trim() ? 'not-allowed' : 'pointer',
          boxShadow: running || !ideia.trim() ? 'none' : 'var(--shadow-glow-primary)',
        }}>
          {running ? '⏳ Processando...' : '🚀 Criar com IA'}
        </button>
      </form>

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          {log.map((line, i) => <div key={i} style={{ padding: '2px 0' }}>{line}</div>)}
        </div>
      )}
    </div>
  )
}
