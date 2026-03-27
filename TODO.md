# QG-IA-Nexus — Pending Tasks

## 🔴 Priority 1: VPS Update
```bash
cd ~/qg-ia-nexus
git pull
pm2 restart all
pm2 logs --lines 20
```

## 🔴 Priority 2: Execute SQL Schema
- Open: https://supabase.com/dashboard/project/icodlxcrfgcfygdcjzzu/sql
- Paste contents of `apps/api/SUPABASE_SETUP.sql`
- Run it (creates all tables for Nexus + Fábrica)

## 🔴 Priority 3: Fix Socket.io 404
- `/fabrica` shows `Status: 🔴 404` — Socket.io not connecting
- After VPS update, check `pm2 logs` for connection errors
- Verify socket endpoint matches server config

## 🟡 Priority 4: Test Pipeline E2E
- Go to `https://ideiatoapp.me/fabrica`
- Create: *"Sistema de cadastro de clientes com CRUD"*
- Verify each agent produces real output (SQL + Backend + UI + Audit)

## 🟡 Priority 5: Verify Supabase Data
- Check `projetos` table for new project
- Check `pipeline_logs` for agent execution logs

---

## ✅ Completed (2026-03-26)
- 21 system prompts rewritten English (OWL/CAMEL-AI patterns)
- 12 agent files updated (7 main + 5 sub-agents)
- Supabase migration (MySQL → Supabase-only)
- Git commit `076a491` pushed
