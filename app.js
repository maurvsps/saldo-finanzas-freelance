'use strict';

// ── Configuración ──
// Versión publicada: debe coincidir con version.json y con el ?v= de index.html.
const APP_VERSION = 31;
const KEY = 'saldo-v2';
const OLD_KEY = 'saldo-freelance-v1';
// ID de cliente OAuth (público). Se usa para guardar tus datos en tu Google Drive (carpeta oculta de la app).
const GOOGLE_CLIENT_ID = '1057047663238-a3prjms222f111drrcse66qtrpu400sv.apps.googleusercontent.com';
const DRIVE_FILE = 'saldo-datos.json';
const DRIVE_CONNECTED = 'saldo-drive-connected';
// Inicio de sesión con Google desactivado: los datos se guardan solo en este dispositivo.
const GOOGLE_ENABLED = false;

const CURRENCIES = { PEN: 'S/', USD: '$', EUR: '€', GBP: '£' };
const CURRENCY_NAMES = { PEN: 'Soles (PEN)', USD: 'Dólares (USD)', EUR: 'Euros (EUR)', GBP: 'Libras (GBP)' };
// Monedas en las que te puede pagar un cliente.
const CLIENT_CURRENCIES = ['USD', 'EUR', 'GBP', 'PEN'];
const COLORS = ['#2f7a59', '#7b3fa0', '#2563a8', '#b26a2c', '#3f7f88', '#a8445a'];
const OTHERS = 'Otros trabajos';
// Cada cuánto haces un producto: solo se usa para estimar lo que falta del mes.
// Para estimar: cuántas veces haces un producto por semana o al mes (0 = a pedido).
const EST_PER = { week: 'por semana', month: 'al mes' };
// Frecuencias de la versión anterior convertidas a "N por semana / al mes".
const OLD_FREQ = { daily: [7, 'week'], weekdays: [5, 'week'], weekly: [1, 'week'], monthly: [1, 'month'], ondemand: [0, 'week'] };
function normalizeProduct(p) {
  const out = { active: true, notes: '', ...p };
  if (out.estPer !== 'week' && out.estPer !== 'month') {
    const [n, per] = OLD_FREQ[out.freq] || OLD_FREQ.ondemand;
    out.estCount = n;
    out.estPer = per;
  }
  out.estCount = Math.max(0, Number(out.estCount) || 0);
  delete out.freq;
  return out;
}
const estText = p => (p.estCount > 0 ? `${String(p.estCount).replace('.', ',')} ${p.estCount === 1 ? 'vez' : 'veces'} ${EST_PER[p.estPer]}` : 'A pedido');
const STRATEGIES = {
  monthly: 'Cada mes',
  every2: 'Cada 2 meses',
  every3: 'Cada 3 meses',
  threshold: 'Al juntar',
  end: 'Todo al final',
};
const PLAN_MONTHS = 12;
// Categorías de gastos (puedes añadir las tuyas al anotar un gasto).
// Icono y color de cada categoría; las que creas tú guardan el suyo en data.catStyles.
const CAT_META = {
  Comida: ['utensils', '#b26a2c'], Transporte: ['bus', '#2563a8'], Vivienda: ['home', '#7b3fa0'], Servicios: ['bolt', '#946013'],
  Salud: ['heart', '#a8445a'], Ocio: ['gamepad', '#3f7f88'], Compras: ['bag', '#c2478a'], Trabajo: ['briefcase', '#2f7a59'],
  Impuestos: ['percent', '#646c66'], Otros: ['dots', '#8b928c'],
  Cobro: ['banknote', '#2f7a59'], 'Yape recibido': ['phone', '#7b3fa0'], Regalo: ['gift', '#c2478a'], Reembolso: ['refresh', '#2563a8'], Venta: ['tag', '#b26a2c'],
};
const CAT_ICONS = ['utensils', 'coffee', 'bus', 'car', 'home', 'bolt', 'wifi', 'heart', 'gamepad', 'bag', 'briefcase', 'percent', 'gift', 'book', 'plane', 'tag', 'star', 'user', 'banknote', 'dots'];
const CAT_COLORS = ['#2f7a59', '#2563a8', '#7b3fa0', '#c2478a', '#a8445a', '#b26a2c', '#946013', '#3f7f88', '#646c66', '#1b211e'];
const INCOME_CATEGORIES = ['Cobro', 'Yape recibido', 'Regalo', 'Reembolso', 'Venta', 'Otros'];
const EXPENSE_CATEGORIES = ['Comida', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Ocio', 'Compras', 'Trabajo', 'Impuestos', 'Otros'];

// ── Iconos (SVG, nunca caracteres) ──
const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  upload: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  download: '<path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  receipt: '<path d="M4 2v20l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V2l-3 2-2.5-2-2.5 2-2.5-2L7 4Z"/><path d="M8 9h8M8 13h8"/>',
  chevronUp: '<path d="m18 15-6-6-6 6"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2"/><path d="M6 2v20"/><path d="M19 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  coffee: '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M6 8h11v7a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4Z"/><path d="M17 10h1a3 3 0 0 1 0 6h-1"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><path d="M8 21v-4M16 21v-4"/><path d="M8 14h.01M16 14h.01"/>',
  car: '<path d="M3 13l2-6h14l2 6v4H3Z"/><path d="M7 17v2M17 17v2"/><path d="M7 13h.01M17 13h.01"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>',
  wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><path d="M12 20h.01"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  gamepad: '<path d="M6 12h4M8 10v4"/><path d="M15 13h.01M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="4"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  dots: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5Z"/><path d="M20 17v5H6.5a2.5 2.5 0 0 1 0-5"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.4 1.4 6.4 3.5-3 3-3-.5-1 1 4 2 2 4 1-1-.5-3 3-3 3.5 6.4Z"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z"/><path d="M7 7h.01"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2l-5-4.9 6.9-1Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

// ── Utilidades ──
const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arr = x => (Array.isArray(x) ? x : []);
const roundTo = (n, p) => Math.round((Number(n) || 0) * 10 ** p) / 10 ** p;
const round2 = n => roundTo(n, 2);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const maxStr = (...xs) => xs.filter(Boolean).reduce((a, b) => (a > b ? a : b));
const minStr = (...xs) => xs.filter(Boolean).reduce((a, b) => (a < b ? a : b));

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => new Date(s + 'T12:00:00');
const todayISO = () => iso(new Date());
const thisMonth = () => todayISO().slice(0, 7);
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const monthKey = s => String(s || '').slice(0, 7);
const shiftMonth = (m, n) => iso(new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1, 12)).slice(0, 7);
const lastDay = m => iso(new Date(+m.slice(0, 4), +m.slice(5, 7), 0, 12));
function addMonthsClamped(s, n) {
  const d = parse(s);
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  t.setDate(Math.min(d.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return iso(t);
}
const fmtDate = (s, opts = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('es-PE', opts).format(parse(s)).replace(/\./g, '');
const monthName = m => new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(parse(m + '-01')).toLowerCase();
const monthLabel = m => cap(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(parse(m + '-01')));
const monthShort = m => new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(parse(m + '-01')).replace('.', '');
function relDate(s) {
  const t = todayISO();
  if (s === t) return 'hoy';
  if (s === addDays(t, -1)) return 'ayer';
  return `el ${fmtDate(s)}`;
}

function money(n, cur = 'PEN') {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? '−' : ''}${CURRENCIES[cur] || cur} ${s}`;
}
const moneyShort = (n, cur = 'PEN') => `${CURRENCIES[cur] || cur} ${Math.round(Number(n) || 0).toLocaleString('es-PE')}`;

// ── Datos ──
function blank() {
  return {
    version: 4,
    updatedAt: 0,
    rates: { USD: 3.72, EUR: 4.05, GBP: 4.72 },
    ratesDate: '',
    wallets: [
      { id: 'account', name: 'Cuenta', currency: 'PEN', balance: 0, color: 0, updated: '' },
      { id: 'yape', name: 'Yape', currency: 'PEN', balance: 0, color: 1, updated: '' },
      { id: 'paypal', name: 'PayPal', currency: 'USD', balance: 0, color: 2, updated: '' },
    ],
    clients: [], // { id, name, note, currency, wallet, products: [{ id, name, price, estCount, estPer, notes, active }] }
    entries: [], // trabajos anotados: { id, clientId, productId, name, label, price, qty, date }
    payments: [], // { id, clientId, month, amount, currency, wallet, date, balanceBefore, balanceAfter }
    withdrawals: [], // { id, date, from, to, amount, received, fromBefore, fromAfter, toBefore, toAfter, note }
    plan: { strategy: 'monthly', threshold: 200, rate: 0, fee: 0, from: '', to: '' },
    // Sección Gastos: va aparte del resto (solo soles, su propio saldo de Yape).
    expenses: [], // movimientos: { id, kind: 'in' | 'out' | 'adj', date, amount, currency: 'PEN', category, note }
    customCategories: [], // categorías de gasto creadas por ti
    incomeCategories: [], // categorías de ingreso creadas por ti
    yape: { opening: 0 }, // saldo de Yape antes de los movimientos anotados
    catStyles: {}, // icono y color de las categorías que creas: { nombre: { icon, color } }
    contacts: [], // contactos frecuentes: { id, name, uses, lastKind, lastCategory }
    horizon: '', // fecha de la previsión en Inicio (AAAA-MM-DD); vacía = fin de este mes
  };
}

function copyRates(d, raw) {
  if (raw.rates) for (const c of ['USD', 'EUR', 'GBP']) if (Number(raw.rates[c]) > 0) d.rates[c] = Number(raw.rates[c]);
  if (raw.ratesDate) d.ratesDate = raw.ratesDate;
}
function migrationKit(d) {
  const conv = (n, from, to) => {
    const v = Number(n) || 0;
    if (from === to || !CURRENCIES[from] || !CURRENCIES[to]) return v;
    return (v * (from === 'PEN' ? 1 : d.rates[from])) / (to === 'PEN' ? 1 : d.rates[to]);
  };
  const walletCur = id => (d.wallets.find(w => w.id === id) || d.wallets[0]).currency;
  const walletByCur = cur => (d.wallets.find(w => w.currency === cur) || d.wallets[0]).id;
  return { conv, walletCur, walletByCur };
}

// Las versiones 1 y 2 se pasan primero al formato 3 (clientes con cobros programados) y de ahí al actual.
// Sus ingresos sueltos no se convierten en meses cobrados: los saldos ya los incluyen.
function fromV1(raw) {
  const d = blank();
  copyRates(d, raw);
  if (raw.wallets && !Array.isArray(raw.wallets)) for (const w of d.wallets) w.balance = round2(raw.wallets[w.id]);
  const k = migrationKit(d);
  const service = (p, cur) => {
    const low = Number(p.low ?? 1), high = Number(p.high ?? low), price = Number(p.price) || 0;
    const frequency = ['weekly', 'monthly', 'once'].includes(p.frequency) ? p.frequency : 'monthly';
    const start = /^\d{4}-\d{2}-\d{2}$/.test(p.start || '') ? p.start : todayISO();
    const months = Number(p.months) || 0;
    return {
      id: p.id || uid(), name: String(p.name || 'Trabajo'),
      amount: round2(k.conv(price * (low + high) / 2, p.currency || cur, cur)),
      frequency, start, end: frequency === 'monthly' && months > 0 ? addDays(addMonthsClamped(start, months), -1) : '', active: true,
    };
  };
  const mkClient = (id, name, note, products) => {
    const wid = k.walletByCur(CURRENCIES[products[0]?.currency] ? products[0].currency : 'USD');
    return { id: id || uid(), name, note, wallet: wid, services: products.map(p => service(p, k.walletCur(wid))) };
  };
  d.clients = arr(raw.clients).map(c => mkClient(c.id, String(c.name || 'Cliente'), String(c.description || ''), arr(c.products)));
  if (arr(raw.products).length) d.clients.push(mkClient('', OTHERS, '', raw.products));
  return d;
}
function fromV2(raw) {
  const d = blank();
  copyRates(d, raw);
  if (arr(raw.wallets).length) d.wallets = raw.wallets.map(w => ({ id: w.id, name: w.name, currency: w.currency, balance: round2(w.balance), color: w.color ?? 0, updated: '' }));
  const k = migrationKit(d);
  const recs = arr(raw.recurring);
  const toService = (r, cur) => ({ id: r.id || uid(), name: r.name, amount: round2(k.conv(r.amount, r.currency, cur)), frequency: r.frequency, start: r.start, end: r.end || '', active: r.active !== false });
  const mkClient = (id, name, note, list) => {
    const first = list[0];
    const wid = first && d.wallets.some(w => w.id === first.wallet) ? first.wallet : k.walletByCur(first?.currency || 'USD');
    return { id: id || uid(), name, note, wallet: wid, services: list.map(r => toService(r, k.walletCur(wid))) };
  };
  d.clients = arr(raw.clients).map(c => mkClient(c.id, c.name, c.note || '', recs.filter(r => r.clientId === c.id)));
  const orphans = recs.filter(r => !d.clients.some(c => c.id === r.clientId));
  if (orphans.length) d.clients.push(mkClient('', OTHERS, '', orphans));
  for (const m of arr(raw.movements)) {
    if (m.type === 'transfer') {
      d.withdrawals.push({ id: m.id || uid(), date: m.date, from: m.wallet, to: m.to, amount: round2(m.amount), received: round2(m.toAmount), fromBefore: null, fromAfter: null, toBefore: null, toAfter: null, note: m.note || '' });
    }
  }
  return d;
}

// Versión 3 → 4: los cobros programados pasan a ser productos, y lo ya hecho este mes queda anotado.
function fromV3(raw) {
  const d = blank();
  copyRates(d, raw);
  if (arr(raw.wallets).length) d.wallets = raw.wallets.map(w => ({ color: 0, updated: '', ...w, balance: round2(w.balance) }));
  d.payments = arr(raw.payments);
  d.withdrawals = arr(raw.withdrawals);
  d.plan = { ...d.plan, ...(raw.plan || {}) };
  const now = thisMonth(), today = todayISO(), first = now + '-01';
  for (const c of arr(raw.clients)) {
    const services = arr(c.services);
    d.clients.push({
      id: c.id || uid(), name: c.name, note: c.note || '', wallet: c.wallet,
      products: services.map(s => ({
        id: s.id || uid(), name: s.name, price: round2(s.amount),
        freq: s.frequency === 'weekly' ? 'weekly' : s.frequency === 'monthly' ? 'monthly' : 'ondemand',
        active: s.active !== false && !(s.end && s.end < today),
      })),
    });
    if (d.payments.some(p => p.clientId === c.id && p.month === now)) continue;
    for (const s of services) {
      if (s.active === false || !s.start) continue;
      const from = maxStr(first, s.start), to = minStr(today, s.end);
      if (from > to) continue;
      const dates = [];
      if (s.frequency === 'weekly') {
        let x = s.start;
        if (x < from) x = addDays(x, Math.ceil(dayDiff(x, from) / 7) * 7);
        for (; x <= to; x = addDays(x, 7)) dates.push(x);
      } else if (s.frequency === 'monthly' || (s.frequency === 'once' && s.start >= from)) {
        dates.push(from);
      }
      for (const date of dates) d.entries.push({ id: uid(), clientId: c.id, productId: s.id, name: s.name, price: round2(s.amount), qty: 1, date });
    }
  }
  return d;
}

function normalize(raw) {
  const d = blank();
  copyRates(d, raw);
  const wallets = arr(raw.wallets).length ? raw.wallets.map(w => ({ color: 0, updated: '', ...w, balance: round2(w.balance) })) : d.wallets;
  // Antes la moneda del cliente era la de su billetera.
  const currencyOf = c => (CURRENCIES[c.currency] ? c.currency : wallets.find(w => w.id === c.wallet)?.currency || 'USD');
  return {
    ...d,
    updatedAt: Number(raw.updatedAt) || 0,
    ratesDate: d.ratesDate,
    wallets,
    clients: arr(raw.clients).map(c => ({ note: '', ...c, currency: currencyOf(c), products: arr(c.products).map(normalizeProduct) })),
    entries: arr(raw.entries),
    payments: arr(raw.payments),
    withdrawals: arr(raw.withdrawals),
    // Los gastos de antes en otra moneda pasan a soles (la sección ya no usa tipo de cambio).
    expenses: arr(raw.expenses).map(x => {
      const rate = x.currency && x.currency !== 'PEN' ? Number(d.rates[x.currency]) || 0 : 1;
      return { ...x, kind: x.kind === 'in' ? 'in' : x.kind === 'adj' ? 'adj' : 'out', currency: 'PEN', amount: round2((Number(x.amount) || 0) * rate) };
    }),
    customCategories: arr(raw.customCategories).map(String),
    incomeCategories: arr(raw.incomeCategories).map(String),
    yape: { opening: round2(raw.yape?.opening) },
    catStyles: raw.catStyles && typeof raw.catStyles === 'object' ? raw.catStyles : {},
    contacts: arr(raw.contacts).filter(c => c && c.name).map(c => ({ id: c.id || uid(), name: String(c.name), uses: Number(c.uses) || 0, lastKind: c.lastKind === 'in' ? 'in' : 'out', lastCategory: String(c.lastCategory || '') })),
    plan: { ...d.plan, ...(raw.plan || {}) },
    horizon: raw.horizon || d.horizon,
  };
}

// Convierte cualquier versión guardada al formato actual.
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return blank();
  if (raw.version === 4) return normalize(raw);
  if (raw.version === 3) return normalize(fromV3(raw));
  return normalize(fromV3(raw.version === 2 ? fromV2(raw) : fromV1(raw)));
}

function load() {
  for (const k of [KEY, OLD_KEY]) {
    try { const raw = JSON.parse(localStorage.getItem(k)); if (raw) return migrate(raw); } catch {}
  }
  return blank();
}

let data = load();
let viewMonth = thisMonth();

function persist() {
  data.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  queueCloudSave();
}
function commit(msg) {
  persist();
  render();
  if (msg) toast(msg);
}

const wallet = id => data.wallets.find(w => w.id === id);
const client = id => data.clients.find(c => c.id === id);
const product = (c, id) => c?.products.find(p => p.id === id);
const toPEN = (n, cur) => (Number(n) || 0) * (cur === 'PEN' ? 1 : Number(data.rates[cur]) || 0);
const convert = (n, from, to) => (from === to ? Number(n) || 0 : toPEN(n, from) / (to === 'PEN' ? 1 : Number(data.rates[to]) || 1));
const walletColor = w => COLORS[(w?.color ?? 0) % COLORS.length];
const clientColor = c => COLORS[Math.max(0, data.clients.indexOf(c)) % COLORS.length];
const clientCur = c => c.currency || wallet(c.wallet)?.currency || 'USD';
const initial = s => esc(String(s || '?').trim().charAt(0).toUpperCase() || '?');
function setBalance(w, value) {
  w.balance = round2(value);
  w.updated = todayISO();
}

// ── Cuenta de cada cliente ──
const monthEntries = (c, m) => data.entries.filter(e => e.clientId === c.id && monthKey(e.date) === m);
const entryTotal = list => round2(list.reduce((t, e) => t + e.qty * e.price, 0));
const monthLogged = (c, m) => entryTotal(monthEntries(c, m));
const productCount = (c, p, m) => monthEntries(c, m).filter(e => e.productId === p.id).reduce((t, e) => t + e.qty, 0);
const paymentOf = (cId, m) => data.payments.find(p => p.clientId === cId && p.month === m);

// Resumen por producto de lo anotado en un mes, p. ej. "12 × Gráfico".
function monthLines(c, m) {
  const map = new Map();
  for (const e of monthEntries(c, m)) {
    const key = e.productId || e.name;
    const x = map.get(key) || { name: product(c, e.productId)?.name || e.name, qty: 0, total: 0 };
    x.qty += e.qty;
    x.total += e.qty * e.price;
    map.set(key, x);
  }
  return [...map.values()];
}
const linesText = lines => lines.map(x => `${x.qty > 1 ? `${x.qty} × ` : ''}${x.name}`).join(', ');

// Lo que esperas facturarle a un cliente en un mes: lo anotado más lo que falta según cuántas veces haces cada producto.
function monthExpected(c, m) {
  const logged = monthLogged(c, m);
  if (m < thisMonth()) return logged;
  return round2(logged + estimateRange(c, maxStr(m + '-01', addDays(todayISO(), 1)), lastDay(m)));
}
// Trabajo aún no anotado que esperas hacer entre dos fechas, según cuántas veces haces cada producto.
function estimateRange(c, from, to) {
  return round2(c.products.reduce((t, p) => t + productEstimate(c, p, from, to).qty * p.price, 0));
}
// Cuántas unidades de un producto esperas hacer entre dos fechas (puede ser fraccionario).
function productEstimate(c, p, from, to) {
  let qty = 0;
  if (!p.active || !(p.estCount > 0)) return { qty, amount: 0 };
  for (let m = monthKey(from); from <= to && m <= monthKey(to); m = shiftMonth(m, 1)) {
    const a = maxStr(from, m + '-01'), b = minStr(to, lastDay(m));
    if (a > b) continue;
    const days = dayDiff(a, b) + 1;
    // Al mes: las que faltan anotar, repartidas en los días que quedan. Por semana: proporcional a los días.
    if (p.estPer === 'month') qty += (Math.max(0, p.estCount - productCount(c, p, m)) * days) / (dayDiff(a, lastDay(m)) + 1);
    else qty += (p.estCount * days) / 7;
  }
  return { qty, amount: round2(qty * p.price) };
}

// ── Previsión ──
// Fecha elegida para la previsión; si no hay una válida y futura, fin de este mes.
function horizonDate(h) {
  const t = todayISO();
  return /^\d{4}-\d{2}-\d{2}$/.test(h || '') && h > t ? h : lastDay(thisMonth()) > t ? lastDay(thisMonth()) : lastDay(shiftMonth(thisMonth(), 1));
}
// Dinero de hoy + lo anotado sin cobrar + lo que estimas hacer hasta la fecha, todo en soles.
function forecast(until) {
  const now = data.wallets.reduce((s, w) => s + toPEN(w.balance, w.currency), 0);
  const pending = pendingCharges().reduce((s, x) => s + toPEN(x.due, clientCur(x.c)), 0);
  const tomorrow = addDays(todayISO(), 1);
  const future = data.clients.reduce((s, c) => s + toPEN(estimateRange(c, tomorrow, until), clientCur(c)), 0);
  const costs = withdrawalCosts(until);
  return { now, pending, future, costs, total: now + pending + future - costs.total };
}
// Comisión fija de los retiros que tu plan haría hasta la fecha (uno a fin de cada mes en que toque retirar).
function withdrawalCosts(until) {
  const none = { count: 0, fee: 0, total: 0 };
  if (data.wallets.length < 2 || !(Number(data.plan.fee) > 0)) return none;
  const st = planSetup();
  if (st.from.id === st.to.id) return none;
  const now = thisMonth(), end = monthKey(until);
  const months = (+end.slice(0, 4) - +now.slice(0, 4)) * 12 + (+end.slice(5, 7) - +now.slice(5, 7)) + 1;
  const count = simulate(data.plan.strategy, st, months, false).rows.filter(r => r.out > 0 && lastDay(r.m) <= until).length;
  const fee = toPEN(st.fee, st.to.currency);
  return { count, fee, total: count * fee };
}
// Meses con trabajo anotado que todavía no te pagan (incluye el mes en curso).
function pendingCharges() {
  const now = thisMonth(), floor = shiftMonth(now, -12), out = [];
  for (const c of data.clients) {
    const months = [...new Set(data.entries.filter(e => e.clientId === c.id).map(e => monthKey(e.date)))].filter(m => m >= floor && m <= now).sort();
    for (const m of months) {
      const due = monthLogged(c, m);
      if (due > 0 && !paymentOf(c.id, m)) out.push({ c, m, due });
    }
  }
  return out.sort((a, b) => (a.m < b.m ? -1 : a.m > b.m ? 1 : 0));
}
function monthTotals(m) {
  let logged = 0, expected = 0;
  for (const c of data.clients) {
    logged += toPEN(monthLogged(c, m), clientCur(c));
    expected += toPEN(monthExpected(c, m), clientCur(c));
  }
  const collected = data.payments.filter(p => p.month === m).reduce((t, p) => t + toPEN(p.amount, p.currency), 0);
  return { logged, expected, collected };
}
// ── Gastos e ingresos (todo en soles, aparte de billeteras y clientes) ──
const isIncome = x => x.kind === 'in';
const isAdj = x => x.kind === 'adj'; // ajuste de saldo: cambia el saldo, nunca cuenta en estadísticas
const isOut = x => !isIncome(x) && !isAdj(x);
const sumAmount = list => list.reduce((t, x) => t + (Number(x.amount) || 0), 0);
const kindCategories = kind => [...new Set(kind === 'in'
  ? [...INCOME_CATEGORIES, ...data.incomeCategories, ...data.expenses.filter(isIncome).map(x => x.category)]
  : [...EXPENSE_CATEGORIES, ...data.customCategories, ...data.expenses.filter(isOut).map(x => x.category)])];
// Saldo de Yape: ingresos, menos gastos, más los ajustes que hayas hecho.
const netMoves = () => sumAmount(data.expenses.filter(isIncome)) - sumAmount(data.expenses.filter(isOut)) + sumAmount(data.expenses.filter(isAdj));
const yapeBalance = () => round2(data.yape.opening + netMoves());
const catMeta = name => {
  const s = data.catStyles[name];
  if (s && PATHS[s.icon]) return { icon: s.icon, color: s.color || CAT_COLORS[0] };
  const m = CAT_META[name];
  if (m) return { icon: m[0], color: m[1] };
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % CAT_COLORS.length;
  return { icon: 'tag', color: CAT_COLORS[h] };
};
const catBadge = (name, small = false) => { const m = catMeta(name); return `<span class="cat-ic${small ? ' sm' : ''}" style="--c:${m.color}">${icon(m.icon)}</span>`; };
const contactKey = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const frequentContacts = () => [...data.contacts].sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
const contactMoves = c => data.expenses.filter(x => contactKey(x.contact) === contactKey(c.name));
// Fecha para anotar con "+" en el mes que estás viendo.
function logDate(m) {
  const now = thisMonth();
  return m === now ? todayISO() : m < now ? lastDay(m) : m + '-01';
}

// ── Plan de retiros ──
function planSetup() {
  const p = data.plan;
  const from = wallet(p.from) || data.wallets.find(w => w.currency !== 'PEN') || data.wallets[0];
  const to = (p.to !== from.id && wallet(p.to))
    || data.wallets.find(w => w.id !== from.id && w.currency === 'PEN')
    || data.wallets.find(w => w.id !== from.id) || from;
  const last = data.withdrawals
    .filter(w => w.from === from.id && w.to === to.id && w.amount > 0 && w.received > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const market = convert(1, from.currency, to.currency);
  // El tipo de tu último retiro solo se usa si es razonable: si se aleja más de 15 % del de Ajustes,
  // seguramente el saldo de destino no cuadró al registrarlo.
  const lastRate = last ? last.received / last.amount : 0;
  const lastOk = lastRate > 0 && Math.abs(lastRate - market) <= market * 0.15;
  const autoRate = lastOk ? lastRate : market;
  const manual = Number(p.rate) > 0;
  return {
    from, to, autoRate, market, fromLast: lastOk,
    rateSource: manual ? 'el que pusiste en Retiros' : lastOk ? `tu último retiro, del ${fmtDate(last.date)}` : 'Ajustes',
    rate: manual ? Number(p.rate) : autoRate,
    fee: Number(p.fee) || 0,
    threshold: Number(p.threshold) || 0,
  };
}
// Lo que te pagarán en una billetera en cada mes. El primer mes suma lo pendiente de meses anteriores.
function incomeInto(w, m, first) {
  let total = 0;
  for (const c of data.clients) {
    if (c.wallet !== w.id) continue;
    let due = 0;
    if (!first) due = monthExpected(c, m);
    else {
      if (!paymentOf(c.id, m)) due += monthExpected(c, m);
      due += pendingCharges().filter(x => x.c === c && x.m < m).reduce((t, x) => t + x.due, 0);
    }
    total += convert(due, clientCur(c), w.currency); // el cliente paga en su moneda; llega a la billetera en la suya
  }
  return total;
}
// forceLast: al final del periodo se retira lo que quede (para comparar estrategias en igualdad).
function simulate(strategy, st, months = PLAN_MONTHS, forceLast = true) {
  const now = thisMonth();
  let bal = st.from.balance, received = 0, fees = 0, count = 0;
  const rows = [];
  for (let i = 0; i < months; i++) {
    const m = shiftMonth(now, i);
    const inc = incomeInto(st.from, m, i === 0);
    bal += inc;
    const go = (forceLast && i === months - 1)
      || strategy === 'monthly'
      || (strategy === 'every2' && i % 2 === 1)
      || (strategy === 'every3' && i % 3 === 2)
      || (strategy === 'threshold' && st.threshold > 0 && bal >= st.threshold);
    let out = 0, got = 0;
    // El costo fijo se cobra en la moneda de destino (soles) y se descuenta de lo recibido.
    if (go && bal * st.rate > st.fee) {
      out = bal;
      got = bal * st.rate - st.fee;
      received += got;
      fees += st.fee;
      count++;
      bal = 0;
    }
    rows.push({ m, inc, out, got, bal });
  }
  return { rows, received, fees, count };
}

// ── Vistas ──
const VIEWS = {
  inicio: { label: 'Inicio', icon: 'home', render: viewHome },
  clientes: { label: 'Clientes', icon: 'users', render: viewClients },
  gastos: { label: 'Gastos', icon: 'receipt', render: viewExpenses },
  retiros: { label: 'Retiros', icon: 'banknote', render: viewWithdrawals },
  ajustes: { label: 'Ajustes', icon: 'settings', render: viewSettings },
};
const ALIASES = { cobros: 'clientes' };
function currentView() {
  const h = location.hash.slice(1);
  return VIEWS[h] ? h : ALIASES[h] || 'inicio';
}

function render() {
  const name = currentView();
  $('nav').innerHTML = Object.entries(VIEWS).map(([k, v]) =>
    `<a class="nav-item${k === name ? ' active' : ''}" href="#${k}"${k === name ? ' aria-current="page"' : ''}>${icon(v.icon)}<span>${v.label}</span></a>`).join('');
  $('pageTitle').textContent = VIEWS[name].label;
  $('view').innerHTML = VIEWS[name].render();
  enhanceSelects($('view'));
  renderSync();
}

const emptyState = (text, action = '') => `<div class="empty"><p>${text}</p>${action}</div>`;
const avatar = (text, color) => `<span class="avatar" style="--c:${color}">${initial(text)}</span>`;
const newClientButton = () => `<button class="btn primary" data-act="newClient">${icon('plus')}Nuevo cliente</button>`;
const monthSwitch = (m, prev = 'prevMonth', next = 'nextMonth') => `<div class="month-switch">
  <button class="icon-btn" data-act="${prev}" aria-label="Mes anterior">${icon('chevronLeft')}</button>
  <span>${monthLabel(m)}</span>
  <button class="icon-btn" data-act="${next}" aria-label="Mes siguiente">${icon('chevronRight')}</button>
</div>`;

// Fila de producto con contador: "+" anota uno, "−" quita el último.
function productRow(c, p, m, showClient = false, detail = false) {
  const cur = clientCur(c), n = productCount(c, p, m);
  const ids = `data-client="${c.id}" data-id="${p.id}" data-month="${m}"`;
  // Cada entrega del mes, con su título; se toca para ponerle o cambiarle el título.
  const units = detail ? monthEntries(c, m).filter(e => e.productId === p.id).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) : [];
  const shown = units.slice(-6);
  const open = !collapsed.has(`p:${p.id}`);
  const untitled = units.filter(e => !e.label).length;
  const unitToggle = units.length ? `<button class="units-toggle${open ? ' open' : ''}" data-act="toggleProduct" data-id="${p.id}" aria-expanded="${open}">
    ${icon('chevronDown', 'toggle-ic')}<span>${units.length} ${units.length === 1 ? 'entrega' : 'entregas'}${untitled ? ` · ${untitled} sin título` : ''}</span>
  </button>` : '';
  const unitList = units.length && open ? `<div class="units">
    ${units.length > shown.length ? `<button class="unit more" data-act="entries" data-client="${c.id}" data-month="${m}">Ver las ${units.length} entregas</button>` : ''}
    ${shown.map(e => `<button class="unit${e.label ? '' : ' empty'}" data-act="editEntry" data-id="${e.id}" data-from="card">
      <span>${fmtDate(e.date)}</span><b>${e.label ? esc(e.label) : 'Agregar título'}</b>${e.qty > 1 ? `<small>× ${e.qty}</small>` : ''}
    </button>`).join('')}
  </div>` : '';
  return `<div class="prod-item"><div class="prod-row${p.active ? '' : ' paused'}">
    <button class="prod-main" data-act="editProduct" data-client="${c.id}" data-id="${p.id}">
      <b>${esc(p.name)}${p.active ? '' : '<em class="tag">Pausado</em>'}</b>
      <small>${showClient ? `${esc(c.name)} · ` : ''}${money(p.price, cur)}${n ? ` · ${money(n * p.price, cur)}` : ''}${detail ? ` · ${estText(p)}` : ''}</small>
    </button>
    <div class="counter">
      <button class="icon-btn" data-act="unlog" ${ids} aria-label="Quitar uno de ${esc(p.name)}"${n ? '' : ' disabled'}>${icon('minus')}</button>
      <span class="count" aria-label="${n} anotados">${n}</span>
      <button class="icon-btn add" data-act="log" ${ids} aria-label="Anotar uno de ${esc(p.name)}">${icon('plus')}</button>
    </div>
  </div>${unitToggle}${unitList}</div>`;
}

function viewHome() {
  const now = thisMonth();
  const foreign = [...new Set(data.wallets.map(w => w.currency))].filter(c => c !== 'PEN');
  const rateNote = foreign.length ? foreign.map(c => `1 ${c} = ${money(data.rates[c])}`).join(' · ') : 'Todo en soles';
  const pend = pendingCharges();
  const t = monthTotals(now);
  return `
  <section class="card hero">
    ${forecastBlock()}
    <p class="muted small">${esc(rateNote)}</p>
    <div class="wallet-list">${data.wallets.map(w => `
      <button class="wallet" data-act="editWallet" data-id="${w.id}" aria-label="Escribir saldo de ${esc(w.name)}">
        ${avatar(w.name, walletColor(w))}
        <span class="wallet-name">${esc(w.name)}<small>${w.updated ? `Actualizado ${relDate(w.updated)}` : w.currency}</small></span>
        <span class="wallet-amount">${money(w.balance, w.currency)}</span>
        ${icon('edit', 'wallet-edit')}
      </button>`).join('')}
    </div>
    <div class="btn-row hero-actions">
      <button class="btn ghost" data-act="updateBalances">${icon('refresh')}Actualizar saldos</button>
      <button class="btn primary" data-act="newWithdrawal">${icon('banknote')}Retiré</button>
    </div>
  </section>
  ${data.clients.length ? '' : `<section class="card">${emptyState('Agrega a tus clientes y lo que les haces para ir anotando cada entrega.', newClientButton())}</section>`}
  ${pend.length ? `<section class="card">
    <div class="card-head"><h2>Por cobrar</h2></div>
    <div class="rows">${pend.map(chargeRow).join('')}</div>
  </section>` : ''}
  <section class="card">
    <div class="card-head"><h2>${monthLabel(now)}</h2></div>
    <div class="stats">
      <div class="stat"><span>Anotado</span><b>${money(t.logged)}</b></div>
      <div class="stat"><span>Cobrado</span><b class="pos">${money(t.collected)}</b></div>
      <div class="stat"><span>Estimado a fin de mes</span><b>${money(t.expected)}</b></div>
    </div>
  </section>
  ${nextWithdrawalCard()}`;
}

function forecastBlock() {
  const until = horizonDate(data.horizon), f = forecast(until);
  return `<div class="forecast">
    <div class="fc-box">
      <p class="label">Hoy tienes</p>
      <p class="hero-amount">${money(f.now)}</p>
    </div>
    <div class="fc-box future">
      <label class="label fc-label" for="horizonDate">Al ${fmtDate(until, { day: 'numeric', month: 'short', year: until.slice(0, 4) === todayISO().slice(0, 4) ? undefined : 'numeric' })}</label>
      <button class="hero-amount pos fc-detail" data-act="forecastDetail" aria-label="Ver qué incluye la previsión">${money(f.total)}${icon('chevronRight', 'fc-more')}</button>
    </div>
  </div>
  <label class="fc-controls">
    <span>Ver previsión al</span>
    <input type="date" id="horizonDate" value="${until}" min="${addDays(todayISO(), 1)}">
  </label>
  <div class="fc-breakdown">
    <span>Hoy <b>${money(f.now)}</b></span>
    <span>Por cobrar <b>+${money(f.pending)}</b></span>
    <span>Por hacer <b>+${money(f.future)}</b></span>
    ${f.costs.count ? `<span>Comisión de retiro (${f.costs.count} × ${money(f.costs.fee)}) <b>−${money(f.costs.total)}</b></span>` : ''}
  </div>`;
}

function chargeRow({ c, m, due }) {
  const now = thisMonth(), late = m < now;
  return `<div class="row${late ? ' late' : ''}">
    ${avatar(c.name, clientColor(c))}
    <span class="row-main"><b>${esc(c.name)}</b><small>${cap(monthName(m))}${m === now ? ' (en curso)' : ''} · ${esc(linesText(monthLines(c, m)))}</small></span>
    <span class="row-side"><span class="amount">${money(due, clientCur(c))}</span><button class="btn-sm ${late ? 'primary' : 'ghost'}" data-act="charge" data-id="${c.id}" data-month="${m}">Cobrar</button></span>
  </div>`;
}

function nextWithdrawalCard() {
  if (!data.clients.length || data.wallets.length < 2) return '';
  const st = planSetup();
  const next = simulate(data.plan.strategy, st).rows.find(r => r.out > 0);
  if (!next) return '';
  return `<section class="card">
    <div class="card-head"><h2>Próximo retiro</h2><a class="link" href="#retiros">Ver plan</a></div>
    <p class="muted">Según tu plan (${STRATEGIES[data.plan.strategy].toLowerCase()}), a fin de ${monthName(next.m)} retirarías unos <b class="ink">${money(next.out, st.from.currency)}</b> de ${esc(st.from.name)} y recibirías unos <b class="ink">${money(next.got, st.to.currency)}</b>.</p>
  </section>`;
}

function viewClients() {
  const m = viewMonth;
  if (!data.clients.length) return `<section class="card">${emptyState('Agrega a tus clientes y lo que les haces para ir anotando cada entrega.', newClientButton())}</section>`;
  const t = monthTotals(m);
  return `
  ${monthSwitch(m)}
  <div class="stats two">
    <div class="stat"><span>Anotado en ${monthName(m)}</span><b>${money(t.logged)}</b></div>
    <div class="stat"><span>Cobrado</span><b class="pos">${money(t.collected)}</b></div>
  </div>
  ${data.clients.map(c => accountCard(c, m)).join('')}
  <div class="page-actions end">${newClientButton()}</div>`;
}

// Clientes y productos contraídos en la vista de Clientes (preferencia de este dispositivo; productos con prefijo "p:").
const COLLAPSED_KEY = 'saldo-collapsed';
let collapsed = new Set();
try { collapsed = new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || []); } catch {}
function toggleCollapsed(id) {
  if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
  try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed])); } catch {}
}

function accountCard(c, m) {
  const cur = clientCur(c), now = thisMonth();
  const logged = monthLogged(c, m), pay = paymentOf(c.id, m);
  const w = wallet(c.wallet);
  const open = !collapsed.has(c.id);
  const status = pay ? 'cobrado' : logged > 0 && m <= now ? 'por cobrar' : '';
  return `<section class="card account${open ? '' : ' collapsed'}">
    <div class="card-head client-head">
      <button class="client-toggle" data-act="toggleClient" data-id="${c.id}" aria-expanded="${open}" aria-label="${open ? 'Contraer' : 'Expandir'} ${esc(c.name)}">
        ${avatar(c.name, clientColor(c))}
        <span class="row-main"><b>${esc(c.name)}</b><small>${open ? `${clientCur(c)} · te paga en ${esc(w ? w.name : 'una billetera eliminada')}` : `${money(logged, cur)} en ${monthName(m)}${status ? ` · ${status}` : ''}`}</small></span>
        ${icon('chevronDown', 'toggle-ic')}
      </button>
      ${open ? `<button class="btn-sm ghost" data-act="editClient" data-id="${c.id}">${icon('edit')}Editar</button>` : ''}
    </div>
    ${open ? accountBody(c, m) : ''}
  </section>`;
}

function accountBody(c, m) {
  const cur = clientCur(c), now = thisMonth();
  const logged = monthLogged(c, m), expected = monthExpected(c, m), pay = paymentOf(c.id, m);
  const count = monthEntries(c, m).length;
  return `
    ${c.products.length ? `<div class="prod-list">${c.products.map(p => productRow(c, p, m, false, true)).join('')}</div>` : '<p class="muted small">Agrega lo que le haces a este cliente.</p>'}
    <div class="btn-row tight">
      <button class="btn-sm ghost" data-act="newProduct" data-client="${c.id}">${icon('plus')}Producto</button>
      <button class="btn-sm ghost" data-act="entries" data-client="${c.id}" data-month="${m}">${icon('list')}Anotaciones${count ? ` (${count})` : ''}</button>
    </div>
    <div class="account-total">
      <span>Total de ${monthName(m)}${m === now && expected > logged ? `<small>Estimado a fin de mes: ${money(expected, cur)}</small>` : ''}</span>
      <b>${money(logged, cur)}</b>
    </div>
    ${pay ? `<div class="paid">${icon('check')}<span>Cobrado ${relDate(pay.date)} · <b>${money(pay.amount, pay.currency)}</b></span><button class="btn-sm ghost" data-act="editPayment" data-id="${pay.id}">Editar</button></div>`
      : m <= now ? `<button class="btn ${logged > 0 ? 'primary' : 'ghost'} block" data-act="charge" data-id="${c.id}" data-month="${m}">Cobrar ${monthName(m)}</button>` : ''}`;
}

function viewWithdrawals() {
  const list = [...data.withdrawals].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return `
  <button class="btn primary block big" data-act="newWithdrawal">${icon('banknote')}Registrar un retiro</button>
  ${data.wallets.length > 1 ? planCard() : ''}
  <section class="card">
    <div class="card-head"><h2>Retiros hechos</h2></div>
    ${list.length ? `<div class="rows">${list.map(withdrawalRow).join('')}</div>` : emptyState('Aún no registras retiros.')}
  </section>`;
}

function withdrawalRow(x) {
  const a = wallet(x.from), b = wallet(x.to);
  const aCur = a?.currency || 'USD', bCur = b?.currency || 'PEN';
  const rate = x.amount > 0 ? x.received / x.amount : 0;
  return `<button class="row" data-act="viewWithdrawal" data-id="${x.id}">
    <span class="move-ic">${icon('banknote')}</span>
    <span class="row-main"><b>${money(x.amount, aCur)} de ${esc(a ? a.name : 'billetera eliminada')}</b><small>${fmtDate(x.date)}${aCur !== bCur && rate ? ` · ${money(rate, bCur)} por ${CURRENCIES[aCur]}1` : ''}</small></span>
    <span class="amount pos">+${money(x.received, bCur)}<small>a ${esc(b ? b.name : 'billetera eliminada')}</small></span>
  </button>`;
}

function planCard() {
  const p = data.plan, st = planSetup();
  const strategies = ['monthly', 'every2', 'every3', 'threshold'];
  return `<section class="card" id="planCard">
    <div class="card-head"><h2>Planificar retiros</h2></div>
    <form class="form" id="planForm">
      <div class="grid2">
        <label class="field"><span>Desde</span><select name="from">${walletOptions(st.from.id)}</select></label>
        <label class="field"><span>Hacia</span><select name="to">${walletOptions(st.to.id)}</select></label>
      </div>
      <div class="segmented four" role="radiogroup" aria-label="Cada cuánto retiras">
        ${strategies.map(k => `<label><input type="radio" name="strategy" value="${k}"${p.strategy === k ? ' checked' : ''}><span>${STRATEGIES[k]}</span></label>`).join('')}
      </div>
      <div data-threshold${p.strategy === 'threshold' ? '' : ' hidden'}>${moneyField('Retirar cuando tengas', 'threshold', st.from.currency, p.threshold || '', 'min="0"')}</div>
      <div class="grid2">
        <label class="field"><span>Recibes por ${CURRENCIES[st.from.currency]} 1 al retirar</span><input name="rate" type="number" step="0.001" min="0" inputmode="decimal" value="${Number(p.rate) > 0 ? p.rate : ''}" placeholder="${roundTo(st.autoRate, 3)}"></label>
        ${moneyField('Costo fijo por retiro', 'fee', st.to.currency, p.fee || '', 'min="0"')}
      </div>
      <small class="field-hint">Ajustes: ${money(st.market, st.to.currency)} por ${CURRENCIES[st.from.currency]}1. ${Number(p.rate) > 0 ? 'Al retirar usa el valor que escribiste.' : st.fromLast ? 'Al retirar usa el de tu último retiro real.' : 'Vacío: usa el de Ajustes.'}</small>
    </form>
    <div id="planResult">${planResult()}</div>
  </section>`;
}

function planResult() {
  const st = planSetup(), fc = st.from.currency, tc = st.to.currency;
  const sim = simulate(data.plan.strategy, st);
  const compare = Object.keys(STRATEGIES).map(k => ({ k, r: simulate(k, st) }));
  const best = Math.max(...compare.map(x => x.r.received));
  return `
  <div class="stats">
    <div class="stat"><span>Recibirías en ${PLAN_MONTHS} meses</span><b class="pos">${money(sim.received, tc)}</b></div>
    <div class="stat"><span>Retiros</span><b>${sim.count}</b></div>
    <div class="stat"><span>Costos fijos</span><b>${money(sim.fees, tc)}</b></div>
  </div>
  <div class="table" role="table">
    <div class="table-row table-head" role="row"><span>Mes</span><span>Te pagan</span><span>Retiras</span><span>Recibes</span></div>
    ${sim.rows.map(r => `<div class="table-row${r.out ? ' hit' : ''}" role="row"><span>${cap(monthShort(r.m))}</span><span>${r.inc ? moneyShort(r.inc, fc) : ''}</span><span>${r.out ? moneyShort(r.out, fc) : ''}</span><span>${r.got ? moneyShort(r.got, tc) : ''}</span></div>`).join('')}
  </div>
  <h3 class="sub">Comparar</h3>
  <div class="rows">${compare.map(({ k, r }) => `<div class="compare-row${data.plan.strategy === k ? ' current' : ''}">
    <span><b>${STRATEGIES[k]}${k === 'threshold' ? ` ${moneyShort(st.threshold, fc)}` : ''}</b><small>${r.count} ${r.count === 1 ? 'retiro' : 'retiros'} · ${money(r.fees, tc)} en costos</small></span>
    <span class="amount">${money(r.received, tc)}${best - r.received < 0.005 ? '<small class="pos">La mejor</small>' : `<small>${money(r.received - best, tc)}</small>`}</span>
  </div>`).join('')}</div>
  <small class="field-hint">Lo que te pagarán sale de lo anotado y de la frecuencia de cada producto. Supone el mismo tipo de cambio todo el año.</small>`;
}

function viewSettings() {
  const signed = driveAuthed();
  const googleText = !gTokenClient ? 'Google no está disponible ahora mismo.'
    : signed ? 'Tus datos se guardan en tu Google Drive y se sincronizan entre dispositivos.'
    : 'Entra con Google para guardar una copia en tu Drive y usar Saldo en varios dispositivos.';
  return `
  <section class="card">
    <div class="card-head"><h2>Billeteras</h2><button class="btn-sm ghost" data-act="newWallet">${icon('plus')}Añadir</button></div>
    <div class="rows">${data.wallets.map(w => `
      <button class="row" data-act="editWallet" data-id="${w.id}">
        ${avatar(w.name, walletColor(w))}
        <span class="row-main"><b>${esc(w.name)}</b><small>${CURRENCY_NAMES[w.currency] || w.currency}</small></span>
        <span class="amount">${money(w.balance, w.currency)}</span>
      </button>`).join('')}
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Tipo de cambio</h2></div>
    <p class="muted small">Cuántos soles equivalen a cada moneda.${data.ratesDate ? ` Actualizado el ${fmtDate(data.ratesDate, { day: 'numeric', month: 'long' })}.` : ''}</p>
    <form class="rates" id="ratesForm">
      ${['USD', 'EUR', 'GBP'].map(c => `<label class="field"><span>1 ${c} en soles</span><input name="${c}" type="number" step="0.001" min="0.001" inputmode="decimal" value="${data.rates[c]}" required></label>`).join('')}
      <div class="form-actions">
        <button type="button" class="btn ghost" data-act="fetchRates">${icon('refresh')}Usar el de hoy</button>
        <button class="btn primary">Guardar</button>
      </div>
    </form>
  </section>
  ${GOOGLE_ENABLED ? `<section class="card">
    <div class="card-head"><h2>Google Drive</h2></div>
    <p class="muted small">${googleText}</p>
    <div class="btn-row"><button class="btn ${signed ? 'ghost' : 'primary'}" data-act="toggleGoogle"${gTokenClient ? '' : ' disabled'}>${icon('cloud')}${signed ? 'Desconectar' : 'Entrar con Google'}</button></div>
  </section>` : ''}
  <section class="card">
    <div class="card-head"><h2>Respaldo</h2></div>
    <div class="btn-row">
      <button class="btn ghost" data-act="exportData">${icon('download')}Descargar respaldo</button>
      <button class="btn ghost" data-act="importData">${icon('upload')}Importar respaldo</button>
    </div>
  </section>
  <section class="card danger">
    <div class="card-head"><h2>Borrar datos</h2></div>
    <p class="muted small">Elimina billeteras, clientes, trabajos anotados, cobros, gastos y retiros de este dispositivo.</p>
    <div class="btn-row"><button class="btn danger" data-act="resetData">${icon('trash')}Borrar todo</button></div>
  </section>`;
}

// ── Menús de selección propios: cada <select> se queda oculto (sigue guardando el valor) y se muestra un menú de la app ──
function closePickers(except) {
  document.querySelectorAll('.picker.open').forEach(p => {
    if (p === except) return;
    p.classList.remove('open');
    p.querySelector('.picker-list').hidden = true;
  });
}
// El menú flota sobre la pantalla (no empuja el contenido): debajo del botón o, si no cabe, encima.
function placePopover(btn, list) {
  const r = btn.getBoundingClientRect();
  const kb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb')) || 0;
  const avail = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - kb;
  const below = avail - r.bottom - 10, above = r.top - 10;
  list.style.left = r.left + 'px';
  list.style.width = r.width + 'px';
  list.style.maxHeight = '';
  const want = Math.min(280, list.scrollHeight + 12);
  if (below >= want || below >= above) {
    list.style.top = r.bottom + 6 + 'px';
    list.style.maxHeight = Math.max(120, Math.min(280, below)) + 'px';
  } else {
    const h = Math.min(want, Math.max(120, above));
    list.style.maxHeight = h + 'px';
    list.style.top = Math.max(8, r.top - h - 6) + 'px';
  }
}
function enhanceSelects(root) {
  for (const sel of root.querySelectorAll('select:not([data-enhanced])')) {
    sel.dataset.enhanced = '1';
    sel.classList.add('select-native');
    const box = document.createElement('div');
    box.className = 'picker';
    box.innerHTML = `<button type="button" class="picker-btn" aria-haspopup="listbox"><span class="picker-label"></span>${icon('chevronDown')}</button><div class="picker-list" role="listbox" hidden></div>`;
    sel.after(box);
    const btn = box.querySelector('.picker-btn'), label = box.querySelector('.picker-label'), list = box.querySelector('.picker-list');
    const badge = o => (o.dataset.icon ? `<span class="cat-ic sm" style="--c:${o.dataset.color}">${icon(o.dataset.icon)}</span>` : '');
    const sync = () => { const o = sel.selectedOptions[0]; label.innerHTML = o ? badge(o) + esc(o.textContent) : ''; };
    btn.onclick = () => {
      const open = list.hidden;
      closePickers(box);
      list.hidden = !open;
      box.classList.toggle('open', open);
      if (!open) return;
      list.innerHTML = [...sel.options].map((o, i) => `<button type="button" role="option" class="picker-opt${o.selected ? ' sel' : ''}" data-i="${i}">${badge(o)}<span>${esc(o.textContent)}</span>${o.selected ? icon('check', 'picker-check') : ''}</button>`).join('');
      placePopover(btn, list);
      list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
    };
    list.onclick = e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      sel.selectedIndex = +b.dataset.i;
      list.hidden = true;
      box.classList.remove('open');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    };
    sel.addEventListener('change', sync);
    sync();
  }
}
document.addEventListener('click', e => { if (!e.target.closest('.picker')) closePickers(); });
// Al desplazar la pantalla o girarla, el menú abierto se cierra (flota en una posición fija).
window.addEventListener('scroll', e => { if (!e.target.closest || !e.target.closest('.picker-list')) closePickers(); }, true);
window.addEventListener('resize', () => closePickers());

// Teclado en pantalla. Android no avisa cuándo se abre o se cierra (sobre todo con el gesto de atrás), así que la hoja no se mueve:
// al tocar un campo gana espacio al final (--kb) y se sube el campo a la parte alta, donde el teclado no llega.
const kbRoot = document.documentElement;
const isTextField = el => el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'button', 'submit', 'file', 'hidden', 'range', 'color', 'date', 'time', 'month', 'week', 'datetime-local'].includes(el.type);
let baseHeight = window.innerHeight;
const baseH = () => Math.max(baseHeight, window.innerHeight); // por si la página cargó con la ventana aún sin tamaño
let kbTimer = 0;
const setKb = px => kbRoot.style.setProperty('--kb', px + 'px');
const windowShrunk = () => Math.min(window.innerHeight, window.visualViewport ? window.visualViewport.height : window.innerHeight) < baseH() - 120;
function revealField(field) {
  if (document.activeElement !== field) return;
  const target = window.innerHeight * 0.2; // el campo queda en el quinto superior de la pantalla
  const delta = field.getBoundingClientRect().top - target;
  if (delta <= 0) return;
  const box = field.closest('.sheet');
  if (box) box.scrollBy({ top: delta });
  else window.scrollBy({ top: delta });
}
document.addEventListener('focusin', e => {
  if (!isTextField(e.target) || !window.matchMedia('(pointer: coarse)').matches) return;
  const field = e.target;
  clearTimeout(kbTimer);
  setKb(Math.round(baseH() * 0.45));
  kbTimer = setTimeout(() => { if (windowShrunk()) setKb(0); revealField(field); }, 350);
});
document.addEventListener('focusout', () => {
  clearTimeout(kbTimer);
  kbTimer = setTimeout(() => { if (!isTextField(document.activeElement)) setKb(0); }, 200);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') setKb(0); });
window.addEventListener('resize', () => { if (!isTextField(document.activeElement)) baseHeight = window.innerHeight; });

// ── Hojas (formularios) ──
function openSheet(title, html, mount) {
  $('sheetTitle').textContent = title;
  $('sheetBody').innerHTML = html;
  enhanceSelects($('sheetBody'));
  $('sheet').hidden = false;
  document.body.classList.add('locked');
  const form = $('sheetBody').querySelector('form');
  if (mount && form) mount(form, n => form.elements[n]);
}
function closeSheet() {
  setKb(0);
  $('sheet').hidden = true;
  $('sheetBody').innerHTML = '';
  document.body.classList.remove('locked');
}

const walletOptions = sel => data.wallets.map(w => `<option value="${w.id}"${w.id === sel ? ' selected' : ''}>${esc(w.name)} · ${w.currency}</option>`).join('');
const currencyOptions = sel => Object.keys(CURRENCIES).map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>${CURRENCY_NAMES[c]}</option>`).join('');
const formActions = (label = 'Guardar') => `<div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cancelar</button><button class="btn primary">${label}</button></div>`;
const deleteButton = (act, id, label = 'Eliminar', extra = '') => `<button type="button" class="btn danger-ghost" data-act="${act}" data-id="${id}"${extra}>${icon('trash')}${label}</button>`;
function moneyField(label, name, cur, value, attrs = 'min="0.01" required', hint = '') {
  return `<label class="field"><span data-label="${name}">${label}</span><span class="money-input"><span data-cur="${name}">${CURRENCIES[cur] || cur}</span><input name="${name}" type="number" step="0.01" inputmode="decimal" ${attrs} value="${value ?? ''}" placeholder="0.00"></span>${hint ? `<small class="field-hint" data-hint="${name}">${hint}</small>` : ''}</label>`;
}
const setText = (form, sel, text) => { const el = form.querySelector(sel); if (el) el.textContent = text; };

// Cobrar el mes de un cliente: registras lo que te pagó y escribes cuánto tienes ahora.
function chargeForm(c, m, pay = null) {
  const logged = monthLogged(c, m);
  const w0 = wallet(pay?.wallet) ? pay.wallet : wallet(c.wallet) ? c.wallet : data.wallets[0].id;
  const lines = monthLines(c, m);
  openSheet(pay ? `Cobro de ${monthName(m)}` : `Cobrar ${monthName(m)}`, `<form class="form">
    <p class="preview">${esc(c.name)}${lines.length ? ` · ${esc(linesText(lines))} · ${money(logged, clientCur(c))}` : ''}</p>
    ${moneyField('Te pagó', 'amount', clientCur(c), pay ? pay.amount : logged || '', 'min="0.01" required', ' ')}
    <label class="field"><span>Lo recibiste en</span><select name="wallet">${walletOptions(w0)}</select></label>
    ${moneyField('', 'balance', wallet(w0).currency, '', pay ? 'placeholder="Sin cambios"' : 'required', ' ')}
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${pay?.date || todayISO()}"></label>
    ${pay ? deleteButton('deletePayment', pay.id, 'Deshacer cobro') : ''}
    ${formActions(pay ? 'Guardar' : 'Cobrar')}
  </form>`, (form, el) => {
    const cc = clientCur(c);
    const sync = () => {
      const w = wallet(el('wallet').value);
      const amount = Number(el('amount').value) || 0;
      setText(form, '[data-hint="amount"]', cc !== w.currency && amount > 0 ? `Unos ${money(convert(amount, cc, w.currency), w.currency)} en ${w.name}` : '');
      setText(form, '[data-cur="balance"]', CURRENCIES[w.currency]);
      setText(form, '[data-label="balance"]', `¿Cuánto tienes ahora en ${w.name}?`);
      setText(form, '[data-hint="balance"]', pay ? `Ahora: ${money(w.balance, w.currency)}. Déjalo vacío si no cambió.` : `Antes de este cobro: ${money(w.balance, w.currency)}`);
    };
    el('wallet').addEventListener('change', sync);
    el('amount').addEventListener('input', sync);
    sync();
    if (!pay) el('balance').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const w = wallet(el('wallet').value);
      const amount = round2(el('amount').value);
      if (!(amount > 0)) return toast('Escribe cuánto te pagó');
      const typed = el('balance').value;
      const before = w.balance;
      if (typed !== '') setBalance(w, typed);
      if (pay) {
        Object.assign(pay, { amount, currency: cc, wallet: w.id, date: el('date').value });
        if (typed !== '') Object.assign(pay, { balanceBefore: before, balanceAfter: w.balance });
      } else {
        data.payments.push({ id: uid(), clientId: c.id, month: m, amount, currency: cc, wallet: w.id, date: el('date').value, balanceBefore: before, balanceAfter: w.balance });
      }
      closeSheet();
      commit(pay ? 'Cobro actualizado' : `${c.name}: ${monthName(m)} cobrado`);
    };
  });
}

// Lista de lo anotado a un cliente en un mes.
function entriesSheet(c, m) {
  const cur = clientCur(c);
  const list = monthEntries(c, m).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  openSheet(`${c.name} · ${monthName(m)}`, `<div class="form">
    ${list.length ? `<div class="rows">${list.map(e => `
      <button class="row compact" data-act="editEntry" data-id="${e.id}">
        <span class="row-main"><b>${e.qty > 1 ? `${e.qty} × ` : ''}${esc(e.label || entryName(c, e))}</b><small>${e.label ? `${esc(entryName(c, e))} · ` : ''}${cap(fmtDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</small></span>
        <span class="amount">${money(e.qty * e.price, cur)}</span>
      </button>`).join('')}</div>
      <div class="account-total"><span>Total</span><b>${money(entryTotal(list), cur)}</b></div>` : emptyState(`Nada anotado en ${monthName(m)}.`)}
    ${list.length ? `<button type="button" class="btn ghost" data-act="copySummary" data-client="${c.id}" data-month="${m}">${icon('upload')}${canShare() ? 'Compartir' : 'Copiar'} resumen del mes</button>` : ''}
    <button type="button" class="btn ghost" data-act="newEntry" data-client="${c.id}" data-month="${m}">${icon('plus')}Anotar con otra fecha o cantidad</button>
    <div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cerrar</button></div>
  </div>`);
}
const entryName = (c, e) => product(c, e.productId)?.name || e.name;
const canShare = () => Boolean(window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.Share);

// Resumen del mes para enviar al cliente: cada entrega con su título y el total.
function monthSummaryText(c, m) {
  const cur = clientCur(c);
  const list = monthEntries(c, m).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const lines = list.map(e => `${fmtDate(e.date)} · ${entryName(c, e)}${e.label ? `: ${e.label}` : ''}${e.qty > 1 ? ` (×${e.qty})` : ''} — ${money(e.qty * e.price, cur)}`);
  return `${c.name} · ${cap(monthName(m))} ${m.slice(0, 4)}\n\n${lines.join('\n')}\n\nTotal: ${money(entryTotal(list), cur)}`;
}
async function copySummary(c, m) {
  const text = monthSummaryText(c, m);
  if (canShare()) {
    try { await window.Capacitor.Plugins.Share.share({ title: `${c.name} · ${monthName(m)}`, text }); } catch {}
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('Resumen copiado');
}

function entryForm(c, m, e = null, fromCard = false) {
  const cur = clientCur(c);
  const first = c.products.find(p => p.active) || c.products[0];
  const pid = e ? (product(c, e.productId) ? e.productId : '__other') : first ? first.id : '__other';
  const price = e ? e.price : first?.price;
  openSheet(e ? 'Editar anotación' : 'Anotar trabajo', `<form class="form">
    <label class="field"><span>Título</span><input name="label" maxlength="80" value="${esc(e?.label || '')}" placeholder="Ej. Gráfico de Messi"></label>
    <label class="field"><span>Producto</span><select name="product">${c.products.map(p => `<option value="${p.id}"${p.id === pid ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}<option value="__other"${pid === '__other' ? ' selected' : ''}>Otro trabajo</option></select></label>
    <label class="field" data-other><span>Nombre</span><input name="title" maxlength="60" value="${esc(e && pid === '__other' ? e.name : '')}" placeholder="Ej. Gráfico especial"></label>
    <div class="grid2">
      <label class="field"><span>Cantidad</span><input name="qty" type="number" min="1" step="1" inputmode="numeric" required value="${e?.qty || 1}"></label>
      ${moneyField('Precio c/u', 'price', cur, price)}
    </div>
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${e?.date || logDate(m)}"></label>
    ${e ? deleteButton('deleteEntry', e.id) : ''}
    ${formActions(e ? 'Guardar' : 'Anotar')}
  </form>`, (form, el) => {
    const sync = changed => {
      const other = el('product').value === '__other';
      form.querySelector('[data-other]').hidden = !other;
      if (changed && !other) el('price').value = product(c, el('product').value).price;
    };
    el('product').addEventListener('change', () => sync(true));
    sync(false);
    if (fromCard) el('label').focus();
    form.onsubmit = ev => {
      ev.preventDefault();
      const other = el('product').value === '__other';
      const p = other ? null : product(c, el('product').value);
      const next = {
        productId: p ? p.id : '', name: p ? p.name : el('title').value.trim(), label: el('label').value.trim(),
        qty: Math.max(1, Math.round(Number(el('qty').value) || 1)), price: round2(el('price').value), date: el('date').value,
      };
      if (!next.name) return toast('Escribe qué hiciste');
      if (!(next.price > 0)) return toast('Escribe el precio');
      if (e) Object.assign(e, next);
      else data.entries.push({ id: uid(), clientId: c.id, ...next });
      const month = monthKey(next.date);
      persist();
      render();
      if (fromCard) closeSheet();
      else entriesSheet(c, month);
      toast(e ? 'Anotación actualizada' : 'Anotado');
    };
  });
}

// ── Gastos: resumen, estadísticas y movimientos ──
// Los ajustes de saldo (kind 'adj') cambian el saldo pero nunca cuentan en gráficas, totales ni estadísticas.
const G_PREF_KEY = 'saldo-gastos-prefs';
const G_COLS = { date: 'Fecha', contact: 'Contacto', note: 'Detalle', category: 'Categoría', kind: 'Tipo', amount: 'Monto' };
const G_RANGES = { month: 'Un mes', d7: 'Últimos 7 días', d30: 'Últimos 30 días', d90: 'Últimos 90 días', year: 'Este año', all: 'Todo', custom: 'Personalizado' };
const G_TABS = { resumen: 'Resumen', stats: 'Estadísticas', movs: 'Movimientos' };
let gTab = 'resumen';
let gQTimer = 0;
const gf = {
  range: 'month', month: thisMonth(), from: '', to: '', type: 'out', category: '', q: '', adj: true, limit: 100,
  cols: ['date', 'contact', 'category', 'amount'], sort: { key: 'date', dir: 'desc' }, catSort: { key: 'total', dir: 'desc' },
};
try {
  const p = JSON.parse(localStorage.getItem(G_PREF_KEY));
  if (p) {
    if (Array.isArray(p.cols) && p.cols.length && p.cols.every(c => G_COLS[c])) gf.cols = p.cols;
    if (p.sort && G_COLS[p.sort.key]) gf.sort = { key: p.sort.key, dir: p.sort.dir === 'asc' ? 'asc' : 'desc' };
    if (p.catSort && ['name', 'n', 'total', 'avg'].includes(p.catSort.key)) gf.catSort = { key: p.catSort.key, dir: p.catSort.dir === 'asc' ? 'asc' : 'desc' };
    if (p.adj === false) gf.adj = false;
  }
} catch {}
const saveGPrefs = () => { try { localStorage.setItem(G_PREF_KEY, JSON.stringify({ cols: gf.cols, sort: gf.sort, catSort: gf.catSort, adj: gf.adj })); } catch {} };

function gRange() {
  const t = todayISO();
  switch (gf.range) {
    case 'month': return { from: gf.month + '-01', to: lastDay(gf.month) };
    case 'd7': return { from: addDays(t, -6), to: t };
    case 'd30': return { from: addDays(t, -29), to: t };
    case 'd90': return { from: addDays(t, -89), to: t };
    case 'year': return { from: t.slice(0, 4) + '-01-01', to: t.slice(0, 4) + '-12-31' };
    case 'custom': return { from: gf.from || '0000-01-01', to: gf.to || '9999-12-31' };
    default: return { from: '0000-01-01', to: '9999-12-31' };
  }
}
function gFiltered(stats) {
  const { from, to } = gRange(), q = gf.q.trim().toLowerCase();
  return data.expenses.filter(x => {
    if (x.date < from || x.date > to) return false;
    if (isAdj(x)) return !stats && gf.adj && !gf.category && !q;
    if (gf.type === 'out' && !isOut(x)) return false;
    if (gf.type === 'in' && !isIncome(x)) return false;
    if (gf.category && x.category !== gf.category) return false;
    if (q && !`${x.contact || ''} ${x.note || ''} ${x.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
const gSign = x => (isIncome(x) ? 1 : isAdj(x) ? Math.sign(x.amount) : -1);
const gSigned = x => (isAdj(x) ? Number(x.amount) || 0 : gSign(x) * (Number(x.amount) || 0));
const gMoney = x => `${gSigned(x) < 0 ? '−' : '+'}${money(Math.abs(Number(x.amount) || 0))}`;
const gSelect = (field, opts, val) => `<select data-gf="${field}">${opts.map(([v, l, ic, col]) => `<option value="${esc(v)}"${ic ? ` data-icon="${ic}" data-color="${col}"` : ''}${v === val ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

function gFilterBar() {
  const cats = [...new Set([...kindCategories('out'), ...kindCategories('in')])].map(c => { const m = catMeta(c); return [c, c, m.icon, m.color]; });
  return `<section class="card filters">
    <div class="grid2">
      <label class="field"><span>Periodo</span>${gSelect('range', Object.entries(G_RANGES), gf.range)}</label>
      <label class="field"><span>Tipo</span>${gSelect('type', [['out', 'Gastos'], ['in', 'Ingresos'], ['both', 'Gastos e ingresos']], gf.type)}</label>
    </div>
    ${gf.range === 'month' ? monthSwitch(gf.month, 'gPrevMonth', 'gNextMonth') : ''}
    ${gf.range === 'custom' ? `<div class="grid2"><label class="field"><span>Desde</span><input type="date" data-gf="from" value="${gf.from}"></label><label class="field"><span>Hasta</span><input type="date" data-gf="to" value="${gf.to}"></label></div>` : ''}
    <div class="grid2">
      <label class="field"><span>Categoría</span>${gSelect('category', [['', 'Todas'], ...cats], gf.category)}</label>
      <label class="field"><span>Buscar</span><input type="search" data-gf="q" value="${esc(gf.q)}" placeholder="Contacto o detalle" autocomplete="off"></label>
    </div>
  </section>`;
}

// Resumen del periodo, sin ajustes de saldo.
function gStats(list) {
  const out = list.filter(isOut), inn = list.filter(isIncome);
  const outT = sumAmount(out), inT = sumAmount(inn);
  const { from, to } = gRange(), dates = list.map(x => x.date).sort();
  const start = from === '0000-01-01' ? dates[0] || todayISO() : from;
  const end = minStr(to === '9999-12-31' ? todayISO() : to, todayISO());
  const days = Math.max(1, dayDiff(start, end) + 1);
  const main = gf.type === 'in' ? inn : out;
  const top = main.reduce((a, x) => (!a || x.amount > a.amount ? x : a), null);
  return { outT, inT, net: inT - outT, days, perDay: (gf.type === 'in' ? inT : outT) / days, count: list.length, top };
}

// ── Gráficas ──
const weekStart = d => addDays(d, -((parse(d).getDay() + 6) % 7));
function gBuckets(list) {
  const { from, to } = gRange(), dates = list.map(x => x.date).sort();
  const a = from === '0000-01-01' ? dates[0] || todayISO() : from;
  const b = to === '9999-12-31' ? dates[dates.length - 1] || todayISO() : to;
  const span = Math.max(1, dayDiff(a, b) + 1);
  const mode = span <= 45 ? 'day' : span <= 190 ? 'week' : 'month';
  const keyOf = d => (mode === 'day' ? d : mode === 'week' ? weekStart(d) : d.slice(0, 7));
  const keys = [];
  if (mode === 'day') for (let x = a; x <= b; x = addDays(x, 1)) keys.push(x);
  else if (mode === 'week') for (let x = weekStart(a); x <= b; x = addDays(x, 7)) keys.push(x);
  else for (let m = a.slice(0, 7); m <= b.slice(0, 7); m = shiftMonth(m, 1)) keys.push(m);
  const map = new Map(keys.map(k => [k, { key: k, in: 0, out: 0 }]));
  for (const x of list) { const bk = map.get(keyOf(x.date)); if (bk) bk[isIncome(x) ? 'in' : 'out'] += Number(x.amount) || 0; }
  const label = k => (mode === 'day' ? String(+k.slice(8)) : mode === 'week' ? fmtDate(k) : monthShort(k + '-01'));
  const title = k => (mode === 'day' ? fmtDate(k) : mode === 'week' ? `Semana del ${fmtDate(k)}` : monthLabel(k));
  return { mode, items: [...map.values()], label, title };
}
function gTimeChart(list) {
  const { mode, items, label, title } = gBuckets(list);
  const series = gf.type === 'out' ? ['out'] : gf.type === 'in' ? ['in'] : ['in', 'out'];
  const max = Math.max(1, ...items.flatMap(b => series.map(s => b[s])));
  const W = 640, H = 210, padB = 24, padT = 16, n = items.length, slot = W / n;
  const bw = Math.max(2, Math.min(26, (slot * 0.72) / series.length));
  const step = Math.ceil(n / 9);
  const col = { in: 'var(--green)', out: 'var(--red)' };
  const bars = items.map((b, i) => series.map((s, j) => {
    const h = (b[s] / max) * (H - padB - padT);
    const x = slot * i + (slot - bw * series.length) / 2 + j * bw;
    return `<rect x="${x.toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, b[s] > 0 ? 1.5 : 0).toFixed(1)}" rx="2" style="fill:${col[s]}"><title>${esc(title(b.key))}: ${money(b[s])}${series.length > 1 ? (s === 'in' ? ' (ingresos)' : ' (gastos)') : ''}</title></rect>`;
  }).join('')).join('');
  const labels = items.map((b, i) => (i % step ? '' : `<text x="${(slot * i + slot / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle" class="chart-t">${esc(label(b.key))}</text>`)).join('');
  const unit = mode === 'day' ? 'por día' : mode === 'week' ? 'por semana' : 'por mes';
  return `<section class="card">
    <div class="card-head"><h2>${gf.type === 'in' ? 'Ingresos' : gf.type === 'out' ? 'Gastos' : 'Ingresos y gastos'} ${unit}</h2>${series.length > 1 ? '<span class="legend"><i style="background:var(--green)"></i>Ingresos <i style="background:var(--red)"></i>Gastos</span>' : ''}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica ${unit}">
      <line x1="0" y1="${H - padB}" x2="${W}" y2="${H - padB}" class="chart-ax"/>
      <text x="0" y="10" class="chart-t">${esc(moneyShort(max))}</text>${bars}${labels}
    </svg>
  </section>`;
}
function gDonut(cats, total) {
  const R = 62, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = cats.map(c => {
    const len = (c.total / total) * C;
    const el = `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${catMeta(c.category).color}" stroke-width="26" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 80 80)"><title>${esc(c.category)}: ${money(c.total)}</title></circle>`;
    off += len;
    return el;
  }).join('');
  return `<svg class="donut" viewBox="0 0 160 160" role="img" aria-label="Por categoría"><circle cx="80" cy="80" r="${R}" fill="none" class="donut-bg" stroke-width="26"/>${arcs}<text x="80" y="76" text-anchor="middle" class="donut-k">Total</text><text x="80" y="96" text-anchor="middle" class="donut-v">${esc(moneyShort(total))}</text></svg>`;
}
const sortArrow = (s, key) => (s.key === key ? icon(s.dir === 'asc' ? 'chevronUp' : 'chevronDown', 'sort-ic') : '');

function gCategories(list) {
  const isIn = gf.type === 'in';
  const main = list.filter(isIn ? isIncome : isOut);
  const total = sumAmount(main);
  if (!main.length) return `<section class="card"><div class="card-head"><h2>${isIn ? 'Ingresos' : 'Gastos'} por categoría</h2></div>${emptyState('Sin movimientos en este periodo.')}</section>`;
  const map = new Map();
  for (const x of main) { const r = map.get(x.category) || { category: x.category, total: 0, n: 0 }; r.total += Number(x.amount) || 0; r.n++; map.set(x.category, r); }
  const rows = [...map.values()].map(r => ({ ...r, avg: r.total / r.n }));
  const { key, dir } = gf.catSort, k = dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => k * (key === 'name' ? a.category.localeCompare(b.category) : a[key] - b[key]));
  const th = (key2, text, cls = '') => `<th class="${cls}"><button data-act="gCatSort" data-key="${key2}">${text}${sortArrow(gf.catSort, key2)}</button></th>`;
  const byTotal = [...rows].sort((a, b) => b.total - a.total);
  return `<section class="card">
    <div class="card-head"><h2>${isIn ? 'Ingresos' : 'Gastos'} por categoría</h2></div>
    <div class="donut-wrap">${gDonut(byTotal, total)}</div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr>${th('name', 'Categoría')}${th('n', 'Mov.', 'num')}${th('total', 'Total', 'num')}${th('avg', 'Promedio', 'num')}<th class="num">%</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td><span class="cell-cat">${catBadge(r.category, true)}${esc(r.category)}</span></td><td class="num">${r.n}</td><td class="num"><b>${money(r.total)}</b></td><td class="num">${money(r.avg)}</td><td class="num">${Math.round((r.total / total) * 100)}%</td></tr>`).join('')}</tbody>
    </table></div>
  </section>`;
}
function gTopContacts(list) {
  const isIn = gf.type === 'in';
  const map = new Map();
  for (const x of list.filter(isIn ? isIncome : isOut)) {
    if (!x.contact) continue;
    const k = contactKey(x.contact), r = map.get(k) || { name: x.contact, total: 0, n: 0 };
    r.total += Number(x.amount) || 0; r.n++; map.set(k, r);
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  if (!rows.length) return '';
  return `<section class="card">
    <div class="card-head"><h2>${isIn ? 'De quién recibes más' : 'A quién le envías más'}</h2></div>
    <div class="cat-list">${rows.map((r, i) => `<div class="cat" style="--c:${COLORS[i % COLORS.length]}">
      <span class="cat-name">${avatar(r.name, COLORS[i % COLORS.length])}<b>${esc(r.name)}</b><small>${r.n} ${r.n === 1 ? 'vez' : 'veces'}</small></span>
      <span class="cat-amount">${money(r.total)}</span>
      <span class="cat-bar"><i style="width:${Math.max(3, (r.total / rows[0].total) * 100)}%"></i></span>
    </div>`).join('')}</div>
  </section>`;
}

function gViewStats() {
  const list = gFiltered(true), s = gStats(list);
  const adjNet = sumAmount(gFiltered(false).filter(isAdj));
  const both = gf.type === 'both';
  return `${gFilterBar()}
  <div class="stats">
    <div class="stat"><span>${gf.type === 'in' ? 'Ingresos' : 'Gastos'}</span><b class="${gf.type === 'in' ? 'pos' : 'neg'}">${money(gf.type === 'in' ? s.inT : s.outT)}</b></div>
    ${both ? `<div class="stat"><span>Ingresos</span><b class="pos">${money(s.inT)}</b></div><div class="stat"><span>Balance</span><b class="${s.net < 0 ? 'neg' : 'pos'}">${money(s.net)}</b></div>` : `<div class="stat"><span>Movimientos</span><b>${s.count}</b></div><div class="stat"><span>Promedio por día</span><b>${money(s.perDay)}</b></div>`}
  </div>
  ${both ? `<div class="stats two"><div class="stat"><span>Promedio de gasto por día</span><b>${money(s.outT / s.days)}</b></div><div class="stat"><span>Movimientos</span><b>${s.count}</b></div></div>` : s.top ? `<div class="stats two"><div class="stat"><span>Mayor ${gf.type === 'in' ? 'ingreso' : 'gasto'}</span><b>${money(s.top.amount)}</b></div><div class="stat"><span>${esc(s.top.contact || s.top.note || s.top.category)}</span><b>${fmtDate(s.top.date)}</b></div></div>` : ''}
  ${list.length ? gTimeChart(list) : `<section class="card">${emptyState('Sin movimientos en este periodo.')}</section>`}
  ${list.length ? gCategories(list) : ''}
  ${gTopContacts(list)}
  ${adjNet ? `<p class="muted small note">Los ajustes de saldo de este periodo (${adjNet > 0 ? '+' : '−'}${money(Math.abs(adjNet))}) no cuentan en las estadísticas.</p>` : ''}`;
}

// ── Tabla de movimientos: ordenable, con columnas a tu gusto ──
function gCompare(a, b) {
  const { key, dir } = gf.sort, k = dir === 'asc' ? 1 : -1;
  let r;
  if (key === 'date') r = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  else if (key === 'amount') r = gSigned(a) - gSigned(b);
  else if (key === 'kind') r = (isAdj(a) ? 2 : isIncome(a) ? 1 : 0) - (isAdj(b) ? 2 : isIncome(b) ? 1 : 0);
  else r = String(a[key] || '').localeCompare(String(b[key] || ''));
  return k * (r || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
const kindName = x => (isAdj(x) ? 'Ajuste' : isIncome(x) ? 'Ingreso' : 'Gasto');
function gCell(c, x) {
  switch (c) {
    case 'date': return fmtDate(x.date, x.date.slice(0, 4) === todayISO().slice(0, 4) ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
    case 'contact': return esc(x.contact || '');
    case 'note': return esc(x.note || '');
    case 'category': return isAdj(x) ? `<span class="cell-cat"><span class="cat-ic sm" style="--c:#646c66">${icon('refresh')}</span>Ajuste de saldo</span>` : `<span class="cell-cat">${catBadge(x.category, true)}${esc(x.category)}</span>`;
    case 'kind': return `<span class="tag-kind ${isAdj(x) ? 'adj' : isIncome(x) ? 'in' : 'out'}">${kindName(x)}</span>`;
    default: return `<b class="${isAdj(x) ? 'muted' : gSigned(x) < 0 ? 'neg' : 'pos'}">${gMoney(x)}</b>`;
  }
}
function gViewMovs() {
  const list = gFiltered(false).sort(gCompare);
  const real = list.filter(x => !isAdj(x)), out = sumAmount(real.filter(isOut)), inn = sumAmount(real.filter(isIncome));
  const shown = list.slice(0, gf.limit);
  return `${gFilterBar()}
  <section class="card">
    <div class="card-head"><h2>Movimientos</h2>
      <div class="btn-row tight">
        <button class="btn-sm${gf.adj ? ' primary' : ''}" data-act="gToggleAdj" aria-pressed="${gf.adj}">${icon('refresh')}Ajustes</button>
        <button class="btn-sm" data-act="gCols">${icon('list')}Columnas</button>
      </div>
    </div>
    ${list.length ? `<p class="muted small tbl-sum">${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'}${inn ? ` · ingresos <b class="pos">${money(inn)}</b>` : ''}${out ? ` · gastos <b class="neg">${money(out)}</b>` : ''}${inn && out ? ` · balance <b>${money(inn - out)}</b>` : ''}</p>
    <div class="tbl-wrap"><table class="tbl moves">
      <thead><tr>${gf.cols.map(c => `<th class="${c === 'amount' ? 'num' : ''}"><button data-act="gSort" data-key="${c}">${G_COLS[c]}${sortArrow(gf.sort, c)}</button></th>`).join('')}</tr></thead>
      <tbody>${shown.map(x => `<tr class="${isAdj(x) ? 'adj' : ''}" data-act="editExpense" data-id="${x.id}">${gf.cols.map(c => `<td class="${c === 'amount' ? 'num' : ''}">${gCell(c, x)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    ${list.length > shown.length ? `<div class="btn-row"><button class="btn ghost block" data-act="gMore">Ver más (${list.length - shown.length})</button></div>` : ''}` : emptyState('Sin movimientos con estos filtros.')}
  </section>`;
}
function gColsSheet() {
  openSheet('Columnas de la tabla', `<div class="form">
    <p class="muted">Elige qué columnas ver. Para ordenar, toca el título de una columna.</p>
    <div class="chips">${Object.entries(G_COLS).map(([k, l]) => `<button type="button" class="chip${gf.cols.includes(k) ? ' on' : ''}" data-act="gToggleCol" data-key="${k}">${gf.cols.includes(k) ? icon('check', 'chip-ic') : ''}${l}</button>`).join('')}</div>
    <div class="form-actions"><button type="button" class="btn ghost" data-act="gColsReset">Restablecer</button><button type="button" class="btn primary" data-act="closeSheet">Listo</button></div>
  </div>`);
}

// ── Resumen ──
function moveRow(x) {
  if (isAdj(x)) {
    return `<button class="row" data-act="editExpense" data-id="${x.id}">
      <span class="cat-ic" style="--c:#646c66">${icon('refresh')}</span>
      <span class="row-main"><b>Ajuste de saldo</b><small>${esc(x.note || 'No cuenta en estadísticas')} · ${fmtDate(x.date)}</small></span>
      <span class="amount muted">${gMoney(x)}</span>
    </button>`;
  }
  return `<button class="row" data-act="editExpense" data-id="${x.id}">
    ${catBadge(x.category)}
    <span class="row-main"><b>${esc(x.note || x.contact || x.category)}</b><small>${esc((x.note && x.contact ? x.contact + ' · ' : '') + x.category)} · ${fmtDate(x.date)}</small></span>
    <span class="amount ${isIncome(x) ? 'pos' : 'neg'}">${gMoney(x)}</span>
  </button>`;
}
function gViewHome() {
  const m = thisMonth(), mv = data.expenses.filter(x => monthKey(x.date) === m && !isAdj(x));
  const inT = sumAmount(mv.filter(isIncome)), outT = sumAmount(mv.filter(isOut));
  const recent = [...data.expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 6);
  return `
  <section class="card">
    <div class="forecast"><div class="fc-box">
      <p class="label">Saldo de Yape</p>
      <p class="hero-amount ${yapeBalance() < 0 ? 'neg' : ''}">${money(yapeBalance())}</p>
    </div></div>
    <div class="btn-row"><button class="btn ghost" data-act="adjustYape">${icon('edit')}Ajustar saldo</button></div>
  </section>
  <div class="btn-row">
    <button class="btn primary big" data-act="newExpense">${icon('plus')}Gasto</button>
    <button class="btn primary big" data-act="newIncome">${icon('plus')}Ingreso</button>
  </div>
  <div class="stats two">
    <div class="stat"><span>Gastos de ${monthName(m)}</span><b class="neg">${money(outT)}</b></div>
    <div class="stat"><span>Ingresos de ${monthName(m)}</span><b class="pos">${money(inT)}</b></div>
  </div>
  <section class="card">
    <div class="card-head"><h2>Últimos movimientos</h2>${data.expenses.length > 6 ? '<button class="link" data-act="gTab" data-tab="movs">Ver todos</button>' : ''}</div>
    ${recent.length ? `<div class="rows">${recent.map(moveRow).join('')}</div>` : emptyState('Aún no anotas movimientos. Empieza ajustando tu saldo de Yape.')}
  </section>
  ${contactsCard()}`;
}

function viewExpenses() {
  return `<div class="seg" role="tablist">${Object.entries(G_TABS).map(([k, l]) => `<button role="tab" aria-selected="${k === gTab}" class="${k === gTab ? 'on' : ''}" data-act="gTab" data-tab="${k}">${l}</button>`).join('')}</div>
  ${gTab === 'stats' ? gViewStats() : gTab === 'movs' ? gViewMovs() : gViewHome()}`;
}

// Ajustar el saldo no es un gasto ni un ingreso: queda anotado como ajuste y no cuenta en las estadísticas.
function adjSheet(x) {
  openSheet('Ajuste de saldo', `<div class="form">
    <p class="preview">${gMoney(x)} · ${fmtDate(x.date)}</p>
    ${x.prev != null ? `<p class="muted">El saldo pasó de ${money(x.prev)} a ${money(x.after)}.</p>` : ''}
    ${x.note ? `<p class="muted">${esc(x.note)}</p>` : ''}
    <p class="muted small">No cuenta en gráficas ni estadísticas. Si lo eliminas, tu saldo cambia en ese monto.</p>
    ${deleteButton('deleteExpense', x.id, 'Eliminar ajuste')}
  </div>`);
}

function contactsCard() {
  const list = frequentContacts().slice(0, 8);
  if (!list.length) return '';
  return `<section class="card">
    <div class="card-head"><h2>Contactos frecuentes</h2></div>
    <div class="rows">${list.map((c, i) => {
      const mv = contactMoves(c), out = sumAmount(mv.filter(isOut)), inn = sumAmount(mv.filter(isIncome));
      return `<button class="row" data-act="contact" data-id="${c.id}">
        ${avatar(c.name, COLORS[i % COLORS.length])}
        <span class="row-main"><b>${esc(c.name)}</b><small>${c.uses} ${c.uses === 1 ? 'vez' : 'veces'}${out ? ` · enviaste ${money(out)}` : ''}${inn ? ` · recibiste ${money(inn)}` : ''}</small></span>
        ${icon('chevronRight', 'row-more')}
      </button>`;
    }).join('')}</div>
  </section>`;
}
function contactSheet(c) {
  openSheet(c.name, `<div class="form">
    <p class="muted">${c.uses} ${c.uses === 1 ? 'vez' : 'veces'} en tus movimientos.</p>
    <div class="btn-row">
      <button class="btn primary" data-act="contactOut" data-id="${c.id}">${icon('plus')}Gasto</button>
      <button class="btn primary" data-act="contactIn" data-id="${c.id}">${icon('plus')}Ingreso</button>
    </div>
    ${deleteButton('deleteContact', c.id, 'Quitar de frecuentes')}
  </div>`);
}

// Escribes cuánto tienes ahora en Yape: la diferencia queda como un ajuste de saldo (no cuenta en estadísticas).
function yapeForm() {
  openSheet('Ajustar saldo de Yape', `<form class="form">
    ${moneyField('Cuánto tienes ahora en Yape', 'balance', 'PEN', yapeBalance(), 'required')}
    <label class="field"><span>Motivo</span><input name="note" maxlength="80" placeholder="Opcional. Ej. Cuadré con la app de Yape"></label>
    <p class="muted small">Se anota como ajuste de saldo: cambia tu saldo pero no cuenta como gasto ni ingreso.</p>
    ${formActions()}
  </form>`, (form, el) => {
    el('balance').focus();
    form.onsubmit = e => {
      e.preventDefault();
      if (el('balance').value === '' || !Number.isFinite(Number(el('balance').value))) return toast('Escribe tu saldo');
      const prev = yapeBalance(), after = round2(el('balance').value), diff = round2(after - prev);
      if (!diff) return toast('Ya tienes ese saldo');
      const note = el('note').value.trim() || (data.expenses.length ? '' : 'Saldo inicial');
      data.expenses.push({ id: uid(), kind: 'adj', date: todayISO(), amount: diff, currency: 'PEN', category: 'Ajuste', note, prev, after });
      closeSheet();
      commit('Saldo ajustado');
    };
  });
}

// ── Leer capturas de Yape (OCR en el dispositivo con Tesseract.js, cargado solo al usarlo) ──
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const MONTHS3 = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, set: 9, sep: 9, oct: 10, nov: 11, dic: 12 };
let tesseractLoading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  tesseractLoading ||= new Promise((ok, fail) => {
    const s = Object.assign(document.createElement('script'), { src: TESSERACT_URL, onload: ok, onerror: () => { tesseractLoading = null; fail(new Error('load')); } });
    document.head.appendChild(s);
  });
  return tesseractLoading;
}
// Saca monto, destinatario, fecha y número de operación del texto que leyó el OCR.
function parseYape(d) {
  const text = d.text || '';
  const out = { sent: /yapeaste/i.test(text), received: /te\s+yape[óo]|yape\s+recibido|recibiste/i.test(text) };
  // El "S/" suele leerse como un dígito más pequeño: se descartan los dígitos iniciales mucho más bajos que el resto.
  const word = arr(d.words).find(w => /^\D{0,2}\d[\d.,]*[.,]\d{2}$/.test(w.text));
  if (word) {
    const syms = arr(word.symbols).filter(y => /\d/.test(y.text));
    const h = y => y.bbox.y1 - y.bbox.y0, max = Math.max(...syms.map(h), 0);
    const digits = syms.length ? syms.filter((y, i) => !(i === 0 && h(y) < max * 0.8)).map(y => y.text).join('') : word.text.replace(/\D/g, '');
    const v = Number(digits) / 100; // siempre trae dos decimales
    if (v > 0) out.amount = v;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const i = lines.findIndex(l => l.includes(word.text));
    if (i >= 0 && lines[i + 1]) out.name = lines[i + 1].replace(/^[^\p{L}]+/u, '');
  }
  if (out.amount == null) { const m = text.match(/S\/\s*(\d+[.,]\d{2})/); if (m) out.amount = parseFloat(m[1].replace(',', '.')); }
  const dm = text.match(/(\d{1,2})\s+([a-záéíóú]{3,})\.?\s+(\d{4})/i);
  const mon = dm && MONTHS3[dm[2].slice(0, 3).toLowerCase()];
  if (mon) out.date = `${dm[3]}-${pad(mon)}-${pad(+dm[1])}`;
  const op = text.match(/operaci[oó]n\s*:?\s*(\d{5,})/i);
  if (op) out.op = op[1];
  return out;
}
async function readYape(file) {
  await loadTesseract();
  const { data: d } = await window.Tesseract.recognize(file, 'spa');
  return parseYape(d);
}

function expenseForm(x = null, kind0 = 'out', pre = {}) {
  const date0 = x?.date || todayISO();
  const kind1 = x ? (isIncome(x) ? 'in' : 'out') : kind0;
  const catOptions = (kind, sel) => kindCategories(kind).map(c => { const m = catMeta(c); return `<option value="${esc(c)}" data-icon="${m.icon}" data-color="${m.color}"${c === sel ? ' selected' : ''}>${esc(c)}</option>`; }).join('') + '<option value="__new">+ Nueva categoría…</option>';
  const chips = x ? [] : frequentContacts().slice(0, 8);
  openSheet(x ? 'Editar movimiento' : kind1 === 'in' ? 'Anotar ingreso' : 'Anotar gasto', `<form class="form">
    ${x ? '' : `<button type="button" class="btn ghost" data-scan>${icon('upload')}Leer captura de Yape</button><input type="file" accept="image/*" data-scan-file hidden>`}
    <label class="field"><span>Tipo</span><select name="kind"><option value="out"${kind1 === 'out' ? ' selected' : ''}>Gasto</option><option value="in"${kind1 === 'in' ? ' selected' : ''}>Ingreso</option></select></label>
    ${moneyField('Monto', 'amount', 'PEN', x?.amount)}
    <label class="field"><span>Categoría</span><select name="category">${catOptions(kind1, x?.category ?? pre.category)}</select></label>
    <div class="newcat" data-newcat hidden>
      <label class="field"><span>Nombre de la categoría</span><input name="newcat" maxlength="30" placeholder="Ej. Mascotas"></label>
      <div class="field"><span>Icono</span><div class="swatches">${CAT_ICONS.map(i => `<button type="button" class="swatch-ic" data-icon="${i}" aria-label="${i}">${icon(i)}</button>`).join('')}</div></div>
      <div class="field"><span>Color</span><div class="swatches">${CAT_COLORS.map(c => `<button type="button" class="swatch" data-color="${c}" style="--c:${c}" aria-label="Color"></button>`).join('')}</div></div>
    </div>
    <label class="field"><span>Contacto</span><input name="contact" maxlength="40" autocomplete="off" value="${esc(x?.contact ?? pre.contact ?? '')}" placeholder="Opcional. A quién o de quién">
      ${chips.length ? `<span class="chips">${chips.map(c => `<button type="button" class="chip" data-contact="${c.id}">${esc(c.name.split(' ')[0])}</button>`).join('')}</span>` : ''}
    </label>
    <label class="field"><span>Detalle</span><input name="note" maxlength="80" value="${esc(x?.note || '')}" placeholder="Opcional. Ej. Almuerzo"></label>
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${date0}"></label>
    ${x ? deleteButton('deleteExpense', x.id) : ''}
    ${formActions(x ? 'Guardar' : 'Anotar')}
  </form>`, (form, el) => {
    const fire = n => el(n).dispatchEvent(new Event('change', { bubbles: true }));
    const setCat = v => { if ([...el('category').options].some(o => o.value === v)) { el('category').value = v; fire('category'); } };
    // Al cambiar el tipo, la lista de categorías es otra.
    let listKind = kind1;
    const setKind = k => {
      if (el('kind').value !== k) { el('kind').value = k; fire('kind'); }
    };
    el('kind').addEventListener('change', () => {
      if (listKind === el('kind').value) return;
      listKind = el('kind').value;
      el('category').innerHTML = catOptions(listKind);
      fire('category');
    });
    // Categoría nueva: nombre, icono y color.
    let newIcon = 'tag', newColor = CAT_COLORS[0];
    const mark = () => {
      form.querySelectorAll('.swatch-ic').forEach(b => b.classList.toggle('on', b.dataset.icon === newIcon));
      form.querySelectorAll('.swatch').forEach(b => b.classList.toggle('on', b.dataset.color === newColor));
    };
    form.querySelector('[data-newcat]').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.icon) newIcon = b.dataset.icon;
      if (b.dataset.color) newColor = b.dataset.color;
      mark();
    });
    mark();
    el('category').addEventListener('change', () => {
      const isNew = el('category').value === '__new';
      form.querySelector('[data-newcat]').hidden = !isNew;
      if (isNew) el('newcat').focus();
    });
    // Contactos frecuentes: un toque rellena el contacto y su última categoría.
    form.querySelectorAll('[data-contact]').forEach(b => {
      b.onclick = e => {
        e.preventDefault();
        const c = data.contacts.find(y => y.id === b.dataset.contact);
        if (!c) return;
        el('contact').value = c.name;
        if (c.lastCategory && c.lastKind === el('kind').value) setCat(c.lastCategory);
        el('amount').focus();
      };
    });
    if (pre.contact && !x) {
      const c = data.contacts.find(y => contactKey(y.name) === contactKey(pre.contact));
      if (c && !pre.category && c.lastKind === kind1 && c.lastCategory) setCat(c.lastCategory);
    }
    if (!x) el('amount').focus();
    let op = x?.op || '';
    const scan = form.querySelector('[data-scan]'), pick = form.querySelector('[data-scan-file]');
    const readFile = async file => {
      scan.disabled = true;
      scan.lastChild.textContent = 'Leyendo captura…';
      try {
        const r = await readYape(file);
        if (!(r.amount > 0)) throw new Error('amount');
        const received = r.received && !r.sent;
        if (r.op && data.expenses.some(y => y.op === r.op)) toast('Ojo: ya anotaste este Yape');
        if (received) { setKind('in'); setCat('Yape recibido'); }
        el('amount').value = r.amount;
        if (r.name && !el('contact').value) {
          el('contact').value = r.name.replace(/\*+$/, '').trim();
          const c = data.contacts.find(y => contactKey(y.name) === contactKey(el('contact').value));
          if (c && !received && c.lastKind === 'out' && c.lastCategory) setCat(c.lastCategory);
        }
        if (r.date) el('date').value = r.date;
        op = r.op || '';
      } catch {
        toast('No pude leer la captura. Escribe los datos a mano.');
      }
      scan.disabled = false;
      scan.lastChild.textContent = 'Leer captura de Yape';
    };
    if (scan) {
      scan.onclick = () => pick.click();
      pick.onchange = async () => {
        const file = pick.files[0];
        if (!file) return;
        await readFile(file);
        pick.value = '';
      };
      if (pre.file) readFile(pre.file);
    }
    form.onsubmit = e => {
      e.preventDefault();
      const amount = round2(el('amount').value);
      if (!(amount > 0)) return toast('Escribe el monto');
      const kind = el('kind').value;
      let category = el('category').value;
      if (category === '__new') {
        category = el('newcat').value.trim();
        if (!category) return toast('Escribe el nombre de la categoría');
        const known = kindCategories(kind).find(c => c.toLowerCase() === category.toLowerCase());
        if (known) category = known;
        else {
          (kind === 'in' ? data.incomeCategories : data.customCategories).push(category);
          data.catStyles[category] = { icon: newIcon, color: newColor };
        }
      }
      const contact = el('contact').value.trim().replace(/\s+/g, ' ');
      const next = { kind, amount, currency: 'PEN', category, note: el('note').value.trim(), date: el('date').value, ...(contact ? { contact } : {}), ...(op ? { op } : {}) };
      if (x) { delete x.contact; Object.assign(x, next); }
      else data.expenses.push({ id: uid(), ...next });
      if (contact) {
        const c = data.contacts.find(y => contactKey(y.name) === contactKey(contact));
        if (c) { if (!x) c.uses++; c.lastKind = kind; c.lastCategory = category; }
        else data.contacts.push({ id: uid(), name: contact, uses: 1, lastKind: kind, lastCategory: category });
      }
      closeSheet();
      commit(x ? 'Movimiento actualizado' : kind === 'in' ? 'Ingreso anotado' : 'Gasto anotado');
    };
  });
}

// Retiré: indicas cuánto sacaste y escribes cuánto tienes ahora en la billetera de destino.
function withdrawalForm() {
  if (data.wallets.length < 2) return toast('Necesitas al menos dos billeteras');
  const st = planSetup();
  openSheet('Registrar retiro', `<form class="form">
    <div class="grid2">
      <label class="field"><span>Desde</span><select name="from">${walletOptions(st.from.id)}</select></label>
      <label class="field"><span>Hacia</span><select name="to">${walletOptions(st.to.id)}</select></label>
    </div>
    ${moneyField('Retiraste', 'amount', st.from.currency, st.from.balance > 0 ? st.from.balance : '', 'min="0.01" required', ' ')}
    ${moneyField('', 'toAfter', st.to.currency, '', 'required', ' ')}
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${todayISO()}"></label>
    <label class="field"><span>Nota</span><input name="note" maxlength="80" placeholder="Opcional"></label>
    <p class="preview" data-preview></p>
    ${formActions('Guardar retiro')}
  </form>`, (form, el) => {
    const pair = () => [wallet(el('from').value), wallet(el('to').value)];
    const sync = changed => {
      const [a, b] = pair();
      if (changed === 'from') el('amount').value = a.balance > 0 ? a.balance : '';
      setText(form, '[data-cur="amount"]', CURRENCIES[a.currency]);
      setText(form, '[data-cur="toAfter"]', CURRENCIES[b.currency]);
      setText(form, '[data-label="toAfter"]', `¿Cuánto tienes ahora en ${b.name}?`);
      setText(form, '[data-hint="amount"]', `Tenías ${money(a.balance, a.currency)} en ${a.name}`);
      setText(form, '[data-hint="toAfter"]', `Antes del retiro: ${money(b.balance, b.currency)}`);
      const amount = Number(el('amount').value) || 0;
      const received = el('toAfter').value === '' ? 0 : round2(Number(el('toAfter').value) - b.balance);
      const parts = [];
      if (received > 0) parts.push(`Recibiste ${money(received, b.currency)}`);
      if (received > 0 && amount > 0 && a.currency !== b.currency) parts.push(`${money(received / amount, b.currency)} por cada ${CURRENCIES[a.currency]} 1`);
      if (amount > 0) parts.push(`En ${a.name} quedan ${money(Math.max(0, a.balance - amount), a.currency)}`);
      setText(form, '[data-preview]', parts.join(' · '));
    };
    form.addEventListener('input', e => sync(e.target.name));
    sync();
    form.onsubmit = e => {
      e.preventDefault();
      const [a, b] = pair();
      if (a.id === b.id) return toast('Elige dos billeteras distintas');
      const amount = round2(el('amount').value);
      const fromBefore = a.balance, toBefore = b.balance;
      const toAfter = round2(el('toAfter').value);
      const received = round2(toAfter - toBefore);
      if (!(amount > 0)) return toast('Escribe cuánto retiraste');
      if (!(received > 0)) return toast(`El saldo de ${b.name} debería ser mayor que ${money(toBefore, b.currency)}`);
      setBalance(a, Math.max(0, fromBefore - amount));
      setBalance(b, toAfter);
      data.withdrawals.push({ id: uid(), date: el('date').value, from: a.id, to: b.id, amount, received, fromBefore, fromAfter: a.balance, toBefore, toAfter, note: el('note').value.trim() });
      closeSheet();
      commit('Retiro registrado');
    };
  });
}

// Qué incluye la previsión: billeteras, lo anotado sin cobrar y lo estimado por producto hasta la fecha.
function forecastDetail() {
  const until = horizonDate(data.horizon), f = forecast(until);
  const tomorrow = addDays(todayISO(), 1);
  const qtyText = q => (Math.abs(q - Math.round(q)) < 0.05 ? String(Math.round(q)) : q.toFixed(1).replace('.', ','));
  const pen = (n, cur) => (cur === 'PEN' ? '' : `<small>${money(toPEN(n, cur))}</small>`);
  const line = (title, sub, amount, extra = '') => `<div class="row compact"><span class="row-main"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="amount">${amount}${extra}</span></div>`;
  const section = (title, total, rows) => `<div class="group"><h3 class="group-date">${title} · ${money(total)}</h3><div class="rows">${rows || '<p class="muted small">Nada.</p>'}</div></div>`;
  const wallets = data.wallets.map(w => line(esc(w.name), '', money(w.balance, w.currency), pen(w.balance, w.currency))).join('');
  const pending = pendingCharges().map(({ c, m, due }) => line(`${esc(c.name)} · ${monthName(m)}`, esc(linesText(monthLines(c, m))), money(due, clientCur(c)), pen(due, clientCur(c)))).join('');
  const todo = data.clients.map(c => {
    const cur = clientCur(c);
    return c.products.map(p => ({ p, e: productEstimate(c, p, tomorrow, until) })).filter(x => x.e.qty > 0)
      .map(({ p, e }) => line(`≈ ${qtyText(e.qty)} × ${esc(p.name)}`, `${esc(c.name)} · ${money(p.price, cur)} c/u · ${estText(p)}`, money(e.amount, cur), pen(e.amount, cur))).join('');
  }).join('');
  openSheet(`Al ${fmtDate(until, { day: 'numeric', month: 'long', year: 'numeric' })}`, `<div class="form">
    <div class="account-total"><span>Tendrías</span><b class="pos">${money(f.total)}</b></div>
    ${section('Hoy tienes', f.now, wallets)}
    ${section('Por cobrar', f.pending, pending)}
    ${section(`Por hacer hasta el ${fmtDate(until)}`, f.future, todo)}
    ${f.costs.count ? section('Comisión de retiro', -f.costs.total, line(`${f.costs.count} × comisión fija de ${money(f.costs.fee)}`, `Según tu plan: ${STRATEGIES[data.plan.strategy].toLowerCase()}`, `−${money(f.costs.total)}`)) : ''}
    <small class="field-hint">Todo convertido a soles con el tipo de cambio de Ajustes. "Por hacer" estima según cuántas veces haces cada producto.</small>
    <div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cerrar</button></div>
  </div>`);
}

function withdrawalDetail(x) {
  const a = wallet(x.from), b = wallet(x.to);
  const aCur = a?.currency || 'USD', bCur = b?.currency || 'PEN';
  openSheet('Retiro', `<div class="form">
    <div class="stats two">
      <div class="stat"><span>Retiraste</span><b>${money(x.amount, aCur)}</b></div>
      <div class="stat"><span>Recibiste</span><b class="pos">${money(x.received, bCur)}</b></div>
    </div>
    <p class="preview">${cap(fmtDate(x.date, { weekday: 'long', day: 'numeric', month: 'long' }))} · De ${esc(a ? a.name : 'billetera eliminada')} a ${esc(b ? b.name : 'billetera eliminada')}${aCur !== bCur && x.amount > 0 ? ` · ${money(x.received / x.amount, bCur)} por cada ${CURRENCIES[aCur]} 1` : ''}${x.note ? ` · ${esc(x.note)}` : ''}</p>
    ${deleteButton('deleteWithdrawal', x.id, 'Eliminar retiro')}
    <div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cerrar</button></div>
  </div>`);
}

function updateBalancesForm() {
  openSheet('Actualizar saldos', `<form class="form">
    ${data.wallets.map(w => moneyField(esc(w.name), `w_${w.id}`, w.currency, w.balance, '', w.updated ? `Actualizado ${relDate(w.updated)}` : '')).join('')}
    ${formActions()}
  </form>`, (form, el) => {
    const first = el(`w_${data.wallets[0].id}`);
    first.focus();
    first.select();
    form.onsubmit = e => {
      e.preventDefault();
      for (const w of data.wallets) {
        const v = el(`w_${w.id}`).value;
        if (v !== '') setBalance(w, v);
      }
      closeSheet();
      commit('Saldos actualizados');
    };
  });
}

function walletForm(w = null) {
  const cur = w?.currency || 'PEN';
  const balance = moneyField(w ? '¿Cuánto tienes ahora?' : 'Saldo actual', 'balance', cur, w ? w.balance : '', '', w?.updated ? `Actualizado ${relDate(w.updated)}` : '');
  const name = `<label class="field"><span>Nombre</span><input name="title" required maxlength="30" value="${esc(w?.name || '')}" placeholder="Ej. BCP, Efectivo"></label>`;
  const currency = `<label class="field"><span>Moneda</span><select name="currency">${currencyOptions(cur)}</select></label>`;
  openSheet(w ? w.name : 'Nueva billetera', `<form class="form">
    ${w ? balance + name + currency : name + currency + balance}
    ${w && data.wallets.length > 1 ? deleteButton('deleteWallet', w.id, 'Eliminar billetera') : ''}
    ${formActions()}
  </form>`, (form, el) => {
    el('currency').addEventListener('change', () => setText(form, '[data-cur="balance"]', CURRENCIES[el('currency').value]));
    const first = w ? el('balance') : el('title');
    first.focus();
    if (w) first.select();
    form.onsubmit = e => {
      e.preventDefault();
      const name = el('title').value.trim();
      if (!name) return toast('Escribe un nombre');
      if (w) {
        Object.assign(w, { name, currency: el('currency').value });
        setBalance(w, el('balance').value);
      } else {
        data.wallets.push({ id: uid(), name, currency: el('currency').value, balance: round2(el('balance').value), color: data.wallets.length % COLORS.length, updated: todayISO() });
      }
      closeSheet();
      commit(w ? 'Saldo guardado' : 'Billetera agregada');
    };
  });
}

function clientForm(c = null) {
  const w0 = c?.wallet || (data.wallets.find(w => w.currency === 'USD') || data.wallets[0]).id;
  const cur0 = c ? clientCur(c) : 'USD';
  openSheet(c ? 'Editar cliente' : 'Nuevo cliente', `<form class="form">
    <label class="field"><span>Nombre</span><input name="title" required maxlength="60" value="${esc(c?.name || '')}" placeholder="Ej. Estudio Norte"></label>
    <div class="grid2">
      <label class="field"><span>Moneda</span><select name="currency">${CLIENT_CURRENCIES.map(k => `<option value="${k}"${k === cur0 ? ' selected' : ''}>${CURRENCY_NAMES[k]}</option>`).join('')}</select></label>
      <label class="field"><span>Lo recibes en</span><select name="wallet">${walletOptions(w0)}</select></label>
    </div>
    ${c ? '<small class="field-hint">Si cambias la moneda, los precios y lo anotado mantienen sus números.</small>' : ''}
    <label class="field"><span>Nota</span><input name="note" maxlength="80" value="${esc(c?.note || '')}" placeholder="Opcional"></label>
    ${c ? deleteButton('deleteClient', c.id) : ''}
    ${formActions(c ? 'Guardar' : 'Siguiente')}
  </form>`, (form, el) => {
    if (!c) el('title').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const next = { name: el('title').value.trim(), currency: el('currency').value, wallet: el('wallet').value, note: el('note').value.trim() };
      if (!next.name) return toast('Escribe el nombre del cliente');
      if (c) {
        Object.assign(c, next);
        closeSheet();
        commit('Cliente actualizado');
        return;
      }
      const nc = { id: uid(), ...next, products: [] };
      data.clients.push(nc);
      persist();
      render();
      productForm(nc); // seguimos con lo que le haces
    };
  });
}

function productForm(c, p = null) {
  const cur = clientCur(c);
  openSheet(p ? 'Editar producto' : `¿Qué le haces a ${c.name}?`, `<form class="form">
    <label class="field"><span>Producto</span><input name="title" required maxlength="60" value="${esc(p?.name || '')}" placeholder="Ej. Gráfico para redes"></label>
    ${moneyField('Precio por unidad', 'price', cur, p?.price)}
    <div class="field">
      <span>¿Cuántas veces lo haces?</span>
      <div class="grid2">
        <input name="estCount" type="number" min="0" step="0.5" inputmode="decimal" value="${p ? p.estCount : 1}" aria-label="Cuántas veces">
        <select name="estPer" aria-label="Por semana o al mes">${Object.entries(EST_PER).map(([k, l]) => `<option value="${k}"${(p?.estPer || 'week') === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <small class="field-hint">Solo para estimar lo que falta del mes. Pon 0 si es a pedido.</small>
    </div>
    <label class="field"><span>Notas generales</span><textarea name="notes" rows="3" maxlength="4000" placeholder="Medidas, formato, lo que pide el cliente…">${esc(p?.notes || '')}</textarea><small class="field-hint">No cambian cada mes. Para cada entrega, ponle título en la tarjeta del cliente.</small></label>
    ${p ? `<label class="switch"><span>Activo</span><input type="checkbox" name="active"${p.active ? ' checked' : ''}></label>` : ''}
    ${p ? deleteButton('deleteProduct', p.id, 'Eliminar', ` data-client="${c.id}"`) : ''}
    ${formActions(p ? 'Guardar' : 'Agregar')}
  </form>`, (form, el) => {
    if (!p) el('title').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const next = {
        name: el('title').value.trim(), price: round2(el('price').value),
        estCount: Math.max(0, Number(el('estCount').value) || 0), estPer: el('estPer').value,
        notes: el('notes').value.trim(), active: p ? el('active').checked : true,
      };
      if (!next.name) return toast('Escribe el nombre del producto');
      if (!(next.price > 0)) return toast('Escribe el precio');
      if (p) Object.assign(p, next);
      else c.products.push({ id: uid(), ...next });
      closeSheet();
      commit(p ? 'Producto actualizado' : 'Producto agregado');
    };
  });
}

// ── Acciones ──
function findEntry(id) { return data.entries.find(e => e.id === id); }
const actions = {
  closeSheet,
  log: d => {
    const c = client(d.client), p = product(c, d.id);
    if (!p) return;
    data.entries.push({ id: uid(), clientId: c.id, productId: p.id, name: p.name, price: p.price, qty: 1, date: logDate(d.month) });
    commit(`${p.name}: ${productCount(c, p, d.month)} en ${monthName(d.month)}`);
  },
  unlog: d => {
    const c = client(d.client), p = product(c, d.id);
    if (!p) return;
    const list = monthEntries(c, d.month).filter(e => e.productId === p.id);
    const last = list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
    if (!last) return;
    if (last.qty > 1) last.qty -= 1;
    else data.entries = data.entries.filter(e => e !== last);
    commit(`${p.name}: ${productCount(c, p, d.month)} en ${monthName(d.month)}`);
  },
  entries: d => { const c = client(d.client); if (c) entriesSheet(c, d.month); },
  copySummary: d => { const c = client(d.client); if (c) copySummary(c, d.month); },
  newEntry: d => { const c = client(d.client); if (c) entryForm(c, d.month); },
  editEntry: d => {
    const e = findEntry(d.id), c = e && client(e.clientId);
    if (c) entryForm(c, monthKey(e.date), e, d.from === 'card');
  },
  deleteEntry: d => {
    const e = findEntry(d.id), c = e && client(e.clientId);
    if (!e || !confirm('¿Eliminar esta anotación?')) return;
    data.entries = data.entries.filter(x => x !== e);
    persist();
    render();
    entriesSheet(c, monthKey(e.date));
    toast('Anotación eliminada');
  },
  charge: d => { const c = client(d.id); if (c) chargeForm(c, d.month); },
  editPayment: d => {
    const p = data.payments.find(x => x.id === d.id);
    const c = p && client(p.clientId);
    if (c) chargeForm(c, p.month, p);
  },
  deletePayment: d => {
    const p = data.payments.find(x => x.id === d.id);
    if (!p || !confirm('¿Deshacer este cobro? Lo anotado se mantiene.')) return;
    const w = wallet(p.wallet);
    // Si el saldo no se ha tocado desde el cobro, vuelve al valor anterior.
    if (w && p.balanceBefore != null && w.balance === p.balanceAfter) setBalance(w, p.balanceBefore);
    data.payments = data.payments.filter(x => x !== p);
    closeSheet();
    commit('Cobro deshecho');
  },
  newExpense: () => expenseForm(null, 'out'),
  newIncome: () => expenseForm(null, 'in'),
  adjustYape: () => yapeForm(),
  contact: d => { const c = data.contacts.find(y => y.id === d.id); if (c) contactSheet(c); },
  contactOut: d => { const c = data.contacts.find(y => y.id === d.id); if (c) expenseForm(null, 'out', { contact: c.name }); },
  contactIn: d => { const c = data.contacts.find(y => y.id === d.id); if (c) expenseForm(null, 'in', { contact: c.name }); },
  deleteContact: d => {
    const c = data.contacts.find(y => y.id === d.id);
    if (!c || !confirm(`¿Quitar a ${c.name} de tus contactos frecuentes? Sus movimientos se quedan.`)) return;
    data.contacts = data.contacts.filter(y => y !== c);
    closeSheet();
    commit('Contacto quitado');
  },
  gTab: d => { gTab = d.tab in G_TABS ? d.tab : 'resumen'; gf.limit = 100; render(); window.scrollTo(0, 0); },
  gPrevMonth: () => { gf.month = shiftMonth(gf.month, -1); render(); },
  gNextMonth: () => { gf.month = shiftMonth(gf.month, 1); render(); },
  gSort: d => { gf.sort = { key: d.key, dir: gf.sort.key === d.key && gf.sort.dir === 'desc' ? 'asc' : 'desc' }; saveGPrefs(); render(); },
  gCatSort: d => { gf.catSort = { key: d.key, dir: gf.catSort.key === d.key && gf.catSort.dir === 'desc' ? 'asc' : 'desc' }; saveGPrefs(); render(); },
  gMore: () => { gf.limit += 100; render(); },
  gToggleAdj: () => { gf.adj = !gf.adj; saveGPrefs(); render(); },
  gCols: () => gColsSheet(),
  gToggleCol: d => {
    const on = gf.cols.includes(d.key);
    if (on && gf.cols.length === 1) return toast('Deja al menos una columna');
    gf.cols = Object.keys(G_COLS).filter(k => (k === d.key ? !on : gf.cols.includes(k)));
    if (!G_COLS[gf.sort.key] || !gf.cols.includes(gf.sort.key)) gf.sort = { key: gf.cols[0], dir: 'desc' };
    saveGPrefs();
    render();
    gColsSheet();
  },
  gColsReset: () => { gf.cols = ['date', 'contact', 'category', 'amount']; gf.sort = { key: 'date', dir: 'desc' }; saveGPrefs(); render(); gColsSheet(); },
  editExpense: d => { const x = data.expenses.find(y => y.id === d.id); if (x) (isAdj(x) ? adjSheet(x) : expenseForm(x)); },
  deleteExpense: d => {
    const x = data.expenses.find(y => y.id === d.id);
    if (!x || !confirm('¿Eliminar este movimiento?')) return;
    data.expenses = data.expenses.filter(y => y !== x);
    closeSheet();
    commit('Movimiento eliminado');
  },
  newWithdrawal: () => withdrawalForm(),
  viewWithdrawal: d => { const x = data.withdrawals.find(y => y.id === d.id); if (x) withdrawalDetail(x); },
  deleteWithdrawal: d => {
    const x = data.withdrawals.find(y => y.id === d.id);
    if (!x || !confirm('¿Eliminar este retiro?')) return;
    const a = wallet(x.from), b = wallet(x.to);
    // Si los saldos siguen como quedaron tras el retiro, se restauran.
    if (a && b && x.fromBefore != null && a.balance === x.fromAfter && b.balance === x.toAfter) {
      setBalance(a, x.fromBefore);
      setBalance(b, x.toBefore);
    }
    data.withdrawals = data.withdrawals.filter(y => y !== x);
    closeSheet();
    commit('Retiro eliminado');
  },
  updateBalances: () => updateBalancesForm(),
  newWallet: () => walletForm(),
  editWallet: d => { const w = wallet(d.id); if (w) walletForm(w); },
  deleteWallet: d => {
    const w = wallet(d.id);
    if (!w || data.wallets.length < 2 || !confirm(`¿Eliminar la billetera ${w.name}?`)) return;
    data.wallets = data.wallets.filter(x => x !== w);
    for (const c of data.clients) if (c.wallet === w.id) c.wallet = data.wallets[0].id;
    closeSheet();
    commit('Billetera eliminada');
  },
  newClient: () => clientForm(),
  editClient: d => { const c = client(d.id); if (c) clientForm(c); },
  toggleClient: d => { toggleCollapsed(d.id); render(); },
  toggleProduct: d => { toggleCollapsed(`p:${d.id}`); render(); },
  forecastDetail: () => forecastDetail(),
  deleteClient: d => {
    const c = client(d.id);
    if (!c || !confirm(`¿Eliminar a ${c.name} junto con lo anotado y sus cobros?`)) return;
    data.clients = data.clients.filter(x => x !== c);
    data.entries = data.entries.filter(e => e.clientId !== c.id);
    data.payments = data.payments.filter(p => p.clientId !== c.id);
    closeSheet();
    commit('Cliente eliminado');
  },
  newProduct: d => { const c = client(d.client); if (c) productForm(c); },
  editProduct: d => { const c = client(d.client), p = product(c, d.id); if (p) productForm(c, p); },
  deleteProduct: d => {
    const c = client(d.client), p = product(c, d.id);
    if (!p || !confirm(`¿Eliminar "${p.name}"? Lo ya anotado se conserva.`)) return;
    c.products = c.products.filter(x => x !== p);
    closeSheet();
    commit('Producto eliminado');
  },
  prevMonth: () => { viewMonth = shiftMonth(viewMonth, -1); render(); },
  nextMonth: () => { viewMonth = shiftMonth(viewMonth, 1); render(); },
  fetchRates,
  toggleGoogle,
  exportData,
  importData: () => $('importFile').click(),
  resetData: () => {
    if (!confirm('¿Borrar todos tus datos de este dispositivo? No se puede deshacer.')) return;
    data = blank();
    commit('Datos borrados');
  },
};

// El planificador se recalcula al escribir, sin redibujar el formulario.
function onPlanInput(e) {
  const form = e.target.form;
  if (!form || form.id !== 'planForm') return;
  const el = n => form.elements[n];
  const p = data.plan;
  p.strategy = el('strategy').value;
  p.threshold = Number(el('threshold').value) || 0;
  p.rate = Number(el('rate').value) || 0;
  p.fee = Number(el('fee').value) || 0;
  form.querySelector('[data-threshold]').hidden = p.strategy !== 'threshold';
  if (e.target.name === 'from' || e.target.name === 'to') {
    p.from = el('from').value;
    p.to = el('to').value;
    p.rate = 0; // el tipo de cambio depende del par de billeteras
    persist();
    render();
    return;
  }
  $('planResult').innerHTML = planResult();
  if (e.type === 'change') persist();
}

async function fetchRates() {
  toast('Consultando el tipo de cambio…');
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const j = await r.json();
    const pen = Number(j?.rates?.PEN);
    if (!r.ok || !pen) throw new Error('rates');
    data.rates = { USD: roundTo(pen, 3), EUR: roundTo(pen / j.rates.EUR, 3), GBP: roundTo(pen / j.rates.GBP, 3) };
    data.ratesDate = todayISO();
    commit('Tipo de cambio actualizado');
  } catch {
    toast('No se pudo obtener el tipo de cambio. Escríbelo a mano.');
  }
}

async function exportData() {
  const name = `saldo-respaldo-${todayISO()}.json`;
  const json = JSON.stringify(data, null, 2);
  // Dentro de la app de Android no hay descargas: se guarda el archivo y se abre el menú de compartir.
  const native = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins;
  if (native?.Filesystem && native?.Share) {
    try {
      const file = await native.Filesystem.writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      await native.Share.share({ title: 'Respaldo de Saldo', files: [file.uri], dialogTitle: 'Guardar respaldo' });
    } catch (e) {
      if (!/cancel/i.test(e?.message || '')) toast('No se pudo compartir el respaldo');
    }
    return;
  }
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Respaldo descargado');
}
function importFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      if (!raw || (!raw.wallets && !raw.clients)) throw new Error('formato');
      if (!confirm('¿Reemplazar tus datos actuales por los del respaldo?')) return;
      data = migrate(raw);
      commit('Respaldo importado');
    } catch {
      toast('Ese archivo no parece un respaldo de Saldo');
    }
  };
  reader.readAsText(file);
}

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Cuenta de Google + guardado en tu Google Drive (carpeta oculta de la app) ──
let gToken = null, gExpires = 0, gTokenClient = null, gFileId = null, driveTimer = null, driveNeedsSave = false;
let syncState = 'local';
const SYNC_TEXT = { local: 'En este dispositivo', on: 'Sincronizado', saving: 'Guardando…', error: 'Sin sincronizar' };

function setSync(s) { syncState = s; renderSync(); }
function renderSync() {
  const chip = $('syncChip');
  chip.hidden = !GOOGLE_ENABLED;
  chip.className = `sync-chip ${syncState}`;
  chip.innerHTML = `${icon(syncState === 'local' ? 'phone' : 'cloud')}<span>${SYNC_TEXT[syncState]}</span>`;
}
function driveAuthed() { return Boolean(gToken) && Date.now() < gExpires; }
async function driveFetch(url, opts = {}) {
  if (!driveAuthed()) throw new Error('auth');
  const r = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${gToken}`, ...(opts.headers || {}) } });
  if (r.status === 401) { gToken = null; throw new Error('auth'); }
  if (!r.ok) throw new Error('drive ' + r.status);
  return r;
}
async function findDriveFile() {
  const q = encodeURIComponent(`name='${DRIVE_FILE}'`);
  const r = await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=${q}`);
  const { files } = await r.json();
  return files?.[0]?.id || null;
}
async function pushDrive() {
  if (!driveAuthed()) return;
  setSync('saving');
  const boundary = 'saldo' + Date.now();
  const meta = gFileId ? { name: DRIVE_FILE } : { name: DRIVE_FILE, parents: ['appDataFolder'] };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data)}\r\n--${boundary}--`;
  const url = gFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${gFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const r = await driveFetch(url, { method: gFileId ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  gFileId = (await r.json()).id;
  setSync('on');
}
async function loadDrive() {
  try {
    gFileId = await findDriveFile();
    if (!gFileId) { await pushDrive(); toast('Tus datos se guardaron en Google Drive'); return; }
    const r = await driveFetch(`https://www.googleapis.com/drive/v3/files/${gFileId}?alt=media`);
    const remote = migrate(JSON.parse(await r.text()));
    if ((data.updatedAt || 0) > (remote.updatedAt || 0)) {
      await pushDrive();
    } else {
      data = remote;
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
      render();
      toast('Datos cargados desde Google Drive');
    }
    setSync('on');
  } catch (e) {
    if (e.message === 'auth') return driveExpired();
    setSync('error');
    toast('No se pudieron cargar tus datos de Drive');
  }
}
function driveExpired() {
  localStorage.removeItem(DRIVE_CONNECTED);
  setSync('local');
  render();
  toast('Vuelve a entrar con Google para seguir sincronizando');
}
function onDriveToken(r) {
  if (r.error) { toast('No se pudo iniciar sesión con Google'); return; }
  gToken = r.access_token;
  gExpires = Date.now() + (Number(r.expires_in) - 60) * 1000;
  localStorage.setItem(DRIVE_CONNECTED, '1');
  setSync('on');
  render();
  if (driveNeedsSave) { driveNeedsSave = false; pushDrive().catch(() => setSync('error')); }
  else loadDrive();
}
function queueCloudSave() {
  if (!GOOGLE_ENABLED) return;
  if (!driveAuthed()) {
    // El token dura ~1 h: si expiró, pedimos uno nuevo sin ventana y guardamos después
    if (gTokenClient && localStorage.getItem(DRIVE_CONNECTED)) { driveNeedsSave = true; gTokenClient.requestAccessToken({ prompt: '' }); }
    return;
  }
  clearTimeout(driveTimer);
  driveTimer = setTimeout(() => pushDrive().catch(e => { if (e.message === 'auth') driveExpired(); else setSync('error'); }), 800);
}
function toggleGoogle() {
  if (!gTokenClient) return;
  if (driveAuthed()) {
    if (!confirm('¿Desconectar Google? Tus datos seguirán en este dispositivo y en tu Drive.')) return;
    google.accounts.oauth2.revoke(gToken, () => {});
    gToken = null;
    gFileId = null;
    localStorage.removeItem(DRIVE_CONNECTED);
    setSync('local');
    render();
    toast('Cuenta desconectada');
    return;
  }
  gTokenClient.requestAccessToken({ prompt: '' });
}
function initDrive() {
  if (!GOOGLE_ENABLED) { localStorage.removeItem(DRIVE_CONNECTED); return; }
  if (!window.google?.accounts?.oauth2) return;
  gTokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.appdata', callback: onDriveToken });
  if (currentView() === 'ajustes') render();
  if (localStorage.getItem(DRIVE_CONNECTED)) { try { gTokenClient.requestAccessToken({ prompt: '' }); } catch {} }
}

// ── Inicio ──
$('sheetClose').innerHTML = icon('x');
$('sheetClose').onclick = closeSheet;
$('syncChip').onclick = () => { location.hash = '#ajustes'; };
$('sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
$('importFile').onchange = e => { importFile(e.target.files?.[0]); e.target.value = ''; };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || !actions[el.dataset.act]) return;
  e.preventDefault();
  actions[el.dataset.act](el.dataset, el);
});
document.addEventListener('change', e => {
  const f = e.target.dataset && e.target.dataset.gf;
  if (!f || f === 'q') return;
  gf[f] = e.target.value;
  gf.limit = 100;
  render();
});
document.addEventListener('input', e => {
  if (!e.target.dataset || e.target.dataset.gf !== 'q') return;
  gf.q = e.target.value;
  clearTimeout(gQTimer);
  gQTimer = setTimeout(() => {
    render();
    const i = document.querySelector('[data-gf="q"]');
    if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }, 250);
});
document.addEventListener('input', onPlanInput);
document.addEventListener('change', onPlanInput);
document.addEventListener('change', e => {
  if (e.target.id === 'horizonDate' && e.target.value > todayISO()) {
    data.horizon = e.target.value;
    persist();
    render();
  }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'planForm') { e.preventDefault(); return; }
  if (e.target.id !== 'ratesForm') return;
  e.preventDefault();
  const f = new FormData(e.target);
  for (const c of ['USD', 'EUR', 'GBP']) data.rates[c] = Number(f.get(c)) || data.rates[c];
  data.ratesDate = todayISO();
  commit('Tipo de cambio guardado');
});
window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });
window.addEventListener('load', initDrive);

// Imagen compartida desde otra app (por ejemplo el botón Compartir de Yape). Solo la app de Android la entrega.
async function checkShared() {
  let dataUrl = '';
  try { dataUrl = (window.SaldoShare && window.SaldoShare.take()) || ''; } catch {}
  if (!dataUrl) return;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'captura', { type: blob.type || 'image/png' });
    if (currentView() !== 'gastos') {
      location.hash = '#gastos';
      await new Promise(r => setTimeout(r, 120)); // el cambio de pantalla cierra las hojas abiertas
    }
    expenseForm(null, 'out', { file });
  } catch {
    toast('No pude abrir la captura compartida');
  }
}
window.saldoCheckShare = checkShared;
window.addEventListener('load', checkShared);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkShared(); });
render();

// La app de Android se queda abierta en segundo plano y guarda la página en caché:
// al abrir o volver a la app se revisa si hay una versión nueva y se recarga.
async function checkForUpdate() {
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    const v = Number((await r.json()).v);
    if (!(v > APP_VERSION)) return;
    const flag = `saldo-reload-${v}`;
    if (sessionStorage.getItem(flag)) return; // evita recargar en bucle si algo sigue en caché
    sessionStorage.setItem(flag, '1');
    location.replace(`${location.pathname}?v=${v}${location.hash}`);
  } catch {}
}
checkForUpdate();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
