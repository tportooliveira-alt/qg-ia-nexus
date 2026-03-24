import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../api/client'

interface TerminalEntry { cmd: string; output: string; ok: boolean }

export function TerminalPage() {
  const [cmd, setCmd] = useState('')
  const [history, setHistory] = useState<TerminalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  async function run() {
    if (!cmd.trim() || loading) return
    const command = cmd.trim()
    setCmd('')
    setLoading(true)
    try {
      const data = await apiFetch<{ output?: string; error?: string; status?: string }>('/terminal/exec', {
        method: 'POST',
        body: JSON.stringify({ command }),
      })
      setHistory((h) => [...h, { cmd: command, output: data.output || JSON.stringify(data), ok: data.status !== 'erro' }])
    } catch (err) {
      setHistory((h) => [...h, { cmd: command, output: (err as Error).message, ok: false }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A0A0A' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⌨️</span>
        <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Terminal — Nexus Auto-Healing</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ color: 'var(--color-primary-400)' }}>$ {entry.cmd}</div>
            <pre style={{ color: entry.ok ? 'var(--color-success)' : 'var(--color-error)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 4 }}>
              {entry.output}
            </pre>
          </div>
        ))}
        {loading && <div style={{ color: 'var(--color-accent-400)' }}>⏳ Executando...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
        <span style={{ color: 'var(--color-primary-400)', fontFamily: 'var(--font-mono)', lineHeight: '38px' }}>$</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="comando..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button onClick={run} disabled={loading} style={{
          padding: '8px 16px',
          background: 'var(--color-primary-500)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12,
        }}>
          ▶ Run
        </button>
      </div>
    </div>
  )
}
