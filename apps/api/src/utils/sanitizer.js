// Sanitizador simples para evitar vazamento de segredos/PII em logs e respostas
const patterns = [
  // API keys comuns (OpenAI, etc.)
  /sk-[A-Za-z0-9]{16,}/gi,
  /AIza[0-9A-Za-z_\-]{20,}/g,
  /(eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,})/g, // JWT-like
  /(service_key|anon_key)\s*[:=]\s*[A-Za-z0-9\-_]{20,}/gi,
  /(openai|anthropic|deepseek|groq|cerebras|gemini)[-_ ]?api[_-]?key\s*[:=]\s*[A-Za-z0-9\-_]{10,}/gi,
  // Telefones brasileiros simples
  /\+?\d{2}\s?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g,
  // E-mails
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
];

function sanitizeText(text) {
  if (text === undefined || text === null) return "";
  let cleaned = String(text);
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, "[REDACTED]");
  }
  if (cleaned.length > 5000) {
    cleaned = cleaned.slice(0, 5000) + " ...[TRUNCATED]";
  }
  return cleaned;
}

module.exports = { sanitizeText };
