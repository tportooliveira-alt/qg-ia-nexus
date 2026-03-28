# 🔧 MCP Tools Catalog

## O que é MCP?
Model Context Protocol (MCP) é um padrão aberto (criado pela Anthropic) que permite
agentes de IA se conectarem a ferramentas externas via JSON-RPC 2.0 sobre stdio.

## Arquitetura MCP do Nexus
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Nexus Brain  │ ──► │  MCP Client  │ ──► │  MCP Server  │
│  (nexusServ)  │     │ (mcpService) │     │  (qualquer)  │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     JSON-RPC 2.0
                     via stdio
```

## MCP Servers Recomendados (Top 20)

### 📁 Sistema de Arquivos
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@modelcontextprotocol/server-filesystem` | `npx -y @modelcontextprotocol/server-filesystem /path` | Leitura/escrita de arquivos com sandboxing |
| `@nicollassilva/mcp-disk-io` | `npx -y @nicollassilva/mcp-disk-io` | Operações avançadas de disco |

### 🌐 Web & Browser
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@anthropic/mcp-server-puppeteer` | `npx -y @anthropic/mcp-server-puppeteer` | Automação de browser com Puppeteer |
| `@nicollassilva/mcp-web-search` | `npx -y @nicollassilva/mcp-web-search` | Busca na web via DuckDuckGo |
| `firecrawl-mcp` | `npx -y firecrawl-mcp` | Web scraping inteligente |

### 🗄️ Banco de Dados
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@modelcontextprotocol/server-postgres` | `npx -y @modelcontextprotocol/server-postgres "postgresql://..."` | Consultas PostgreSQL |
| `@nicollassilva/supabase-mcp` | `npx -y @nicollassilva/supabase-mcp` | Operações Supabase completas |
| `@modelcontextprotocol/server-sqlite` | `npx -y @modelcontextprotocol/server-sqlite db.sqlite` | SQLite local |

### 🔧 Git & Code
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@modelcontextprotocol/server-git` | `npx -y @modelcontextprotocol/server-git --repository /path` | Operações Git |
| `@nicollassilva/mcp-github` | `npx -y @nicollassilva/mcp-github` | API GitHub (repos, issues, PRs) |

### 📧 Comunicação
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@nicollassilva/mcp-email` | `npx -y @nicollassilva/mcp-email` | Envio de emails (SMTP) |
| `@nicollassilva/mcp-slack` | `npx -y @nicollassilva/mcp-slack` | Integração Slack |

### 📊 Dados & Analytics
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@nicollassilva/mcp-google-sheets` | `npx -y @nicollassilva/mcp-google-sheets` | Leitura/escrita Google Sheets |
| `@modelcontextprotocol/server-memory` | `npx -y @modelcontextprotocol/server-memory` | Grafo de conhecimento persistente |

### 🚀 Deploy & Infra
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@nicollassilva/mcp-docker` | `npx -y @nicollassilva/mcp-docker` | Gerenciamento Docker |
| `@nicollassilva/mcp-vercel` | `npx -y @nicollassilva/mcp-vercel` | Deploy no Vercel |

### 🧠 IA & Embeddings
| Server | Instalação | Descrição |
|--------|-----------|-----------|
| `@nicollassilva/mcp-rag` | `npx -y @nicollassilva/mcp-rag` | RAG com embeddings vetoriais |
| `@modelcontextprotocol/server-brave-search` | `npx -y @modelcontextprotocol/server-brave-search` | Busca Brave com IA |

## Como Registrar um MCP Server no Nexus

### Via API
```bash
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "filesystem", "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/root/projetos"]}'
```

### Via Código (mcpService.js)
```javascript
const McpService = require('./services/mcpService');

// Registrar servidor
await McpService.registerServer("filesystem", "npx", [
  "-y", "@modelcontextprotocol/server-filesystem", "/root/projetos"
]);

// Listar ferramentas
const tools = McpService.getTools("filesystem");

// Invocar ferramenta
const result = await McpService.invokeTool("filesystem", "read_file", {
  path: "/root/projetos/README.md"
});
```

## Protocolo JSON-RPC 2.0

### Listar ferramentas
```json
{"jsonrpc": "2.0", "id": "1", "method": "tools/list", "params": {}}
```

### Invocar ferramenta
```json
{"jsonrpc": "2.0", "id": "2", "method": "tools/call", "params": {
  "name": "read_file",
  "arguments": {"path": "/root/projetos/README.md"}
}}
```

## Fluxo de Auto-Descoberta
1. O módulo de auto-capacitação pesquisa novos MCP servers
2. Avalia utilidade para o sistema (score 1-10)
3. Registra automaticamente servers com score >= 7
4. Testa ferramentas e documenta resultados
5. Agentes passam a usar as novas ferramentas no Re-ACT loop
