import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/dashboard', icon: 'dashboard',              label: 'Dashboard' },
  { to: '/chat',      icon: 'forum',                  label: 'Chat'      },
  { to: '/agents',    icon: 'smart_toy',               label: 'Agentes'   },
  { to: '/fabrica',   icon: 'precision_manufacturing', label: 'Fábrica'   },
  { to: '/knowledge', icon: 'database',                label: 'Knowledge' },
  { to: '/terminal',  icon: 'terminal',                label: 'Terminal'  },
  { to: '/memory',    icon: 'memory',                  label: 'Memória'   },
  { to: '/audit',     icon: 'security',                label: 'Audit'     },
  { to: '/mcp',       icon: 'account_tree',            label: 'MCP'       },
  { to: '/vps',       icon: 'dns',                     label: 'VPS'       },
]

export function AppShell() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    // Layout raiz: flex row, 100dvh, sem overflow global
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#050505', color: 'var(--color-text-primary)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="group"
        style={{
          width: 64,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 40,
          background: '#050505',
        }}
        onMouseEnter={e => (e.currentTarget.style.width = '192px')}
        onMouseLeave={e => (e.currentTarget.style.width = '64px')}
      >
        {/* Logo */}
        <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: '#1EE0E0', flexShrink: 0 }}>terminal</span>
          <span style={{ marginLeft: 12, fontWeight: 700, color: '#1EE0E0', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: 14, letterSpacing: '-0.5px' }}>
            QG IA Nexus
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '10px 16px',
                textDecoration: 'none',
                color: isActive ? '#1EE0E0' : '#64748B',
                borderLeft: isActive ? '2px solid #1EE0E0' : '2px solid transparent',
                background: isActive ? 'rgba(30,224,224,0.06)' : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.borderLeftColor.includes('1EE0E0')) {
                  el.style.color = '#1EE0E0'
                  el.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                if (!el.style.borderLeftColor.includes('1EE0E0')) {
                  el.style.color = '#64748B'
                  el.style.background = 'transparent'
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', overflow: 'hidden' }}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Status dot + logout */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: '#22C55E', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ONLINE</span>
        </div>

        <div style={{ padding: '0 0 16px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 16px', background: 'none', border: 'none',
              color: '#475569', cursor: 'pointer', width: '100%',
              transition: 'color 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#EF4444')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#475569')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, flexShrink: 0 }}>logout</span>
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TopBar */}
        <header style={{
          height: 48, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
          background: '#050505',
        }}>
          <span style={{ fontSize: 12, color: '#334155', fontFamily: 'monospace', letterSpacing: '0.05em' }}>NEXUS CLAW | QG IA</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ONLINE</span>
          </div>
        </header>

        {/* Page content — this is the ONLY scrollable area */}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}
