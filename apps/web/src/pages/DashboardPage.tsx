import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import { useNavigate } from 'react-router-dom'

interface NexusStatus {
  status: string
  agente: string
  uptime: number
  token_volume: string
  memoria: { rss: string; heapUsed: string }
  servicos: Record<string, string>
}

interface AuditLog {
  id: string | number
  created_at?: string
  criado_em?: string
  agente: string
  acao: string
  status: 'ok' | 'erro' | 'warn' | string
  detalhe?: string
  origem?: string
}

interface FabricaStatus {
  fabrica?: FabricaStatus
  ativos?: number
  pipelines?: Array<{ id: string; usuario_id: string }>
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function timeAgo(iso: string | undefined) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h`
}

const STATUS_DOT: Record<string, string> = {
  ok: '#22C55E',
  erro: '#EF4444',
  warn: '#F59E0B',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [pesquisando, setPesquisando] = useState(false)
  const [pesquisaMsg, setPesquisaMsg] = useState('')

  const { data: nexusStatus } = useQuery({
    queryKey: ['nexus-status'],
    queryFn: () => apiFetch<NexusStatus>('/status'),
    refetchInterval: 30000,
  })

  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['dashboard-audit'],
    queryFn: () => apiFetch<{ logs: AuditLog[]; count: number }>('/audit?limit=8'),
    refetchInterval: 15000,
  })

  const { data: fabricaData } = useQuery({
    queryKey: ['fabrica-dashboard'],
    queryFn: () => apiFetch<FabricaStatus>('/fabrica/status').then(r => r.fabrica || r).catch(() => ({} as FabricaStatus)),
    refetchInterval: 20000,
  })

  const pesquisarMutation = useMutation({
    mutationFn: () => apiFetch<{ status: string }>('/nexus/pesquisa', { method: 'POST', body: '{}' }),
    onMutate: () => { setPesquisando(true); setPesquisaMsg('') },
    onSuccess: () => { setPesquisaMsg('✅ Pesquisa iniciada! Resultados salvos na Memória.'); setPesquisando(false) },
    onError: (e: Error) => { setPesquisaMsg(`❌ ${e.message}`); setPesquisando(false) },
  })

  function exportarLogs() {
    const logs = auditData?.logs || []
    const csv = [
      'id,quando,agente,acao,status,origem',
      ...logs.map(l => `${l.id},"${l.created_at || l.criado_em || ''}","${l.agente}","${l.acao}","${l.status}","${l.origem || ''}"`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `audit_${Date.now()}.csv`
    a.click()
  }

  const pipelines = fabricaData?.pipelines || []
  const nAtivos = fabricaData?.ativos ?? pipelines.length ?? 0

  const logs: AuditLog[] = auditData?.logs || []

  return (
    <div className="p-6 overflow-y-auto bg-[#050505]">

      {/* ── Hero Strip ── */}
      <section className="mb-8 border border-white/5 bg-[#0B0D10] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tighter text-on-surface">
            {nexusStatus?.agente || 'Nexus Claw'}{' '}
            <span className="text-primary">{nexusStatus?.status || '...'}</span>
          </h1>
          <p className="font-label text-xs text-slate-500 uppercase tracking-widest mt-1">
            Uptime: {nexusStatus ? formatUptime(nexusStatus.uptime) : '...'} · Volume: {nexusStatus?.token_volume || '...'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="font-label text-[10px] text-on-surface uppercase tracking-tighter">
              AutoHealing: {nexusStatus?.servicos?.autoHealing || '...'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="font-label text-[10px] text-on-surface uppercase tracking-tighter">
              Multi-IA: {nexusStatus?.servicos?.multiIA || '...'}
            </span>
          </div>
          <button
            onClick={() => pesquisarMutation.mutate()}
            disabled={pesquisando}
            className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-label text-[10px] uppercase tracking-tighter transition-all disabled:opacity-50"
          >
            🔬 {pesquisando ? 'Pesquisando...' : 'Pesquisa IA'}
          </button>
        </div>
      </section>

      {pesquisaMsg && (
        <div className="mb-4 px-4 py-3 border border-white/10 bg-white/5 font-label text-xs text-slate-300">
          {pesquisaMsg}
        </div>
      )}

      {/* ── InsightCards Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Memória Heap</span>
            <div className="flex items-baseline gap-1 mt-1">
              <h2 className="font-headline font-bold text-2xl text-on-surface">{nexusStatus?.memoria?.heapUsed || '...'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-label text-[#22C55E]">
            <span className="material-symbols-outlined text-xs">memory</span>
            <span>RSS: {nexusStatus?.memoria?.rss || '...'}</span>
          </div>
        </div>

        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32">
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Uptime</span>
            <h2 className="font-headline font-bold text-2xl text-on-surface mt-1">
              {nexusStatus ? formatUptime(nexusStatus.uptime) : '...'}
            </h2>
          </div>
          <div className="flex gap-1 h-4 items-end">
            <div className="flex-1 bg-primary/20 h-1/2"></div>
            <div className="flex-1 bg-primary/40 h-2/3"></div>
            <div className="flex-1 bg-primary/60 h-3/4"></div>
            <div className="flex-1 bg-primary h-full"></div>
            <div className="flex-1 bg-primary/40 h-1/2"></div>
            <div className="flex-1 bg-primary/20 h-1/3"></div>
          </div>
        </div>

        <div
          className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/fabrica')}
        >
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Fábrica de IA</span>
            <h2 className="font-headline font-bold text-2xl text-on-surface mt-1">
              {nAtivos} {nAtivos === 1 ? 'pipeline' : 'pipelines'}
            </h2>
          </div>
          <div className="font-label text-[10px] text-primary uppercase tracking-tighter bg-primary/5 px-2 py-1 self-start">
            {nAtivos > 0 ? `${nAtivos} ativo(s)` : 'Nenhum ativo'}
          </div>
        </div>

        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32">
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">WhatsApp</span>
            <h2 className="font-headline font-bold text-xl text-on-surface mt-1">
              {nexusStatus?.servicos?.whatsapp || '...'}
            </h2>
          </div>
          <div className="font-label text-[10px] text-primary uppercase tracking-tighter bg-primary/5 px-2 py-1 self-start">
            Pesquisa: {nexusStatus?.servicos?.cron_pesquisa || '...'}
          </div>
        </div>

      </section>

      {/* ── Actions rápidas ── */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '💬 Chat', path: '/chat', desc: 'Conversar com Nexus Claw' },
          { label: '🏭 Fábrica', path: '/fabrica', desc: 'Criar app com IA' },
          { label: '🧠 Memória', path: '/memory', desc: 'Ver conhecimentos' },
          { label: '📋 Auditoria', path: '/audit', desc: 'Ver todos os logs' },
        ].map(btn => (
          <button
            key={btn.path}
            onClick={() => navigate(btn.path)}
            className="bg-[#0B0D10] border border-white/5 p-4 text-left hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="font-headline font-bold text-sm text-on-surface">{btn.label}</div>
            <div className="font-label text-[10px] text-slate-500 mt-1">{btn.desc}</div>
          </button>
        ))}
      </section>

      {/* ── System Audit Trail REAL ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">security</span>
            Audit Trail
          </h3>
          <div className="flex gap-2">
            <button
              onClick={exportarLogs}
              className="bg-[#0B0D10] hover:bg-white/5 px-3 py-1 font-label text-[10px] uppercase border border-white/10 transition-colors text-slate-400"
            >
              ⬇ Export CSV
            </button>
            <button
              onClick={() => refetchAudit()}
              className="bg-[#0B0D10] hover:bg-white/5 px-3 py-1 font-label text-[10px] uppercase border border-white/10 transition-colors text-slate-400"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="bg-primary/10 hover:bg-primary/20 px-3 py-1 font-label text-[10px] uppercase border border-primary/30 transition-colors text-primary"
            >
              Ver Todos
            </button>
          </div>
        </div>

        <div className="bg-[#0B0D10] border border-white/5 divide-y divide-white/5">
          {logs.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-600 font-label text-xs">
              {auditData === undefined ? 'Carregando...' : 'Nenhum log ainda. Use o chat ou a fábrica!'}
            </div>
          )}
          {logs.map((log) => {
            const quando = log.created_at || log.criado_em
            const dotCor = STATUS_DOT[log.status] || '#6B7280'
            return (
              <div key={log.id} className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-white/5 transition-colors">
                <div className="col-span-2 font-label text-[10px] text-slate-500">
                  {timeAgo(quando)} atrás
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotCor }}></div>
                  <span className="text-xs font-medium truncate">{log.acao}</span>
                </div>
                <div className="col-span-2">
                  <span
                    className="text-[9px] font-label px-2 py-0.5 rounded-full border"
                    style={{ color: dotCor, borderColor: dotCor + '44', background: dotCor + '11' }}
                  >
                    {log.agente}
                  </span>
                </div>
                <div className="col-span-2 text-[10px] font-label text-slate-400">{log.origem || '—'}</div>
                <div
                  className="col-span-1 text-right font-label text-[11px]"
                  style={{ color: log.status === 'ok' ? '#22C55E' : '#EF4444' }}
                >
                  {log.status}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => navigate('/audit')}
            className="font-label text-[10px] text-primary uppercase flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
            Ver histórico completo
          </button>
        </div>
      </section>

      {/* ── Floating HUD ── */}
      {nexusStatus && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
          <div className="bg-[#0B0D10] border border-primary/30 p-3 flex items-center gap-4 backdrop-blur-md pointer-events-auto">
            <div className="flex flex-col">
              <span className="font-label text-[9px] text-slate-500 uppercase tracking-widest">Heap</span>
              <span className="font-headline font-bold text-lg text-primary tracking-tighter">{nexusStatus.memoria.heapUsed}</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="font-label text-[9px] text-slate-500 uppercase tracking-widest">Uptime</span>
              <span className="font-headline font-bold text-lg text-on-surface tracking-tighter">{formatUptime(nexusStatus.uptime)}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
