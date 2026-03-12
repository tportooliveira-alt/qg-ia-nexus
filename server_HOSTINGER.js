const express = require(\"express\");
const cors = require(\"cors\");
const { createClient } = require(\"@supabase/supabase-js\");
const dotenv = require(\"dotenv\");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CONFIGURAÇÃO CORS PARA HOSTINGER
app.use(cors({
  origin: [\"https://ideiatoapp.me\", \"https://www.ideiatoapp.me\", \"http://localhost:3000\", \"http://127.0.0.1:3000\"],
  credentials: true
}));

app.use(express.json({ limit: \"50mb\" }));

// Supabase - ADICIONE SUAS CHAVES NO ARQUIVO .ENV
const supabase = createClient(
  process.env.SUPABASE_URL || \"https://slqajataiuhvlkgoujml.supabase.co\",
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || \"SUA_CHAVE_AQUI\"
);

console.log(\"?? Servidor QG IA pronto para o Hostinger!\");

// ROTA DE STATUS
app.get(\"/api/status\", (req, res) => {
  res.json({ status: \"Online\", server: \"Hostinger\", db: \"Supabase Connected\" });
});

// MEMÓRIAS COM FILTRO (A BASE DA INTELIGÊNCIA)
app.get(\"/api/memorias\", async (req, res) => {
  const { agente, projeto_rel, categoria, limit = 20 } = req.query;
  let query = supabase.from(\"memorias\").select(\"*\").order(\"criado\", { ascending: false });
  
  if (agente) query = query.eq(\"agente\", agente);
  if (projeto_rel) query = query.eq(\"projeto_rel\", projeto_rel);
  if (categoria) query = query.eq(\"categoria\", categoria);
  
  const { data, error } = await query.limit(parseInt(limit));
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post(\"/api/memorias\", async (req, res) => {
  const { error } = await supabase.from(\"memorias\").insert(req.body);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// RESTANTE DAS ROTAS (PROJETOS E IDEIAS)
app.get(\"/api/projetos\", async (req, res) => {
  const { data, error } = await supabase.from(\"projetos\").select(\"*\");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(port, () => console.log(\"Servidor rodando na porta \" + port));
