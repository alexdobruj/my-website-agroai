const express = require('express');
const path = require('path');
const crypto = require('crypto');
const store = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const INVITE_CODES = (process.env.BUYER_INVITE_CODES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// ---------- helpers ----------

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function str(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function oneOf(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(res, message) {
  return res.status(400).json({ error: message });
}

// Примитивный rate-limit на POST-запросы: 20 запросов в 10 минут с одного IP.
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
  if (list.length >= 20) return res.status(429).json({ error: 'Слишком много запросов, попробуйте позже' });
  list.push(now);
  hits.set(req.ip, list);
  next();
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN || !safeEqual(req.get('x-admin-token') || '', ADMIN_TOKEN)) {
    return res.status(401).json({ error: 'Нет доступа' });
  }
  next();
}

function requireBuyer(req, res, next) {
  const code = req.get('x-invite-code') || '';
  if (!INVITE_CODES.some((c) => safeEqual(code, c))) {
    return res.status(401).json({ error: 'Неверный инвайт-код' });
  }
  req.inviteCode = code;
  next();
}

// Публичный код поставщика вместо названия: покупатель не видит контакты,
// сделка идёт через холдинг (это и есть наша комиссия / ценность).
function supplierCode(farmer) {
  return 'AG-' + farmer.id.replace(/-/g, '').slice(0, 6).toUpperCase();
}

// ---------- public: заявки на консультацию ----------

app.post('/api/leads', rateLimit, (req, res) => {
  const b = req.body || {};
  const lead = {
    name: str(b.name, 100),
    email: str(b.email, 150),
    phone: str(b.phone, 40),
    company: str(b.company, 150),
    direction: oneOf(b.direction, ['erp', 'agro', 'market', 'other'], 'other'),
    message: str(b.message, 2000),
    status: 'new',
  };
  if (!lead.name) return bad(res, 'Укажите имя');
  if (!EMAIL_RE.test(lead.email) && !lead.phone) return bad(res, 'Укажите email или телефон');
  store.insert('leads', lead);
  res.status(201).json({ ok: true });
});

// ---------- public: регистрация аграрного производителя ----------

const CATEGORIES = ['grain', 'oilseeds', 'fruits', 'vegetables', 'nuts', 'dried', 'honey', 'oil', 'wine', 'processed', 'other'];
const CERTS = ['globalgap', 'organic', 'haccp', 'iso22000', 'brc', 'ifs', 'halal', 'kosher', 'fda'];

app.post('/api/farmers', rateLimit, (req, res) => {
  const b = req.body || {};
  const farmer = {
    company: str(b.company, 150),
    contactName: str(b.contactName, 100),
    email: str(b.email, 150),
    phone: str(b.phone, 40),
    country: str(b.country, 60),
    region: str(b.region, 100),
    hectares: Number(b.hectares) > 0 ? Math.round(Number(b.hectares)) : null,
    certifications: Array.isArray(b.certifications) ? b.certifications.filter((c) => CERTS.includes(c)) : [],
    exportExperience: oneOf(b.exportExperience, ['none', 'some', 'regular'], 'none'),
    hasErp: oneOf(b.hasErp, ['none', 'excel', 'erp'], 'none'),
    goals: Array.isArray(b.goals)
      ? b.goals.filter((g) => ['export', 'marketplaces', 'b2b', 'erp', 'certification', 'financing'].includes(g))
      : [],
    comment: str(b.comment, 2000),
    consent: b.consent === true,
    status: 'pending',
  };
  if (!farmer.company || !farmer.contactName) return bad(res, 'Укажите хозяйство и контактное лицо');
  if (!EMAIL_RE.test(farmer.email)) return bad(res, 'Укажите корректный email');
  if (!farmer.country) return bad(res, 'Укажите страну');
  if (!farmer.consent) return bad(res, 'Нужно согласие на обработку данных');

  const products = (Array.isArray(b.products) ? b.products : []).slice(0, 10).map((p) => ({
    product: str(p && p.product, 100),
    category: oneOf(p && p.category, CATEGORIES, 'other'),
    volume: Number(p && p.volume) > 0 ? Number(p.volume) : null,
    unit: oneOf(p && p.unit, ['t', 'kg', 'l', 'pcs'], 't'),
    season: str(p && p.season, 60),
    packaged: Boolean(p && p.packaged),
  })).filter((p) => p.product);
  if (!products.length) return bad(res, 'Добавьте хотя бы один продукт');

  const saved = store.insert('farmers', farmer);
  products.forEach((p) => store.insert('offers', { farmerId: saved.id, ...p }));
  res.status(201).json({ ok: true });
});

// ---------- closed marketplace (по инвайт-коду) ----------

app.get('/api/market/offers', requireBuyer, (req, res) => {
  const verified = new Map(
    store.all('farmers').filter((f) => f.status === 'verified').map((f) => [f.id, f]),
  );
  const offers = store.all('offers')
    .filter((o) => verified.has(o.farmerId))
    .map((o) => {
      const f = verified.get(o.farmerId);
      return {
        id: o.id,
        product: o.product,
        category: o.category,
        volume: o.volume,
        unit: o.unit,
        season: o.season,
        packaged: o.packaged,
        supplier: supplierCode(f),
        country: f.country,
        region: f.region,
        certifications: f.certifications,
        exportExperience: f.exportExperience,
      };
    });
  res.json({ offers });
});

app.post('/api/market/requests', rateLimit, requireBuyer, (req, res) => {
  const b = req.body || {};
  const offer = store.find('offers', str(b.offerId, 60));
  if (!offer) return bad(res, 'Предложение не найдено');
  const request = {
    offerId: offer.id,
    farmerId: offer.farmerId,
    buyerName: str(b.buyerName, 100),
    buyerCompany: str(b.buyerCompany, 150),
    buyerEmail: str(b.buyerEmail, 150),
    quantity: str(b.quantity, 60),
    destination: str(b.destination, 100),
    message: str(b.message, 2000),
    inviteCode: req.inviteCode,
    status: 'new',
  };
  if (!request.buyerName || !request.buyerCompany) return bad(res, 'Укажите имя и компанию');
  if (!EMAIL_RE.test(request.buyerEmail)) return bad(res, 'Укажите корректный email');
  store.insert('requests', request);
  res.status(201).json({ ok: true });
});

// ---------- admin ----------

app.get('/api/admin/overview', requireAdmin, (req, res) => {
  res.json({
    leads: store.all('leads'),
    farmers: store.all('farmers').map((f) => ({ ...f, supplierCode: supplierCode(f) })),
    offers: store.all('offers'),
    requests: store.all('requests'),
  });
});

app.patch('/api/admin/:collection/:id', requireAdmin, (req, res) => {
  const statuses = {
    farmers: ['pending', 'verified', 'rejected'],
    leads: ['new', 'in_progress', 'won', 'lost'],
    requests: ['new', 'in_progress', 'deal', 'lost'],
  };
  const allowed = statuses[req.params.collection];
  if (!allowed) return res.status(404).json({ error: 'Not found' });
  const status = (req.body || {}).status;
  if (!allowed.includes(status)) return bad(res, 'Недопустимый статус');
  const row = store.update(req.params.collection, req.params.id, { status });
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!ADMIN_TOKEN) console.warn('ADMIN_TOKEN не задан — админка отключена');
  if (!INVITE_CODES.length) console.warn('BUYER_INVITE_CODES не заданы — закрытый маркетплейс недоступен');
});
