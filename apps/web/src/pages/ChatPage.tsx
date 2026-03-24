import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { apiStream } from '../api/client'

export function ChatPage() {
  const [input, setInput] = useState('')
  const { messages, isStreaming, addUserMessage, startAssistantMessage, appendChunk, finalizeMessage, clearMessages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function send() {
    if (!input.trim() || isStreaming) return
    const prompt = input.trim()
    setInput('')
    addUserMessage(prompt)
    const msgId = startAssistantMessage()

    cancelRef.current = apiStream(
      '/nexus/stream',
      { prompt },
      (chunk) => appendChunk(msgId, chunk),
      () => finalizeMessage(msgId),
      (err) => { appendChunk(msgId, `\n\n❌ Erro: ${err}`); finalizeMessage(msgId) }
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>💬 Chat — Nexus Claw</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>CEO Supremo do QG IA</p>
        </div>
        <button onClick={clearMessages} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
          Limpar
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <p>Como posso ajudar?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--color-primary-500)' : 'var(--color-bg-elevated)',
              border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content}
              {msg.streaming && <span style={{ color: 'var(--color-accent-400)', marginLeft: 4 }}>▋</span>}
              {msg.provider && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>via {msg.provider}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            rows={2}
            style={{
              flex: 1,
              padding: '12px 14px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            onClick={send}
            disabled={isStreaming || !input.trim()}
            style={{
              padding: '0 20px',
              background: isStreaming || !input.trim() ? 'var(--color-border)' : 'var(--color-primary-500)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontWeight: 600,
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18,
              boxShadow: isStreaming || !input.trim() ? 'none' : 'var(--shadow-glow-primary)',
            }}
          >
            {isStreaming ? '⏳' : '➤'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Shift+Enter para nova linha · Enter para enviar
        </p>
      </div>
    </div>
  )
}
