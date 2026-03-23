# 10 — Regras e Padrões

> Estas regras valem para qualquer agente IA, desenvolvedor ou colaborador
> que trabalhe neste repositório.

---

## Regras de segurança (invioláveis)

1. **NUNCA commitar `.env`** — chaves de API ficam apenas no .env local
2. **NUNCA salvar chave de API em arquivo .txt** — só em .env
3. **NUNCA modificar `fabrica-ia-api/`** — é submodule separado com seu próprio repositório
4. **Sempre rodar `npm audit` antes de push** — manter zero vulnerabilidades
5. **`.gitignore` deve incluir:** `.env`, `node_modules/`, `auth_info_baileys/`, `*.key`, `*.secret`

---

## Regras de código

### Padrão de rota (obrigatório para TODA nova rota)
```js
router.post('/api/nova-rota', autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    // lógica aqui
    res.json({ status: 'Sucesso', resultado: data });
  } catch (err) {
    await safeAudit({ tipo: 'erro', rota: '/api/nova-rota', erro: err.message });
    res.status(500).json({ error: 'Falha em NovaRota: ' + err.message });
  }
});
```

### Padrão de resposta HTTP
```js
// Sucesso
res.json({ status: 'Sucesso', [chave]: data });

// Erro de cliente (input inválido)
res.status(400).json({ error: 'Mensagem clara do problema' });

// Erro de servidor
res.status(500).json({ error: 'Falha em NomeDoServico: ' + err.message });
```

### Padrão de serviço
```js
// Todo serviço é um objeto com métodos async
const MeuServico = {
  async meuMetodo(param) {
    // lógica
    return resultado;
  }
};
module.exports = MeuServico;
```

### Padrão de SSE
```js
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.flushHeaders();

// Enviar chunk
res.write(`data: ${JSON.stringify({ chunk: texto })}\n\n`);

// Finalizar
res.write(`data: ${JSON.stringify({ done: true, provider, domain, cost })}\n\n`);
res.end();
```

---

## Regras de organização

### Onde colocar cada tipo de arquivo
| Tipo | Onde fica |
|------|----------|
| Lógica de negócio | `apps/api/src/services/` |
| Definições de rotas | `apps/api/src/routes/` |
| Componentes React | `apps/web/src/components/` |
| Páginas React | `apps/web/src/pages/` |
| Stores Zustand | `apps/web/src/store/` |
| Clientes HTTP | `apps/web/src/api/` |
| Tipos TypeScript | `packages/shared/src/types/` |
| Scripts utilitários | `scripts/` |
| Migrations SQL | `database/migrations/` |
| Documentação | `_CONSOLIDADO/` |
| Configs de agentes | `apps/api/src/skills/agentes/` |
| Knowledge base | `apps/api/src/knowledge_base/` |
| Testes | `apps/api/tests/` |

### O que NÃO fazer
- ❌ Colocar lógica de negócio no server.js
- ❌ Criar arquivos soltos na raiz do projeto
- ❌ Duplicar código entre serviços
- ❌ Importar diretamente de `node_modules` no frontend sem wrapper
- ❌ Hardcodar URLs ou chaves no código
- ❌ Fazer try/catch sem logar o erro no AuditService

---

## Regras para o frontend React

### Estrutura de componente
```tsx
// Sempre TypeScript
// Props tipadas
// Sem lógica de negócio (mover para hooks ou store)
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### Regras de estado (Zustand)
- Um store por domínio: `useChatStore`, `useAgentStore`, `useFabricaStore`, `useUIStore`
- Actions dentro do store, não em componentes
- Componentes só leem estado e chamam actions

### Regras de chamadas API
- Todas as chamadas passam por `api/client.ts` (nunca fetch direto em componente)
- `api/sse.ts` é o único lugar que lida com SSE

---

## Regras de linguagem

- **Todo código comentado:** em português do Brasil
- **Todo commit:** em português do Brasil
- **Toda documentação:** em português do Brasil
- **Código em si** (variáveis, funções, classes): inglês ou português (consistência dentro do arquivo)

---

## Regras de commit

Formato: `tipo: descrição curta`

| Tipo | Quando usar |
|------|------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `refactor:` | Reorganização sem mudar comportamento |
| `docs:` | Documentação |
| `style:` | Formatação, CSS |
| `test:` | Testes |
| `chore:` | Dependências, configs |

Exemplos:
```
feat: adicionar PipelineKanban com SSE em tempo real
fix: corrigir perda de sessão WhatsApp no Render
refactor: quebrar server.js em 12 route files
docs: atualizar CLAUDE.md com nova estrutura monorepo
```

---

## Regras para agentes IA

Quando um agente IA (Claude Code, Copilot, etc.) trabalhar neste repositório:

1. **Sempre ler `_CONSOLIDADO/00_INDICE.md` primeiro** — é a fonte de verdade
2. **Nunca modificar os 20 serviços existentes** sem um plano aprovado
3. **Nunca modificar `fabrica-ia-api/`** — submodule separado
4. **Usar `safeAudit.js`** para todas as operações críticas
5. **Seguir o padrão de rota** para toda nova rota criada
6. **Rodar `npm test` e `npm audit`** antes de qualquer commit
7. **Responder sempre em português do Brasil**

---

## Checklist antes de cada PR

- [ ] `npm test` passa sem erros
- [ ] `npm audit` retorna 0 vulnerabilidades
- [ ] Novas rotas usam `autenticarToken + rateLimiter`
- [ ] Nenhuma chave de API no código
- [ ] Nenhum arquivo `.env` no commit
- [ ] `CLAUDE.md` atualizado se a estrutura mudou
- [ ] `_CONSOLIDADO/` atualizado se algo relevante mudou
