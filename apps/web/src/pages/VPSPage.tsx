import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VPSOverview {
  hostname: string
  ip: string
  os: string
  node: string
  npm: string
  cpu: { percent: number; model: string; cores: number }
  ram: { total: number; used: number; free: number; percent: number }
  disk: { total: string; used: string; free: string; percent: number; mount: string }
  uptime: { uptime: string; load_1m: number; load_5m: number; load_15m: number }
  timestamp: string
}

interface PM2Process {
  name: string
  pm_id: number
  status: string
  cpu: number
  memory_mb: number
  restarts: number
  uptime_ms: number
  pid: number
}

interface NginxStatus {
  active: boolean
  status: string
  config_ok: boolean
  config_test: string
  sites: string[]
}

interface LogResult {
  source: string
  lines: number
  output: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGaugeColor(percent: number): string {
  if (percent < 50) return '#22C55E'
  if (percent < 75) return '#F59E0B'
  if (percent < 90) return '#F97316'
  return '#EF4444'
}

function statusColor(status: string): string {
  switch (status) {
    case 'online': return '#22C55E'
    case 'stopping': return '#F59E0B'
    case 'stopped': return '#6B7280'
    case 'errored': return '#EF4444'
    default: return '#6B7280'
  }
}

// ─── CircularGauge Component ─────────────────────────────────────────────────

function CircularGauge({ percent, size = 100, strokeWidth = 8, label, value, sub }: {
  percent: number; size?: number; strokeWidth?: number; label: string; value: string; sub?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const color = getGaugeColor(percent)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-1px' }}>
            {percent}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 500, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function VPSPage() {
  const qc = useQueryClient()
  const [logSource, setLogSource] = useState('pm2')
  const [logLines, setLogLines] = useState(50)

  // ── Queries ──

  const { data: overview, isLoading: loadingOverview, error: overviewError } = useQuery({
    queryKey: ['vps-overview'],
    queryFn: () => apiFetch<VPSOverview>('/vps/overview'),
    refetchInterval: 10000,
  })

  const { data: processData, isLoading: loadingProcesses } = useQuery({
    queryKey: ['vps-processes'],
    queryFn: () => apiFetch<{ processes: PM2Process[] }>('/vps/processes'),
    refetchInterval: 10000,
  })

  const { data: nginx } = useQuery({
    queryKey: ['vps-nginx'],
    queryFn: () => apiFetch<NginxStatus>('/vps/nginx'),
    refetchInterval: 30000,
  })

  const { data: logs, refetch: refetchLogs, isFetching: fetchingLogs } = useQuery({
    queryKey: ['vps-logs', logSource, logLines],
    queryFn: () => apiFetch<LogResult>(`/vps/logs?source=${logSource}&lines=${logLines}`),
  })

  // ── Mutations ──

  const pm2Mutation = useMutation({
    mutationFn: ({ name, action }: { name: string; action: string }) =>
      apiFetch(`/vps/processes/${name}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vps-processes'] })
      qc.invalidateQueries({ queryKey: ['vps-overview'] })
    },
  })

  const nginxReloadMutation = useMutation({
    mutationFn: () => apiFetch('/vps/nginx/reload', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vps-nginx'] }),
  })

  const processes = processData?.processes || []

  // ── Scroll logs to bottom ──
  useEffect(() => {
    const el = document.getElementById('vps-log-output')
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  // ── Error state ──
  if (overviewError) {
    return (
      <div className="p-6 overflow-y-auto" style={{ background: '#050505', height: '100%' }}>
        <div style={{
          background: '#0B0D10', border: '1px solid rgba(239,68,68,0.3)',
          padding: 32, textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EF4444', display: 'block', marginBottom: 12 }}>
            cloud_off
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Conexão SSH Falhou</h2>
          <p style={{ fontSize: 12, color: '#64748B', maxWidth: 400, margin: '0 auto' }}>
            Verifique as variáveis VPS_SSH_HOST, VPS_SSH_KEY_PATH no .env e se a chave SSH está autorizada no servidor.
          </p>
          <pre style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, fontFamily: 'monospace' }}>
            {(overviewError as Error).message}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto" style={{ background: '#050505', height: '100%' }}>

      {/* ── Hero Strip ── */}
      <section style={{
        marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)',
        background: '#0B0D10', padding: 16,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: '#F8FAFC' }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8, color: '#1EE0E0' }}>
              dns
            </span>
            {loadingOverview ? '...' : overview?.hostname || 'VPS'}
            {' '}
            <span style={{ color: '#1EE0E0' }}>Control Panel</span>
          </h1>
          <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>
            {overview?.ip || '...'} · {overview?.os || '...'} · Node {overview?.node || '...'} · npm {overview?.npm || '...'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {overview && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                  {overview.uptime.uptime}
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 10, color: '#64748B' }}>Load:</span>
                <span style={{
                  fontSize: 10, fontFamily: 'monospace',
                  color: overview.uptime.load_1m > 2 ? '#F59E0B' : '#22C55E',
                }}>
                  {overview.uptime.load_1m} / {overview.uptime.load_5m} / {overview.uptime.load_15m}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Resource Gauges ── */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24,
      }}>
        <div style={{
          background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
          padding: 20, display: 'flex', justifyContent: 'center',
        }}>
          <CircularGauge
            percent={overview?.cpu.percent || 0}
            label="CPU"
            value={`${overview?.cpu.cores || 0} cores`}
            sub={overview?.cpu.model?.substring(0, 30) || ''}
          />
        </div>

        <div style={{
          background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
          padding: 20, display: 'flex', justifyContent: 'center',
        }}>
          <CircularGauge
            percent={overview?.ram.percent || 0}
            label="RAM"
            value={`${overview?.ram.used || 0} / ${overview?.ram.total || 0} MB`}
            sub={`${overview?.ram.free || 0} MB free`}
          />
        </div>

        <div style={{
          background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
          padding: 20, display: 'flex', justifyContent: 'center',
        }}>
          <CircularGauge
            percent={overview?.disk.percent || 0}
            label="Disco"
            value={`${overview?.disk.used || '0'} / ${overview?.disk.total || '0'}`}
            sub={`${overview?.disk.free || '0'} free`}
          />
        </div>

        <div style={{
          background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
          padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#1EE0E0' }}>swap_vert</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 600 }}>
              REDE
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginTop: 4 }}>
              {processes.length} proc
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
              {processes.filter(p => p.status === 'online').length} online
            </div>
          </div>
        </div>
      </section>

      {/* ── PM2 Processes + Nginx ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>

        {/* PM2 Processes */}
        <div style={{ background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1EE0E0' }}>memory</span>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 600 }}>
                PM2 Processes ({processes.length})
              </span>
            </div>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['vps-processes'] })}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 8px',
                color: '#64748B', fontSize: 10, cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {loadingProcesses && (
            <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 12 }}>Carregando processos...</div>
          )}

          {processes.length === 0 && !loadingProcesses && (
            <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 12 }}>Nenhum processo PM2.</div>
          )}

          {processes.map((p) => (
            <div
              key={p.pm_id}
              style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'grid', gridTemplateColumns: '1fr 60px 70px 60px 50px 110px', alignItems: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{p.name}</div>
                <div style={{ fontSize: 9, color: '#475569' }}>pid {p.pid} · id {p.pm_id}</div>
              </div>

              <div>
                <span style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 99,
                  background: statusColor(p.status) + '18',
                  border: `1px solid ${statusColor(p.status)}44`,
                  color: statusColor(p.status),
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
                }}>
                  {p.status}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#E2E8F0' }}>{p.cpu}%</div>
                <div style={{ fontSize: 9, color: '#475569' }}>CPU</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#E2E8F0' }}>{p.memory_mb}M</div>
                <div style={{ fontSize: 9, color: '#475569' }}>RAM</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: p.restarts > 5 ? '#F59E0B' : '#64748B' }}>
                  {p.restarts}
                </div>
                <div style={{ fontSize: 9, color: '#475569' }}>↻</div>
              </div>

              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                {p.status === 'online' ? (
                  <>
                    <ActionBtn icon="restart_alt" label="Restart" color="#F59E0B"
                      onClick={() => pm2Mutation.mutate({ name: p.name, action: 'restart' })}
                      loading={pm2Mutation.isPending} />
                    <ActionBtn icon="stop_circle" label="Stop" color="#EF4444"
                      onClick={() => pm2Mutation.mutate({ name: p.name, action: 'stop' })}
                      loading={pm2Mutation.isPending} />
                  </>
                ) : (
                  <ActionBtn icon="play_circle" label="Start" color="#22C55E"
                    onClick={() => pm2Mutation.mutate({ name: p.name, action: 'start' })}
                    loading={pm2Mutation.isPending} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nginx Card */}
        <div style={{
          background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1EE0E0' }}>language</span>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 600 }}>
              Nginx
            </span>
          </div>

          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: nginx?.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `2px solid ${nginx?.active ? '#22C55E' : '#EF4444'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 20, color: nginx?.active ? '#22C55E' : '#EF4444',
                }}>
                  {nginx?.active ? 'check' : 'close'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>
                  {nginx?.active ? 'Running' : nginx?.status || '...'}
                </div>
                <div style={{
                  fontSize: 10, color: nginx?.config_ok ? '#22C55E' : '#EF4444',
                }}>
                  Config: {nginx?.config_ok ? '✓ OK' : '✗ Error'}
                </div>
              </div>
            </div>

            {/* Sites */}
            {nginx?.sites && nginx.sites.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Sites Enabled
                </div>
                {nginx.sites.map((s, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: '#94A3B8', padding: '3px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Reload */}
            <button
              onClick={() => nginxReloadMutation.mutate()}
              disabled={nginxReloadMutation.isPending || !nginx?.config_ok}
              style={{
                marginTop: 'auto', padding: '8px 0',
                background: 'rgba(30,224,224,0.08)', border: '1px solid rgba(30,224,224,0.25)',
                color: '#1EE0E0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                opacity: nginxReloadMutation.isPending || !nginx?.config_ok ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              {nginxReloadMutation.isPending ? '⏳ Reloading...' : '↻ Reload Nginx'}
            </button>
          </div>
        </div>
      </div>

      {/* ── System Logs ── */}
      <section style={{
        background: '#0B0D10', border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1EE0E0' }}>receipt_long</span>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748B', fontWeight: 600 }}>
              System Logs
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['pm2', 'nginx', 'nginx-access', 'journal', 'syslog'].map((src) => (
              <button
                key={src}
                onClick={() => setLogSource(src)}
                style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                  border: `1px solid ${logSource === src ? 'rgba(30,224,224,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: logSource === src ? 'rgba(30,224,224,0.08)' : 'transparent',
                  color: logSource === src ? '#1EE0E0' : '#64748B',
                  transition: 'all 0.15s',
                }}
              >
                {src}
              </button>
            ))}

            <select
              value={logLines}
              onChange={(e) => setLogLines(Number(e.target.value))}
              style={{
                padding: '4px 8px', fontSize: 10, background: '#050505',
                border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8',
                outline: 'none',
              }}
            >
              {[30, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n} lines</option>
              ))}
            </select>

            <button
              onClick={() => refetchLogs()}
              disabled={fetchingLogs}
              style={{
                padding: '4px 10px', fontSize: 10, fontWeight: 600,
                background: 'rgba(30,224,224,0.08)', border: '1px solid rgba(30,224,224,0.25)',
                color: '#1EE0E0', cursor: 'pointer', textTransform: 'uppercase',
                opacity: fetchingLogs ? 0.5 : 1,
              }}
            >
              {fetchingLogs ? '⏳' : '↻'} Refresh
            </button>
          </div>
        </div>

        <pre
          id="vps-log-output"
          style={{
            margin: 0, padding: 16, fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11, lineHeight: 1.7, color: '#94A3B8',
            maxHeight: 360, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            background: '#050505',
          }}
        >
          {fetchingLogs && !logs ? 'Carregando logs...\n' : ''}
          {logs?.output || 'Sem logs disponíveis.'}
        </pre>
      </section>
    </div>
  )
}

// ─── Action Button ───────────────────────────────────────────────────────────

function ActionBtn({ icon, label, color, onClick, loading }: {
  icon: string; label: string; color: string; onClick: () => void; loading: boolean
}) {
  return (
    <button
      title={label}
      disabled={loading}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, border: `1px solid ${color}44`,
        background: `${color}11`, color, cursor: 'pointer',
        opacity: loading ? 0.4 : 1, transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}22` }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}11` }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
    </button>
  )
}
