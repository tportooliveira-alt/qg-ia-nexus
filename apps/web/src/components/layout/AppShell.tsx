import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/chat',     icon: '💬', label: 'Chat' },
  { to: '/agents',   icon: '🤖', label: 'Agentes' },
  { to: '/fabrica',  icon: '🏭', label: 'Fábrica IA' },
  { to: '/terminal', icon: '⌨️',  label: 'Terminal' },
  { to: '/memory',   icon: '🧠', label: 'Memória' },
]

export function AppShell() {
  const [open, setOpen] = useState(true)
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Sidebar */}
      <aside style={{
        width: open ? 220 : 60,
        background: 'var(--color-bg-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          {open && <span style={{ fontWeight: 700, color: 'var(--color-primary-400)', whiteSpace: 'nowrap' }}>QG IA Nexus</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary-400)' : 'var(--color-text-muted)',
              background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--color-primary-500)' : '3px solid transparent',
              fontSize: 14,
              whiteSpace: 'nowrap',
            })}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {open && label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
          <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textAlign: 'left', fontSize: 18 }}>
            {open ? '◀' : '▶'}
          </button>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', textAlign: 'left', fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
            <span>🚪</span>{open && 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
