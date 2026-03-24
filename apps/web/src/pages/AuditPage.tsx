import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface AuditLog {
  id: string | number
  created_at: string
  agente: string
  acao: string
  status: 'ok' | 'erro' | string
  detalhe: string
  origem: string
  alvo?: string
}

const STATUS_COLORS: Record<string, string> = {
  ok:    'text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/5',
  erro:  'text-red-400 border-red-400/30 bg-red-400/5',
  warn:  'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s atrás`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export function AuditPage() {
  const [filterAgente, setFilterAgente] = useState('')
  const [filterAcao, setFilterAcao] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [limit, setLimit] = useState(50)
  const [expanded, setExpanded] = useState<string | number | null>(null)

  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (filterAgente) params.set('agente', filterAgente)
  if (filterAcao)   params.set('acao', filterAcao)
  if (filterStatus) params.set('status', filterStatus)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filterAgente, filterAcao, filterStatus, limit],
    queryFn: () => apiFetch<{ logs: AuditLog[]; count: number }>(`/audit?${params}`),
    refetchInterval: 15000,
  })

  const logs: AuditLog[] = data?.logs || []

  const agentes = [...new Set(logs.map((l) => l.agente))].sort()
  const acoes   = [...new Set(logs.map((l) => l.acao))].sort()

  return (
    <div className="p-6 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-headline font-bold text-xl text-on-surface">
          <span className="material-symbols-outlined align-middle mr-2 text-primary">security</span>
          Auditoria
        </h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 font-label text-xs transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Atualizar
        </button>
      </div>
      <p className="font-label text-xs text-slate-500 uppercase tracking-widest mb-6">
        {data?.count ?? '...'} eventos · atualiza a cada 15s
      </p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterAgente}
          onChange={(e) => setFilterAgente(e.target.value)}
          className="px-3 py-2 bg-[#0B0D10] border border-white/10 text-slate-300 text-xs font-label outline-none focus:border-primary/50"
        >
          <option value="">Todos os agentes</option>
          {agentes.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterAcao}
          onChange={(e) => setFilterAcao(e.target.value)}
          className="px-3 py-2 bg-[#0B0D10] border border-white/10 text-slate-300 text-xs font-label outline-none focus:border-primary/50"
        >
          <option value="">Todas as ações</option>
          {acoes.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#0B0D10] border border-white/10 text-slate-300 text-xs font-label outline-none focus:border-primary/50"
        >
          <option value="">Todos os status</option>
          <option value="ok">ok</option>
          <option value="erro">erro</option>
          <option value="warn">warn</option>
        </select>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="px-3 py-2 bg-[#0B0D10] border border-white/10 text-slate-300 text-xs font-label outline-none focus:border-primary/50"
        >
          {[25, 50, 100, 200].map((n) => <option key={n} value={n}>Últimos {n}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-[#0B0D10] border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-0 border-b border-white/5 px-4 py-2">
          {['Quando', 'Agente', 'Ação', 'Status', 'Origem'].map((h) => (
            <span key={h} className="font-label text-[9px] uppercase tracking-widest text-slate-600">{h}</span>
          ))}
        </div>

        {isLoading && (
          <div className="px-4 py-8 text-center text-slate-600 font-label text-xs">Carregando logs...</div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-600 font-label text-xs">Nenhum log encontrado.</div>
        )}

        <div className="max-h-[65vh] overflow-y-auto">
          {logs.map((log) => {
            const isOpen = expanded === log.id
            const sc = STATUS_COLORS[log.status] || STATUS_COLORS.ok
            return (
              <div key={log.id} className="border-b border-white/3 last:border-0">
                <div
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 cursor-pointer hover:bg-white/3 transition-all"
                >
                  <span className="font-mono text-[10px] text-slate-600 whitespace-nowrap">
                    {timeAgo(log.created_at)}
                  </span>
                  <span className="font-label text-xs text-slate-300 truncate">{log.agente}</span>
                  <span className="font-mono text-xs text-primary truncate">{log.acao}</span>
                  <span className={`font-label text-[9px] uppercase tracking-widest px-2 py-0.5 border ${sc}`}>
                    {log.status}
                  </span>
                  <span className="font-label text-[9px] text-slate-600">{log.origem}</span>
                </div>

                {isOpen && (
                  <div className="px-4 pb-3 bg-white/2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {log.alvo && (
                        <div>
                          <p className="font-label text-[9px] text-slate-600 uppercase tracking-widest mb-1">Alvo</p>
                          <p className="font-mono text-xs text-slate-400">{log.alvo}</p>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <p className="font-label text-[9px] text-slate-600 uppercase tracking-widest mb-1">Detalhe</p>
                        <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap bg-[#050505] border border-white/5 px-3 py-2 max-h-32 overflow-auto">
                          {(() => {
                            try { return JSON.stringify(JSON.parse(log.detalhe), null, 2) }
                            catch { return log.detalhe }
                          })()}
                        </pre>
                      </div>
                      <div>
                        <p className="font-label text-[9px] text-slate-600 uppercase tracking-widest mb-1">Timestamp</p>
                        <p className="font-mono text-xs text-slate-500">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
