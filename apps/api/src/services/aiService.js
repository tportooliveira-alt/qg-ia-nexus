const fetch = require("node-fetch");
const routingService = require("./routingService");

function envInt(name, fallback) {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const MAX_TOKENS_DEFAULT = {
  Gemini: envInt("MAX_TOKENS_GEMINI", 8192),
  DeepSeek: envInt("MAX_TOKENS_DEEPSEEK", 4096),
  Cerebras: envInt("MAX_TOKENS_CEREBRAS", 8192),
  Anthropic: envInt("MAX_TOKENS_ANTHROPIC", 4096),
  OpenAI: envInt("MAX_TOKENS_OPENAI", 4096),
  Groq: envInt("MAX_TOKENS_GROQ", 8192),
  SambaNova: envInt("MAX_TOKENS_SAMBANOVA", 4096),
  xAI: envInt("MAX_TOKENS_XAI", 4096)
};

function getVolumeMultiplier() {
  const profile = (process.env.TOKEN_VOLUME || "normal").toLowerCase();
  if (profile === "eco") return 0.7;
  if (profile === "power") return 1.5;
  return 1.0;
}

function getMaxTokens(provider, override) {
  if (Number.isFinite(override) && override > 0) return override;
  const base = MAX_TOKENS_DEFAULT[provider] || 1024;
  return Math.max(128, Math.round(base * getVolumeMultiplier()));
}

const AIService = {
  async callGemini(prompt, maxTokens = null) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: getMaxTokens("Gemini", maxTokens) }
      })
    });
    if (!res.ok) throw new Error(`Gemini falhou com status: ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  },

  async callDeepSeek(prompt, maxTokens = null) {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY ausente");
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", max_tokens: getMaxTokens("DeepSeek", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`DeepSeek falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async callCerebras(prompt, maxTokens = null) {
    if (!process.env.CEREBRAS_API_KEY) throw new Error("CEREBRAS_API_KEY ausente");
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1-8b", max_tokens: getMaxTokens("Cerebras", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`Cerebras falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async callAnthropic(prompt, maxTokens = null) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: getMaxTokens("Anthropic", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`Anthropic falhou com status: ${res.status}`);
    const data = await res.json();
    return data.content[0].text;
  },

  async callGeminiStream(prompt, maxTokens = null, onChunk) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: getMaxTokens("Gemini", maxTokens) }
        })
      }
    );
    if (!res.ok) throw new Error(`Gemini stream falhou com status: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { fullText += text; onChunk(text); }
        } catch { /* linha incompleta */ }
      }
    }
    return fullText;
  },

  async callAnthropicStream(prompt, maxTokens = null, onChunk) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: getMaxTokens("Anthropic", maxTokens),
        stream: true,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic stream falhou com status: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch { /* linha incompleta */ }
      }
    }
    return fullText;
  },

  async callGroqStream(prompt, maxTokens = null, onChunk) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY ausente");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: getMaxTokens("Groq", maxTokens),
        stream: true,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(`Groq stream falhou com status: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) { fullText += text; onChunk(text); }
        } catch { /* linha incompleta */ }
      }
    }
    return fullText;
  },

  async callCerebrasStream(prompt, maxTokens = null, onChunk) {
    if (!process.env.CEREBRAS_API_KEY) throw new Error("CEREBRAS_API_KEY ausente");
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3.1-8b",
        max_tokens: getMaxTokens("Cerebras", maxTokens),
        stream: true,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(`Cerebras stream falhou com status: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) { fullText += text; onChunk(text); }
        } catch { /* linha incompleta */ }
      }
    }
    return fullText;
  },

  async callDeepSeekStream(prompt, maxTokens = null, onChunk) {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY ausente");
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: getMaxTokens("DeepSeek", maxTokens),
        stream: true,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) throw new Error(`DeepSeek stream falhou com status: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) { fullText += text; onChunk(text); }
        } catch { /* linha incompleta */ }
      }
    }
    return fullText;
  },

  async callOpenAI(prompt, maxTokens = null) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: getMaxTokens("OpenAI", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`OpenAI falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async callSambaNova(prompt, maxTokens = null) {
    if (!process.env.SAMBANOVA_API_KEY) throw new Error("SAMBANOVA_API_KEY ausente");
    const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", max_tokens: getMaxTokens("SambaNova", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`SambaNova falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async callxAI(prompt, maxTokens = null) {
    if (!process.env.XAI_API_KEY) throw new Error("XAI_API_KEY ausente");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "grok-3-mini", max_tokens: getMaxTokens("xAI", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`xAI falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async callGroq(prompt, maxTokens = null) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY ausente");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: getMaxTokens("Groq", maxTokens), messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`Groq falhou com status: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  },

  async chamarIAComCascata(prompt, prioridadeDeIAs = null, modoSintese = false, maxTokens = null, taskType = null, taskDescription = null) {
    const startTime = Date.now();

    let routing = null;
    if (taskType || taskDescription) {
      routing = await routingService.getRoutingForTask(taskDescription || prompt, taskType);
      console.log(`[AI Routing] Dominio detectado: ${routing.domain}, Providers: ${routing.allProviders.join(", ")}`);
    }

    const mapaIAs = {
      DeepSeek: this.callDeepSeek,
      Gemini: this.callGemini,
      Cerebras: this.callCerebras,
      Anthropic: this.callAnthropic,
      OpenAI: this.callOpenAI,
      Groq: this.callGroq,
      SambaNova: this.callSambaNova,
      xAI: this.callxAI
    };

    if (!prioridadeDeIAs) {
      if (routing) {
        // Guardrail: com baixa confianca, evita roteamento especializado prematuro.
        if (routing.needsClarification) {
          prioridadeDeIAs = ["Gemini", "Groq", "Cerebras", "DeepSeek", "SambaNova", "xAI", "Anthropic", "OpenAI"];
        } else {
          prioridadeDeIAs = routing.allProviders;
        }
        if (!routing.needsClarification && routing.constraints.maxTokens && !maxTokens) {
          maxTokens = routing.constraints.maxTokens;
        }
      } else {
        const p = String(prompt || "").toLowerCase();
        if (p.includes("codigo") || p.includes("programacao") || p.includes("script")) {
          prioridadeDeIAs = ["DeepSeek", "Gemini", "Groq", "Cerebras", "SambaNova", "xAI", "Anthropic", "OpenAI"];
        } else if (p.includes("rapido") || p.includes("status") || p.includes("zap")) {
          prioridadeDeIAs = ["Groq", "Cerebras", "Gemini", "SambaNova"];
        } else if (p.includes("analise") || p.includes("compare") || p.includes("arquitetura")) {
          prioridadeDeIAs = ["Gemini", "Groq", "Cerebras", "DeepSeek", "SambaNova", "xAI", "Anthropic", "OpenAI"];
        } else {
          prioridadeDeIAs = ["Gemini", "Groq", "Cerebras", "DeepSeek", "SambaNova", "xAI", "Anthropic", "OpenAI"];
        }
      }
    }

    if (modoSintese) {
      const [resDS, resGem] = await Promise.all([
        this.callDeepSeek(prompt, maxTokens).catch(() => null),
        this.callGemini(prompt, maxTokens).catch(() => null)
      ]);

      if (!resDS && !resGem) {
        prioridadeDeIAs = ["Anthropic", "Groq", "Cerebras", "OpenAI"];
      } else if (resDS && resGem) {
        const latency = Date.now() - startTime;
        routingService.recordCall("DeepSeek+Gemini", routing?.domain || "synthesis", latency, true);
        return { resultado: `[SINTESE INTELIGENTE]\n\nAnalise DeepSeek:\n${resDS}\n\nAnalise Gemini:\n${resGem}`, iaUsada: "DeepSeek+Gemini" };
      } else {
        const provider = resDS ? "DeepSeek" : "Gemini";
        const latency = Date.now() - startTime;
        routingService.recordCall(provider, routing?.domain || "synthesis", latency, true);
        return { resultado: resDS || resGem, iaUsada: provider };
      }
    }

    let ultimoErro = null;
    for (const nomeIA of prioridadeDeIAs) {
      try {
        if (mapaIAs[nomeIA]) {
          const resultado = await mapaIAs[nomeIA].bind(this)(prompt, maxTokens);
          const latency = Date.now() - startTime;
          routingService.recordCall(nomeIA, routing?.domain || "unknown", latency, true);
          console.log(`[IA] Usada: ${nomeIA} (${latency}ms)`);
          return { resultado, iaUsada: nomeIA };
        }
      } catch (erro) {
        ultimoErro = erro;
        const latency = Date.now() - startTime;
        routingService.recordCall(nomeIA, routing?.domain || "unknown", latency, false);
        if (erro.message.includes("429") || erro.message.includes("402") ||
            erro.message.toLowerCase().includes("quota") ||
            erro.message.toLowerCase().includes("tokens") ||
            erro.message.toLowerCase().includes("payment") ||
            erro.message.toLowerCase().includes("insufficient") ||
            erro.message.toLowerCase().includes("balance")) {
          console.warn(`[IA] ${nomeIA} sem credito/quota (${erro.message.match(/\d{3}/)?.[0] || 'err'}). Tentando proxima...`);
          continue;
        }
        console.warn(`[IA] ${nomeIA} falhou, tentando proxima...`);
      }
    }

    throw new Error(`Todas as IAs falharam. Ultimo erro: ${ultimoErro?.message}`);
  }
};

module.exports = AIService;
