import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import './AppShell.css'

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
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="material-symbols-outlined sidebar-logo-icon">terminal</span>
          <span className="sidebar-logo-text">QG IA Nexus</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="material-symbols-outlined sidebar-nav-icon">{icon}</span>
              <span className="sidebar-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Status dot + logout */}
        <div className="sidebar-status">
          <div className="sidebar-status-dot" />
          <span className="sidebar-status-text">ONLINE</span>
        </div>

        <div className="sidebar-logout-wrap">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span className="material-symbols-outlined sidebar-logout-icon">logout</span>
            <span className="sidebar-logout-label">Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Content Area ── */}
      <div className="app-content">

        {/* TopBar */}
        <header className="app-topbar">
          <span className="topbar-title">NEXUS CLAW | QG IA</span>
          <div className="topbar-status">
            <div className="topbar-status-dot" />
            <span className="topbar-status-text">ONLINE</span>
          </div>
        </header>

        {/* Page content — this is the ONLY scrollable area */}
        <main className="app-main">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
