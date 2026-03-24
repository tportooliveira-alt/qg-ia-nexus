import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'
import { AgentsPage } from './pages/AgentsPage'
import { FabricaPage } from './pages/FabricaPage'
import { TerminalPage } from './pages/TerminalPage'
import { MemoryPage } from './pages/MemoryPage'

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
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="chat"     element={<ChatPage />} />
            <Route path="agents"   element={<AgentsPage />} />
            <Route path="fabrica"  element={<FabricaPage />} />
            <Route path="terminal" element={<TerminalPage />} />
            <Route path="memory"   element={<MemoryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
