const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_KEY || ''; const key = rawKey.replace(/[\r\n\t ]+/g, '').trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  }
  return createClient(url, key);
}

const ApprovalService = {
  async solicitar({ agente, acao, detalhes, origem }) {
    const supabase = getSupabase();
    const payload = {
      agente,
      acao,
      detalhes: typeof detalhes === "string" ? detalhes : JSON.stringify(detalhes || {}),
      origem: origem || "api",
      status: "PENDENTE"
    };
    const { data, error } = await supabase.from("approvals").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async listarPendentes(limit = 50) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("approvals")
      .select("*")
      .eq("status", "PENDENTE")
      .order("criado_em", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  },

  async obterPorId(id) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("approvals").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async decidir({ id, status, decisor, observacao }) {
    const supabase = getSupabase();
    const payload = {
      status,
      decisor: decisor || "Thiago",
      observacao: observacao || null,
      decidido_em: new Date().toISOString()
    };
    const { data, error } = await supabase.from("approvals").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = ApprovalService;
