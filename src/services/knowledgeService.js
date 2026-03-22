const fs = require('fs').promises;
const path = require('path');

class KnowledgeService {
  constructor() {
    this.knowledgeBase = {};
    this.domains = ['software', 'mechanical', 'civil', 'electrical', 'chemical', 'product', 'integration'];
    this.ready = this.loadKnowledgeBase();
  }

  async loadKnowledgeBase() {
    console.log('[KnowledgeService] Carregando base de conhecimento...');

    for (const domain of this.domains) {
      this.knowledgeBase[domain] = {};

      const domainPath = path.join(__dirname, '..', 'knowledge_base', domain);

      try {
        // Carregar arquivos JSON
        const jsonFiles = await fs.readdir(domainPath).catch(() => []);
        for (const file of jsonFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(domainPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            const key = file.replace('.json', '');
            this.knowledgeBase[domain][key] = JSON.parse(this.stripBom(content));
          }
        }

        // Carregar arquivos Markdown como texto
        const mdFiles = await fs.readdir(domainPath).catch(() => []);
        for (const file of mdFiles) {
          if (file.endsWith('.md')) {
            const filePath = path.join(domainPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            const key = file.replace('.md', '');
            this.knowledgeBase[domain][key] = content;
          }
        }

      } catch (error) {
        console.warn(`[KnowledgeService] Erro ao carregar conhecimento para ${domain}:`, error.message);
      }
    }

    console.log('[KnowledgeService] Base de conhecimento carregada');
  }

  stripBom(text) {
    return typeof text === 'string' ? text.replace(/^\uFEFF/, '') : text;
  }

  async ensureReady() {
    await this.ready;
  }

  getKnowledge(domain, category = null) {
    if (!this.knowledgeBase[domain]) {
      return null;
    }

    if (category) {
      return this.knowledgeBase[domain][category] || null;
    }

    return this.knowledgeBase[domain];
  }

  searchKnowledge(domain, query, maxResults = 50) {
    const domainKnowledge = this.getKnowledge(domain);
    if (!domainKnowledge) return [];

    const results = [];
    const searchTerm = String(query || '').trim().toLowerCase();
    if (!searchTerm) return [];

    // Buscar em objetos JSON
    const searchInObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        if (obj.toLowerCase().includes(searchTerm)) {
          if (results.length < maxResults) results.push({
            path: path,
            content: obj,
            type: 'text'
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          searchInObject(item, `${path}[${index}]`);
        });
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          searchInObject(value, path ? `${path}.${key}` : key);
        }
      }
    };

    // Buscar em strings (conteúdo Markdown)
    const searchInString = (content, filename) => {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchTerm)) {
          if (results.length < maxResults) results.push({
            path: `${filename}:${index + 1}`,
            content: line.trim(),
            type: 'markdown'
          });
        }
      });
    };

    // Executar busca
    for (const [key, value] of Object.entries(domainKnowledge)) {
      if (typeof value === 'string') {
        searchInString(value, key);
      } else {
        searchInObject(value, key);
      }
    }

    return results.slice(0, maxResults);
  }

  getAvailableDomains() {
    return this.domains;
  }

  getDomainCategories(domain) {
    if (!this.knowledgeBase[domain]) return [];
    return Object.keys(this.knowledgeBase[domain]);
  }

  async addKnowledge(domain, category, content, isJson = false) {
    if (!this.domains.includes(domain)) {
      throw new Error(`Domínio '${domain}' não suportado`);
    }

    const domainPath = path.join(__dirname, '..', 'knowledge_base', domain);
    await fs.mkdir(domainPath, { recursive: true });

    const extension = isJson ? 'json' : 'md';
    const filePath = path.join(domainPath, `${category}.${extension}`);

    const contentToWrite = isJson ? JSON.stringify(content, null, 2) : content;
    await fs.writeFile(filePath, contentToWrite, 'utf8');

    // Recarregar conhecimento
    this.ready = this.loadKnowledgeBase();
    await this.ready;

    return { domain, category, filePath };
  }

  getKnowledgeSummary() {
    const summary = {};

    for (const domain of this.domains) {
      const categories = this.getDomainCategories(domain);
      summary[domain] = {
        categories: categories.length,
        categoryNames: categories
      };
    }

    return summary;
  }
}

module.exports = new KnowledgeService();
