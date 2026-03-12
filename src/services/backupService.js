const fs = require("fs").promises;
const path = require("path");

const BackupService = {
  async criarSnapshot(filePath) {
    try {
      const backupDir = path.join(__dirname, "../backups");
      await fs.mkdir(backupDir, { recursive: true });

      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);

      const content = await fs.readFile(filePath, "utf-8");
      await fs.writeFile(backupPath, content, "utf-8");
      
      console.log(`[BACKUP] Snapshot criado para ${fileName}`);
      return backupPath;
    } catch (err) {
      console.error("[BACKUP] Erro ao criar snapshot:", err.message);
      return null;
    }
  }
};

module.exports = BackupService;