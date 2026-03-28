/**
 * server.js — IdeaOrganizer QG Server v4.0
 *
 * Backend completo da Fábrica de IA:
 * - CRUD de projetos, ideias, agentes, skills, memórias
 * - Pipeline multi-agente completo (apps, sites, planilhas, documentos, etc.)
 * - Cascata de 6 provedores de IA com fallback automático
 * - Banco: Supabase (cloud) com fallback SQLite (local dev)
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Chave de Controle Global dos Agentes ─────────────────────────────────────
// MODO_TESTE=true → bloqueia emails, CRON e efeitos externos
// AGENTES_ATIVOS=false → pausa toda execução de pipeline
const sistemaControle = {
    modoTeste:     process.env.MODO_TESTE    !== 'false',   // padrão: true
    agentesAtivos: process.env.AGENTES_ATIVOS !== 'false',  // padrão: true
    pipelinesEmExecucao: 0,
    ultimaAlteracao: new Date().toISOString()
};

console.log(`🔧 Modo Teste: ${sistemaControle.modoTeste ? '✅ ATIVO (emails bloqueados)' : '❌ INATIVO (produção)'}`);
console.log(`🤖 Agentes:   ${sistemaControle.agentesAtivos ? '✅ ATIVOS' : '⏸️ PAUSADOS'}`);

// ─── Banco de dados: Supabase ou SQLite ──────────────────────────────────────

let supabase = null;
let db       = null;  // SQLite (fallback local)

if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Conectado ao Supabase');
} else {
    // Fallback para SQLite em desenvolvimento local
    const sqlite3 = require('sqlite3').verbose();
    const dbPath  = path.join(__dirname, 'database.sqlite');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('❌ Erro SQLite:', err.message);
        else {
            console.log('✅ Conectado ao SQLite (modo local)');
            inicializarSQLite();
        }
    });
}

// ─── Inicializar tabelas SQLite ───────────────────────────────────────────────

function inicializarSQLite() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS projetos (id TEXT PRIMARY KEY, nome TEXT NOT NULL, desc TEXT, emoji TEXT, cor TEXT, criado TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS ideias (id TEXT PRIMARY KEY, projeto_id TEXT, tipo TEXT, texto_original TEXT, titulo TEXT, descricao TEXT, detalhes TEXT, prioridade TEXT, tags TEXT, proximos_passos TEXT, conteudo TEXT, criado TEXT, spec_produto TEXT, spec_arquitetura TEXT, spec_tarefas TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS agentes (id TEXT PRIMARY KEY, nome TEXT NOT NULL, desc TEXT, system TEXT, emoji TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS skills (id TEXT PRIMARY KEY, nome TEXT NOT NULL, desc TEXT, prompt TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS memorias (id TEXT PRIMARY KEY, agente TEXT NOT NULL, conteudo TEXT NOT NULL, projeto_rel TEXT, criado TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS projetos_fabrica (id TEXT PRIMARY KEY, usuario_id TEXT, nome TEXT, tipo TEXT, tipo_entregavel TEXT, ideia_original TEXT, status TEXT, score_final INTEGER, iteracoes INTEGER, aprovado INTEGER, plano TEXT, arquitetura TEXT, codigo_sql TEXT, codigo_app TEXT, codigo_ui TEXT, planilha TEXT, documento TEXT, design_system TEXT, auditoria TEXT, tempo_total_ms INTEGER, criado_em TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS agent_memories (id TEXT PRIMARY KEY, agente_id TEXT NOT NULL, usuario_id TEXT, projeto_id TEXT, tipo_memoria TEXT, conteudo TEXT, metadata TEXT, relevancia REAL DEFAULT 1.0, vezes_usada INTEGER DEFAULT 0, criado_em TEXT)`);
        console.log('📦 Tabelas SQLite carregadas.');
    });
}

// ─── Adaptador universal de banco ────────────────────────────────────────────
// Abstrai Supabase e SQLite numa interface única

const BD = {
    async buscarTodos(tabela, filtros = {}, limite = 100, ordem = null) {
        if (supabase) {
            let q = supabase.from(tabela).select('*');
            Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined) q = q.eq(k, v); });
            if (ordem) q = q.order(ordem, { ascending: false });
            q = q.limit(limite);
            const { data, error } = await q;
            if (error) throw new Error(error.message);
            return data || [];
        } else {
            return new Promise((resolve, reject) => {
                const where = Object.keys(filtros).length
                    ? 'WHERE ' + Object.keys(filtros).map(k => `${k} = ?`).join(' AND ')
                    : '';
                const params = Object.values(filtros);
                db.all(`SELECT * FROM ${tabela} ${where} ${ordem ? `ORDER BY ${ordem} DESC` : ''} LIMIT ${limite}`, params, (err, rows) => {
                    if (err) reject(err); else resolve(rows || []);
                });
            });
        }
    },

    async inserir(tabela, dados) {
        if (supabase) {
            const { data, error } = await supabase.from(tabela).insert(dados).select().single();
            if (error) throw new Error(error.message);
            return data;
        } else {
            return new Promise((resolve, reject) => {
                const cols   = Object.keys(dados).join(', ');
                const placeholders = Object.keys(dados).map(() => '?').join(', ');
                const vals   = Object.values(dados);
                db.run(`INSERT OR REPLACE INTO ${tabela} (${cols}) VALUES (${placeholders})`, vals, function(err) {
                    if (err) reject(err); else resolve({ ...dados, rowid: this.lastID });
                });
            });
        }
    },

    async atualizar(tabela, id, dados) {
        if (supabase) {
            const { error } = await supabase.from(tabela).update(dados).eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                const sets = Object.keys(dados).map(k => `${k} = ?`).join(', ');
                const vals = [...Object.values(dados), id];
                db.run(`UPDATE ${tabela} SET ${sets} WHERE id = ?`, vals, (err) => {
                    if (err) reject(err); else resolve(true);
                });
            });
        }
    },

    async deletar(tabela, id) {
        if (supabase) {
            const { error } = await supabase.from(tabela).delete().eq('id', id);
            if (error) throw new Error(error.message);
            return true;
        } else {
            return new Promise((resolve, reject) => {
                db.run(`DELETE FROM ${tabela} WHERE id = ?`, [id], (err) => {
                    if (err) reject(err); else resolve(true);
                });
            });
        }
    }
};

// ─── Middlewares ─────────────────────────────────────────────────────────────

// CORS
app.use(cors({
    origin: [
        'https://ideiatoapp.me',
        'https://www.ideiatoapp.me',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://localhost:5173',
        null  // file://
    ],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// ─── Inicializar AgentMemory com banco ───────────────────────────────────────
// (feito após conexão ao banco ser estabelecida — ver final do arquivo)

// ─── Rotas SSE do Pipeline (multi-agente v4) ─────────────────────────────────
const pipelineRoutes = require('./routes/pipeline.routes');
app.use('/api/pipeline', pipelineRoutes);

// Rate limiter simples por IP
const rateLimitMap = new Map();
app.use((req, res, next) => {
    const ip    = req.ip || req.connection.remoteAddress;
    const agora = Date.now();
    const janela = 60000; // 1 minuto
    const limite = 120;

    if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
    const reqs = rateLimitMap.get(ip).filter(t => agora - t < janela);
    if (reqs.length >= limite) return res.status(429).json({ error: 'Muitas requisições. Tente em 1 minuto.' });
    reqs.push(agora);
    rateLimitMap.set(ip, reqs);
    next();
});

// Servir arquivos estáticos da raiz do projeto (index.html, fabrica.html)
app.use(express.static(path.join(__dirname, '..')));

// Middleware: valida chave da Fábrica
function verificarChaveFabrica(req, res, next) {
    const chave = (req.headers['x-chave-fabrica'] || '').trim();
    const esperada = (process.env.CHAVE_SECRETA_DA_API || '').trim();
    if (!chave || chave !== esperada) {
        return res.status(401).json({ error: 'Chave da Fábrica inválida' });
    }
    next();
}

// ─── Rotas estáticas ─────────────────────────────────────────────────────────

app.get('/fabrica', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'fabrica.html'));
});

// ─── API Status ───────────────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
    res.json({
        status: 'Online',
        message: 'IdeaOrganizer QG Server v4.0 está rodando!',
        banco: supabase ? 'Supabase' : 'SQLite',
        versao: '4.0.0',
        modo_teste: sistemaControle.modoTeste,
        agentes_ativos: sistemaControle.agentesAtivos,
        pipelines_em_execucao: sistemaControle.pipelinesEmExecucao
    });
});

// ─── Controle dos Agentes (ligar/desligar/modo teste) ────────────────────────

// GET — ver estado atual
app.get('/api/controle', (req, res) => {
    res.json({
        agentes_ativos: sistemaControle.agentesAtivos,
        modo_teste: sistemaControle.modoTeste,
        pipelines_em_execucao: sistemaControle.pipelinesEmExecucao,
        ultima_alteracao: sistemaControle.ultimaAlteracao,
        descricao: sistemaControle.modoTeste
            ? '🔧 MODO TESTE: emails e efeitos externos bloqueados'
            : '🚀 MODO PRODUÇÃO: sistema completo ativo'
    });
});

// POST — alterar estado
app.post('/api/controle', (req, res) => {
    const { acao, chave } = req.body;

    // Validar chave de segurança
    if (chave !== (process.env.CHAVE_SECRETA_DA_API || 'qgia-fabrica-2026')) {
        return res.status(401).json({ error: 'Chave inválida' });
    }

    const acoes_validas = ['pausar', 'ligar', 'modo_teste', 'modo_producao'];
    if (!acoes_validas.includes(acao)) {
        return res.status(400).json({ error: `Ação inválida. Use: ${acoes_validas.join(', ')}` });
    }

    switch (acao) {
        case 'pausar':
            sistemaControle.agentesAtivos = false;
            console.log('⏸️  [Controle] Agentes PAUSADOS');
            break;
        case 'ligar':
            sistemaControle.agentesAtivos = true;
            console.log('▶️  [Controle] Agentes LIGADOS');
            break;
        case 'modo_teste':
            sistemaControle.modoTeste = true;
            console.log('🔧 [Controle] Modo TESTE ativado — emails bloqueados');
            break;
        case 'modo_producao':
            sistemaControle.modoTeste = false;
            console.log('🚀 [Controle] Modo PRODUÇÃO ativado — sistema completo');
            break;
    }

    sistemaControle.ultimaAlteracao = new Date().toISOString();
    res.json({ success: true, estado: sistemaControle, acao_executada: acao });
});

// ─── CRUD: Projetos ───────────────────────────────────────────────────────────

app.get('/api/projetos', async (req, res) => {
    try {
        const rows = await BD.buscarTodos('projetos', {}, 100, 'criado');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/projetos', async (req, res) => {
    try {
        const p = req.body;
        await BD.inserir('projetos', p);
        res.json({ success: true, id: p.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/projetos/:id', async (req, res) => {
    try {
        await BD.deletar('projetos', req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CRUD: Ideias ─────────────────────────────────────────────────────────────

app.get('/api/ideias', async (req, res) => {
    try {
        const { projeto_id, limit = 20 } = req.query;
        const filtros = projeto_id ? { projeto_id } : {};
        const rows = await BD.buscarTodos('ideias', filtros, parseInt(limit), 'criado');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ideias', async (req, res) => {
    try {
        const i = req.body;
        const dados = {
            ...i,
            conteudo: typeof i.conteudo === 'object' ? JSON.stringify(i.conteudo) : i.conteudo || JSON.stringify(i),
            spec_produto: i.spec_produto ? JSON.stringify(i.spec_produto) : null,
            spec_arquitetura: i.spec_arquitetura ? JSON.stringify(i.spec_arquitetura) : null,
            spec_tarefas: i.spec_tarefas ? JSON.stringify(i.spec_tarefas) : null,
            tags: Array.isArray(i.tags) ? JSON.stringify(i.tags) : i.tags,
            proximos_passos: Array.isArray(i.proximos_passos) ? JSON.stringify(i.proximos_passos) : i.proximos_passos,
            detalhes: Array.isArray(i.detalhes) ? JSON.stringify(i.detalhes) : i.detalhes,
        };
        await BD.inserir('ideias', dados);
        res.json({ success: true, id: i.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/ideias/:id', async (req, res) => {
    try {
        await BD.deletar('ideias', req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/ideias/:id', async (req, res) => {
    try {
        await BD.atualizar('ideias', req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CRUD: Agentes ────────────────────────────────────────────────────────────

app.get('/api/agentes', async (req, res) => {
    try { res.json(await BD.buscarTodos('agentes')); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/agentes', async (req, res) => {
    try {
        const a = req.body;
        await BD.inserir('agentes', a);
        res.json({ success: true, id: a.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/agentes/:id', async (req, res) => {
    try {
        await BD.deletar('agentes', req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CRUD: Skills ─────────────────────────────────────────────────────────────

app.get('/api/skills', async (req, res) => {
    try { res.json(await BD.buscarTodos('skills', {}, 500)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skills', async (req, res) => {
    try {
        const s = req.body;
        await BD.inserir('skills', s);
        res.json({ success: true, id: s.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/skills/batch', async (req, res) => {
    try {
        const skills = Array.isArray(req.body) ? req.body : req.body.skills || [];
        if (!skills.length) return res.status(400).json({ error: 'Array de skills vazio' });

        const validas = skills.filter(s => s.nome && s.prompt).map(s => ({
            id: s.id || (Date.now().toString() + Math.random().toString(36).substr(2, 5)),
            nome: s.nome, desc: s.desc || '', prompt: s.prompt
        }));

        for (const s of validas) await BD.inserir('skills', s);
        res.json({ success: true, count: validas.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/skills/:id', async (req, res) => {
    try {
        await BD.deletar('skills', req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CRUD: Memórias ───────────────────────────────────────────────────────────

app.get('/api/memorias', async (req, res) => {
    try {
        const { agente, projeto_rel, categoria, limit = 20 } = req.query;
        const filtros = {};
        if (agente) filtros.agente = agente;
        if (projeto_rel) filtros.projeto_rel = projeto_rel;
        if (categoria) filtros.categoria = categoria;
        res.json(await BD.buscarTodos('memorias', filtros, parseInt(limit), 'criado'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/memorias', async (req, res) => {
    try {
        await BD.inserir('memorias', req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/memorias/:id', async (req, res) => {
    try {
        await BD.deletar('memorias', req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CRUD: Projetos da Fábrica ────────────────────────────────────────────────

app.get('/api/fabrica/projetos', async (req, res) => {
    try {
        const { usuario_id, status, limit = 20 } = req.query;
        const filtros = {};
        if (usuario_id) filtros.usuario_id = usuario_id;
        if (status) filtros.status = status;
        res.json(await BD.buscarTodos('projetos_fabrica', filtros, parseInt(limit), 'criado_em'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/fabrica/projetos/:id', async (req, res) => {
    try {
        const rows = await BD.buscarTodos('projetos_fabrica', { id: req.params.id }, 1);
        if (!rows.length) return res.status(404).json({ error: 'Projeto não encontrado' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── 🏭 FÁBRICA: Orquestrar Ideia ────────────────────────────────────────────

app.post('/api/orquestrar-ideia', verificarChaveFabrica, async (req, res) => {
    if (!sistemaControle.agentesAtivos) {
        return res.status(503).json({ error: '⏸️ Agentes pausados. Use /api/controle para ligar.' });
    }
    try {
        const { ideia, usuario_id = 'anonimo' } = req.body;
        if (!ideia || String(ideia).trim().length < 5) {
            return res.status(400).json({ error: 'A ideia deve ter pelo menos 5 caracteres.' });
        }

        sistemaControle.pipelinesEmExecucao++;
        const fabricaOrchestrator = require('./fabricaOrchestrator');
        const resultado = await fabricaOrchestrator.executarPipeline(ideia.trim(), db || supabase, usuario_id);
        sistemaControle.pipelinesEmExecucao--;
        res.json({ success: true, resultado, modo_teste: sistemaControle.modoTeste });
    } catch (err) {
        sistemaControle.pipelinesEmExecucao = Math.max(0, sistemaControle.pipelinesEmExecucao - 1);
        console.error('[ERRO /api/orquestrar-ideia]', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── 🏭 FÁBRICA: Cocriador → Fábrica ─────────────────────────────────────────

app.post('/api/cocriador-para-fabrica', verificarChaveFabrica, async (req, res) => {
    try {
        const { conversa, usuario_id = 'anonimo' } = req.body;
        if (!conversa) return res.status(400).json({ error: 'Conversa é obrigatória' });

        const fabricaOrchestrator = require('./fabricaOrchestrator');
        const resultado = await fabricaOrchestrator.executarPipelineDeConversa(conversa, db || supabase, usuario_id);
        res.json({ success: true, resultado });
    } catch (err) {
        console.error('[ERRO /api/cocriador-para-fabrica]', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── 🏭 FÁBRICA: Apenas Analisar Conversa ────────────────────────────────────

app.post('/api/analisar-conversa', verificarChaveFabrica, async (req, res) => {
    try {
        const { conversa } = req.body;
        if (!conversa) return res.status(400).json({ error: 'Conversa é obrigatória' });

        const analyst = require('./agents/analyst');
        const spec = await analyst.analisarConversa(conversa);
        res.json({ success: true, spec });
    } catch (err) {
        console.error('[ERRO /api/analisar-conversa]', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── CRON: Processamento automático 24/7 ─────────────────────────────────────

app.post('/api/cron', async (req, res) => {
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    if (secret !== (process.env.CRON_SECRET || 'qgia-cron-2026')) {
        return res.status(401).json({ error: 'Cron secret inválido' });
    }

    // MODO TESTE: CRON só faz heartbeat, não processa ideias nem envia emails
    if (sistemaControle.modoTeste) {
        return res.json({
            success: true,
            modo_teste: true,
            msg: '🔧 Modo teste ativo — CRON em modo heartbeat apenas (sem processamento, sem emails)',
            heartbeat: new Date().toISOString()
        });
    }

    if (!sistemaControle.agentesAtivos) {
        return res.json({
            success: true,
            msg: '⏸️ Agentes pausados — CRON ignorado',
            heartbeat: new Date().toISOString()
        });
    }

    try {
        const totalIdeias   = (await BD.buscarTodos('ideias',   {}, 1000)).length;
        const totalMemorias = (await BD.buscarTodos('memorias', {}, 1000)).length;

        // Salvar heartbeat
        await BD.inserir('memorias', {
            id: Date.now().toString(),
            agente: 'cron',
            conteudo: `Heartbeat: ${totalIdeias} ideias | ${totalMemorias} memórias | ${new Date().toISOString()}`,
            projeto_rel: null,
            criado: new Date().toISOString()
        });

        res.json({
            success: true,
            heartbeat: new Date().toISOString(),
            stats: { ideias: totalIdeias, memorias: totalMemorias }
        });
    } catch (err) {
        console.error('[ERRO /api/cron]', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Inicialização ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    // Inicializar AgentMemory com o banco ativo
    const AgentMemory = require('./core/AgentMemory');
    AgentMemory.inicializar(BD);

    console.log(`\n🚀 IdeaOrganizer QG Server v4.0 rodando na porta ${PORT}`);
    console.log(`🌐 Status:  http://localhost:${PORT}/api/status`);
    console.log(`🏭 Fábrica: http://localhost:${PORT}/fabrica`);
    console.log(`⚡ SSE:     http://localhost:${PORT}/api/pipeline/status`);
    console.log(`🗄️  Banco:   ${supabase ? 'Supabase (cloud)' : 'SQLite (local)'}\n`);
});
