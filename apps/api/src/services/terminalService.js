const { exec } = require("child_process");
const AIService = require("./aiService");

const TerminalService = {
  /**
   * Valida se um comando é perigoso antes de executar.
   * Retorna { nivel: 'VERMELHO'|'VERDE', msg: string }
   */
  validarAcaoPerigosa(comando) {
    const acao = comando.toLowerCase().trim();

    // 🚫 Comandos destrutivos (Linux + Windows)
    const perigosos = [
      'rm ', 'rm -', 'rmdir', 'del ', 'format ',
      'drop ', 'truncate', 'delete from',
      '> /dev', 'chmod 777', 'chmod -R',
      'shutdown', 'reboot', 'poweroff', 'init 0', 'halt',
      'mkfs', 'dd if=', 'wipefs',
      'kill -9', 'killall', 'pkill',
      ':(){', 'fork bomb',
    ];

    // 🚫 Tentativas de escalar privilégio ou encadear comandos maliciosos
    const padroesMaliciosos = [
      /;\s*(rm|del|drop|shutdown|reboot|kill)/,      // encadeamento: ls; rm -rf
      /\|\s*(rm|del|drop|bash|sh|curl|wget)/,        // pipe pra comando perigoso
      /&&\s*(rm|del|drop|shutdown)/,                  // AND com destrutivo
      /`[^`]*(rm|del|curl|wget|bash)[^`]*`/,         // backtick injection
      /\$\([^)]*(rm|del|curl|wget|bash)[^)]*\)/,     // subshell injection
      /curl\s.*\|\s*(bash|sh)/,                       // curl | bash (execução remota)
      /wget\s.*-O\s*-\s*\|\s*(bash|sh)/,             // wget pipe bash
      />\s*\/etc\//,                                  // sobrescrever configs do sistema
      />\s*~\//,                                      // sobrescrever home
      /eval\s/,                                       // eval injection
      /base64\s.*-d/,                                 // decodificar e executar
    ];

    // 📁 Arquivos/pastas que NUNCA podem ser tocados
    const protegidos = [
      '.env', 'server.js', 'server_HOSTINGER.js',
      'auth_info_baileys', '.git', 'node_modules',
      'authMiddleware.js', 'package.json', 'package-lock.json'
    ];

    // Checa comandos perigosos
    if (perigosos.some(p => acao.includes(p))) {
      return { nivel: 'VERMELHO', msg: "⚠️ BLOQUEADO: Comando destrutivo detectado." };
    }

    // Checa padrões maliciosos com regex
    if (padroesMaliciosos.some(regex => regex.test(acao))) {
      return { nivel: 'VERMELHO', msg: "⚠️ BLOQUEADO: Padrão de injeção de comando detectado." };
    }

    // Checa arquivos protegidos
    if (protegidos.some(file => acao.includes(file))) {
      return { nivel: 'VERMELHO', msg: `⚠️ BLOQUEADO: Tentativa de acessar arquivo protegido.` };
    }

    return { nivel: 'VERDE', msg: "✅ SEGURO" };
  },

  /**
   * Executa comando com Auto-Healing (IA corrige erros automaticamente).
   * Timeout de 30s pra evitar que comandos travem o servidor.
   */
  async executarComAutoHealing(cmd, maxTentativas = 3) {
    let tentativas = 0;
    let comandoAtual = cmd;

    while (tentativas < maxTentativas) {
      const seguranca = this.validarAcaoPerigosa(comandoAtual);
      if (seguranca.nivel === 'VERMELHO') {
        return { status: "Erro", msg: seguranca.msg };
      }

      try {
        const { stdout, stderr } = await new Promise((resolve, reject) => {
          const processo = exec(comandoAtual, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) reject({ error, stderr: stderr || error.message });
            else resolve({ stdout, stderr });
          });
        });
        return { status: "Sucesso", stdout: stdout.substring(0, 5000), comandoExecutado: comandoAtual };
      } catch (falha) {
        tentativas++;
        console.log(`[TERMINAL] Falha na tentativa ${tentativas}. Erro: ${falha.stderr}`);

        if (tentativas >= maxTentativas) {
          return { status: "Erro", msg: `Falha crítica após ${maxTentativas} tentativas.`, erro: falha.stderr };
        }

        // Tenta curar o comando usando IA (com timeout de 15s para não travar)
        const promptCorrecao = `O comando terminal '${comandoAtual}' falhou com o erro: '${falha.stderr}'.\nCorrija o comando para que funcione no Linux/Hostinger e retorne APENAS o novo comando no formato CMD: <comando>.`;
        let resultado;
        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('IA timeout')), 15000)
          );
          const iaCall = AIService.chamarIAComCascata(promptCorrecao, ['Groq', 'Cerebras', 'Gemini']);
          const iaResult = await Promise.race([iaCall, timeout]);
          resultado = iaResult.resultado;
        } catch (iaErr) {
          console.log(`[TERMINAL] Auto-healing IA falhou: ${iaErr.message}`);
          return { status: "Erro", msg: `Falha na tentativa ${tentativas}. Auto-healing indisponível.`, erro: falha.stderr };
        }

        if (resultado && resultado.includes('CMD:')) {
          comandoAtual = resultado.split('CMD:')[1].trim().split('\n')[0]; // Pega só a primeira linha

          // Valida de novo o comando que a IA sugeriu (ela pode sugerir algo perigoso)
          const segCorrecao = this.validarAcaoPerigosa(comandoAtual);
          if (segCorrecao.nivel === 'VERMELHO') {
            return { status: "Erro", msg: "IA sugeriu um comando perigoso. Execução cancelada.", erro: segCorrecao.msg };
          }
        } else {
          return { status: "Erro", msg: "IA não conseguiu sugerir uma correção válida.", erro: falha.stderr };
        }
      }
    }
  }
};

module.exports = TerminalService;
