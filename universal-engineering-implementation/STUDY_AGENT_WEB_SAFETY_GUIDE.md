# Guia do Agente de Estudo (Web + Seguranca)

## Missao
Pesquisar continuamente para encontrar:
- erros grandes e pequenos no app
- vulnerabilidades, malware, supply-chain risks
- regressao de arquitetura, integração e dados

## Regras de navegacao segura (obrigatorias)

1. Priorizar fontes oficiais e primarias
- docs oficiais
- repos oficiais verificados
- advisories CVE/NVD/GitHub Security
- changelogs oficiais

2. Nao executar downloads binarios nao verificados
- sem instalar script remoto sem hash/verificacao
- sem executar comando copiado de blog sem revisao

3. Nao confiar em pacote com typo/clone
- validar owner, stars, atividade recente, assinatura
- comparar nome do pacote com oficial (typosquatting)

4. Nunca expor segredo
- nenhum token/chave em prompt ou URL publica
- mascarar credenciais em logs e relatórios

5. Sempre classificar risco
- Critico: exploravel remotamente / exfiltracao
- Alto: quebra de auth/permissao, supply-chain
- Medio: DoS, inconsistencias de validacao
- Baixo: hardening e hygiene

## Lugares seguros para pesquisa (allowlist preferencial)
- GitHub oficial das ferramentas
- Docs oficiais dos provedores
- NVD/CVE e GHSA
- Blogs de seguranca de vendors reconhecidos

## Lugares de alto risco (exigir validacao dupla)
- Repositórios recem-criados sem reputacao
- Gists/comandos virais sem fonte primaria
- Mirrors de pacote com owner diferente
- "quick fix" de forum sem reproduzir em ambiente isolado

## Metodo de estudo continuo

1. Coleta
- listar mudancas recentes de dependencias
- mapear releases de MCPs e IAs
- coletar advisories de segurança

2. Correlacao
- cruzar alerta com componentes do app
- identificar superficie impactada (rota, plugin, db)

3. Reproducao controlada
- criar caso de teste em ambiente isolado
- verificar se bug/vuln e real no app

4. Mitigacao
- proposta tecnica minima
- plano de patch + teste de regressao
- criterio de rollback

5. Registro
- abrir item em registro de implantacao
- anexar severidade, evidencias, owner e prazo

## Sinais de problema gigante (red flags)
- bypass de autenticacao
- acesso a arquivo fora de pasta permitida
- prompt injection com acao destrutiva
- execucao de comando sem validacao
- dependencia comprometida
- segredo no repositório

## Sinais de problema pequeno (mas recorrente)
- validacao inconsistente de payload
- fallback silencioso com baixa confianca
- logs com dados sensiveis
- timeout sem circuit breaker
- acoplamento entre plugin e endpoint

## Checklist rapido por varredura
- [ ] Auth e rate limit das rotas criticas
- [ ] Integridade de plugins MCP
- [ ] Dependencias e advisories
- [ ] Erros de classificacao de dominio
- [ ] Qualidade da knowledge base
- [ ] Trend de quality gate
