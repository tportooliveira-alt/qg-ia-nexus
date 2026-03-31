const MAX_PIPELINES = 50;
const MAX_EVENTS_PER_PIPELINE = 1200;

const pipelines = new Map();

function nowIso() {
  return new Date().toISOString();
}

function prunePipelines() {
  while (pipelines.size > MAX_PIPELINES) {
    const oldest = pipelines.keys().next().value;
    pipelines.delete(oldest);
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return safeStringify(value);
}

function inferAgent(evento) {
  if (evento.agente) return String(evento.agente);
  if (evento.tipo === "auditoria_resultado") return "Auditor-Claude";
  if (evento.tipo === "pipeline_aprovado") return "Auditor-Claude";
  return null;
}

function statusFromEvent(evento) {
  switch (evento.tipo) {
    case "pipeline_iniciado": return "rodando";
    case "pipeline_aprovado": return "aprovado";
    case "pipeline_concluido": return "concluido";
    case "pipeline_erro": return "erro";
    case "pipeline_cancelado": return "cancelado";
    case "pipeline_timeout": return "erro";
    default: return null;
  }
}

function extractArtifacts(evento) {
  const dados = evento.dados && typeof evento.dados === "object" ? evento.dados : null;
  if (!dados) return [];

  const keys = [
    "codigo_app",
    "codigo_ui",
    "codigo_sql",
    "documento",
    "planilha",
    "auditoria",
    "plano",
    "arquitetura",
    "design_system"
  ];

  return keys
    .filter((k) => dados[k] != null)
    .map((k) => ({
      tipo: k,
      titulo: k.replace(/_/g, " "),
      conteudo: toText(dados[k]),
      geradoEm: evento.timestamp || nowIso(),
    }));
}

function extractLearning(evento) {
  const texto = `${evento.tipo || ""} ${evento.mensagem || ""}`.toLowerCase();
  const sinais = ["auditoria", "aprov", "memoria", "corrig", "score", "problema"];
  if (!sinais.some((s) => texto.includes(s))) return null;
  return {
    titulo: evento.tipo || "aprendizado",
    conteudo: evento.mensagem || "",
    score: evento.dados?.score || null,
    criadoEm: evento.timestamp || nowIso(),
  };
}

function ensurePipeline(pipelineId, ideia = null) {
  const id = String(pipelineId || "").trim();
  if (!id) return null;
  if (!pipelines.has(id)) {
    pipelines.set(id, {
      pipelineId: id,
      ideia: ideia || "",
      criadoEm: nowIso(),
      atualizadoEm: nowIso(),
      status: "aguardando",
      progresso: 0,
      fase: null,
      agentes: {},
      eventos: [],
      aprendizados: [],
      artefatos: [],
      contexto: {
        resumo: "Aguardando eventos...",
        faseAtual: null,
        agentesAtivos: [],
        sinais: [],
      },
    });
    prunePipelines();
  } else if (ideia) {
    pipelines.get(id).ideia = ideia;
  }
  return pipelines.get(id);
}

function updateContexto(pipe) {
  const agentesAtivos = Object.values(pipe.agentes)
    .filter((a) => a.status === "ativo")
    .map((a) => a.nome);

  const ultimosAprendizados = pipe.aprendizados.slice(-3).map((a) => a.conteudo).filter(Boolean);

  pipe.contexto = {
    resumo: pipe.eventos.slice(-1)[0]?.mensagem || "Executando pipeline",
    faseAtual: pipe.fase,
    agentesAtivos,
    sinais: ultimosAprendizados,
  };
}

function registrarEvento(pipelineId, eventoRaw) {
  const pipe = ensurePipeline(pipelineId);
  if (!pipe) return;

  const evento = {
    ...eventoRaw,
    pipeline_id: pipelineId,
    timestamp: eventoRaw.timestamp || nowIso(),
  };

  pipe.atualizadoEm = nowIso();
  if (typeof evento.progresso === "number") pipe.progresso = evento.progresso;
  if (evento.fase != null) pipe.fase = evento.fase;

  const novoStatus = statusFromEvent(evento);
  if (novoStatus) pipe.status = novoStatus;

  const agenteNome = inferAgent(evento);
  if (agenteNome) {
    const atual = pipe.agentes[agenteNome] || {
      nome: agenteNome,
      status: "aguardando",
      ultimaMensagem: "",
      atualizadoEm: null,
      progresso: 0,
      eventos: 0,
    };

    if (evento.tipo === "agente_ativo") atual.status = "ativo";
    if (evento.tipo === "agente_concluido" || evento.tipo === "auditoria_resultado") atual.status = "concluido";
    if (pipe.status === "erro" || pipe.status === "cancelado") atual.status = pipe.status;

    atual.ultimaMensagem = evento.mensagem || atual.ultimaMensagem;
    atual.atualizadoEm = evento.timestamp;
    atual.eventos += 1;
    if (typeof evento.progresso === "number") atual.progresso = evento.progresso;

    pipe.agentes[agenteNome] = atual;
  }

  const artifacts = extractArtifacts(evento);
  if (artifacts.length > 0) {
    pipe.artefatos.push(...artifacts);
    if (pipe.artefatos.length > 300) pipe.artefatos = pipe.artefatos.slice(-300);
  }

  const aprendizado = extractLearning(evento);
  if (aprendizado) {
    pipe.aprendizados.push(aprendizado);
    if (pipe.aprendizados.length > 400) pipe.aprendizados = pipe.aprendizados.slice(-400);
  }

  pipe.eventos.push(evento);
  if (pipe.eventos.length > MAX_EVENTS_PER_PIPELINE) {
    pipe.eventos = pipe.eventos.slice(-MAX_EVENTS_PER_PIPELINE);
  }

  updateContexto(pipe);
}

function ingestChunk(pipelineId, chunk) {
  if (!chunk) return;
  const lines = String(chunk).split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.replace(/^data:\s*/, "");
    if (!payload || payload === "[DONE]") continue;
    try {
      const evento = JSON.parse(payload);
      registrarEvento(pipelineId, evento);
    } catch {
      // ignore malformed chunks
    }
  }
}

function finalizar(pipelineId, status, mensagem) {
  const pipe = ensurePipeline(pipelineId);
  if (!pipe) return;
  pipe.status = status || pipe.status;
  pipe.atualizadoEm = nowIso();
  if (mensagem) {
    pipe.eventos.push({
      tipo: "stream_encerrado",
      mensagem,
      pipeline_id: pipelineId,
      timestamp: nowIso(),
    });
  }
  updateContexto(pipe);
}

function timeline(pipelineId, limit = 300) {
  const pipe = pipelines.get(String(pipelineId || "").trim());
  if (!pipe) return null;
  const lim = Math.max(1, Math.min(Number(limit) || 300, MAX_EVENTS_PER_PIPELINE));
  return {
    pipelineId: pipe.pipelineId,
    ideia: pipe.ideia,
    status: pipe.status,
    progresso: pipe.progresso,
    fase: pipe.fase,
    criadoEm: pipe.criadoEm,
    atualizadoEm: pipe.atualizadoEm,
    agentes: Object.values(pipe.agentes),
    contexto: pipe.contexto,
    eventos: pipe.eventos.slice(-lim),
    aprendizados: pipe.aprendizados,
    artefatos: pipe.artefatos,
  };
}

function recentes(limit = 10) {
  const lim = Math.max(1, Math.min(Number(limit) || 10, 50));
  return Array.from(pipelines.values())
    .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime())
    .slice(0, lim)
    .map((p) => ({
      pipelineId: p.pipelineId,
      ideia: p.ideia,
      status: p.status,
      progresso: p.progresso,
      atualizadoEm: p.atualizadoEm,
      fase: p.fase,
    }));
}

module.exports = {
  ensurePipeline,
  ingestChunk,
  finalizar,
  timeline,
  recentes,
};
