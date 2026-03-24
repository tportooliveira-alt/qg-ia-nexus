/**
 * AgentNetwork — Grafo estilo n8n dos agentes do QG IA
 * Mostra os agentes como nós e as relações como arestas animadas.
 */

import { useState } from 'react'

interface No {
  id: string
  label: string
  icone: string
  cor: string
  x: number
  y: number
  tipo: 'orquestrador' | 'fabrica' | 'especialista' | 'suporte'
  descricao?: string
  providers?: string[]
}

interface Aresta {
  de: string
  para: string
  label?: string
  tipo?: 'principal' | 'fabrica' | 'suporte'
}

// Layout do grafo — posições em px (viewBox 900x500)
const NOS: No[] = [
  // Centro: Nexus Claw
  { id: 'nexus',      label: 'Nexus Claw',      icone: '🦂', cor: '#1EE0E0', x: 450, y: 60,  tipo: 'orquestrador',  descricao: 'CEO e orquestrador central', providers: ['Gemini','Groq','Cerebras','DeepSeek'] },
  // Linha 2: suporte direto
  { id: 'scout',      label: 'Scout',            icone: '🔍', cor: '#F59E0B', x: 150, y: 160, tipo: 'suporte',       descricao: 'Pesquisa e coleta de dados', providers: ['Groq','Gemini'] },
  { id: 'gemcode',    label: 'GeminiCode',       icone: '🤖', cor: '#8B5CF6', x: 350, y: 160, tipo: 'especialista',  descricao: 'Análise e revisão de código', providers: ['Gemini','DeepSeek'] },
  { id: 'openclaw',   label: 'OpenClawBR',       icone: '🌐', cor: '#06B6D4', x: 550, y: 160, tipo: 'especialista',  descricao: 'Interface web e front-end', providers: ['Gemini','Groq'] },
  { id: 'evolution',  label: 'Auto-Aprendizado', icone: '📚', cor: '#22C55E', x: 750, y: 160, tipo: 'suporte',       descricao: 'Ciclo de estudo a cada 6h — Supabase' },
  // Linha 3: pipeline fábrica
  { id: 'analista',   label: 'Analista',         icone: '🔎', cor: '#EF4444', x: 100, y: 310, tipo: 'fabrica',       descricao: 'Analisa requisitos da ideia' },
  { id: 'comandante', label: 'Comandante',       icone: '⚔️', cor: '#F97316', x: 250, y: 310, tipo: 'fabrica',       descricao: 'Define estratégia e tarefas' },
  { id: 'arquiteto',  label: 'Arquiteto',        icone: '🏗️', cor: '#EAB308', x: 400, y: 310, tipo: 'fabrica',       descricao: 'Projeta a arquitetura técnica' },
  { id: 'coder',      label: 'CoderChief',       icone: '💻', cor: '#84CC16', x: 550, y: 310, tipo: 'fabrica',       descricao: 'Gera o código + sub-agentes' },
  { id: 'auditor',    label: 'Auditor',          icone: '⚖️', cor: '#22C55E', x: 700, y: 310, tipo: 'fabrica',       descricao: 'Valida e aprova o resultado' },
  // Linha 4: sub-agentes do coder
  { id: 'sub1',       label: 'Sub-1',            icone: '⚡', cor: '#6366F1', x: 430, y: 430, tipo: 'fabrica',       descricao: 'Sub-agente Backend' },
  { id: 'sub2',       label: 'Sub-2',            icone: '⚡', cor: '#6366F1', x: 550, y: 430, tipo: 'fabrica',       descricao: 'Sub-agente Frontend' },
  { id: 'sub3',       label: 'Sub-3',            icone: '⚡', cor: '#6366F1', x: 670, y: 430, tipo: 'fabrica',       descricao: 'Sub-agente Infra/DB' },
]

const ARESTAS: Aresta[] = [
  // Nexus → suporte
  { de: 'nexus',      para: 'scout',      label: 'pesquisa',    tipo: 'suporte' },
  { de: 'nexus',      para: 'gemcode',    label: 'código',      tipo: 'suporte' },
  { de: 'nexus',      para: 'openclaw',   label: 'web',         tipo: 'suporte' },
  { de: 'nexus',      para: 'evolution',  label: 'aprende',     tipo: 'suporte' },
  // Nexus → Fábrica
  { de: 'nexus',      para: 'analista',   label: 'ideia',       tipo: 'fabrica' },
  // Pipeline Fábrica
  { de: 'analista',   para: 'comandante', tipo: 'fabrica' },
  { de: 'comandante', para: 'arquiteto',  tipo: 'fabrica' },
  { de: 'arquiteto',  para: 'coder',      tipo: 'fabrica' },
  { de: 'coder',      para: 'auditor',    tipo: 'fabrica' },
  // Auditor → loop correção
  { de: 'auditor',    para: 'coder',      label: 'corrige', tipo: 'fabrica' },
  // CoderChief → sub-agentes paralelos
  { de: 'coder',      para: 'sub1',       tipo: 'fabrica' },
  { de: 'coder',      para: 'sub2',       tipo: 'fabrica' },
  { de: 'coder',      para: 'sub3',       tipo: 'fabrica' },
  // Evolution → Nexus (feedback de aprendizado)
  { de: 'evolution',  para: 'nexus',      label: 'mem.',        tipo: 'suporte' },
]

const TIPO_COR: Record<string, string> = {
  fabrica:    '#F59E0B',
  suporte:    '#1EE0E0',
  principal:  '#8B5CF6',
}

function calcularPonto(noA: No, noB: No, raio = 28): [number, number, number, number] {
  const dx = noB.x - noA.x
  const dy = noB.y - noA.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / len; const ny = dy / len
  return [noA.x + nx * raio, noA.y + ny * raio, noB.x - nx * raio, noB.y - ny * raio]
}

export function AgentNetwork() {
  const [selecionado, setSelecionado] = useState<No | null>(null)
  const [animando, setAnimando] = useState<string | null>(null)

  function simularExecucao() {
    const ordem = ['nexus', 'analista', 'comandante', 'arquiteto', 'coder', 'sub1', 'sub2', 'sub3', 'auditor']
    setAnimando('nexus')
    ordem.forEach((id, i) => {
      setTimeout(() => setAnimando(id), i * 600)
    })
    setTimeout(() => setAnimando(null), ordem.length * 600 + 200)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Controles */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={simularExecucao}
          style={{
            padding: '8px 18px', background: 'var(--color-primary-500)',
            border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}
        >
          ▶ Simular Pipeline
        </button>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span>─── <span style={{ color: '#F59E0B' }}>Fábrica</span></span>
          <span>─── <span style={{ color: '#1EE0E0' }}>Suporte</span></span>
          <span>● Clique no nó para detalhes</span>
        </div>
      </div>

      {/* SVG do grafo */}
      <div style={{
        background: '#0A0C0F', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'auto',
      }}>
        <svg
          viewBox="0 0 900 490"
          style={{ width: '100%', minHeight: 320, display: 'block' }}
          onClick={() => setSelecionado(null)}
        >
          <defs>
            {['fabrica', 'suporte', 'principal'].map(tipo => (
              <marker key={tipo} id={`arrow-${tipo}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={TIPO_COR[tipo] || '#6B7280'} />
              </marker>
            ))}
          </defs>

          {/* Fundo de grade sutil estilo n8n */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="900" height="490" fill="url(#grid)" />

          {/* Rótulo "FÁBRICA DE IA" */}
          <rect x="60" y="285" width="680" height="175" rx="8" fill="rgba(245,158,11,0.04)" stroke="rgba(245,158,11,0.12)" strokeWidth="1" strokeDasharray="6,4" />
          <text x="75" y="304" fill="#F59E0B" fontSize="10" fontWeight="600" opacity="0.7">FÁBRICA DE IA — PIPELINE MULTI-AGENTE</text>

          {/* Arestas */}
          {ARESTAS.map((a, i) => {
            const noA = NOS.find(n => n.id === a.de)
            const noB = NOS.find(n => n.id === a.para)
            if (!noA || !noB) return null
            const [x1, y1, x2, y2] = calcularPonto(noA, noB)
            const cor = TIPO_COR[a.tipo || 'suporte']
            const ativo = animando === a.de || animando === a.para
            const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={ativo ? cor : cor + '55'}
                  strokeWidth={ativo ? 2 : 1}
                  markerEnd={`url(#arrow-${a.tipo || 'suporte'})`}
                  strokeDasharray={a.label === 'corrige' ? '5,3' : 'none'}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
                {a.label && (
                  <text x={midX} y={midY - 5} textAnchor="middle" fill={cor} fontSize="9" opacity="0.8">
                    {a.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nós */}
          {NOS.map(no => {
            const ativo = animando === no.id
            const sel = selecionado?.id === no.id
            const raio = no.tipo === 'orquestrador' ? 34 : 26
            return (
              <g
                key={no.id}
                onClick={e => { e.stopPropagation(); setSelecionado(sel ? null : no) }}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow quando ativo */}
                {ativo && (
                  <circle cx={no.x} cy={no.y} r={raio + 12} fill={no.cor + '33'} />
                )}
                {/* Círculo do nó */}
                <circle
                  cx={no.x} cy={no.y} r={raio}
                  fill={sel ? no.cor + '30' : ativo ? no.cor + '25' : '#111318'}
                  stroke={sel || ativo ? no.cor : no.cor + '88'}
                  strokeWidth={sel ? 2.5 : 1.5}
                  style={{ transition: 'all 0.25s' }}
                />
                {/* Ícone */}
                <text x={no.x} y={no.y - 4} textAnchor="middle" fontSize={no.tipo === 'orquestrador' ? 18 : 14}>
                  {no.icone}
                </text>
                {/* Label */}
                <text x={no.x} y={no.y + 14} textAnchor="middle" fill={no.cor} fontSize={no.tipo === 'orquestrador' ? 10 : 8} fontWeight="600">
                  {no.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Tooltip de detalhe */}
      {selecionado && (
        <div style={{
          marginTop: 12,
          background: selecionado.cor + '11',
          border: `1px solid ${selecionado.cor}44`,
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 32 }}>{selecionado.icone}</span>
          <div>
            <div style={{ fontWeight: 700, color: selecionado.cor, fontSize: 15 }}>{selecionado.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{selecionado.descricao}</div>
            {selecionado.providers && selecionado.providers.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {selecionado.providers.map(p => (
                  <span key={p} style={{
                    fontSize: 10, padding: '2px 8px',
                    background: 'rgba(30,224,224,0.08)',
                    border: '1px solid rgba(30,224,224,0.2)',
                    borderRadius: 4, color: '#1EE0E0',
                  }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
