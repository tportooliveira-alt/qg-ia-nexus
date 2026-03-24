const fs = require("node:fs");
const path = require("node:path");

const templates = {
  software: [
    "Desenvolver API REST para {target} com autenticacao e logs",
    "Criar backend escalavel para {target} com banco relacional",
    "Implementar frontend web de {target} com dashboard interativo",
    "Refatorar sistema de {target} para microservicos",
    "Construir app mobile para {target} com notificacoes em tempo real"
  ],
  mechanical: [
    "Projetar conjunto mecanico de {target} com analise de torque",
    "Selecionar material e usinagem para componente de {target}",
    "Criar modelo CAD de {target} para fabricacao",
    "Avaliar vibracao e fadiga em estrutura mecanica de {target}",
    "Otimizar transmissao e engrenagens para {target}"
  ],
  civil: [
    "Dimensionar fundacao e estrutura de concreto para {target}",
    "Planejar obra civil de {target} com cronograma executivo",
    "Calcular carga e estabilidade estrutural de {target}",
    "Definir infraestrutura urbana para {target}",
    "Projetar ponte e acessos de {target} com normas tecnicas"
  ],
  electrical: [
    "Projetar circuito eletrico de potencia para {target}",
    "Desenvolver firmware embarcado para controle de {target}",
    "Definir automacao com sensores e atuadores em {target}",
    "Analisar protecao, corrente e tensao no sistema de {target}",
    "Criar arquitetura eletrica e IoT para {target}"
  ],
  chemical: [
    "Otimizar reacao quimica e rendimento de {target}",
    "Projetar processo industrial de separacao para {target}",
    "Definir seguranca quimica e controle de efluentes em {target}",
    "Selecionar catalisador e parametros de reator para {target}",
    "Balancear massa e energia do processo de {target}"
  ],
  product: [
    "Melhorar UX e usabilidade de {target} para usuarios iniciantes",
    "Desenhar interface UI de {target} com foco em acessibilidade",
    "Criar prototipo navegavel de {target} para testes com usuarios",
    "Definir jornada do usuario e ergonomia de {target}",
    "Planejar estrategia de produto para {target} com metricas"
  ],
  integration: [
    "Orquestrar integracao multidominio de {target} entre software, eletrica e mecanica",
    "Coordenar projeto interdisciplinar de {target} com interfaces entre dominios",
    "Definir arquitetura de integracao para {target} com varios times",
    "Planejar sincronizacao de sistemas complexos de {target} com governanca tecnica",
    "Executar orquestracao completa de {target} envolvendo civil, automacao e software"
  ]
};

const targets = [
  "linha de producao",
  "fabrica inteligente",
  "plataforma industrial",
  "sistema de transporte",
  "edificio comercial",
  "equipamento hospitalar"
];

function generate() {
  const rows = [];
  let idx = 1;
  for (const [domain, domainTemplates] of Object.entries(templates)) {
    for (let n = 0; n < 30; n++) {
      const t = domainTemplates[n % domainTemplates.length];
      const target = targets[n % targets.length];
      rows.push({
        id: `${domain.slice(0, 2)}-${String(idx).padStart(4, "0")}`,
        taskDescription: t.replace("{target}", target),
        expectedDomain: domain
      });
      idx += 1;
    }
  }

  const outPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "domain-detection",
    "benchmark-dataset.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
  console.log(`Generated ${rows.length} rows at ${outPath}`);
}

generate();
