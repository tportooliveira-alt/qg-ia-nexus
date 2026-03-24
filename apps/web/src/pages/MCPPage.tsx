import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface McpTool {
  name: string
  description?: string
  inputSchema?: { properties?: Record<string, { type: string; description?: string }> }
}

interface McpServer {
  name: string
  pid?: number
  ready: boolean
  tools: McpTool[]
}

const PRESETS = [
  { label: 'Brave Search', name: 'brave-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'] },
  { label: 'Filesystem',   name: 'filesystem',   command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '.'] },
  { label: 'GitHub',       name: 'github',        command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
]

export function MCPPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', command: 'npx', args: '' })
  const [selected, setSelected] = useState<McpServer | null>(null)
  const [invokeForm, setInvokeForm] = useState({ tool: '', args: '' })
  const [invokeResult, setInvokeResult] = useState<string | null>(null)
  const [invokeError, setInvokeError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: () => apiFetch<{ servers: McpServer[] }>('/mcp/servers'),
    refetchInterval: 10000,
  })

  const servers: McpServer[] = data?.servers || []

  const startMutation = useMutation({
    mutationFn: (body: { name: string; command: string; args: string[] }) =>
      apiFetch('/mcp/servers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mcp-servers'] }); setForm({ name: '', command: 'npx', args: '' }) },
  })

  const stopMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch(`/mcp/servers/${name}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mcp-servers'] }); setSelected(null) },
  })

  const invokeMutation = useMutation({
    mutationFn: (body: { server: string; tool: string; args: object }) =>
      apiFetch<{ result: unknown }>('/mcp/invoke', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      setInvokeResult(JSON.stringify(data.result, null, 2))
      setInvokeError(null)
    },
    onError: (err: Error) => { setInvokeError(err.message); setInvokeResult(null) },
  })

  function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.command) return
    startMutation.mutate({
      name: form.name,
      command: form.command,
      args: form.args ? form.args.split(' ').filter(Boolean) : [],
    })
  }

  function handleInvoke(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !invokeForm.tool) return
    let parsedArgs = {}
    try { if (invokeForm.args.trim()) parsedArgs = JSON.parse(invokeForm.args) } catch { setInvokeError('Args deve ser JSON válido'); return }
    invokeMutation.mutate({ server: selected.name, tool: invokeForm.tool, args: parsedArgs })
  }

  return (
    <div className="p-6 min-h-screen bg-[#050505]">
      <h2 className="font-headline font-bold text-xl text-on-surface mb-1">
        <span className="material-symbols-outlined align-middle mr-2 text-primary">account_tree</span>
        MCP — Model Context Protocol
      </h2>
      <p className="font-label text-xs text-slate-500 uppercase tracking-widest mb-6">
        Servidores de ferramentas conectados via stdio JSON-RPC
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Coluna esquerda: Servidores ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Presets */}
          <div className="bg-[#0B0D10] border border-white/5 p-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">Iniciar Preset</p>
            <div className="flex flex-col gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  disabled={servers.some((s) => s.name === p.name) || startMutation.isPending}
                  onClick={() => startMutation.mutate({ name: p.name, command: p.command, args: p.args })}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/30 text-slate-300 text-xs font-label disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-sm text-primary">add_circle</span>
                  {p.label}
                  {servers.some((s) => s.name === p.name) && (
                    <span className="ml-auto text-[#22C55E] text-[9px] uppercase tracking-widest">Online</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Formulário manual */}
          <div className="bg-[#0B0D10] border border-white/5 p-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">Servidor Customizado</p>
            <form onSubmit={handleStart} className="flex flex-col gap-2">
              {(['name', 'command', 'args'] as const).map((field) => (
                <input
                  key={field}
                  placeholder={field === 'args' ? 'args (separados por espaço)' : field}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="px-3 py-2 bg-[#050505] border border-white/10 text-slate-300 text-xs font-mono outline-none focus:border-primary/50 transition-colors"
                />
              ))}
              <button
                type="submit"
                disabled={startMutation.isPending || !form.name || !form.command}
                className="mt-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-label text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {startMutation.isPending ? '⏳ Iniciando...' : 'Iniciar Servidor'}
              </button>
            </form>
          </div>

          {/* Lista de servidores */}
          <div className="bg-[#0B0D10] border border-white/5 p-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">
              Servidores Ativos ({servers.length})
            </p>
            {isLoading && <p className="text-slate-600 text-xs">Carregando...</p>}
            {!isLoading && servers.length === 0 && (
              <p className="text-slate-600 text-xs">Nenhum servidor ativo.</p>
            )}
            <div className="flex flex-col gap-2">
              {servers.map((s) => (
                <div
                  key={s.name}
                  onClick={() => { setSelected(s); setInvokeForm({ tool: s.tools[0]?.name || '', args: '' }); setInvokeResult(null); setInvokeError(null) }}
                  className={`flex items-center justify-between px-3 py-2 border cursor-pointer transition-all ${
                    selected?.name === s.name
                      ? 'border-primary/50 bg-primary/5 text-primary'
                      : 'border-white/5 hover:border-white/15 text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-label text-xs">{s.name}</p>
                    <p className="font-label text-[9px] text-slate-500">pid {s.pid} · {s.tools.length} tools</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.ready ? 'bg-[#22C55E]' : 'bg-yellow-500 animate-pulse'}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); stopMutation.mutate(s.name) }}
                      className="material-symbols-outlined text-sm text-slate-600 hover:text-red-400 transition-colors"
                    >
                      stop_circle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Coluna direita: Ferramentas + Invoke ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!selected ? (
            <div className="bg-[#0B0D10] border border-white/5 p-8 flex items-center justify-center text-slate-600">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl mb-2 block">account_tree</span>
                <p className="font-label text-xs uppercase tracking-widest">Selecione um servidor</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ferramentas disponíveis */}
              <div className="bg-[#0B0D10] border border-white/5 p-4">
                <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                  Ferramentas — {selected.name}
                </p>
                {selected.tools.length === 0 ? (
                  <p className="text-slate-600 text-xs">Sem ferramentas detectadas (servidor pode não ter respondido tools/list ainda).</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selected.tools.map((t) => (
                      <div
                        key={t.name}
                        onClick={() => setInvokeForm((f) => ({ ...f, tool: t.name }))}
                        className={`px-3 py-2 border cursor-pointer transition-all ${
                          invokeForm.tool === t.name
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        <p className="font-mono text-xs text-primary">{t.name}</p>
                        {t.description && (
                          <p className="font-label text-[10px] text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invocar tool */}
              <div className="bg-[#0B0D10] border border-white/5 p-4">
                <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">Invocar Tool</p>
                <form onSubmit={handleInvoke} className="flex flex-col gap-3">
                  <div>
                    <p className="font-label text-[9px] text-slate-600 mb-1">TOOL</p>
                    <input
                      value={invokeForm.tool}
                      onChange={(e) => setInvokeForm((f) => ({ ...f, tool: e.target.value }))}
                      placeholder="nome da tool"
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-slate-300 text-xs font-mono outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="font-label text-[9px] text-slate-600 mb-1">ARGS (JSON)</p>
                    <textarea
                      rows={3}
                      value={invokeForm.args}
                      onChange={(e) => setInvokeForm((f) => ({ ...f, args: e.target.value }))}
                      placeholder={'{\n  "query": "exemplo"\n}'}
                      className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-slate-300 text-xs font-mono outline-none focus:border-primary/50 resize-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={invokeMutation.isPending || !invokeForm.tool}
                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-label text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all self-start"
                  >
                    {invokeMutation.isPending ? '⏳ Executando...' : '▶ Executar'}
                  </button>
                </form>

                {invokeError && (
                  <div className="mt-3 px-3 py-2 bg-red-900/20 border border-red-500/30 text-red-400 font-mono text-xs">
                    ❌ {invokeError}
                  </div>
                )}
                {invokeResult && (
                  <div className="mt-3">
                    <p className="font-label text-[9px] text-slate-600 mb-1 uppercase tracking-widest">Resultado</p>
                    <pre className="px-3 py-3 bg-[#050505] border border-white/5 text-[#22C55E] font-mono text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                      {invokeResult}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
