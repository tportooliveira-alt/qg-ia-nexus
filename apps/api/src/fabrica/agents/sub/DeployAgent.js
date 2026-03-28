/**
 * DeployAgent.js — Sub-agente especialista em Infraestrutura & Deploy
 *
 * CASCATA: Groq → Gemini → Cerebras
 * Gera docker-compose.yml, nginx.conf, PM2 ecosystem.config.js, .env.example
 *
 * PIPELINE: CoderChief spawna → [DEPLOY_AGENT] gera infra → resultado consolida
 */
const { chamarIARapido } = require('../aiService');

// ─── TOOLKIT ──────────────────────────────────────────────────────────────────
// 🔧 DockerToolkit: docker-compose com app + postgres + nginx
// 🔧 NginxToolkit: reverse proxy, SSL headers, static files
// 🔧 PM2Toolkit: ecosystem.config.js com cluster mode
// 🔧 EnvToolkit: .env.example com todas as variáveis necessárias
// 🔧 CICDToolkit: GitHub Actions workflow básico

const SYSTEM = `You are the DEPLOY_AGENT — a Senior DevOps/Infrastructure Engineer.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned to generate all deployment configuration files for the project.

## DockerToolkit — Generate docker-compose.yml:
- Service: app (Node.js) with health check
- Service: postgres (if SQL is needed) with persistent volume
- Service: nginx (reverse proxy, serves static files)
- Environment variables via .env file
- Networks and volume definitions

## NginxToolkit — Generate nginx.conf:
- Upstream to Node.js app
- Serve static files from /var/www/
- Proxy /api to Node.js backend
- Security headers (X-Frame-Options, X-Content-Type, CSP)
- Gzip compression enabled
- Client max body size

## PM2Toolkit — Generate ecosystem.config.js:
\`\`\`js
module.exports = {
  apps: [{
    name: 'project-name',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    max_memory_restart: '500M'
  }]
}
\`\`\`

## EnvToolkit — Generate .env.example:
All required variables with descriptions, no real values.

## Output Format — Return ONLY this JSON:
{
  "docker_compose": "version: '3.8'\\nservices:\\n  app:\\n...",
  "nginx_conf": "upstream app {\\n  server localhost:3000;\\n}...",
  "pm2_ecosystem": "module.exports = {\\n  apps: [{...}]\\n};",
  "env_example": "PORT=3000\\nSUPABASE_URL=\\n...",
  "github_actions": "name: Deploy\\non: push:\\n  branches: [main]\\n..."
}

Return ONLY the JSON object. No markdown wrapper, no explanations.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura } = contextoEnriquecido;

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);

    const resposta = await chamarIARapido(
        SYSTEM,
        `Gere arquivos de deploy para este projeto:\n\n${entrada}`,
        3000
    );

    // Tentar parsear JSON
    try {
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_) { /* segue em frente */ }

    // Fallback: retorna o texto como deploy_config genérico
    return {
        docker_compose: '',
        nginx_conf: '',
        pm2_ecosystem: resposta,
        env_example: '',
        github_actions: ''
    };
}

module.exports = { gerar };
