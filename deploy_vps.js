/**
 * deploy_vps.js — Deploy automático na VPS Hostinger
 * Conecta via SSH e executa: git pull → npm install → build → copy → pm2 restart
 */
const { Client } = require("ssh2");

const VPS = {
  host: "187.77.252.91",
  port: 22,
  username: "root",
  password: "@8Vpb1mLy,jp/,g'/@Ej",
  readyTimeout: 15000,
};

const COMMANDS = [
  "echo '=== DEPLOY INICIADO ==='",
  "cd /root/qg-ia-nexus && git pull origin main",
  "cd /root/qg-ia-nexus && npm install --production=false",
  "cd /root/qg-ia-nexus/apps/web && npx vite build 2>&1 | tail -5",
  "cp -r /root/qg-ia-nexus/apps/web/dist/* /var/www/qgia/ 2>/dev/null || echo 'Pasta /var/www/qgia nao existe, pulando copia'",
  "cd /root/qg-ia-nexus && pm2 restart 0 --update-env 2>&1 || pm2 restart all --update-env 2>&1",
  "pm2 status",
  "echo '=== DEPLOY CONCLUIDO ==='",
];

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${cmd}`);
    conn.exec(cmd, { timeout: 120000 }, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      let errOut = "";
      stream.on("data", (d) => { out += d; process.stdout.write(d); });
      stream.stderr.on("data", (d) => { errOut += d; process.stderr.write(d); });
      stream.on("close", (code) => {
        resolve({ code, stdout: out, stderr: errOut });
      });
    });
  });
}

async function deploy() {
  const conn = new Client();
  
  conn.on("ready", async () => {
    console.log("✅ Conectado à VPS!\n");
    
    for (const cmd of COMMANDS) {
      try {
        const result = await runCommand(conn, cmd);
        if (result.code !== 0 && result.code !== null) {
          console.warn(`⚠️ Comando retornou código ${result.code}`);
        }
      } catch (e) {
        console.error(`❌ Erro: ${e.message}`);
      }
    }
    
    conn.end();
    console.log("\n🚀 Deploy finalizado!");
    process.exit(0);
  });

  conn.on("error", (err) => {
    console.error("❌ SSH falhou:", err.message);
    process.exit(1);
  });

  console.log(`🔌 Conectando a ${VPS.host}...`);
  conn.connect(VPS);
}

deploy();
