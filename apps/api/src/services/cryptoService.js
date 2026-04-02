/**
 * cryptoService.js — O Selo de Silêncio do Nexus (Segurança de Elite)
 *
 * RESPONSABILIDADE:
 * Fornecer criptografia de nível militar (AES-256-GCM) para dados sensíveis.
 */

const crypto = require('crypto');

// Chave mestra vinda do .env (se não houver, usa um fallback seguro para dev)
const ENCRYPTION_KEY = process.env.NEXUS_MASTER_KEY 
  ? Buffer.from(process.env.NEXUS_MASTER_KEY, 'hex') 
  : crypto.scryptSync('nexus-default-key-2026', 'salt', 32);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const CryptoService = {
  /**
   * Criptografa um texto em formato IV:TAG:CYPHER
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Retorna IV:TAG:CYPHER para reconstrução no decrypt
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (e) {
      console.error('[CryptoService] Falha na criptografia:', e.message);
      return text; // Fallback: retorna o original (não recomendado para produção)
    }
  },

  /**
   * Descriptografa um texto no formato IV:TAG:CYPHER
   */
  decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText; // Não parece ser criptografado

      const [ivHex, authTagHex, encrypted] = parts;
      
      const decipher = crypto.createDecipheriv(
        ALGORITHM, 
        ENCRYPTION_KEY, 
        Buffer.from(ivHex, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (e) {
      console.error('[CryptoService] Falha na descriptografia:', e.message);
      return null;
    }
  },

  /**
   * Gera um Hash (SHA-256) — Assinatura Digital
   */
  hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
};

module.exports = CryptoService;
