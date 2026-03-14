const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_KEY || ''; const key = rawKey.replace(/[\r\n\t ]+/g, '').trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  }
  return createClient(url, key);
}

const MemoryService = {
  async registrar({ agente, categoria, conteudo, projeto }) {
    const supabase = getSupabase();
    const payload = {
      agente,
      categoria: categoria || "geral",
      conteudo: typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo || {}),
      projeto: projeto || null
    };
    const { data, error } = await supabase.from("agent_memories").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async listar({ agente, categoria, projeto, limit = 50 }) {
    const supabase = getSupabase();
    let query = supabase.from("agent_memories").select("*").order("criado_em", { ascending: false });
    if (agente) query = query.eq("agente", agente);
    if (categoria) query = query.eq("categoria", categoria);
    if (projeto) query = query.eq("projeto", projeto);
    const { data, error } = await query.limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }
};

module.exports = MemoryService;
