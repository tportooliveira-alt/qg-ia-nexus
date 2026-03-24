import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/dashboard', icon: 'dashboard',              label: 'Dashboard' },
  { to: '/chat',      icon: 'forum',                  label: 'Chat'      },
  { to: '/agents',    icon: 'smart_toy',               label: 'Agents'    },
  { to: '/fabrica',   icon: 'precision_manufacturing', label: 'Fábrica'   },
  { to: '/knowledge', icon: 'database',                label: 'Knowledge' },
  { to: '/terminal',  icon: 'terminal',                label: 'Terminal'  },
  { to: '/memory',    icon: 'memory',                  label: 'Memory'    },
  { to: '/audit',     icon: 'security',                label: 'Audit'     },
  { to: '/mcp',       icon: 'account_tree',            label: 'MCP'       },
]

export function AppShell() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="bg-[#050505] text-on-surface font-body selection:bg-primary/30">

      {/* ── TopAppBar ── */}
      <header className="fixed top-0 w-full h-12 z-50 bg-[#050505] border-b border-white/5 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1EE0E0]">terminal</span>
          <span className="font-headline font-bold text-[#1EE0E0] tracking-tighter">QG IA Nexus</span>
        </div>
        <div className="font-headline tracking-tighter text-sm uppercase text-[#1EE0E0] flex gap-4 items-center">
          <span className="text-slate-400 hidden md:inline">NEXUS CLAW | ONLINE</span>
          <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse"></div>
        </div>
      </header>

      {/* ── NavigationDrawer ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="fixed left-0 top-12 h-full w-16 hover:w-48 transition-all duration-300 z-40 bg-[#050505] border-r border-white/5 flex flex-col pt-4 gap-2 overflow-hidden group"
      >
        <div className="px-4 mb-4">
          <span className="font-label text-[11px] uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            SYSTEM_OS
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 transition-all duration-200 ease-in-out ` +
                (isActive
                  ? 'text-[#1EE0E0] border-l-2 border-[#1EE0E0] bg-[#1EE0E0]/5'
                  : 'text-slate-500 hover:text-[#1EE0E0] hover:bg-white/5 border-l-2 border-transparent')
              }
            >
              <span className="material-symbols-outlined shrink-0">{icon}</span>
              <span className="font-label text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto mb-20 px-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full py-3 text-slate-500 hover:text-red-400 transition-colors"
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            <span className="font-label text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 whitespace-nowrap">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* ── Content Area ── */}
      <div className="transition-all duration-300 mt-12 h-[calc(100vh-3rem)] overflow-y-auto" style={{ marginLeft: expanded ? '192px' : '64px' }}>
        <Outlet />
      </div>

    </div>
  )
}
