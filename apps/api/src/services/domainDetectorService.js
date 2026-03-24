const fs = require("fs");
const path = require("path");

class DomainDetectorService {
  constructor() {
    this.keywords = this.getDefaultKeywords();
    this.keywordWeights = this.getDefaultKeywordWeights();
    this.loadKeywords();
  }

  normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  loadKeywords() {
    try {
      const keywordsPath = path.join(
        __dirname,
        "..",
        "..",
        "universal-engineering-implementation",
        "domain-detection",
        "keywords.json"
      );
      if (!fs.existsSync(keywordsPath)) return;
      const raw = fs.readFileSync(keywordsPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        this.keywords = this.mergeKeywords(this.keywords, parsed);
      }
    } catch (error) {
      console.warn("[DomainDetectorService] Falha ao carregar keywords:", error.message);
    }
  }

  mergeKeywords(base, incoming) {
    const merged = { ...base };
    for (const [domain, words] of Object.entries(incoming || {})) {
      const baseWords = Array.isArray(merged[domain]) ? merged[domain] : [];
      const extraWords = Array.isArray(words) ? words : [];
      merged[domain] = Array.from(new Set([...baseWords, ...extraWords]));
    }
    return merged;
  }

  getDefaultKeywords() {
    return {
      software: [
        "software",
        "sistemas",
        "api",
        "backend",
        "frontend",
        "mobile",
        "app",
        "algoritmo",
        "codigo",
        "programacao",
        "sistema"
      ],
      mechanical: [
        "mecanico",
        "mecanica",
        "mecanicas",
        "maquina",
        "maquinas",
        "motor",
        "motores",
        "engrenagem",
        "engrenagens",
        "transmissao",
        "vibracao",
        "fadiga",
        "torque",
        "forca",
        "manufatura",
        "usinagem",
        "cad"
      ],
      civil: [
        "civil",
        "estrutural",
        "construcao",
        "construcoes",
        "edificio",
        "predio",
        "fundacao",
        "fundacoes",
        "concreto",
        "estrutura",
        "estruturas",
        "ponte",
        "obras",
        "infraestrutura",
        "obra"
      ],
      electrical: [
        "eletrico",
        "eletrica",
        "eletronica",
        "eletrco",
        "firmware",
        "firmare",
        "embarcado",
        "embarcdo",
        "controle",
        "embedded",
        "circuito",
        "circtio",
        "circuitos",
        "potencia",
        "potnca",
        "tensao",
        "corrente",
        "automacao",
        "sensor",
        "sensres",
        "iot"
      ],
      chemical: [
        "quimica",
        "quimico",
        "reacao",
        "reator",
        "processo",
        "processos",
        "processo industrial",
        "catalisador",
        "solvente",
        "separacao",
        "efluente",
        "massa",
        "energia",
        "corrosao"
      ],
      product: [
        "produto",
        "prototipo",
        "prototipos",
        "design",
        "ux",
        "ui",
        "usabilidade",
        "ergonomia",
        "interface",
        "jornada",
        "experiencia"
      ],
      integration: [
        "integracao",
        "multidominio",
        "orquestracao",
        "sincronizacao",
        "governanca",
        "interoperabilidade",
        "interfaces entre dominios",
        "varios dominios",
        "sistemas complexos",
        "sistema complexo",
        "interdisciplinar",
        "tradeoff",
        "sinergia"
      ]
    };
  }

  getDefaultKeywordWeights() {
    return {
      software: {
        api: 2,
        backend: 2,
        frontend: 2,
        algoritmo: 2,
        sistemas: 1
      },
      mechanical: {
        engrenagens: 2,
        transmissao: 2,
        vibracao: 2,
        fadiga: 2
      },
      chemical: {
        processo: 2,
        processos: 2,
        massa: 2,
        energia: 2,
        reator: 2
      },
      electrical: {
        firmware: 3,
        embarcado: 3,
        embedded: 3,
        controle: 2,
        circuito: 2,
        circuitos: 2,
        potencia: 2,
        sensor: 2,
        iot: 2
      },
      integration: {
        integracao: 4,
        multidominio: 4,
        orquestracao: 4,
        interdisciplinar: 4,
        coordenacao: 3,
        sincronizacao: 3,
        governanca: 3,
        interoperabilidade: 3,
        "interfaces entre dominios": 4,
        "varios dominios": 3,
        "sistemas complexos": 3
      }
    };
  }

  detectDomain(taskDescription, taskType = null, taskTypeMapping = {}) {
    const normalizedType = this.normalize(taskType);
    if (normalizedType && taskTypeMapping[normalizedType]) {
      const domain = taskTypeMapping[normalizedType];
      return {
        domain,
        confidence: 1,
        method: "taskTypeMapping",
        scores: this.emptyScores(domain)
      };
    }

    const text = this.normalize(taskDescription);
    if (!text) {
      return {
        domain: "software",
        confidence: 0,
        method: "fallback",
        scores: this.emptyScores("software")
      };
    }

    const scores = {};
    for (const [domain, keywords] of Object.entries(this.keywords)) {
      let score = 0;
      for (const keyword of keywords) {
        const normalizedKeyword = this.normalize(keyword);
        if (text.includes(normalizedKeyword)) {
          const weight = this.keywordWeights?.[domain]?.[normalizedKeyword] || 1;
          score += weight;
        }
      }
      scores[domain] = score;
    }

    let detectedDomain = "software";
    let maxScore = 0;
    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain;
      }
    }

    // Heuristica de projeto multidominio:
    // se houver dois dominios tecnicos fortes e proximos, priorizar integracao.
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [top1, top2] = sorted;
    if (
      top1 &&
      top2 &&
      top1[0] !== "integration" &&
      top2[0] !== "integration" &&
      top1[1] >= 2 &&
      top2[1] >= 2 &&
      Math.abs(top1[1] - top2[1]) <= 1
    ) {
      const multiScore = scores.integration || 0;
      if (
        multiScore > 0 ||
        text.includes("integracao") ||
        text.includes("multidominio") ||
        text.includes("interdisciplinar") ||
        text.includes("orquestracao") ||
        text.includes("coordenacao")
      ) {
        detectedDomain = "integration";
        maxScore = Math.max(maxScore, multiScore);
      } else if (top1[1] + top2[1] >= 5) {
        // Mesmo sem palavra explicita de integracao, forte sinal de dominio misto.
        detectedDomain = "integration";
        maxScore = Math.max(maxScore, Math.floor((top1[1] + top2[1]) / 2));
      }
    }

    // Regra forte de integracao quando varios dominios aparecem juntos.
    const crossDomainSignals = [
      "software",
      "mecanica",
      "mecanico",
      "civil",
      "eletrica",
      "eletrico",
      "quimica",
      "produto",
      "automacao",
      "estrutura",
      "fundacao",
      "maquina",
      "circuito",
      "reator"
    ];
    const signalHits = crossDomainSignals.filter((s) => text.includes(s)).length;
    if (
      detectedDomain !== "integration" &&
      signalHits >= 4 &&
      (text.includes("integracao") || text.includes("multidominio") || text.includes("orquestracao"))
    ) {
      detectedDomain = "integration";
      maxScore = Math.max(maxScore, scores.integration || 0);
    }

    // Integracao implicita por alta mistura de dominios (sem palavra explicita).
    const nonIntegrationDomains = ["software", "mechanical", "civil", "electrical", "chemical", "product"];
    const activeDomains = nonIntegrationDomains.filter((d) => (scores[d] || 0) > 0);
    const mixedScore = activeDomains.reduce((acc, d) => acc + (scores[d] || 0), 0);
    if (detectedDomain !== "integration" && activeDomains.length >= 4 && mixedScore >= 8 && signalHits >= 5) {
      detectedDomain = "integration";
      maxScore = Math.max(maxScore, Math.floor(mixedScore / activeDomains.length));
    }

    const total = Object.values(scores).reduce((acc, value) => acc + value, 0);
    const confidence = total > 0 ? maxScore / total : 0;
    return {
      domain: detectedDomain,
      confidence: Number(confidence.toFixed(3)),
      method: "keyword-scoring",
      scores
    };
  }

  emptyScores(preferred) {
    const scores = {};
    for (const domain of Object.keys(this.keywords)) {
      scores[domain] = domain === preferred ? 1 : 0;
    }
    return scores;
  }

}

module.exports = new DomainDetectorService();
