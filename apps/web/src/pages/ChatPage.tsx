import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import { apiStream } from '../api/client'

interface AgentState {
  agente?: string
  icone?: string
  papel?: string
}

export function ChatPage() {
  const location = useLocation()
  const agentState = (location.state as AgentState) || {}
  const agenteAtivo = agentState.agente || 'Nexus Claw'
  const iconeAtivo = agentState.icone || '🦂'
  const papelAtivo = agentState.papel || 'CEO Supremo do QG IA'

  const [input, setInput] = useState('')
  const { messages, isStreaming, addUserMessage, startAssistantMessage, appendChunk, finalizeMessage, clearMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim() || isStreaming) return
    const prompt = input.trim()
    setInput('')
    addUserMessage(prompt)
    const msgId = startAssistantMessage()

    // Passa o agente ativo no contexto do prompt
    const promptComContexto = agenteAtivo !== 'Nexus Claw'
      ? `[Fala como ${agenteAtivo}${agentState.papel ? ` — ${agentState.papel}` : ''}]\n\n${prompt}`
      : prompt

    cancelRef.current = apiStream(
      '/nexus/stream',
      { prompt: promptComContexto },
      (chunk) => appendChunk(msgId, chunk),
      () => finalizeMessage(msgId),
      (err) => { appendChunk(msgId, `\n\n❌ Erro: ${err}`); finalizeMessage(msgId) }
    )
  }

  function cancelar() {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
      finalizeMessage(useChatStore.getState().messages.at(-1)?.id || '')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '12px 20px', flexShrink: 0,
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{iconeAtivo}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{agenteAtivo}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{papelAtivo}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isStreaming && (
            <button
              onClick={cancelar}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, color: '#EF4444', padding: '6px 12px',
                cursor: 'pointer', fontSize: 12,
              }}
            >
              ⏹ Parar
            </button>
          )}
          <button
            onClick={clearMessages}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 6, color: 'var(--color-text-muted)',
              padding: '6px 12px', cursor: 'pointer', fontSize: 12,
            }}
          >
            🗑 Limpar
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{iconeAtivo}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{agenteAtivo}</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{papelAtivo}</p>
            <p style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>Digite algo abaixo para começar</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ fontSize: 22, marginRight: 10, flexShrink: 0, alignSelf: 'flex-start', marginTop: 6 }}>
                {iconeAtivo}
              </div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? 'var(--color-primary-500)' : 'var(--color-bg-elevated)',
              border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
              fontSize: 14, lineHeight: 1.65,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.streaming && (
                <span style={{ color: 'var(--color-accent-400)', marginLeft: 4, animation: 'pulse 1s infinite' }}>▋</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '12px 20px', flexShrink: 0,
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escreva para ${agenteAtivo}... (Enter envia, Shift+Enter = nova linha)`}
            rows={2}
            style={{
              flex: 1, padding: '10px 14px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text-primary)',
              fontSize: 14, resize: 'none', outline: 'none',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={isStreaming || !input.trim()}
            style={{
              padding: '10px 18px',
              background: isStreaming || !input.trim() ? 'var(--color-border)' : 'var(--color-primary-500)',
              border: 'none', borderRadius: 8,
              color: 'white', fontWeight: 700,
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18, flexShrink: 0,
              boxShadow: isStreaming || !input.trim() ? 'none' : 'var(--shadow-glow-primary)',
            }}
          >
            {isStreaming ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}
