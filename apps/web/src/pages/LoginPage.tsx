import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { apiFetch } from '../api/client'

export function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Temporariamente define o token para validar
      localStorage.setItem('qg_auth_token', token)
      await apiFetch('/auth/verify')
      login(token)
      navigate('/chat')
    } catch {
      localStorage.removeItem('qg_auth_token')
      setError('Token inválido. Verifique seu QG_AUTH_TOKEN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-base)',
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
        width: 380,
        boxShadow: 'var(--shadow-glow-primary)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>QG IA Nexus</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Centro de Comando</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Token de Acesso
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="QG_AUTH_TOKEN"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          />

          {error && (
            <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '12px',
              background: loading || !token ? 'var(--color-border)' : 'var(--color-primary-500)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading || !token ? 'not-allowed' : 'pointer',
              boxShadow: loading || !token ? 'none' : 'var(--shadow-glow-primary)',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar no QG'}
          </button>
        </form>
      </div>
    </div>
  )
}
