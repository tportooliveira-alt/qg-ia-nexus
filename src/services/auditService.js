const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_KEY || ''; const key = rawKey.replace(/[\r\n\t ]+/g, '').trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  }
  return createClient(url, key);
}

const AuditService = {
  async registrar({ agente, acao, status, detalhe, origem, alvo }) {
    const supabase = getSupabase();
    const payload = {
      agente: agente || "sistema",
      acao,
      status: status || "ok",
      detalhe: typeof detalhe === "string" ? detalhe : JSON.stringify(detalhe || {}),
      origem: origem || "api",
      alvo: alvo || null
    };
    const { error } = await supabase.from("audit_logs").insert(payload);
    if (error) throw new Error(error.message);
    return true;
  }
};

module.exports = AuditService;
