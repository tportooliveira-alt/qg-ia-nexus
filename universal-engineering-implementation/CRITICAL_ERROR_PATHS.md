# Relatorio Critico de Caminhos de Erro

Gerado em: 2026-03-22

## Evidencias executadas
- `npm test` em loop: 30/30 OK
- `benchmark:domain` em loop: 20/20 OK
- `war-room` em loop: 10/10 OK
- `scan:errors` em loop: 10/10 OK
- `fuzz:domain`: 1050 casos mutados analisados

## Caminhos de erro identificados

### 1) Entrada sem sinal semantico (Severidade: Alta)
- Sintoma: fallback para `software` com confianca 0.
- Evidencia: `ERROR_PATH_SCAN_REPORT.json` (`short-empty`, `generic-low-signal`).
- Risco: roteamento enganoso em tarefa vaga.
- Mitigacao: exigir pergunta de clarificacao quando confianca < 0.25.

### 2) Ambiguidade multidominio sem palavra de integracao (Severidade: Alta)
- Sintoma: pode acertar dominio com confianca baixa (0.25).
- Evidencia: `ambiguous-no-integration-keyword`.
- Risco: cadeia de agentes incompleta para projeto complexo.
- Mitigacao: quando 3+ dominios aparecem, subir para fluxo de validacao cruzada.

### 3) Texto com vogais removidas (Severidade: Alta)
- Sintoma: 85.7% de mismatch em mutacao `remove-vowels`.
- Evidencia: `FUZZ_PATH_REPORT.json`.
- Risco: entradas com OCR ruim/abreviacao agressiva quebram detector.
- Mitigacao: normalizador fonetico ou etapa de restauracao lexical antes da classificacao.

### 4) Typos pesados em termos eletricos (Severidade: Media)
- Sintoma: erros aparecem quando varios termos estao corrompidos ao mesmo tempo.
- Evidencia: casos adversariais e fuzz.
- Risco: dominio eletrico cair em software.
- Mitigacao: dicionario de typo por dominio + distancia de edicao limitada para palavras-chave criticas.

### 5) Truncamento de mensagem (Severidade: Media)
- Sintoma: `trim-half` gera erro em 5.7% dos casos.
- Evidencia: `FUZZ_PATH_REPORT.json`.
- Risco: mensagens cortadas por UI/API perdem contexto de dominio.
- Mitigacao: validar tamanho minimo semantico e pedir complemento.

### 6) Ruido de prefixo/sufixo (Severidade: Media)
- Sintoma: `noise` gera erro em 6.2%.
- Evidencia: fuzz.
- Risco: colagem de logs/metadados contamina classificacao.
- Mitigacao: pre-processador para remover blocos nao semanticos.

### 7) Case alternado extremo (Severidade: Baixa-Media)
- Sintoma: `mixed-case` gera erro em 6.2%.
- Evidencia: fuzz.
- Risco: entradas com capitalizacao anomala degradam recall.
- Mitigacao: ja normaliza lowercase, mas ha efeito indireto por tokenizacao incompleta.

### 8) Dependencia de vocabulos explicitos (Severidade: Media)
- Sintoma: frases genericas de engenharia sem termos de dicionario caem em software.
- Evidencia: low confidence + software fallback.
- Risco: falso positivo sistematico para software.
- Mitigacao: classificador secundario por embedding/LLM quando score total baixo.

### 9) Sensibilidade a plural/sinonimo (Severidade: Media)
- Sintoma: termos fora do dicionario (sinonimos) podem reduzir confianca.
- Evidencia: necessidade de expansao manual de keywords.
- Risco: manutencao manual constante e regressao por idioma/vertical.
- Mitigacao: pipeline de enriquecimento automatico de sinonimos por dominio.

### 10) Dominio correto com confianca muito baixa (Severidade: Media)
- Sintoma: acerto sem robustez (ex.: integration 0.25).
- Evidencia: `lowConfidenceSamples`.
- Risco: decisao automatica fraca sendo tratada como definitiva.
- Mitigacao: gating por confianca (roteamento provisório + validacao).

### 11) Overfitting de heuristica (Severidade: Media)
- Sintoma: pequenas mudancas no detector derrubaram benchmark de 93.8% para 82.4%.
- Evidencia: rodada intermediaria de ajustes.
- Risco: regressao silenciosa em hotfix sem guardrail.
- Mitigacao: bloquear merge se benchmark < 90%.

### 12) Falha de interoperabilidade por payload extremo (Severidade: Baixa)
- Sintoma: payload muito longo precisa ser rejeitado consistentemente.
- Evidencia: validacao atualmente cobre limite, sem falha detectada.
- Risco: DoS logico e uso indevido de recursos.
- Mitigacao: manter limite e adicionar rate-limit por tamanho agregado.

## Prioridades objetivas
1. Implementar fluxo `confidence < 0.25 => pedir clarificacao`.
2. Adicionar classificador de segunda opiniao (LLM/embedding) para baixo sinal.
3. Criar etapa de limpeza robusta (OCR/noise/truncamento).
4. Instituir gate CI: `benchmark >= 0.90` e `fuzz mismatch < 10%` (exceto remove-vowels).

## Estado atual
- Benchmark principal: **93.8%** (197/210)
- Estabilidade de execucao: OK em loops repetidos
- Risco residual principal: robustez sob texto degradado e entradas vagas
