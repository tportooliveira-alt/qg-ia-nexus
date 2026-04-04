require('dotenv').config({ path: './apps/api/.env' });
const VPSService = require('./apps/api/src/services/vpsService');

async function deploySoberano() {
    console.log('🛰️ Iniciando Operação Salto VPS: QG IA Nexus...');
    
    // Comandos de Elite: Puxar código e despertar o sistema
    const cmd = [
        'cd /var/www/qgia || cd apps/api', // Tenta as pastas prováveis
        'git pull origin main',
        'pm2 restart all',
        'pm2 status'
    ].join(' && ');

    try {
        console.log('🔌 Conectando na Hostinger via SSH...');
        const output = await VPSService.execSSH(cmd, 60000); // 1 min timeout
        console.log('✅ Resposta da VPS:\n', output);
        console.log('🚀 Deploy Soberano Concluído com Sucesso!');
    } catch (e) {
        console.error('❌ Falha Crítica no Salto VPS:', e.message);
        console.log('💡 Dica: Verifique se as variáveis VPS_SSH_HOST/USER/KEY estão no .env local.');
    }
}

deploySoberano();
