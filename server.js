require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const ROOT = __dirname;
const CONFIG = path.join(ROOT, 'config', 'assistant.json');
const PRIVATE_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(ROOT, '..', 'proarqui-private-uploads'));
const MAX_MB = Math.max(1, Math.min(Number(process.env.MAX_FILE_MB || 10), 20));
fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
fs.mkdirSync(PRIVATE_DIR, { recursive: true });
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

function adminOnly(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || !supplied || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Acesso administrativo não autorizado.' });
  }
  next();
}
function readConfig() { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); }
function validConfig(c) {
  return c && typeof c === 'object' && Array.isArray(c.services) &&
    Array.isArray(c.pricingRules) && Array.isArray(c.deadlines) &&
    typeof c.whatsappNumber === 'string';
}
const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRIVATE_DIR),
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage, limits: { fileSize: MAX_MB * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => cb(allowed.has(file.mimetype) ? null : new Error('Tipo de arquivo não permitido.'), allowed.has(file.mimetype))
});

function estimateFor(service, area, rules) {
  const matches = rules.filter(rule => rule.service === service);
  if (matches.length !== 1) return null;
  const rule = matches[0];
  if (rule.type === 'fixed' && Number.isFinite(rule.amount) && rule.amount >= 0) {
    return { amount: rule.amount, currency: rule.currency || 'BRL', basis: 'valor fixo cadastrado' };
  }
  if (rule.type === 'per_m2' && Number.isFinite(rule.rate) && rule.rate >= 0 && Number.isFinite(area) && area > 0) {
    const amount = rule.rate * area;
    if (Number.isFinite(rule.minTotal) && amount < rule.minTotal) return { amount: rule.minTotal, currency: rule.currency || 'BRL', basis: 'valor mínimo cadastrado' };
    if (Number.isFinite(rule.maxTotal) && amount > rule.maxTotal) return null;
    return { amount, currency: rule.currency || 'BRL', basis: 'área informada × valor por m² cadastrado' };
  }
  return null;
}
function deadlineFor(service, rules) {
  const matches = rules.filter(rule => rule.service === service && Number.isInteger(rule.days) && rule.days > 0);
  return matches.length === 1 ? { days: matches[0].days, basis: 'prazo cadastrado pela empresa' } : null;
}
app.post('/api/estimate', (req, res) => {
  const c = readConfig();
  const service = String(req.body.service || '');
  const area = Number(req.body.area);
  const estimate = estimateFor(service, area, c.pricingRules || []);
  const deadline = deadlineFor(service, c.deadlines || []);
  res.json({ estimate, deadline, preliminary: true, message: estimate || deadline ? 'Estimativa baseada somente nas regras cadastradas; depende de validação da equipe.' : 'Não há regra comercial suficiente para calcular preço ou prazo. Encaminhe para análise humana.' });
});
app.post('/api/assistant/chat', async (req, res) => {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) return res.status(503).json({ error: 'Integração de IA ainda não configurada no servidor.' });
  const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-8) : [];
  if (!messages.length || messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 2000)) {
    return res.status(400).json({ error: 'Histórico de conversa inválido.' });
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        messages: [
          { role: 'developer', content: 'Você é Karen, assistente virtual da ProArqui 3D. Responda em português brasileiro, com cordialidade e concisão. Ajude apenas a organizar a solicitação de proposta. Não invente preços, prazos, descontos, garantias, disponibilidade ou condições. Não aprove contratação. Não dê parecer definitivo sobre estrutura, segurança, normas, licenças ou viabilidade; encaminhe dúvidas técnicas incertas para profissional responsável. Não solicite dados pessoais além do necessário. Não peça novamente informações já dadas. Não substitua a pergunta estruturada seguinte; apenas reconheça brevemente a resposta e, se apropriado, peça um esclarecimento indispensável.' },
          ...messages
        ]
      })
    });
    const payload = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'O serviço de IA não respondeu. Continue pelo roteiro guiado.' });
    res.json({ reply: payload.choices && payload.choices[0] && payload.choices[0].message ? payload.choices[0].message.content : '' });
  } catch (error) {
    res.status(502).json({ error: 'Falha ao consultar o serviço de IA.' });
  }
});
app.get('/api/assistant/config', (req, res) => {
  const c = readConfig();
  res.json({ companyName: c.companyName, services: c.services, whatsappNumber: c.whatsappNumber,
    conditions: c.conditions, scopeExclusions: c.scopeExclusions, pricingRules: c.pricingRules, deadlines: c.deadlines, aiEnabled: !!c.aiEnabled });
});
app.post('/api/intake/files', upload.array('files', 8), (req, res) => {
  if (req.body.consent !== 'true') {
    (req.files || []).forEach(f => fs.unlinkSync(f.path));
    return res.status(400).json({ error: 'Consentimento obrigatório.' });
  }
  res.status(201).json({ received: (req.files || []).map(f => ({ id: path.basename(f.filename, path.extname(f.filename)), name: f.originalname, size: f.size })),
    message: 'Arquivos armazenados em diretório privado, fora da pasta pública.' });
});
app.get('/api/admin/config', adminOnly, (req, res) => res.json(readConfig()));
app.put('/api/admin/config', adminOnly, (req, res) => {
  if (!validConfig(req.body)) return res.status(400).json({ error: 'Configuração inválida. Verifique os campos obrigatórios.' });
  fs.writeFileSync(CONFIG, JSON.stringify(req.body, null, 2) + '\n', { mode: 0o600 });
  res.json({ saved: true });
});
app.delete('/api/admin/files/:id', adminOnly, (req, res) => {
  const id = String(req.params.id).replace(/[^a-zA-Z0-9-]/g, '');
  const found = fs.readdirSync(PRIVATE_DIR).find(name => path.basename(name, path.extname(name)) === id);
  if (!found) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  fs.unlinkSync(path.join(PRIVATE_DIR, found));
  res.json({ deleted: true });
});
app.use(express.static(ROOT, { dotfiles: 'ignore', index: 'index.html' }));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Arquivo excede o limite ou quantidade permitida.' });
  if (err) return res.status(400).json({ error: err.message || 'Falha ao processar solicitação.' });
  next();
});
const port = Number(process.env.PORT || 3000);
if (require.main === module) app.listen(port, () => console.log('ProArqui Karen disponível na porta ' + port));
module.exports = { app, validConfig, estimateFor, deadlineFor };