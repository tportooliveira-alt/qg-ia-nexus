const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const NexusService = require("./nexusService");
const ApprovalService = require("./approvalService");
const AuditService = require("./auditService");

/**
 * 📱 MÓDULO WHATSAPP (CALIBRADO)
 */
const WhatsAppService = {
  _sock: null, // socket exposto para outros serviços enviarem mensagens

  async conectar() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Busca a versão mais recente do WhatsApp para evitar erro 405
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 Usando versão do WhatsApp: ${version.join('.')} (Mais recente: ${isLatest})`);

    const sock = makeWASocket({
      version,
      auth: state,
      browser: ['Mac OS', 'Chrome', '121.0.6167.184'],
      printQRInTerminal: false // Desativado para usar o nosso log customizado
    });

    this._sock = sock; // expõe o socket para outros serviços

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      // EXIBE O QR CODE NO TERMINAL
      if (qr) {
        console.log('\n📸 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:');
        qrcode.generate(qr, { small: true });
        console.log('Aguardando escaneamento...\n');
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔌 Conexão encerrada. Motivo:', lastDisconnect?.error || 'Desconhecido');
        if (shouldReconnect) {
          console.log('🔄 Tentando reconectar em 5 segundos...');
          setTimeout(() => this.conectar(), 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ NEXUS CLAW: Ponte de WhatsApp ATIVA e ONLINE!');
      }
    });

    // Número mestre autorizado (do .env, sem caracteres especiais)
    const NUMERO_MESTRE = (process.env.WHATSAPP_NUMERO_MESTRE || "").replace(/\D/g, "");

    sock.ev.on('messages.upsert', async ({ messages }) => {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return;

      const texto = m.message.conversation || m.message.extendedTextMessage?.text;
      const remetente = m.key.remoteJid;

      if (!texto) return;
      const lower = texto.toLowerCase().trim();

      // Verifica se o remetente é o número mestre autorizado
      const remetenteNumero = remetente.replace(/\D/g, "").replace(/:\d+$/, "");
      if (NUMERO_MESTRE && !remetenteNumero.includes(NUMERO_MESTRE.replace(/\D/g, ""))) {
        return; // Ignora mensagens de números não autorizados
      }

      if (lower.startsWith("aprovar ")) {
        const id = lower.replace("aprovar ", "").trim();
        try {
          const aprovado = await ApprovalService.decidir({ id, status: "APROVADO", decisor: "Priscila (WhatsApp)" });
          try { await AuditService.registrar({ agente: "Priscila", acao: "approval_decide", status: "APROVADO", detalhe: { id }, origem: "whatsapp" }); } catch {}
          if (aprovado && aprovado.acao === "whatsapp_command") {
            let detalhes = {};
            try { detalhes = JSON.parse(aprovado.detalhes || "{}"); } catch {}
            const comando = detalhes.comando || "";
            if (comando) {
              await sock.sendMessage(remetente, { text: `✅ Aprovado. Executando: "${comando}"` });
              const resposta = await NexusService.processarComando(comando);
              await sock.sendMessage(remetente, { text: resposta });
              return;
            }
          }
          await sock.sendMessage(remetente, { text: `✅ Aprovação registrada: ${id}` });
        } catch (err) {
          await sock.sendMessage(remetente, { text: `❌ Falha ao aprovar: ${err.message}` });
        }
        return;
      }

      if (lower.startsWith("negar ")) {
        const id = lower.replace("negar ", "").trim();
        try {
          await ApprovalService.decidir({ id, status: "NEGADO", decisor: "Priscila (WhatsApp)" });
          try { await AuditService.registrar({ agente: "Priscila", acao: "approval_decide", status: "NEGADO", detalhe: { id }, origem: "whatsapp" }); } catch {}
          await sock.sendMessage(remetente, { text: `🚫 Ação negada: ${id}` });
        } catch (err) {
          await sock.sendMessage(remetente, { text: `❌ Falha ao negar: ${err.message}` });
        }
        return;
      }

      if (lower.startsWith("pendencias")) {
        try {
          const pendentes = await ApprovalService.listarPendentes(10);
          if (!pendentes.length) {
            await sock.sendMessage(remetente, { text: "✅ Nenhuma pendência." });
            return;
          }
          const resumo = pendentes
            .map(p => `• ${p.id} | ${p.acao} | ${p.agente}`)
            .join("\n");
          await sock.sendMessage(remetente, { text: `Pendências:\n${resumo}` });
        } catch (err) {
          await sock.sendMessage(remetente, { text: `❌ Falha ao listar pendências: ${err.message}` });
        }
        return;
      }

      if (lower.startsWith('nexus,')) {
        const comando = texto.replace(/nexus,/i, '').trim();
        try {
          const approval = await ApprovalService.solicitar({
            agente: "OpenClawBR",
            acao: "whatsapp_command",
            detalhes: { comando, remetente },
            origem: "whatsapp"
          });
          try { await AuditService.registrar({ agente: "OpenClawBR", acao: "approval_request", status: "ok", detalhe: { comando }, origem: "whatsapp" }); } catch {}
          await sock.sendMessage(remetente, { text: `⏳ Pedido registrado. Use "aprovar ${approval.id}" ou "negar ${approval.id}".` });
        } catch (err) {
          await sock.sendMessage(remetente, { text: `❌ Falha ao registrar aprovação: ${err.message}` });
        }
      }
    });
  }
};

module.exports = WhatsAppService;
