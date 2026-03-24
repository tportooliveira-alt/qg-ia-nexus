/**
 * supabaseService.js — Cliente Supabase centralizado
 *
 * Usado como armazenamento primário para:
 *   - agent_memories (aprendizado dos agentes)
 *   - audit_logs (auditoria do sistema)
 *
 * MySQL na Hostinger é mantido como backup assíncrono.
 * Supabase free tier: 500MB PostgreSQL + sem limite de linhas.
 */

const { createClient } = require("@supabase/supabase-js");

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes no .env");
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

function ativo() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

const SupabaseService = {
  ativo,
  getClient,

  /**
   * Insere um registro em uma tabela.
   * Lança erro se Supabase estiver indisponível.
   */
  async inserir(tabela, dados) {
    const sb = getClient();
    const { data, error } = await sb.from(tabela).insert(dados).select().single();
    if (error) throw new Error(`Supabase inserir(${tabela}): ${error.message}`);
    return data;
  },

  /**
   * Busca registros com filtros opcionais.
   * Retorna array vazio em caso de erro.
   */
  async buscar(tabela, { filtros = {}, limit = 50, orderBy = "created_at", ascending = false } = {}) {
    const sb = getClient();
    let query = sb.from(tabela).select("*");

    for (const [col, val] of Object.entries(filtros)) {
      if (val !== undefined && val !== null && val !== "") {
        query = query.eq(col, val);
      }
    }

    query = query.order(orderBy, { ascending }).limit(limit);

    const { data, error } = await query;
    if (error) {
      console.warn(`[SUPABASE] Erro ao buscar ${tabela}:`, error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Verifica conexão com o Supabase.
   * Retorna { ok, latencia_ms, erro? }
   */
  async ping() {
    const inicio = Date.now();
    try {
      const sb = getClient();
      const { error } = await sb.from("audit_logs").select("id").limit(1);
      if (error && error.code !== "42P01") { // 42P01 = tabela não existe, ainda ok
        throw new Error(error.message);
      }
      return { ok: true, latencia_ms: Date.now() - inicio };
    } catch (err) {
      return { ok: false, latencia_ms: Date.now() - inicio, erro: err.message };
    }
  }
};

module.exports = SupabaseService;
