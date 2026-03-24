import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

interface KnowledgeSummary {
  domains: string[]
  summary: Record<string, unknown>
}

interface KnowledgeResult {
  domain: string
  category?: string
  search?: string
  data: unknown
}

const DOMAIN_ICONS: Record<string, string> = {
  software:    'code',
  mechanical:  'settings',
  civil:       'apartment',
  electrical:  'bolt',
  chemical:    'science',
  product:     'inventory_2',
  integration: 'hub',
  agro:        'grass',
  finance:     'payments',
}

export function KnowledgePage() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['knowledge-summary'],
    queryFn: () => apiFetch<KnowledgeSummary>('/knowledge'),
  })

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['knowledge-detail', selectedDomain, search],
    queryFn: () =>
      apiFetch<KnowledgeResult>(
        `/knowledge/${selectedDomain}${search ? `?search=${encodeURIComponent(search)}` : ''}`
      ),
    enabled: !!selectedDomain,
  })

  const domains: string[] = summary?.domains || []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <div className="p-6 min-h-screen bg-[#050505]">
      <h2 className="font-headline font-bold text-xl text-on-surface mb-1">
        <span className="material-symbols-outlined align-middle mr-2 text-primary">database</span>
        Knowledge Base
      </h2>
      <p className="font-label text-xs text-slate-500 uppercase tracking-widest mb-6">
        Base de conhecimento multi-domínio do Nexus Claw
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Domínios ── */}
        <div className="lg:col-span-1">
          <div className="bg-[#0B0D10] border border-white/5 p-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-slate-500 mb-3">
              Domínios ({domains.length})
            </p>
            {loadingSummary && <p className="text-slate-600 text-xs">Carregando...</p>}
            <div className="flex flex-col gap-1">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDomain(d); setSearch(''); setSearchInput('') }}
                  className={`flex items-center gap-3 px-3 py-2 text-left border transition-all ${
                    selectedDomain === d
                      ? 'border-primary/50 bg-primary/5 text-primary'
                      : 'border-white/5 hover:border-white/15 text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm shrink-0">
                    {DOMAIN_ICONS[d] || 'folder'}
                  </span>
                  <span className="font-label text-xs capitalize">{d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {!selectedDomain ? (
            <div className="bg-[#0B0D10] border border-white/5 p-8 flex items-center justify-center text-slate-600">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl mb-2 block">database</span>
                <p className="font-label text-xs uppercase tracking-widest">Selecione um domínio</p>
              </div>
            </div>
          ) : (
            <>
              {/* Busca */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Buscar em "${selectedDomain}"...`}
                  className="flex-1 px-3 py-2 bg-[#0B0D10] border border-white/10 text-slate-300 text-sm font-body outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-label text-xs uppercase tracking-widest transition-all"
                >
                  <span className="material-symbols-outlined text-sm">search</span>
                </button>
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setSearchInput('') }}
                    className="px-3 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 font-label text-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </form>

              {/* Resultado */}
              <div className="bg-[#0B0D10] border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-sm text-primary">
                    {DOMAIN_ICONS[selectedDomain] || 'folder'}
                  </span>
                  <p className="font-headline font-bold text-sm text-on-surface capitalize">{selectedDomain}</p>
                  {search && (
                    <span className="ml-auto font-label text-[10px] text-slate-500 uppercase tracking-widest">
                      busca: "{search}"
                    </span>
                  )}
                </div>

                {loadingDetail ? (
                  <p className="text-slate-600 text-xs">Carregando...</p>
                ) : detail?.data ? (
                  <pre className="text-slate-300 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[60vh] leading-relaxed">
                    {typeof detail.data === 'string'
                      ? detail.data
                      : JSON.stringify(detail.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-600 text-xs">Sem dados para este domínio.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
