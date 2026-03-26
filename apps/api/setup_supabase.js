/**
 * setup_supabase.js — Executa as tabelas no Supabase automaticamente
 * Uso: node setup_supabase.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes no .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// Tabelas para criar via insert de teste (se não existem, o erro mostra)
const TABELAS = [
  'audit_logs',
  'agent_memories',
  'transacoes_financeiras',
  'projetos',
  'ideias',
  'agentes',
  'skills',
  'memorias',
  'projetos_fabrica',
  'ideias_logs'
];

async function verificarConexao() {
  console.log('🔌 Testando conexão com Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);
  
  const inicio = Date.now();
  try {
    // Tenta fazer um select simples para verificar se existe
    const { data, error } = await sb.from('audit_logs').select('id').limit(1);
    const latencia = Date.now() - inicio;
    
    if (error && error.code === '42P01') {
      console.log(`⚠️  Conexão OK (${latencia}ms) — tabelas ainda não existem`);
      return 'NEEDS_SETUP';
    } else if (error) {
      console.log(`⚠️  Conexão OK (${latencia}ms) — erro: ${error.message}`);
      return 'NEEDS_SETUP';
    } else {
      console.log(`✅ Conexão OK (${latencia}ms) — audit_logs tem ${data.length} registro(s)`);
      return 'CONNECTED';
    }
  } catch (e) {
    console.error(`❌ Falha na conexão: ${e.message}`);
    return 'FAILED';
  }
}

async function verificarTabelas() {
  console.log('\n📊 Verificando tabelas existentes...');
  const resultados = {};
  
  for (const tabela of TABELAS) {
    try {
      const { data, error } = await sb.from(tabela).select('*').limit(0);
      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        resultados[tabela] = '❌ NÃO EXISTE';
      } else if (error) {
        resultados[tabela] = `⚠️  ERRO: ${error.message}`;
      } else {
        resultados[tabela] = '✅ EXISTE';
      }
    } catch (e) {
      resultados[tabela] = `❌ ERRO: ${e.message}`;
    }
  }
  
  console.log('');
  let existentes = 0;
  let faltando = 0;
  for (const [tabela, status] of Object.entries(resultados)) {
    console.log(`   ${status.padEnd(20)} ${tabela}`);
    if (status.startsWith('✅')) existentes++;
    else faltando++;
  }
  
  console.log(`\n   Total: ${existentes} existentes, ${faltando} faltando`);
  return { existentes, faltando, resultados };
}

async function criarTabelasTeste() {
  console.log('\n🔧 Tentando criar tabelas via INSERT de teste...');
  
  // Tenta inserir um registro em audit_logs para ver se a tabela existe
  const { error: err1 } = await sb.from('audit_logs').insert({
    agente: 'setup_script',
    acao: 'verificacao_inicial',
    status: 'ok',
    detalhe: 'Script de setup executado',
    origem: 'setup'
  });
  
  if (err1 && err1.code === '42P01') {
    console.log('⚠️  Tabelas não existem — você precisa executar o SQL manualmente');
    console.log('\n📋 INSTRUÇÕES:');
    console.log('   1. Abra: https://supabase.com/dashboard/project/slqajataiuhvlkgoujml/sql/new');
    console.log('   2. Cole o conteúdo de SUPABASE_SETUP.sql');
    console.log('   3. Clique em "Run"');
    console.log('   4. Execute este script novamente para verificar');
    return false;
  } else if (err1) {
    console.log(`⚠️  Erro ao inserir teste: ${err1.message}`);
    return false;
  } else {
    console.log('✅ audit_logs funcional — registro de setup inserido');
    return true;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  QG-IA-Nexus — Supabase Setup Verifier');
  console.log('═══════════════════════════════════════════\n');
  
  const status = await verificarConexao();
  
  if (status === 'FAILED') {
    console.log('\n❌ Não foi possível conectar ao Supabase. Verifique as credenciais no .env');
    process.exit(1);
  }
  
  const { existentes, faltando } = await verificarTabelas();
  
  if (faltando > 0) {
    await criarTabelasTeste();
  } else {
    console.log('\n🎉 Todas as tabelas existem! Banco pronto.');
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('  FIM');
  console.log('═══════════════════════════════════════════');
}

main().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
