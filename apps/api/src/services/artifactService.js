const xlsx = require('xlsx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs').promises;
const path = require('path');

/**
 * ArtifactService — O construtor de objetos físicos (arquivos) do Nexus.
 */
const ArtifactService = {
    /**
     * Gera um arquivo Excel (.xlsx) real a partir de uma especificação JSON
     */
    async gerarExcel(pipelineId, spec) {
        try {
            const wb = xlsx.utils.book_new();
            
            if (spec.abas && spec.abas.length > 0) {
                spec.abas.forEach(aba => {
                    const wsData = [];
                    // Cabeçalhos
                    if (aba.colunas) wsData.push(aba.colunas.map(c => typeof c === 'string' ? c : c.nome));
                    
                    // Dados de exemplo (se houver) ou linhas em branco com fórmulas
                    const rows = aba.dados || [[]];
                    rows.forEach(row => wsData.push(row));
                    
                    const ws = xlsx.utils.aoa_to_sheet(wsData);
                    xlsx.utils.book_append_sheet(wb, ws, aba.nome.slice(0, 31));
                });
            } else {
                // Aba padrão se estiver vazio
                const ws = xlsx.utils.aoa_to_sheet([['Nexus', 'Início'], ['Data', new Date().toLocaleDateString()]]);
                xlsx.utils.book_append_sheet(wb, ws, 'Nexus');
            }

            const dir = path.join(process.cwd(), 'dist', 'artifacts', pipelineId);
            await fs.mkdir(dir, { recursive: true });
            const filePath = path.join(dir, `planilha_${pipelineId}.xlsx`);
            
            xlsx.writeFile(wb, filePath);
            return { success: true, path: filePath, filename: `planilha_${pipelineId}.xlsx` };
        } catch (err) {
            console.error('[ArtifactService] Erro ao gerar Excel:', err.message);
            throw err;
        }
    },

    /**
     * Gera um arquivo Word (.docx) real a partir de uma especificação JSON/Markdown
     */
    async gerarWord(pipelineId, spec) {
        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: spec.titulo || "Relatório Nexus Claw",
                            heading: HeadingLevel.TITLE,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Data de Geração: ${new Date().toLocaleString()}`,
                                    bold: true,
                                }),
                            ],
                        }),
                        new Paragraph({ text: "" }), // Espaçador
                        ...(spec.secoes || []).map(secao => [
                            new Paragraph({
                                text: secao.titulo,
                                heading: HeadingLevel.HEADING_1,
                            }),
                            new Paragraph({
                                text: secao.conteudo,
                            }),
                            new Paragraph({ text: "" }),
                        ]).flat()
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            const dir = path.join(process.cwd(), 'dist', 'artifacts', pipelineId);
            await fs.mkdir(dir, { recursive: true });
            const filePath = path.join(dir, `documento_${pipelineId}.docx`);
            
            await fs.writeFile(filePath, buffer);
            return { success: true, path: filePath, filename: `documento_${pipelineId}.docx` };
        } catch (err) {
            console.error('[ArtifactService] Erro ao gerar Word:', err.message);
            throw err;
        }
    }
};

module.exports = ArtifactService;
