function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateDomainDetectPayload(body = {}) {
  const taskDescription = asString(body.taskDescription);
  const taskType = asString(body.taskType);

  const errors = [];
  if (!taskDescription && !taskType) {
    errors.push("taskDescription ou taskType e obrigatorio");
  }
  if (taskDescription.length > 5000) {
    errors.push("taskDescription excede limite de 5000 caracteres");
  }
  if (taskType.length > 120) {
    errors.push("taskType excede limite de 120 caracteres");
  }

  return {
    ok: errors.length === 0,
    errors,
    sanitized: {
      taskDescription,
      taskType
    }
  };
}

function validateKnowledgeQuery(query = {}) {
  const category = asString(query.category);
  const search = asString(query.search);
  const maxResults = Number.parseInt(query.maxResults || "50", 10);
  const clampedMaxResults = Number.isFinite(maxResults) ? Math.min(Math.max(maxResults, 1), 200) : 50;

  const errors = [];
  if (category.length > 200) errors.push("category excede limite de 200 caracteres");
  if (search.length > 500) errors.push("search excede limite de 500 caracteres");

  return {
    ok: errors.length === 0,
    errors,
    sanitized: {
      category,
      search,
      maxResults: clampedMaxResults
    }
  };
}

module.exports = {
  validateDomainDetectPayload,
  validateKnowledgeQuery
};
