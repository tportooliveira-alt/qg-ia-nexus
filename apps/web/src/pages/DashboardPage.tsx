export function DashboardPage() {
  return (
    <div className="p-6 min-h-screen bg-[#050505]">

      {/* ── Hero Strip ── */}
      <section className="mb-8 border border-white/5 bg-[#0B0D10] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tighter text-on-surface">
            Nexus Claw <span className="text-primary">Online</span>
          </h1>
          <p className="font-label text-xs text-slate-500 uppercase tracking-widest mt-1">
            Operational Protocol v4.2.0-Alpha
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="font-label text-[10px] text-on-surface uppercase tracking-tighter">Core Systems: Stable</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="font-label text-[10px] text-on-surface uppercase tracking-tighter">API Gateway: Active</span>
          </div>
          <button className="bg-primary-container text-on-primary-fixed font-headline font-bold text-xs uppercase px-4 py-2 rounded-md glow-hover transition-all">
            Initiate Sweep
          </button>
        </div>
      </section>

      {/* ── InsightCards Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Custo Diário */}
        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Custo Diário</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-label text-primary">$</span>
              <h2 className="font-headline font-bold text-2xl text-on-surface">142.84</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-label text-[#22C55E]">
            <span className="material-symbols-outlined text-xs">trending_down</span>
            <span>12% vrs. yesterday</span>
          </div>
        </div>

        {/* Jobs Ativos */}
        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32">
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Jobs Ativos</span>
            <h2 className="font-headline font-bold text-2xl text-on-surface mt-1">1,024</h2>
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

        {/* Latência Média */}
        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32">
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Latência Média</span>
            <h2 className="font-headline font-bold text-2xl text-on-surface mt-1">
              42<span className="text-sm font-normal text-slate-500 ml-1">ms</span>
            </h2>
          </div>
          <div className="font-label text-[10px] text-primary uppercase tracking-tighter bg-primary/5 px-2 py-1 self-start">
            Optimized: Cluster-A
          </div>
        </div>

        {/* Falhas 24h */}
        <div className="bg-[#0B0D10] p-4 border border-white/5 flex flex-col justify-between h-32">
          <div>
            <span className="font-label text-[10px] text-slate-500 uppercase tracking-widest">Falhas (24h)</span>
            <h2 className="font-headline font-bold text-2xl text-error mt-1">03</h2>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-label text-error uppercase">
            <span className="material-symbols-outlined text-xs">warning</span>
            <span>Action Required: Node-7</span>
          </div>
        </div>

      </section>

      {/* ── Kanban Mini-Board Fábrica ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
            Fábrica Overview
          </h3>
          <span className="font-label text-[10px] text-slate-500 uppercase">14 Pipelines Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 overflow-x-auto">

          {/* Brief */}
          <div className="bg-[#0B0D10]/50 p-2 border border-white/5 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
              <span className="font-label text-[10px] font-bold text-on-surface">Brief</span>
              <span className="font-label text-[10px] text-slate-500">03</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-[#0B0D10] p-3 border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                <p className="text-xs font-medium mb-2">Automated SEO Agent</p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-label bg-secondary-container/20 text-secondary px-1.5 py-0.5 border border-secondary/20">CLAUDE-3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spec */}
          <div className="bg-[#0B0D10]/50 p-2 border border-white/5 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
              <span className="font-label text-[10px] font-bold text-on-surface">Spec</span>
              <span className="font-label text-[10px] text-slate-500">02</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-[#0B0D10] p-3 border border-white/5 cursor-pointer hover:border-primary/50 transition-colors">
                <p className="text-xs font-medium mb-2">Sentiment Analyzer</p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-label bg-primary/10 text-primary px-1.5 py-0.5 border border-primary/20">GPT-4O</span>
                </div>
              </div>
            </div>
          </div>

          {/* Build */}
          <div className="bg-[#0B0D10]/50 p-2 border border-white/5 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
              <span className="font-label text-[10px] font-bold text-on-surface">Build</span>
              <span className="font-label text-[10px] text-slate-500">05</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-[#0B0D10] p-3 border border-white/5 border-l-2 border-l-primary animate-pulse">
                <p className="text-xs font-medium mb-2 text-primary">Nexus-Web-Crawler</p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-label bg-tertiary-container/20 text-tertiary px-1.5 py-0.5 border border-tertiary/20">GEMINI-1.5</span>
                </div>
              </div>
            </div>
          </div>

          {/* QA */}
          <div className="bg-[#0B0D10]/50 p-2 border border-white/5 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
              <span className="font-label text-[10px] font-bold text-on-surface">QA</span>
              <span className="font-label text-[10px] text-slate-500">01</span>
            </div>
            <div className="bg-[#0B0D10] p-3 border border-white/5 border-l-2 border-l-secondary-container">
              <p className="text-xs font-medium mb-2">Social Hub Integrator</p>
              <span className="text-[9px] font-label bg-white/5 text-slate-400 px-1.5 py-0.5">RUNNING TESTS</span>
            </div>
          </div>

          {/* Deploy */}
          <div className="bg-[#0B0D10]/50 p-2 border border-white/5 min-w-[200px]">
            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
              <span className="font-label text-[10px] font-bold text-on-surface">Deploy</span>
              <span className="font-label text-[10px] text-slate-500">03</span>
            </div>
            <div className="bg-[#0B0D10] p-3 border border-white/5 flex flex-col gap-2">
              <div className="h-1 bg-white/5 w-full relative">
                <div className="absolute inset-0 bg-primary w-[85%]"></div>
              </div>
              <p className="text-[10px] font-label uppercase text-slate-500">Pushing to PROD...</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── System Audit Trail ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">security</span>
            System Audit Trail
          </h3>
          <div className="flex gap-2">
            <button className="bg-surface-container-high hover:bg-surface-container-highest px-3 py-1 font-label text-[10px] uppercase border border-white/5 transition-colors">
              Export Logs
            </button>
            <button className="bg-surface-container-high hover:bg-surface-container-highest px-3 py-1 font-label text-[10px] uppercase border border-white/5 transition-colors">
              Filter
            </button>
          </div>
        </div>

        <div className="bg-[#0B0D10] border border-white/5 divide-y divide-white/5">

          <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-white/5 transition-colors">
            <div className="col-span-2 font-label text-[10px] text-slate-500">14:02:44.921</div>
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></div>
              <span className="text-xs font-medium">Pipeline: Nexus-Crawler successfull</span>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] font-label bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">GPT-4O</span>
            </div>
            <div className="col-span-2 text-[10px] font-label text-slate-400">MARKETING_DOM</div>
            <div className="col-span-2 text-right font-label text-[11px] text-[#22C55E]">-$0.0012</div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-white/5 transition-colors">
            <div className="col-span-2 font-label text-[10px] text-slate-500">14:02:40.118</div>
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
              <span className="text-xs font-medium">Token limit warning: Node-9</span>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] font-label bg-secondary-container/20 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">CLAUDE-3</span>
            </div>
            <div className="col-span-2 text-[10px] font-label text-slate-400">ANALYTICS_DOM</div>
            <div className="col-span-2 text-right font-label text-[11px] text-on-surface">-$0.0410</div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-white/5 transition-colors">
            <div className="col-span-2 font-label text-[10px] text-slate-500">14:02:35.002</div>
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span className="text-xs font-medium">Memory Sync Initialized</span>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] font-label bg-tertiary-container/20 text-tertiary px-2 py-0.5 rounded-full border border-tertiary/20">GEMINI-1.5</span>
            </div>
            <div className="col-span-2 text-[10px] font-label text-slate-400">CORE_DOM</div>
            <div className="col-span-2 text-right font-label text-[11px] text-on-surface">-$0.0001</div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-white/5 transition-colors">
            <div className="col-span-2 font-label text-[10px] text-slate-500">14:02:31.990</div>
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></div>
              <span className="text-xs font-medium">Knowledge Base Update Complete</span>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] font-label bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/10">LOCAL_Llama3</span>
            </div>
            <div className="col-span-2 text-[10px] font-label text-slate-400">RESEARCH_DOM</div>
            <div className="col-span-2 text-right font-label text-[11px] text-[#22C55E]">-$0.0000</div>
          </div>

        </div>

        <div className="mt-4 flex justify-center">
          <button className="font-label text-[10px] text-primary uppercase flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
            Load More Events
          </button>
        </div>
      </section>

      {/* ── Floating HUD ── */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-[#0B0D10] border border-primary/30 p-3 flex items-center gap-4 backdrop-blur-md pointer-events-auto">
          <div className="flex flex-col">
            <span className="font-label text-[9px] text-slate-500 uppercase tracking-widest">Global Heat</span>
            <span className="font-headline font-bold text-lg text-primary tracking-tighter">98.2%</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="font-label text-[9px] text-slate-500 uppercase tracking-widest">Active Threads</span>
            <span className="font-headline font-bold text-lg text-on-surface tracking-tighter">4,092</span>
          </div>
        </div>
      </div>

    </div>
  )
}
