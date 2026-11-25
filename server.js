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
  if (!expected || !supplied || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
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

app.get('/api/assistant/config', (req, res) => {
  const c = readConfig();
  res.json({ companyName: c.companyName, services: c.services, whatsappNumber: c.whatsappNumber,
    conditions: c.conditions, scopeExclusions: c.scopeExclusions, pricingRules: c.pricingRules, deadlines: c.deadlines });
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
module.exports = { app, validConfig };