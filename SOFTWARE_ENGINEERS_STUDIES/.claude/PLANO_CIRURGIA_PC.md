# CIRURGIA DO PC — PLANO DE AÇÃO PROFISSIONAL
Data: 2026-03-22

---

## DIAGNÓSTICO: O QUE FOI ENCONTRADO

### 🔴 URGENTE — SEGURANÇA
- **Chaves de API em arquivo de texto solto no Desktop:**
  `C:\Users\Priscila\Desktop\QG-IA-NOVO\GEMINI_API_KEY=AIzaSyD20IBqyZ4IlNSn.txt`
  Contém: Gemini, Groq, DeepSeek. Qualquer pessoa com acesso ao PC vê tudo.
- **`.env` do qg-ia-nexus com todas as chaves como `COLE_AQUI`** — o projeto não roda porque as chaves reais estão no arquivo de texto acima.

### 🟡 PROJETOS DUPLICADOS (mesmo projeto em vários lugares)

| Projeto | Versão REAL (usar esta) | Versão LIXO (apagar) |
|---|---|---|
| qg-ia-nexus | `C:\Users\Priscila\qg-ia-nexus\` (GitHub, 22/03) | `Desktop\QG-IA-NOVO\` (19/03, abandonada) |
| fabrica-ia-api | `C:\Users\Priscila\fabrica-ia-api\` (v3.0.0) | `tmp-repos\fabrica-ia-api\` (v2.0.0, antiga) |
| AgroMacro | `C:\Users\Priscila\tmp-repos\AgroMacro\` | `TUDO_PARA_BACKUP\Projetos\AgroMacro\` |
| fazenda-cerebro | `C:\Users\Priscila\tmp-repos\fazenda-cerebro\` | `TUDO_PARA_BACKUP\Projetos\fazenda-cerebro\` |
| IdeaOrganizer | `C:\Users\Priscila\IdeaOrganizer\` | `TUDO_PARA_BACKUP\Projetos\IdeaOrganizer\` |

### 🟡 PROJETOS SEM GITHUB (risco de perda total)
rw- `C:\Users\Priscila\tmp-repos\GESTAO-DA-FAZENDA-ANTARES\` — não está no GitHub
- `C:\Users\Priscila\tmp-repos\whatsapp-claude-bot\` — não está no GitHub
- `C:\Users\Priscila\tmp-repos\fazenda-cerebro\` — verificar se está no GitHub

### 🟡 LIXO NA RAIZ DO PERFIL
Estes arquivos estão soltos em `C:\Users\Priscila\` sem pertencer a nenhum projeto:
- `server.js` (solto)
- `package-lock.json` (solto)
- `teste-claude.js` (solto)
- `public\` (pasta solta)

### 🟡 BACKUP INCOMPLETO
O Google Drive não terminou de copiar `.gemini` (20 GB faltando) e `qg-ia-nexus`, `fabrica-ia-api`, `tmp-repos` ainda não foram copiados.

---

## PLANO DE AÇÃO — EM ORDEM DE EXECUÇÃO

### FASE 1 — SEGURANÇA (fazer primeiro, hoje ou amanhã) ⏱️ 10 min
1. Copiar as chaves reais do arquivo de texto para o `.env` de cada projeto
2. Apagar o arquivo `GEMINI_API_KEY=AIzaSyD20IBqyZ4IlNSn.txt` do Desktop
3. Confirmar que `.env` está no `.gitignore` de todos os projetos
4. Nunca mais salvar chave em arquivo de texto — só em `.env`

### FASE 2 — CONSOLIDAR ESTRUTURA DE PASTAS (1h) ⏱️
Criar uma estrutura limpa e única:
```
C:\Users\Priscila\projetos\
├── qg-ia-nexus\          ← já existe, manter
├── fabrica-ia-api\       ← mover de C:\Users\Priscila\fabrica-ia-api\
├── frigogest-2026\       ← mover de onde está
├── agromacro\            ← mover de tmp-repos\AgroMacro\
├── fazenda-cerebro\      ← mover de tmp-repos\fazenda-cerebro\
└── gestao-fazenda-antares\ ← mover de tmp-repos\
```

### FASE 3 — SUBIR PROJETOS SEM GITHUB (30 min) ⏱️
Para cada projeto sem GitHub:
1. `gh repo create nome-do-projeto --private` (ou público)
2. `git init && git add . && git commit -m "initial commit"`
3. `git push -u origin main`
Projetos sem GitHub: **frigogest-2026**, **GESTAO-DA-FAZENDA-ANTARES**, **whatsapp-claude-bot**

### FASE 4 — LIMPAR DUPLICATAS (30 min) ⏱️
Só apagar DEPOIS de confirmar que a versão principal está salva no GitHub.
- `Desktop\QG-IA-NOVO\` → apagar
- `tmp-repos\fabrica-ia-api\` → apagar (versão 2.0.0)
- `TUDO_PARA_BACKUP\Projetos\AgroMacro\` → apagar
- `TUDO_PARA_BACKUP\Projetos\fazenda-cerebro\` → apagar
- `TUDO_PARA_BACKUP\Projetos\IdeaOrganizer\` → apagar
- Arquivos soltos na raiz (`server.js`, `teste-claude.js`, `package-lock.json`) → apagar

### FASE 5 — COMPLETAR BACKUP GOOGLE DRIVE (2h) ⏱️
Retomar de onde parou:
1. `.gemini` (20 GB faltando)
2. `qg-ia-nexus`
3. `fabrica-ia-api`
4. `tmp-repos`

### FASE 6 — RODAR O PROJETO (30 min) ⏱️
Depois de tudo organizado:
1. `.env` preenchido com as chaves reais
2. `npm install` no qg-ia-nexus
3. `npm start`
4. Testar todas as rotas
5. `npm test`

---

## RESUMO DE PRIORIDADE

| Prioridade | Ação | Tempo |
|---|---|---|
| 🔴 1 | Mover chaves do .txt para o .env e apagar o .txt | 10 min |
| 🟠 2 | Subir frigogest + outros sem GitHub | 30 min |
| 🟡 3 | Consolidar estrutura de pastas | 1h |
| 🟡 4 | Limpar duplicatas | 30 min |
| 🟢 5 | Completar backup Google Drive | 2h |
| 🟢 6 | Rodar e testar o projeto | 30 min |

**Total estimado:** 4-5 horas de trabalho organizado.
