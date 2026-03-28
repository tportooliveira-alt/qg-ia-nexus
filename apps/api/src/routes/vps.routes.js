/**
 * vps.routes.js — Rotas do Painel de Controle VPS
 *
 * Todas protegidas por autenticação + rate limiting.
 */

const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const VPSService = require("../services/vpsService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

// ─── Health Check / Ping ──────────────────────────────────────────────────────

router.get("/vps/ping", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const result = await VPSService.ping();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Overview Completo ────────────────────────────────────────────────────────

router.get("/vps/overview", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const overview = await VPSService.getOverview();
    res.json(overview);
  } catch (err) {
    await safeAudit({ agente: "VPS", acao: "overview_error", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: err.message });
  }
});

// ─── Processos PM2 ───────────────────────────────────────────────────────────

router.get("/vps/processes", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const processes = await VPSService.getProcesses();
    res.json({ processes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/vps/processes/:name/:action", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    const { name, action } = req.params;
    const result = await VPSService.pm2Action(name, action);
    await safeAudit({ agente: "VPS", acao: `pm2_${action}`, status: "ok", detalhe: { process: name }, origem: "api" });
    res.json(result);
  } catch (err) {
    await safeAudit({ agente: "VPS", acao: `pm2_${req.params.action}`, status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: err.message });
  }
});

// ─── Nginx ────────────────────────────────────────────────────────────────────

router.get("/vps/nginx", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const status = await VPSService.getNginxStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/vps/nginx/reload", autenticarToken, rateLimiter(3), async (req, res) => {
  try {
    const result = await VPSService.nginxReload();
    await safeAudit({ agente: "VPS", acao: "nginx_reload", status: "ok", detalhe: "ok", origem: "api" });
    res.json(result);
  } catch (err) {
    await safeAudit({ agente: "VPS", acao: "nginx_reload", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: err.message });
  }
});

// ─── Rede ─────────────────────────────────────────────────────────────────────

router.get("/vps/network", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const network = await VPSService.getNetwork();
    res.json(network);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Logs ─────────────────────────────────────────────────────────────────────

router.get("/vps/logs", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const source = req.query.source || "pm2";
    const lines = req.query.lines || 50;
    const result = await VPSService.getLogs(source, lines);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Segurança ────────────────────────────────────────────────────────────────

router.get("/vps/security", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    const info = await VPSService.getSecurityInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
