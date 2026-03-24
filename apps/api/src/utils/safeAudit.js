const AuditService = require("../services/auditService");

async function safeAudit(payload) {
  try {
    await AuditService.registrar(payload);
  } catch (e) {
    console.warn("[AUDIT] Falha ao registrar:", e.message);
  }
}

module.exports = safeAudit;
