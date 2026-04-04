/**
 * storageService.js — O Cofre de Inteligência do Nexus (Supabase Storage)
 *
 * Responsável por gerenciar os ativos pesados que não devem poluir o GitHub/VPS.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET_NAME = 'nexus-intelligence-vault';

const StorageService = {
  ativo() {
    return !!supabase;
  },

  /**
   * Faz o upload de uma 'peça' de conhecimento pesada
   */
  async uploadAtivo(pathLocal, destinationPath) {
    if (!this.ativo()) return { success: false, error: 'Supabase não configurado' };
    
    try {
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(pathLocal);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(destinationPath, fileBuffer, {
          upsert: true,
          contentType: 'application/octet-stream'
        });

      if (error) throw error;
      return { success: true, path: data.path };
    } catch (e) {
      console.error('[StorageService] Erro no upload:', e.message);
      return { success: false, error: e.message };
    }
  },

  /**
   * Obtém link para o Minerador baixar a peça
   */
  async getLinkMineracao(path) {
    if (!this.ativo()) return null;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }
};

module.exports = StorageService;
