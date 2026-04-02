/**
 * vpsService.js — Serviço de Gerenciamento VPS via SSH
 *
 * Conecta na VPS Hostinger via ssh2 e coleta métricas do sistema:
 *   - CPU, RAM, Disco, Rede
 *   - Processos PM2
 *   - Status Nginx
 *   - Logs do sistema
 *
 * Quando rodando na própria VPS, usa comandos locais como fallback.
 */

const { Client } = require("ssh2");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Configuração SSH ────────────────────────────────────────────────────────

function getSSHConfig() {
  const host = process.env.VPS_SSH_HOST;
  const port = parseInt(process.env.VPS_SSH_PORT || "22", 10);
  const username = process.env.VPS_SSH_USER || "root";
  const keyPath = process.env.VPS_SSH_KEY_PATH || "";
  const password = process.env.VPS_SSH_PASSWORD || "";

  if (!host) return null;

  const config = { host, port, username, readyTimeout: 10000 };

  // Prioridade: chave SSH > senha
  if (keyPath) {
    const resolved = keyPath.replace(/^~/, os.homedir());
    if (fs.existsSync(resolved)) {
      config.privateKey = fs.readFileSync(resolved);
    }
  }

  if (password) {
    config.password = password;
  }

  return config;
}

// ─── Executor de Comandos ────────────────────────────────────────────────────

function execSSH(command, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const sshConfig = getSSHConfig();

    if (!sshConfig) {
      // Fallback: execução local
      exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve(stdout.trim());
      });
      return;
    }

    const conn = new Client();
    let output = "";
    let errOutput = "";
    let timer;

    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) { conn.end(); reject(err); return; }

        timer = setTimeout(() => {
          stream.close();
          conn.end();
          resolve(output.trim() || "(timeout)");
        }, timeout);

        stream.on("data", (data) => { output += data.toString(); });
        stream.stderr.on("data", (data) => { errOutput += data.toString(); });
        stream.on("close", () => {
          clearTimeout(timer);
          conn.end();
          resolve(output.trim());
        });
      });
    });

    conn.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`SSH: ${err.message}`));
    });

    conn.connect(sshConfig);
  });
}

// ─── Parsers de Métricas ─────────────────────────────────────────────────────

function parseCPU(raw) {
  try {
    const lines = raw.split("\n");
    const cpuLine = lines.find((l) => l.includes("Cpu(s)") || l.includes("%Cpu"));
    if (!cpuLine) return { percent: 0, model: "unknown", cores: 0 };

    const idleMatch = cpuLine.match(/([\d.]+)\s*id/);
    const idle = idleMatch ? parseFloat(idleMatch[1]) : 0;
    const percent = Math.round((100 - idle) * 10) / 10;

    const infoLine = lines.find((l) => l.includes("model name"));
    const model = infoLine ? infoLine.split(":")[1]?.trim() || "N/A" : "N/A";

    const coresLine = lines.find((l) => l.includes("cpu cores") || l.includes("processor"));
    const cores = lines.filter((l) => l.startsWith("processor")).length || 1;

    return { percent, model, cores };
  } catch {
    return { percent: 0, model: "parse error", cores: 0 };
  }
}

function parseRAM(raw) {
  try {
    const memLine = raw.split("\n").find((l) => l.startsWith("Mem:"));
    if (!memLine) return { total: 0, used: 0, free: 0, percent: 0 };

    const parts = memLine.split(/\s+/);
    const total = parseInt(parts[1], 10);
    const used = parseInt(parts[2], 10);
    const free = parseInt(parts[3], 10);
    const percent = total > 0 ? Math.round((used / total) * 1000) / 10 : 0;

    return { total, used, free, percent };
  } catch {
    return { total: 0, used: 0, free: 0, percent: 0 };
  }
}

function parseDisk(raw) {
  try {
    const line = raw.split("\n").find((l) => l.includes("/") && !l.startsWith("Filesystem"));
    if (!line) return { total: "0", used: "0", free: "0", percent: 0, mount: "/" };

    const parts = line.split(/\s+/);
    return {
      total: parts[1],
      used: parts[2],
      free: parts[3],
      percent: parseInt(parts[4], 10) || 0,
      mount: parts[5] || "/",
    };
  } catch {
    return { total: "0", used: "0", free: "0", percent: 0, mount: "/" };
  }
}

function parseUptime(raw) {
  try {
    const lines = raw.split("\n");
    const uptimeLine = lines[0] || "";
    const loadLine = lines[1] || "";
    const loads = loadLine.split(/\s+/).slice(0, 3).map(Number);

    return {
      uptime: uptimeLine.trim(),
      load_1m: loads[0] || 0,
      load_5m: loads[1] || 0,
      load_15m: loads[2] || 0,
    };
  } catch {
    return { uptime: raw, load_1m: 0, load_5m: 0, load_15m: 0 };
  }
}

function parsePM2(raw) {
  try {
    const list = JSON.parse(raw);
    return list.map((p) => ({
      name: p.name,
      pm_id: p.pm_id,
      status: p.pm2_env?.status || "unknown",
      cpu: p.monit?.cpu || 0,
      memory_mb: Math.round((p.monit?.memory || 0) / 1024 / 1024),
      restarts: p.pm2_env?.restart_time || 0,
      uptime_ms: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
      pid: p.pid,
      node_version: p.pm2_env?.node_version || "",
    }));
  } catch {
    return [];
  }
}

// ─── API Pública ─────────────────────────────────────────────────────────────

const VPSService = {
  /**
   * Executa comando SSH arbitrário
   */
  execSSH,

  /**
   * Verifica se SSH está configurado
   */
  isConfigured() {
    return !!process.env.VPS_SSH_HOST;
  },

  /**
   * Testa conexão SSH
   */
  async ping() {
    const start = Date.now();
    try {
      const hostname = await execSSH("hostname");
      return { ok: true, hostname, latency_ms: Date.now() - start };
    } catch (err) {
      return { ok: false, error: err.message, latency_ms: Date.now() - start };
    }
  },

  /**
   * Overview completo do sistema
   */
  async getOverview() {
    const cmd = [
      'echo "===CPU==="',
      'top -bn1 | head -5',
      'echo "===CPUINFO==="',
      'grep "model name" /proc/cpuinfo | head -1',
      'grep "processor" /proc/cpuinfo',
      'echo "===RAM==="',
      'free -m',
      'echo "===DISK==="',
      'df -h /',
      'echo "===UPTIME==="',
      'uptime -p',
      'cat /proc/loadavg',
      'echo "===HOSTNAME==="',
      'hostname',
      'echo "===IP==="',
      'hostname -I 2>/dev/null | awk "{print \\$1}" || echo "N/A"',
      'echo "===OS==="',
      'cat /etc/os-release 2>/dev/null | head -2 || echo "Linux"',
      'echo "===NODE==="',
      'node -v 2>/dev/null || echo "N/A"',
      'npm -v 2>/dev/null || echo "N/A"',
    ].join(" && ");

    const raw = await execSSH(cmd, 20000);
    const sections = {};
    let currentSection = "";

    for (const line of raw.split("\n")) {
      const match = line.match(/^===(\w+)===/);
      if (match) {
        currentSection = match[1];
        sections[currentSection] = "";
      } else if (currentSection) {
        sections[currentSection] += line + "\n";
      }
    }

    const cpu = parseCPU((sections.CPU || "") + "\n" + (sections.CPUINFO || ""));
    const ram = parseRAM(sections.RAM || "");
    const disk = parseDisk(sections.DISK || "");
    const uptime = parseUptime(sections.UPTIME || "");

    const hostnameRaw = (sections.HOSTNAME || "").trim();
    const ipRaw = (sections.IP || "").trim();
    const osLines = (sections.OS || "").trim().split("\n");
    const osName = osLines.find((l) => l.startsWith("PRETTY_NAME"))?.split("=")[1]?.replace(/"/g, "") || "Linux";

    const nodeLines = (sections.NODE || "").trim().split("\n");
    const nodeVersion = nodeLines[0] || "N/A";
    const npmVersion = nodeLines[1] || "N/A";

    return {
      hostname: hostnameRaw,
      ip: ipRaw,
      os: osName,
      node: nodeVersion,
      npm: npmVersion,
      cpu,
      ram,
      disk,
      uptime,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Lista processos PM2
   */
  async getProcesses() {
    const raw = await execSSH("pm2 jlist 2>/dev/null || echo '[]'");
    return parsePM2(raw);
  },

  /**
   * Ação em processo PM2 (restart, stop, start)
   */
  async pm2Action(processName, action) {
    const allowed = ["restart", "stop", "start", "reload"];
    if (!allowed.includes(action)) {
      throw new Error(`Ação inválida: ${action}. Permitidas: ${allowed.join(", ")}`);
    }
    const output = await execSSH(`pm2 ${action} ${processName} 2>&1`);
    return { action, process: processName, output };
  },

  /**
   * Status do Nginx
   */
  async getNginxStatus() {
    const cmd = [
      'echo "===STATUS==="',
      'systemctl is-active nginx 2>/dev/null || echo "unknown"',
      'echo "===TEST==="',
      'nginx -t 2>&1 || echo "config error"',
      'echo "===SITES==="',
      'ls /etc/nginx/sites-enabled/ 2>/dev/null || echo "N/A"',
    ].join(" && ");

    const raw = await execSSH(cmd);
    const sections = {};
    let current = "";

    for (const line of raw.split("\n")) {
      const match = line.match(/^===(\w+)===/);
      if (match) {
        current = match[1];
        sections[current] = "";
      } else if (current) {
        sections[current] += line + "\n";
      }
    }

    const status = (sections.STATUS || "").trim();
    const configTest = (sections.TEST || "").trim();
    const sites = (sections.SITES || "")
      .trim()
      .split("\n")
      .filter(Boolean);

    return {
      active: status === "active",
      status,
      config_ok: configTest.includes("successful") || configTest.includes("ok"),
      config_test: configTest,
      sites,
    };
  },

  /**
   * Reload do Nginx
   */
  async nginxReload() {
    const testResult = await execSSH("nginx -t 2>&1");
    if (!testResult.includes("successful") && !testResult.includes("ok")) {
      throw new Error(`Nginx config inválida: ${testResult}`);
    }
    const output = await execSSH("systemctl reload nginx 2>&1");
    return { ok: true, output, config_test: testResult };
  },

  /**
   * Tráfego de rede
   */
  async getNetwork() {
    const cmd = [
      'echo "===VNSTAT==="',
      'vnstat --oneline 2>/dev/null || echo "N/A"',
      'echo "===CONNECTIONS==="',
      'ss -s 2>/dev/null | head -5 || echo "N/A"',
    ].join(" && ");

    const raw = await execSSH(cmd);
    const sections = {};
    let current = "";

    for (const line of raw.split("\n")) {
      const match = line.match(/^===(\w+)===/);
      if (match) {
        current = match[1];
        sections[current] = "";
      } else if (current) {
        sections[current] += line + "\n";
      }
    }

    const vnstatLine = (sections.VNSTAT || "").trim();
    let today_rx = "N/A", today_tx = "N/A";

    if (vnstatLine && vnstatLine !== "N/A") {
      const parts = vnstatLine.split(";");
      today_rx = parts[3] || "N/A";
      today_tx = parts[4] || "N/A";
    }

    return {
      today_rx,
      today_tx,
      connections_raw: (sections.CONNECTIONS || "").trim(),
    };
  },

  /**
   * Logs do sistema (PM2 + Nginx + Journal)
   */
  async getLogs(source = "pm2", lines = 50) {
    const safe = Math.min(Math.max(parseInt(lines, 10) || 50, 10), 200);
    let cmd;

    switch (source) {
      case "pm2":
        cmd = `pm2 logs --nostream --lines ${safe} 2>&1 | tail -${safe}`;
        break;
      case "nginx":
        cmd = `tail -n ${safe} /var/log/nginx/error.log 2>/dev/null || echo "Sem logs nginx"`;
        break;
      case "nginx-access":
        cmd = `tail -n ${safe} /var/log/nginx/access.log 2>/dev/null || echo "Sem logs nginx access"`;
        break;
      case "journal":
        cmd = `journalctl --no-pager -n ${safe} 2>/dev/null || echo "journalctl indisponivel"`;
        break;
      case "syslog":
        cmd = `tail -n ${safe} /var/log/syslog 2>/dev/null || echo "Sem syslog"`;
        break;
      default:
        cmd = `pm2 logs --nostream --lines ${safe} 2>&1 | tail -${safe}`;
    }

    const output = await execSSH(cmd, 20000);
    return { source, lines: safe, output };
  },

  /**
   * Informações de segurança básicas
   */
  async getSecurityInfo() {
    const cmd = [
      'echo "===PORTS==="',
      'ss -tlnp 2>/dev/null | head -20 || echo "N/A"',
      'echo "===FAIL2BAN==="',
      'fail2ban-client status 2>/dev/null || echo "not installed"',
      'echo "===LASTLOGIN==="',
      'last -5 2>/dev/null || echo "N/A"',
    ].join(" && ");

    const raw = await execSSH(cmd);
    const sections = {};
    let current = "";

    for (const line of raw.split("\n")) {
      const match = line.match(/^===(\w+)===/);
      if (match) {
        current = match[1];
        sections[current] = "";
      } else if (current) {
        sections[current] += line + "\n";
      }
    }

    return {
      open_ports: (sections.PORTS || "").trim(),
      fail2ban: (sections.FAIL2BAN || "").trim(),
      last_logins: (sections.LASTLOGIN || "").trim(),
    };
  },
};

module.exports = VPSService;
