function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeHistory(historico = []) {
  if (!Array.isArray(historico)) return [];
  return historico
    .map((item) => {
      const role = normalizeText(item?.role || item?.autor || item?.tipo || "user").toLowerCase();
      const content = normalizeText(item?.content || item?.texto || item?.message || item?.mensagem || "");
      if (!content) return null;
      return {
        role: role.includes("assistant") || role.includes("nexus") ? "assistant" : "user",
        content
      };
    })
    .filter(Boolean)
    .slice(-20);
}

function inferIntent(prompt, historicoNormalizado) {
  const text = normalizeText(`${historicoNormalizado.map((m) => m.content).join(" ")} ${prompt}`).toLowerCase();
  if (/(erro|bug|falha|quebrou|nao funciona|não funciona|corrigir|consertar)/.test(text)) return "diagnostico_correcao";
  if (/(criar app|gerar app|produto|mvp|startup|ideia|sistema)/.test(text)) return "produto_mvp";
  if (/(arquitetura|escala|infra|performance|seguranca|segurança|deploy)/.test(text)) return "arquitetura_engenharia";
  if (/(vender|preco|preço|marketing|monetiz|clientes|receita)/.test(text)) return "estrategia_negocio";
  return "conversa_geral";
}

function extractConstraints(prompt, historicoNormalizado) {
  const text = normalizeText(`${historicoNormalizado.map((m) => m.content).join(" ")} ${prompt}`);
  const constraints = [];
  if (/\b(hoje|urgente|agora|prazo|deadline)\b/i.test(text)) constraints.push("prioridade_alta");
  if (/\b(sem custo|gratis|grátis|baixo custo|barato)\b/i.test(text)) constraints.push("orcamento_restrito");
  if (/\b(whatsapp|telegram|supabase|mysql|react|vite|node|express)\b/i.test(text)) constraints.push("integracao_stack_existente");
  if (/\b(vps|hostinger|dns|dominio|domínio|nginx|pm2)\b/i.test(text)) constraints.push("ambiente_producao");
  return constraints;
}

function inferMissingInfo(prompt, historicoNormalizado) {
  const full = normalizeText(`${historicoNormalizado.map((m) => m.content).join(" ")} ${prompt}`).toLowerCase();
  const missing = [];
  if (!/(publico|público|cliente|usuario|usuário)/.test(full)) missing.push("publico_alvo");
  if (!/(prazo|deadline|quando)/.test(full)) missing.push("prazo_entrega");
  if (!/(mvp|funcionalidade|requisito|escopo)/.test(full)) missing.push("escopo_funcional");
  if (!/(sucesso|kpi|resultado|meta)/.test(full)) missing.push("criterios_sucesso");
  return missing.slice(0, 4);
}

function buildContextDesigner(analysis, historicoNormalizado) {
  const lastUserTurns = historicoNormalizado.filter((m) => m.role === "user").slice(-3).map((m) => `- ${m.content}`);
  const turns = lastUserTurns.length ? lastUserTurns.join("\n") : "- (sem historico relevante)";
  const constraints = analysis.constraints.length ? analysis.constraints.join(", ") : "nenhuma explicita";
  const missing = analysis.missingInfo.length ? analysis.missingInfo.join(", ") : "nenhuma";

  return [
    "Contexto estruturado da conversa:",
    `- Intencao principal: ${analysis.intent}`,
    `- Objetivo atual: ${analysis.objective}`,
    `- Restricoes identificadas: ${constraints}`,
    `- Lacunas para aprofundar: ${missing}`,
    "- Ultimas mensagens do usuario:",
    turns
  ].join("\n");
}

function buildPromptMaster(analysis, prompt) {
  return [
    "PROMPT MESTRE (gerado automaticamente):",
    `Objetivo central: ${analysis.objective}`,
    `Tipo de demanda: ${analysis.intent}`,
    `Pedido atual do usuario: ${normalizeText(prompt)}`,
    "Instrucoes para o agente:",
    "1. Primeiro, valide entendimento e destaque premissas.",
    "2. Faca perguntas curtas para preencher lacunas criticas.",
    "3. Entregue plano pratico em passos com prioridade.",
    "4. Se apropriado, proponha acionar pipeline da Fabrica.",
    "5. Finalize com proximo passo executavel."
  ].join("\n");
}

function buildCleanOrchestratorContext(analysis, historicoNormalizado, prompt) {
  const userFacts = historicoNormalizado
    .filter((m) => m.role === "user")
    .slice(-6)
    .map((m) => m.content)
    .join(" | ");

  const constraints = analysis.constraints.length ? analysis.constraints.join(", ") : "nenhuma";
  const gaps = analysis.missingInfo.length ? analysis.missingInfo.join(", ") : "nenhuma";

  return [
    `objetivo=${analysis.objective}`,
    `intencao=${analysis.intent}`,
    `restricoes=${constraints}`,
    `lacunas=${gaps}`,
    `pedido_atual=${normalizeText(prompt)}`,
    `historico_relevante=${normalizeText(userFacts) || "sem_historico"}`
  ].join("\n");
}

const ContextEngineeringService = {
  gerarPacote(prompt, historico = []) {
    const promptNormalizado = normalizeText(prompt);
    const historicoNormalizado = normalizeHistory(historico);

    const analysis = {
      intent: inferIntent(promptNormalizado, historicoNormalizado),
      objective: promptNormalizado || "Entender necessidade do usuario",
      constraints: extractConstraints(promptNormalizado, historicoNormalizado),
      missingInfo: inferMissingInfo(promptNormalizado, historicoNormalizado)
    };

    const contextoDesigner = buildContextDesigner(analysis, historicoNormalizado);
    const promptMestreGerado = buildPromptMaster(analysis, promptNormalizado);
    const contextoLimpoOrquestrador = buildCleanOrchestratorContext(analysis, historicoNormalizado, promptNormalizado);

    return {
      analysis,
      contextoDesigner,
      promptMestreGerado,
      contextoLimpoOrquestrador,
      historicoNormalizado
    };
  }
};

module.exports = ContextEngineeringService;
