/**
 * sessionService.js — SSE resumível com session IDs
 * Mantém estado parcial de streams para reconexão sem perder conteúdo.
 */

const sessions = new Map(); // sessionId → { id, createdAt, partial, done }
const TTL_MS = 30 * 60 * 1000; // 30 minutos

// Limpeza periódica de sessões expiradas
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}, 5 * 60 * 1000);

const SessionService = {
  createOrResume(sessionId) {
    if (sessionId && sessions.has(sessionId)) {
      const s = sessions.get(sessionId);
      return { id: sessionId, partial: s.partial, resumed: true, done: s.done };
    }
    const id = sessionId || crypto.randomUUID();
    sessions.set(id, { id, createdAt: Date.now(), partial: '', done: false });
    return { id, partial: '', resumed: false, done: false };
  },

  update(sessionId, chunk) {
    const s = sessions.get(sessionId);
    if (s) s.partial += chunk;
  },

  complete(sessionId) {
    const s = sessions.get(sessionId);
    if (s) s.done = true;
  },

  get(sessionId) {
    return sessions.get(sessionId) || null;
  },

  delete(sessionId) {
    sessions.delete(sessionId);
  },
};

module.exports = SessionService;
