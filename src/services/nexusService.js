const fs = require("fs").promises;
const path = require("path");
const AIService = require("./aiService");
const TerminalService = require("./terminalService");
const MemoryService = require("./memoryService");

const NexusService = {
  async carregarContextoOtimizado(prompt) {
    const kb = (file) => path.join(__dirname, "../knowledge_base", file);
    const sk = (file) => path.join(__dirname, "../skills", file);
    const p = prompt.toLowerCase();
    
    // Sempre carrega a BÃ­blia e o Roadmap (Essenciais)
    const biblia = await fs.readFile(kb("NEXUS_CORE_KNOWLEDGE.md"), 'utf-8').catch(() => '');
    const roadmap = await fs.readFile(kb("NEXUS_MASTER_ROADMAP.md"), 'utf-8').catch(() => '');
    
    let contextoOpcional = "";

    // Carregamento Condicional (EconÃ´mico)
    if (p.includes('finanÃ§a') || p.includes('dinheiro') || p.includes('cfo') || p.includes('custo')) {
      const fin = await fs.readFile(kb("NEXUS_FINANCE_EXPERT.md"), 'utf-8').catch(() => '');
      contextoOpcional += `\nCFO FINANCEIRO:\n${fin}\n`;
    }
    if (p.includes('tendÃªncia') || p.includes('radar') || p.includes('novidade') || p.includes('tech')) {
      const rad = await fs.readFile(kb("NEXUS_TECH_RADAR.md"), 'utf-8').catch(() => '');
      contextoOpcional += `\nRADAR TECH:\n${rad}\n`;
    }
    if (p.includes('rede') || p.includes('diplomata') || p.includes('agente')) {
      const red = await fs.readFile(kb("NEXUS_AGENT_NETWORK.md"), 'utf-8').catch(() => '');
      contextoOpcional += `\nREDE DIPLOMÃTICA:\n${red}\n`;
    }
    if (p.includes('priscila') || p.includes('quem Ã©') || p.includes('vida') || p.includes('preferÃªncia')) {
      const vid = await fs.readFile(sk("agentes/VidaDigital.json"), 'utf-8').catch(() => '{}');
      contextoOpcional += `\nCONHECIMENTO SOBRE PRISCILA: ${vid}\n`;
    }
    if (p.includes('skill') || p.includes('habilidade') || p.includes('agente') || p.includes('contrate')) {
      const ski = await fs.readFile(sk("SkillHub.json"), 'utf-8').catch(() => '{}');
      contextoOpcional += `\nSKILL HUB: ${ski}\n`;
    }

    // Memoria recente do agente (curta e util)
    try {
      const memorias = await MemoryService.listar({ agente: "NexusClaw", limit: 10 });
      if (memorias && memorias.length) {
        const resumo = memorias.map(m => `- [${m.categoria}] ${m.conteudo}`).join("\n");
        contextoOpcional += `\nMEMORIAS RECENTES:\n${resumo}\n`;
      }
    } catch {
      // Sem memoria nao bloqueia
    }

    return { biblia, roadmap, contextoOpcional };
  },

  async processarComando(prompt, historico = []) {
    const { biblia, roadmap, contextoOpcional } = await this.carregarContextoOtimizado(prompt);
    
    const contextoSupremo = `BÃBLIA DO NEXUS:\n${biblia}\n\nROADMAP DE EVOLUÃÃO:\n${roadmap}\n${contextoOpcional}\nVOCÃ Ã O NEXUS CLAW.
Sua missÃ£o Ã© ser o CEO, Engenheiro Supremo, CFO, CaÃ§ador de TendÃªncias e Diplomata de IAs. Se notar que falta um agente especialista, diga "Priscila, precisamos contratar..." e use o comando CMD: para criar o arquivo JSON ou instalar skills via npm.`;

    const modoComplexo = prompt.toLowerCase().includes('analise') || prompt.toLowerCase().includes('estude') || prompt.toLowerCase().includes('contrate') || prompt.toLowerCase().includes('finanÃ§a');
    const { resultado, iaUsada } = await AIService.chamarIAComCascata(`${contextoSupremo}\n\nPedido da Priscila:\n${prompt}`, null, modoComplexo);

    if (resultado.includes('CMD:')) {
      const cmd = resultado.split('CMD:')[1].trim();
      const execResult = await TerminalService.executarComAutoHealing(cmd);
      
      if (execResult.status === "Sucesso") {
        return `â NEXUS [${iaUsada}]:\n${resultado.split('CMD:')[0]}\n\n[AUTO-HEALING: SUCESSO]\nSaÃ­da:\n${execResult.stdout}`;
      } else {
        return `â NEXUS [${iaUsada}]:\n${resultado.split('CMD:')[0]}\n\n[ERRO]: ${execResult.msg}\n${execResult.erro || ''}`;
      }
    }
    
    return `â NEXUS [${iaUsada}]:\n${resultado}`;
  }
};

module.exports = NexusService;
