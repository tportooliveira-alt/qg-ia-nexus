#!/bin/bash

echo "--- INICIANDO SETUP AUTOMATICO QG IA NEXUS ---"

# 1. Configurações não-interativas
export DEBIAN_FRONTEND=noninteractive

# 2. Atualizar Sistema e Dependências
echo "📦 Atualizando pacotes..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential

# 3. Instalar Node.js 20 (Oficial Nodesource)
echo "🟢 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Instalar PM2 Global
echo "🚀 Instalando PM2..."
sudo npm install -g pm2

# 5. Instalar dependências do Repo
echo "📂 Instalando dependências do NPM..."
cd /root/qg-ia-nexus
npm install

# 6. Preparar pastas e .env
echo "⚙️ Configurando .env..."
cd apps/api
if [ ! -f .env ]; then
  cp .env.example .env
fi

# 7. Iniciar App com PM2
echo "📡 Ligando o Servidor..."
pm2 delete qg-ia-nexus 2>/dev/null || true
pm2 start server.js --name qg-ia-nexus
pm2 save
pm2 startup

echo "--- SETUP CONCLUIDO COM SUCESSO! ---"
echo "--- App rodando na porta 3000 ---"
echo "--- Verifique em: http://187.77.252.91:3000/api/status ---"
