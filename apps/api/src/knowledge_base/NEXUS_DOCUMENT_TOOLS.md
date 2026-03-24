# 📄 NEXUS DOCUMENT TOOLS — Ferramentas de Documentos e Mídia

> O Nexus Claw e todos os agentes do QG IA têm acesso a ferramentas para ler e gerar documentos, planilhas e vídeos curtos.

---

## ROTAS DISPONÍVEIS (todas exigem X-QG-Token)

### 📕 PDF — Leitura
```
POST /api/docs/ler-pdf
Body: multipart (campo "arquivo") OU { "base64": "<conteudo_base64>" }
Retorno: { texto, paginas, info, tamanho }
```
**Uso:** Extraia texto de PDFs enviados pelo usuário. Analise contratos, relatórios, documentos de fazenda, laudos veterinários, etc.

---

### 📊 Excel — Leitura e Criação
```
POST /api/docs/ler-excel
Body: multipart (campo "arquivo")
Retorno: { abas: ["Aba1",...], dados: { "Aba1": [...linhas JSON] } }

POST /api/docs/criar-excel
Body: { dados: { "Nome da Aba": [{ col1: val, col2: val },..] }, nome_arquivo: "relatorio" }
Retorno: arquivo .xlsx para download
```
**Uso:** Leia planilhas de controle de rebanho, gere relatórios financeiros, crie planilhas de estoque de vacinas.

---

### 📝 Word — Leitura e Criação
```
POST /api/docs/ler-word
Body: multipart (campo "arquivo")
Retorno: { texto, html }

POST /api/docs/criar-word
Body: {
  conteudo: "Texto simples com # Título e ## Subtítulo"
         OU [{ tipo: "titulo", texto: "..." }, { tipo: "paragrafo", texto: "..." }],
  nome_arquivo: "proposta_gestcort"
}
Retorno: arquivo .docx para download
```
**Uso:** Gere contratos, relatórios de visita, propostas comerciais, planos de manejo do rebanho.

---

### 🟢 Google Sheets — Leitura e Escrita
```
GET  /api/docs/sheets/ler?id=<spreadsheetId>&intervalo=Sheet1!A1:Z100
Retorno: { cabecalho, dados, total }

POST /api/docs/sheets/escrever
Body: { id: "<spreadsheetId>", intervalo: "Sheet1!A1", linhas: [["Col1","Col2"],[val1,val2]] }

POST /api/docs/sheets/acrescentar
Body: { id: "<spreadsheetId>", intervalo: "Sheet1!A1", linhas: [[val1, val2]] }

POST /api/docs/sheets/criar
Body: { titulo: "Controle de Rebanho 2026", dados: [["Lote","Qtd","Peso"],[1,100,480]] }
Retorno: { spreadsheetId, url }
```
**Uso:** Sincronize dados do GestCort com Google Sheets, exporte relatórios financeiros, compartilhe planilhas com funcionários.

**ATENÇÃO:** Requer GOOGLE_SERVICE_ACCOUNT_JSON no .env (ver setup abaixo).

---

### 🎬 Vídeo — Criação de Slides
```
POST /api/docs/video/criar
Body: {
  slides: [
    { titulo: "QG IA Nexus", texto: "Sistema de IA para fazendas", cor: "#0a0c0f", corTexto: "#1EE0E0" },
    { titulo: "GestCort", texto: "Gestão completa de gado de corte", cor: "#1a1a2e" }
  ],
  opcoes: { duracao: 4, fps: 30, resolucao: "hd" }
}
Retorno: arquivo .mp4 (FFmpeg local) OU { id, status } (Shotstack cloud)

GET /api/docs/video/status/:id   — Status do render Shotstack
```
**Uso:** Gere vídeos de apresentação para clientes, resumos visuais de projetos, pitch decks animados.

---

## SETUP GOOGLE SHEETS

1. Acesse: https://console.cloud.google.com
2. Crie um projeto → Ative "Google Sheets API" e "Google Drive API"
3. Crie uma Conta de Serviço (Service Account) → Gere chave JSON
4. Adicione o email da conta de serviço como Editor na planilha desejada
5. Cole o conteúdo do JSON (minificado numa linha) no .env:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

## SETUP VÍDEO (Shotstack)

1. Cadastre em: https://shotstack.io
2. Copie sua API Key do dashboard
3. Adicione no .env:
```
SHOTSTACK_API_KEY=sua_chave_aqui
```
Sem a chave, o sistema usa FFmpeg local (requer `apt install ffmpeg` no servidor).

---

## EXEMPLOS DE USO PELOS AGENTES

**Gerar relatório Excel do rebanho:**
> "Nexus, gere uma planilha Excel com os dados do Lote 1: 100 cabeças, peso médio 480kg, pasto Norte"
→ Chama POST /api/docs/criar-excel com os dados estruturados

**Analisar PDF de contrato:**
> "Nexus, analise este contrato de compra de gado"
→ Recebe o PDF → POST /api/docs/ler-pdf → AI analisa o texto extraído

**Salvar no Google Sheets:**
> "Nexus, salve o resumo financeiro do mês na planilha de controle"
→ POST /api/docs/sheets/acrescentar com os dados do mês

**Criar vídeo de apresentação:**
> "Nexus, crie um vídeo rápido apresentando o GestCort para investidores"
→ POST /api/docs/video/criar com slides estruturados
