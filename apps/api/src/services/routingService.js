const fs = require('fs');
const path = require('path');
const AgentRegistryService = require('./agentRegistryService');
const DomainDetectorService = require('./domainDetectorService');

class RoutingService {
  constructor() {
    this.routingConfig = null;
    this.metrics = {
      callsByProvider: {},
      callsByDomain: {},
      latencyByProvider: {},
      errorsByProvider: {},
      costByProvider: {}
    };
    this.loadConfig();
  }

  getClarificationThreshold() {
    const raw = Number.parseFloat(process.env.DOMAIN_CONFIDENCE_THRESHOLD || "0.25");
    if (!Number.isFinite(raw)) return 0.25;
    return Math.min(Math.max(raw, 0), 1);
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '..', '..', 'universal-engineering-implementation', 'agentRouting.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.routingConfig = JSON.parse(configData);
      console.log('[RoutingService] Configuracao carregada com sucesso');
    } catch (error) {
      console.error('[RoutingService] Erro ao carregar configuracao:', error.message);
      this.routingConfig = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      domains: {
        software: {
          preferredProviders: ['Gemini', 'DeepSeek', 'Anthropic', 'Groq'],
          fallbackProviders: ['Cerebras', 'OpenAI'],
          constraints: { maxTokens: 2048, timeout: 30000, costLimit: 0.1 }
        }
      },
      taskTypeMapping: {
        'web-app': 'software',
        api: 'software',
        mobile: 'software',
        system: 'software'
      },
      globalSettings: {
        enableMetrics: true,
        enableCostTracking: true,
        defaultTimeout: 30000,
        maxRetries: 3
      }
    };
  }

  detectDomain(taskDescription, taskType = null) {
    return DomainDetectorService.detectDomain(
      taskDescription,
      taskType,
      this.routingConfig?.taskTypeMapping || {}
    );
  }

  shouldRequestClarification(detection, taskDescription = "") {
    if (!detection) return true;
    if (detection.method === "taskTypeMapping") return false;

    const threshold = this.getClarificationThreshold();
    const lowConfidence = (detection.confidence || 0) < threshold;
    if (!lowConfidence) return false;

    const text = String(taskDescription || "").trim();
    // texto vazio ou vago demais precisa clarificacao.
    return text.length < 20 || detection.confidence === 0 || lowConfidence;
  }

  buildClarificationQuestions() {
    return [
      "Qual e o objetivo principal do projeto (software, mecanico, civil, eletrico, quimico, produto ou integracao)?",
      "Quais entregaveis voce espera nesta etapa (ex.: especificacao, codigo, diagrama, calculo, prototipo)?",
      "Existe alguma restricao tecnica obrigatoria (prazo, norma, custo, plataforma)?"
    ];
  }

  async getRoutingForTask(taskDescription, taskType = null) {
    const detection = this.detectDomain(taskDescription, taskType);
    const domain = detection.domain;
    const needsClarification = this.shouldRequestClarification(detection, taskDescription);

    const domainConfig = this.routingConfig.domains[domain];
    if (!domainConfig) {
      console.warn(`[RoutingService] Dominio '${domain}' nao encontrado, usando software como fallback`);
      const softwareConfig = this.routingConfig.domains.software || this.getDefaultConfig().domains.software;
      return {
        domain: 'software',
        detection: { ...detection, domain: 'software' },
        needsClarification,
        clarificationQuestions: needsClarification ? this.buildClarificationQuestions() : [],
        preferredProviders: softwareConfig.preferredProviders || [],
        fallbackProviders: softwareConfig.fallbackProviders || [],
        allProviders: [...(softwareConfig.preferredProviders || []), ...(softwareConfig.fallbackProviders || [])],
        constraints: softwareConfig.constraints || {},
        agentChain: softwareConfig.agentChain || [],
        agents: []
      };
    }

    const agents = await AgentRegistryService.listarAgentesPorDominio(domain);

    return {
      domain,
      detection,
      needsClarification,
      clarificationQuestions: needsClarification ? this.buildClarificationQuestions() : [],
      preferredProviders: domainConfig.preferredProviders || [],
      fallbackProviders: domainConfig.fallbackProviders || [],
      allProviders: [...(domainConfig.preferredProviders || []), ...(domainConfig.fallbackProviders || [])],
      constraints: domainConfig.constraints || {},
      agentChain: domainConfig.agentChain || [],
      agents: agents.map((agent) => ({ nome: agent.nome, papel: agent.papel, icone: agent.icone }))
    };
  }

  getPerformanceProfile(profile = 'balanced') {
    return this.routingConfig.performanceProfiles?.[profile] || this.routingConfig.performanceProfiles?.balanced;
  }

  recordCall(provider, domain, latency, success = true, cost = 0) {
    if (!this.routingConfig.globalSettings.enableMetrics) return;

    if (!this.metrics.callsByProvider[provider]) {
      this.metrics.callsByProvider[provider] = 0;
      this.metrics.latencyByProvider[provider] = [];
      this.metrics.errorsByProvider[provider] = 0;
      this.metrics.costByProvider[provider] = 0;
    }

    if (!this.metrics.callsByDomain[domain]) {
      this.metrics.callsByDomain[domain] = 0;
    }

    this.metrics.callsByProvider[provider]++;
    this.metrics.callsByDomain[domain]++;

    if (latency > 0) {
      this.metrics.latencyByProvider[provider].push(latency);
      if (this.metrics.latencyByProvider[provider].length > 100) {
        this.metrics.latencyByProvider[provider].shift();
      }
    }

    if (!success) {
      this.metrics.errorsByProvider[provider]++;
    }

    if (cost > 0) {
      this.metrics.costByProvider[provider] += cost;
    }
  }

  getMetrics() {
    const summary = {};

    for (const [provider, latencies] of Object.entries(this.metrics.latencyByProvider)) {
      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
        summary[`${provider}_avg_latency`] = Math.round(avgLatency);
      }
    }

    summary.callsByProvider = { ...this.metrics.callsByProvider };
    summary.callsByDomain = { ...this.metrics.callsByDomain };
    summary.errorsByProvider = { ...this.metrics.errorsByProvider };
    summary.costByProvider = { ...this.metrics.costByProvider };

    return summary;
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const status = {
      healthy: true,
      issues: [],
      timestamp: new Date().toISOString()
    };

    for (const [provider, calls] of Object.entries(metrics.callsByProvider || {})) {
      const errors = metrics.errorsByProvider[provider] || 0;
      const errorRate = calls > 0 ? (errors / calls) * 100 : 0;
      if (errorRate > 20) {
        status.issues.push(`${provider}: ${errorRate.toFixed(1)}% erro`);
        status.healthy = false;
      }
    }

    for (const [metricName, value] of Object.entries(metrics)) {
      if (metricName.endsWith('_avg_latency') && value > 30000) {
        const providerName = metricName.replace('_avg_latency', '');
        status.issues.push(`${providerName}: latencia alta (${value}ms)`);
        status.healthy = false;
      }
    }

    return status;
  }

  reloadConfig() {
    this.loadConfig();
    console.log('[RoutingService] Configuracao recarregada');
  }
}

module.exports = new RoutingService();
