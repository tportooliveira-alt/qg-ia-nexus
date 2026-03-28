import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChatPage } from './pages/ChatPage'
import { AgentsPage } from './pages/AgentsPage'
import { FabricaPage } from './pages/FabricaPage'
import { TerminalPage } from './pages/TerminalPage'
import { MemoryPage } from './pages/MemoryPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { AuditPage } from './pages/AuditPage'
import { MCPPage } from './pages/MCPPage'
import { VPSPage } from './pages/VPSPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chat"      element={<ChatPage />} />
            <Route path="agents"    element={<AgentsPage />} />
            <Route path="fabrica"   element={<FabricaPage />} />
            <Route path="terminal"   element={<TerminalPage />} />
            <Route path="memory"     element={<MemoryPage />} />
            <Route path="knowledge"  element={<KnowledgePage />} />
            <Route path="audit"      element={<AuditPage />} />
            <Route path="mcp"        element={<MCPPage />} />
            <Route path="vps"        element={<VPSPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
