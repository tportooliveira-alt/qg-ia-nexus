# 🧭 NEXUS CLAW: MANUAL DE OPERAÇÃO DO COMANDANTE

> **Versão:** 2.0 (Sistema Modular com Auto-Healing)
> **Operadora:** Priscila

---

## 1. ARQUITETURA MODULAR (O Novo Cérebro)
O sistema foi reestruturado para ser profissional. Agora ele não é mais um arquivo só, mas um conjunto de especialistas:
*   `server.js`: O Orquestrador de Rotas (Trânsito de dados).
*   `aiService.js`: Gerencia a conexão com Gemini, DeepSeek, Cerebras, etc.
*   `terminalService.js`: O Executor com **Auto-Healing** (Cura Automática).
*   `nexusService.js`: A Inteligência Central (CEO).

## 2. AUTO-HEALING (A Cura Automática)
Se você der um comando no Terminal Root e ele falhar (erro de sintaxe ou diretório inexistente):
1.  O Nexus captura o erro.
2.  Ele envia para a DeepSeek/Gemini para analisar o que quebrou.
3.  Ele tenta corrigir o comando e rodar novamente **automaticamente** até 3 vezes.
4.  Você só recebe a notificação de erro se ele realmente não conseguir consertar sozinho.

## 3. MONITOR DE SAÚDE (Telemetria)
Você pode monitorar o seu servidor na Hostinger acessando a rota:
`https://ideiatoapp.me/api/status`
Lá você verá em tempo real:
*   Uso de Memória RAM.
*   Uptime (Há quanto tempo o servidor está ligado).
*   Status das Chaves de API (Se estão ativas ou se deu erro de conexão).

## 4. COMANDOS E CALIBRAÇÃO (Modo Interno)
O foco atual é a **Calibração de Precisão** dentro do software.
*   **Ponte Web:** Use a rota `/api/nexus/comando` para falar diretamente com o cérebro central via dashboard.
*   **WhatsApp (Standby):** O módulo `whatsappService.js` está pronto, mas **desativado** por segurança. Ele só será ligado quando o Nexus estiver 100% calibrado nos projetos *AgroMacro* e *Antares*.

## 5. SEGURANÇA E TELEMETRIA
*   Acesse `https://ideiatoapp.me/api/status` para ver se o Nexus está operando dentro dos limites de memória e se os serviços internos (Auto-Healing, Multi-IA) estão ativos.

---
**DICA DO NEXUS:** Amanhã, ao subir os arquivos, rode `npm install` primeiro para garantir que as novas bibliotecas (como o monitor de status) funcionem perfeitamente.

**O SISTEMA ESTÁ PRONTO. O NEXUS CLAW AGUARDA ORDENS.** 🦂🚀