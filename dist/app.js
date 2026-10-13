'use strict';

// ── Configuración ──
const KEY = 'saldo-v2';
const OLD_KEY = 'saldo-freelance-v1';
// ID de cliente OAuth (público). Se usa para guardar tus datos en tu Google Drive (carpeta oculta de la app).
const GOOGLE_CLIENT_ID = '1057047663238-a3prjms222f111drrcse66qtrpu400sv.apps.googleusercontent.com';
const DRIVE_FILE = 'saldo-datos.json';
const DRIVE_CONNECTED = 'saldo-drive-connected';

const CURRENCIES = { PEN: 'S/', USD: '$', EUR: '€', GBP: '£' };
const CURRENCY_NAMES = { PEN: 'Soles (PEN)', USD: 'Dólares (USD)', EUR: 'Euros (EUR)', GBP: 'Libras (GBP)' };
const COLORS = ['#2f7a59', '#7b3fa0', '#2563a8', '#b26a2c', '#3f7f88', '#a8445a'];
const OTHERS = 'Otros cobros';
const STRATEGIES = {
  monthly: 'Cada mes',
  every2: 'Cada 2 meses',
  every3: 'Cada 3 meses',
  threshold: 'Al juntar',
  end: 'Todo al final',
};
const PLAN_MONTHS = 12;

// ── Iconos (SVG, nunca caracteres) ──
const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  upload: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  download: '<path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
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

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => new Date(s + 'T12:00:00');
const todayISO = () => iso(new Date());
const thisMonth = () => todayISO().slice(0, 7);
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
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
    version: 3,
    updatedAt: 0,
    rates: { USD: 3.72, EUR: 4.05, GBP: 4.72 },
    ratesDate: '',
    wallets: [
      { id: 'account', name: 'Cuenta', currency: 'PEN', balance: 0, color: 0, updated: '' },
      { id: 'yape', name: 'Yape', currency: 'PEN', balance: 0, color: 1, updated: '' },
      { id: 'paypal', name: 'PayPal', currency: 'USD', balance: 0, color: 2, updated: '' },
    ],
    clients: [], // { id, name, note, wallet, since, services: [{ id, name, amount, frequency, start, end, active }] }
    payments: [], // { id, clientId, month, amount, currency, wallet, date, balanceBefore, balanceAfter }
    withdrawals: [], // { id, date, from, to, amount, received, fromBefore, fromAfter, toBefore, toAfter, note }
    plan: { strategy: 'monthly', threshold: 200, rate: 0, fee: 0, from: '', to: '' },
  };
}

function copyRates(d, raw) {
  if (raw.rates) for (const c of ['USD', 'EUR', 'GBP']) if (Number(raw.rates[c]) > 0) d.rates[c] = Number(raw.rates[c]);
  if (raw.ratesDate) d.ratesDate = raw.ratesDate;
}

// Herramientas compartidas por las migraciones de versiones anteriores.
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
// Los ingresos sueltos de versiones anteriores no se convierten en meses cobrados:
// eran pagos por semana o por evento, y los saldos ya los incluyen.

// Versión 1: billeteras fijas y clientes con productos (rango de unidades).
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
      id: p.id || uid(), name: String(p.name || 'Cobro'),
      amount: round2(k.conv(price * (low + high) / 2, p.currency || cur, cur)),
      frequency, start, end: frequency === 'monthly' && months > 0 ? addDays(addMonthsClamped(start, months), -1) : '', active: true,
    };
  };
  const mkClient = (id, name, note, products) => {
    const wid = k.walletByCur(CURRENCIES[products[0]?.currency] ? products[0].currency : 'USD');
    return { id: id || uid(), name, note, wallet: wid, since: thisMonth(), services: products.map(p => service(p, k.walletCur(wid))) };
  };
  d.clients = arr(raw.clients).map(c => mkClient(c.id, String(c.name || 'Cliente'), String(c.description || ''), arr(c.products)));
  if (arr(raw.products).length) d.clients.push(mkClient('', OTHERS, '', raw.products));
  return d;
}

// Versión 2: cobros fijos sueltos y movimientos; las transferencias pasan a ser retiros.
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
    return { id: id || uid(), name, note, wallet: wid, since: thisMonth(), services: list.map(r => toService(r, k.walletCur(wid))) };
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

function normalize(raw) {
  const d = blank();
  copyRates(d, raw);
  return {
    ...d,
    updatedAt: Number(raw.updatedAt) || 0,
    ratesDate: d.ratesDate,
    wallets: arr(raw.wallets).length ? raw.wallets.map(w => ({ color: 0, updated: '', ...w, balance: round2(w.balance) })) : d.wallets,
    clients: arr(raw.clients).map(c => ({ note: '', since: '', ...c, services: arr(c.services).map(s => ({ end: '', active: true, ...s })) })),
    payments: arr(raw.payments),
    withdrawals: arr(raw.withdrawals),
    plan: { ...d.plan, ...(raw.plan || {}) },
  };
}

// Convierte cualquier versión guardada al formato actual.
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return blank();
  if (raw.version === 3) return normalize(raw);
  return raw.version === 2 ? fromV2(raw) : fromV1(raw);
}

function load() {
  for (const k of [KEY, OLD_KEY]) {
    try { const raw = JSON.parse(localStorage.getItem(k)); if (raw) return migrate(raw); } catch {}
  }
  return blank();
}

let data = load();
let chargeMonth = thisMonth();

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
const toPEN = (n, cur) => (Number(n) || 0) * (cur === 'PEN' ? 1 : Number(data.rates[cur]) || 0);
const convert = (n, from, to) => (from === to ? Number(n) || 0 : toPEN(n, from) / (to === 'PEN' ? 1 : Number(data.rates[to]) || 1));
const walletColor = w => COLORS[(w?.color ?? 0) % COLORS.length];
const clientColor = c => COLORS[Math.max(0, data.clients.indexOf(c)) % COLORS.length];
const clientCur = c => wallet(c.wallet)?.currency || 'USD';
const initial = s => esc(String(s || '?').trim().charAt(0).toUpperCase() || '?');
function setBalance(w, value) {
  w.balance = round2(value);
  w.updated = todayISO();
}

// ── Cobros por mes ──
// Cuántas veces se cobra un servicio dentro de un mes.
function chargeCount(s, m) {
  if (!s.active || !s.start) return 0;
  const first = m + '-01', last = lastDay(m);
  if (s.frequency === 'once') return s.start >= first && s.start <= last ? 1 : 0;
  if (s.frequency === 'monthly') return monthKey(s.start) <= m && (!s.end || monthKey(s.end) >= m) ? 1 : 0;
  const from = maxStr(first, s.start), to = s.end && s.end < last ? s.end : last;
  if (from > to) return 0;
  let d = s.start, n = 0;
  if (d < from) d = addDays(d, Math.ceil(Math.round((parse(from) - parse(d)) / 864e5) / 7) * 7);
  for (; d <= to; d = addDays(d, 7)) n++;
  return n;
}
const clientLines = (c, m) => c.services.map(s => ({ s, n: chargeCount(s, m) })).filter(x => x.n > 0);
const clientDue = (c, m) => round2(clientLines(c, m).reduce((t, x) => t + x.n * x.s.amount, 0));
const paymentOf = (cId, m) => data.payments.find(p => p.clientId === cId && p.month === m);
const linesText = lines => lines.map(x => `${x.n > 1 ? `${x.n} × ` : ''}${x.s.name}`).join(', ');

// Primer mes que puede quedar pendiente: desde que existe el cliente o su primer cobro, máximo un año atrás.
function pendingFloor(c) {
  const now = thisMonth();
  const starts = c.services.map(s => monthKey(s.start)).filter(Boolean).sort();
  return maxStr(c.since || starts[0] || now, shiftMonth(now, -12));
}
function pendingCharges() {
  const now = thisMonth(), out = [];
  for (const c of data.clients) {
    for (let m = pendingFloor(c); m <= now; m = shiftMonth(m, 1)) {
      const due = clientDue(c, m);
      if (due > 0 && !paymentOf(c.id, m)) out.push({ c, m, due });
    }
  }
  return out.sort((a, b) => (a.m < b.m ? -1 : a.m > b.m ? 1 : 0));
}
function monthTotals(m) {
  const expected = data.clients.reduce((t, c) => t + toPEN(clientDue(c, m), clientCur(c)), 0);
  const collected = data.payments.filter(p => p.month === m).reduce((t, p) => t + toPEN(p.amount, p.currency), 0);
  return { expected, collected };
}
function freqText(s) {
  let t;
  if (s.frequency === 'weekly') t = `Cada ${fmtDate(s.start, { weekday: 'long' })}`;
  else if (s.frequency === 'monthly') t = 'Cada mes';
  else t = `Una vez, en ${monthName(monthKey(s.start))}`;
  if (s.frequency !== 'once' && monthKey(s.start) > thisMonth()) t += `, desde ${monthName(monthKey(s.start))}`;
  if (s.end && s.frequency !== 'once') t += `, hasta ${fmtDate(s.end, { month: 'short', year: 'numeric' })}`;
  return t;
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
  const autoRate = last ? last.received / last.amount : convert(1, from.currency, to.currency);
  return {
    from, to, autoRate, fromLast: Boolean(last),
    rate: Number(p.rate) > 0 ? Number(p.rate) : autoRate,
    fee: Number(p.fee) || 0,
    threshold: Number(p.threshold) || 0,
  };
}
// Lo que entra a una billetera en un mes según tus clientes (en el mes actual, solo lo que falta cobrar).
function incomeInto(w, m, onlyUnpaid) {
  return data.clients
    .filter(c => c.wallet === w.id && !(onlyUnpaid && paymentOf(c.id, m)))
    .reduce((t, c) => t + clientDue(c, m), 0);
}
function simulate(strategy, st) {
  const now = thisMonth();
  let bal = st.from.balance, received = 0, fees = 0, count = 0;
  const rows = [];
  for (let i = 0; i < PLAN_MONTHS; i++) {
    const m = shiftMonth(now, i);
    const inc = incomeInto(st.from, m, i === 0);
    bal += inc;
    const go = i === PLAN_MONTHS - 1
      || strategy === 'monthly'
      || (strategy === 'every2' && i % 2 === 1)
      || (strategy === 'every3' && i % 3 === 2)
      || (strategy === 'threshold' && st.threshold > 0 && bal >= st.threshold);
    let out = 0, got = 0;
    if (go && bal > st.fee) {
      out = bal;
      got = (bal - st.fee) * st.rate;
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
  cobros: { label: 'Cobros', icon: 'receipt', render: viewCharges },
  retiros: { label: 'Retiros', icon: 'banknote', render: viewWithdrawals },
  clientes: { label: 'Clientes', icon: 'users', render: viewClients },
  ajustes: { label: 'Ajustes', icon: 'settings', render: viewSettings },
};
const currentView = () => (VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio');

function render() {
  const name = currentView();
  $('nav').innerHTML = Object.entries(VIEWS).map(([k, v]) =>
    `<a class="nav-item${k === name ? ' active' : ''}" href="#${k}"${k === name ? ' aria-current="page"' : ''}>${icon(v.icon)}<span>${v.label}</span></a>`).join('');
  $('pageTitle').textContent = VIEWS[name].label;
  $('view').innerHTML = VIEWS[name].render();
  renderSync();
}

const emptyState = (text, action = '') => `<div class="empty"><p>${text}</p>${action}</div>`;
const avatar = (text, color) => `<span class="avatar" style="--c:${color}">${initial(text)}</span>`;
const newClientButton = () => `<button class="btn primary" data-act="newClient">${icon('plus')}Nuevo cliente</button>`;
function progress({ expected, collected }) {
  const pct = expected > 0 ? Math.min(100, (collected / expected) * 100) : collected > 0 ? 100 : 0;
  return `<div class="progress"><span style="width:${pct}%"></span></div>
    <div class="progress-legend"><span>Cobrado <b>${money(collected)}</b></span><span>Esperado <b>${money(expected)}</b></span></div>`;
}

function viewHome() {
  const now = thisMonth();
  const total = data.wallets.reduce((s, w) => s + toPEN(w.balance, w.currency), 0);
  const foreign = [...new Set(data.wallets.map(w => w.currency))].filter(c => c !== 'PEN');
  const rateNote = foreign.length ? foreign.map(c => `1 ${c} = ${money(data.rates[c])}`).join(' · ') : 'Todo en soles';
  const pend = pendingCharges();
  return `
  <section class="card hero">
    <p class="label">Tienes en total</p>
    <p class="hero-amount">${money(total)}</p>
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
  <section class="card">
    <div class="card-head"><h2>Por cobrar</h2><a class="link" href="#cobros">Ver cobros</a></div>
    ${pend.length ? `<div class="rows">${pend.slice(0, 4).map(chargeRow).join('')}</div>${pend.length > 4 ? `<a class="link more" href="#cobros">Ver ${pend.length - 4} más</a>` : ''}`
      : data.clients.length ? emptyState('Todo cobrado hasta este mes.')
      : emptyState('Agrega a tus clientes y lo que te pagan cada mes.', newClientButton())}
  </section>
  <section class="card">
    <div class="card-head"><h2>${monthLabel(now)}</h2></div>
    ${progress(monthTotals(now))}
  </section>
  ${nextWithdrawalCard()}`;
}

function chargeRow({ c, m, due }) {
  const late = m < thisMonth();
  return `<div class="row${late ? ' late' : ''}">
    ${avatar(c.name, clientColor(c))}
    <span class="row-main"><b>${esc(c.name)}</b><small>${cap(monthName(m))}${late ? ' (atrasado)' : ''} · ${esc(linesText(clientLines(c, m)))}</small></span>
    <span class="row-side"><span class="amount">${money(due, clientCur(c))}</span><button class="btn-sm primary" data-act="charge" data-id="${c.id}" data-month="${m}">Cobrar</button></span>
  </div>`;
}

function nextWithdrawalCard() {
  if (!data.clients.length || data.wallets.length < 2) return '';
  const st = planSetup();
  const next = simulate(data.plan.strategy, st).rows.find(r => r.out > 0);
  if (!next) return '';
  return `<section class="card">
    <div class="card-head"><h2>Próximo retiro</h2><a class="link" href="#retiros">Ver plan</a></div>
    <p class="muted">Según tu plan (${STRATEGIES[data.plan.strategy].toLowerCase()}), a fin de ${monthName(next.m)} retirarías <b class="ink">${money(next.out, st.from.currency)}</b> de ${esc(st.from.name)} y recibirías unos <b class="ink">${money(next.got, st.to.currency)}</b>.</p>
  </section>`;
}

function viewCharges() {
  const m = chargeMonth;
  return `
  <div class="month-switch">
    <button class="icon-btn" data-act="prevMonth" aria-label="Mes anterior">${icon('chevronLeft')}</button>
    <span>${monthLabel(m)}</span>
    <button class="icon-btn" data-act="nextMonth" aria-label="Mes siguiente">${icon('chevronRight')}</button>
  </div>
  ${data.clients.length ? `<section class="card">${progress(monthTotals(m))}</section>${data.clients.map(c => billCard(c, m)).join('')}`
    : `<section class="card">${emptyState('Agrega a tus clientes y lo que te pagan cada mes para empezar a cobrar.', newClientButton())}</section>`}`;
}

function billCard(c, m) {
  const cur = clientCur(c), lines = clientLines(c, m), due = clientDue(c, m), pay = paymentOf(c.id, m);
  const w = wallet(c.wallet);
  return `<section class="card bill">
    <div class="bill-head">
      ${avatar(c.name, clientColor(c))}
      <span class="row-main"><b>${esc(c.name)}</b><small>Te paga en ${esc(w ? w.name : 'una billetera eliminada')}</small></span>
      <span class="amount big">${money(due, cur)}</span>
    </div>
    <div class="bill-lines">${lines.length ? lines.map(x => `<div><span>${x.n > 1 ? `${x.n} × ` : ''}${esc(x.s.name)}</span><span>${money(x.n * x.s.amount, cur)}</span></div>`).join('')
      : `<div><span class="muted">Sin cobros programados en ${monthName(m)}</span></div>`}</div>
    ${pay ? `<div class="paid">${icon('check')}<span>Cobrado ${relDate(pay.date)} · <b>${money(pay.amount, pay.currency)}</b></span><button class="btn-sm ghost" data-act="editPayment" data-id="${pay.id}">Editar</button></div>`
      : `<button class="btn ${due > 0 ? 'primary' : 'ghost'} block" data-act="charge" data-id="${c.id}" data-month="${m}">${due > 0 ? `Cobrar ${monthName(m)}` : 'Registrar un cobro'}</button>`}
  </section>`;
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
        <label class="field"><span>Recibes por cada ${CURRENCIES[st.from.currency]} 1</span><input name="rate" type="number" step="0.001" min="0" inputmode="decimal" value="${Number(p.rate) > 0 ? p.rate : ''}" placeholder="${roundTo(st.autoRate, 3)}"></label>
        ${moneyField('Costo fijo por retiro', 'fee', st.from.currency, p.fee || '', 'min="0"')}
      </div>
      <small class="field-hint">${Number(p.rate) > 0 ? 'Usando el valor que escribiste.' : st.fromLast ? 'Según tu último retiro real.' : 'Según el tipo de cambio de Ajustes.'}</small>
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
    <div class="stat"><span>Costos fijos</span><b>${money(sim.fees, fc)}</b></div>
  </div>
  <div class="table" role="table">
    <div class="table-row table-head" role="row"><span>Mes</span><span>Entra</span><span>Retiras</span><span>Recibes</span></div>
    ${sim.rows.map(r => `<div class="table-row${r.out ? ' hit' : ''}" role="row"><span>${cap(monthShort(r.m))}</span><span>${r.inc ? moneyShort(r.inc, fc) : ''}</span><span>${r.out ? moneyShort(r.out, fc) : ''}</span><span>${r.got ? moneyShort(r.got, tc) : ''}</span></div>`).join('')}
  </div>
  <h3 class="sub">Comparar</h3>
  <div class="rows">${compare.map(({ k, r }) => `<div class="compare-row${data.plan.strategy === k ? ' current' : ''}">
    <span><b>${STRATEGIES[k]}${k === 'threshold' ? ` ${moneyShort(st.threshold, fc)}` : ''}</b><small>${r.count} ${r.count === 1 ? 'retiro' : 'retiros'} · ${money(r.fees, fc)} en costos</small></span>
    <span class="amount">${money(r.received, tc)}${best - r.received < 0.005 ? '<small class="pos">La mejor</small>' : `<small>${money(r.received - best, tc)}</small>`}</span>
  </div>`).join('')}</div>
  <small class="field-hint">Supone el mismo tipo de cambio todo el año: solo cambian los costos fijos.</small>`;
}

function viewClients() {
  const now = thisMonth();
  return `
  <div class="page-actions end">${newClientButton()}</div>
  ${data.clients.length ? data.clients.map(c => {
    const w = wallet(c.wallet);
    return `<section class="card">
      <div class="card-head client-head">
        ${avatar(c.name, clientColor(c))}
        <span class="row-main"><b>${esc(c.name)}</b><small>${esc(w ? w.name : 'Billetera eliminada')} · ${cap(monthName(now))}: ${money(clientDue(c, now), clientCur(c))}</small></span>
        <button class="btn-sm ghost" data-act="editClient" data-id="${c.id}">${icon('edit')}Editar</button>
      </div>
      ${c.services.length ? `<div class="rows">${c.services.map(s => `
        <button class="row compact" data-act="editService" data-client="${c.id}" data-id="${s.id}">
          <span class="row-main"><b>${esc(s.name)}${s.active ? '' : '<em class="tag">Pausado</em>'}</b><small>${esc(freqText(s))}</small></span>
          <span class="amount">${money(s.amount, clientCur(c))}</span>
        </button>`).join('')}</div>` : '<p class="muted small">Sin cobros todavía.</p>'}
      <button class="btn-sm ghost add" data-act="newService" data-client="${c.id}">${icon('plus')}Añadir cobro</button>
    </section>`;
  }).join('') : `<section class="card">${emptyState('Todavía no tienes clientes.')}</section>`}`;
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
  <section class="card">
    <div class="card-head"><h2>Google Drive</h2></div>
    <p class="muted small">${googleText}</p>
    <div class="btn-row"><button class="btn ${signed ? 'ghost' : 'primary'}" data-act="toggleGoogle"${gTokenClient ? '' : ' disabled'}>${icon('cloud')}${signed ? 'Desconectar' : 'Entrar con Google'}</button></div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Respaldo</h2></div>
    <div class="btn-row">
      <button class="btn ghost" data-act="exportData">${icon('download')}Descargar respaldo</button>
      <button class="btn ghost" data-act="importData">${icon('upload')}Importar respaldo</button>
    </div>
  </section>
  <section class="card danger">
    <div class="card-head"><h2>Borrar datos</h2></div>
    <p class="muted small">Elimina billeteras, clientes, cobros y retiros de este dispositivo.</p>
    <div class="btn-row"><button class="btn danger" data-act="resetData">${icon('trash')}Borrar todo</button></div>
  </section>`;
}

// ── Hojas (formularios) ──
function openSheet(title, html, mount) {
  $('sheetTitle').textContent = title;
  $('sheetBody').innerHTML = html;
  $('sheet').hidden = false;
  document.body.classList.add('locked');
  const form = $('sheetBody').querySelector('form');
  if (mount && form) mount(form, n => form.elements[n]);
}
function closeSheet() {
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
  const due = clientDue(c, m);
  const w0 = wallet(pay?.wallet) ? pay.wallet : wallet(c.wallet) ? c.wallet : data.wallets[0].id;
  const lines = clientLines(c, m);
  openSheet(pay ? `Cobro de ${monthName(m)}` : `Cobrar ${monthName(m)}`, `<form class="form">
    <p class="preview">${esc(c.name)}${lines.length ? ` · ${esc(linesText(lines))}` : ''}</p>
    ${moneyField('Te pagó', 'amount', wallet(w0).currency, pay ? pay.amount : due || '')}
    <label class="field"><span>Lo recibiste en</span><select name="wallet">${walletOptions(w0)}</select></label>
    ${moneyField('', 'balance', wallet(w0).currency, '', pay ? 'placeholder="Sin cambios"' : 'required', ' ')}
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${pay?.date || todayISO()}"></label>
    ${pay ? deleteButton('deletePayment', pay.id, 'Deshacer cobro') : ''}
    ${formActions(pay ? 'Guardar' : 'Cobrar')}
  </form>`, (form, el) => {
    const sync = () => {
      const w = wallet(el('wallet').value);
      setText(form, '[data-cur="amount"]', CURRENCIES[w.currency]);
      setText(form, '[data-cur="balance"]', CURRENCIES[w.currency]);
      setText(form, '[data-label="balance"]', `¿Cuánto tienes ahora en ${w.name}?`);
      setText(form, '[data-hint="balance"]', pay ? `Ahora: ${money(w.balance, w.currency)}. Déjalo vacío si no cambió.` : `Antes de este cobro: ${money(w.balance, w.currency)}`);
    };
    el('wallet').addEventListener('change', sync);
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
        Object.assign(pay, { amount, currency: w.currency, wallet: w.id, date: el('date').value });
        if (typed !== '') Object.assign(pay, { balanceBefore: before, balanceAfter: w.balance });
      } else {
        data.payments.push({ id: uid(), clientId: c.id, month: m, amount, currency: w.currency, wallet: w.id, date: el('date').value, balanceBefore: before, balanceAfter: w.balance });
      }
      closeSheet();
      commit(pay ? 'Cobro actualizado' : `${c.name}: ${monthName(m)} cobrado`);
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
    const sync = changedWallet => {
      const [a, b] = pair();
      if (changedWallet === 'from') el('amount').value = a.balance > 0 ? a.balance : '';
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

function withdrawalDetail(x) {
  const a = wallet(x.from), b = wallet(x.to);
  const aCur = a?.currency || 'USD', bCur = b?.currency || 'PEN';
  openSheet('Retiro', `<div class="form">
    <div class="stats two">
      <div class="stat"><span>Retiraste</span><b>${money(x.amount, aCur)}</b></div>
      <div class="stat"><span>Recibiste</span><b class="pos">${money(x.received, bCur)}</b></div>
    </div>
    <p class="preview">${fmtDate(x.date, { weekday: 'long', day: 'numeric', month: 'long' })} · De ${esc(a ? a.name : 'billetera eliminada')} a ${esc(b ? b.name : 'billetera eliminada')}${aCur !== bCur && x.amount > 0 ? ` · ${money(x.received / x.amount, bCur)} por cada ${CURRENCIES[aCur]} 1` : ''}${x.note ? ` · ${esc(x.note)}` : ''}</p>
    ${deleteButton('deleteWithdrawal', x.id, 'Eliminar retiro')}
    <div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cerrar</button></div>
  </div>`);
}

function updateBalancesForm() {
  openSheet('Actualizar saldos', `<form class="form">
    ${data.wallets.map(w => moneyField(`${w.name}`, `w_${w.id}`, w.currency, w.balance, '', w.updated ? `Actualizado ${relDate(w.updated)}` : '')).join('')}
    ${formActions()}
  </form>`, (form, el) => {
    const first = el(`w_${data.wallets[0].id}`);
    first.focus();
    first.select();
    form.onsubmit = e => {
      e.preventDefault();
      for (const w of data.wallets) {
        const v = el(`w_${w.id}`).value;
        if (v !== '' && round2(v) !== w.balance) setBalance(w, v);
        else if (v !== '') w.updated = todayISO();
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
        if (round2(el('balance').value) !== w.balance || !w.updated) setBalance(w, el('balance').value);
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
  openSheet(c ? 'Editar cliente' : 'Nuevo cliente', `<form class="form">
    <label class="field"><span>Nombre</span><input name="title" required maxlength="60" value="${esc(c?.name || '')}" placeholder="Ej. Estudio Norte"></label>
    <label class="field"><span>Te paga en</span><select name="wallet">${walletOptions(w0)}</select></label>
    <label class="field"><span>Nota</span><input name="note" maxlength="80" value="${esc(c?.note || '')}" placeholder="Opcional"></label>
    ${c ? deleteButton('deleteClient', c.id) : ''}
    ${formActions(c ? 'Guardar' : 'Siguiente')}
  </form>`, (form, el) => {
    if (!c) el('title').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const next = { name: el('title').value.trim(), wallet: el('wallet').value, note: el('note').value.trim() };
      if (!next.name) return toast('Escribe el nombre del cliente');
      if (c) {
        Object.assign(c, next);
        closeSheet();
        commit('Cliente actualizado');
        return;
      }
      const nc = { id: uid(), ...next, since: '', services: [] };
      data.clients.push(nc);
      persist();
      render();
      serviceForm(nc); // seguimos con lo que te paga
    };
  });
}

function serviceForm(c, s = null) {
  const cur = clientCur(c);
  const freq = s?.frequency || 'monthly';
  openSheet(s ? 'Editar cobro' : `¿Qué te paga ${c.name}?`, `<form class="form">
    <label class="field"><span>Qué cobras</span><input name="title" required maxlength="60" value="${esc(s?.name || '')}" placeholder="Ej. Diseños del mes"></label>
    ${moneyField('Monto', 'amount', cur, s?.amount)}
    <div class="segmented" role="radiogroup" aria-label="Frecuencia">
      <label><input type="radio" name="frequency" value="monthly"${freq === 'monthly' ? ' checked' : ''}><span>Cada mes</span></label>
      <label><input type="radio" name="frequency" value="weekly"${freq === 'weekly' ? ' checked' : ''}><span>Cada semana</span></label>
      <label><input type="radio" name="frequency" value="once"${freq === 'once' ? ' checked' : ''}><span>Una vez</span></label>
    </div>
    <div class="grid2">
      <label class="field"><span data-start-label>Desde</span><input name="start" type="date" required value="${s?.start || todayISO()}"></label>
      <label class="field" data-end><span>Hasta</span><input name="end" type="date" value="${s?.end || ''}"></label>
    </div>
    ${s ? `<label class="switch"><span>Activo</span><input type="checkbox" name="active"${s.active ? ' checked' : ''}></label>` : ''}
    <p class="preview" data-preview></p>
    ${s ? deleteButton('deleteService', s.id, 'Eliminar', ` data-client="${c.id}"`) : ''}
    ${formActions()}
  </form>`, (form, el) => {
    const sync = () => {
      const f = el('frequency').value;
      form.querySelector('[data-end]').hidden = f === 'once';
      setText(form, '[data-start-label]', f === 'weekly' ? 'Primer día' : f === 'once' ? 'Fecha' : 'Desde');
      const draft = { frequency: f, start: el('start').value, end: f === 'once' ? '' : el('end').value, active: true, amount: Number(el('amount').value) || 0 };
      if (!draft.start) return setText(form, '[data-preview]', '');
      const m = maxStr(thisMonth(), monthKey(draft.start));
      const n = chargeCount(draft, m);
      setText(form, '[data-preview]', n
        ? `${freqText(draft)}. En ${monthName(m)}: ${n > 1 ? `${n} × ${money(draft.amount, cur)} = ` : ''}${money(n * draft.amount, cur)}.`
        : `${freqText(draft)}. Sin cobro en ${monthName(m)}.`);
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    sync();
    if (!s) el('title').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const f = el('frequency').value;
      const next = {
        name: el('title').value.trim(), amount: round2(el('amount').value), frequency: f,
        start: el('start').value, end: f === 'once' ? '' : el('end').value, active: s ? el('active').checked : true,
      };
      if (!next.name) return toast('Escribe qué cobras');
      if (!(next.amount > 0)) return toast('Escribe un monto mayor a 0');
      if (next.end && next.end < next.start) return toast('"Hasta" no puede ser antes de "Desde"');
      if (s) Object.assign(s, next);
      else c.services.push({ id: uid(), ...next });
      closeSheet();
      commit(s ? 'Cobro actualizado' : 'Cobro agregado');
    };
  });
}

// ── Acciones ──
const actions = {
  closeSheet,
  charge: d => { const c = client(d.id); if (c) chargeForm(c, d.month); },
  editPayment: d => {
    const p = data.payments.find(x => x.id === d.id);
    const c = p && client(p.clientId);
    if (c) chargeForm(c, p.month, p);
  },
  deletePayment: d => {
    const p = data.payments.find(x => x.id === d.id);
    if (!p || !confirm('¿Deshacer este cobro?')) return;
    const w = wallet(p.wallet);
    // Si el saldo no se ha tocado desde el cobro, vuelve al valor anterior.
    if (w && p.balanceBefore != null && w.balance === p.balanceAfter) setBalance(w, p.balanceBefore);
    data.payments = data.payments.filter(x => x !== p);
    closeSheet();
    commit('Cobro deshecho');
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
  deleteClient: d => {
    const c = client(d.id);
    if (!c || !confirm(`¿Eliminar a ${c.name} junto con sus cobros registrados?`)) return;
    data.clients = data.clients.filter(x => x !== c);
    data.payments = data.payments.filter(p => p.clientId !== c.id);
    closeSheet();
    commit('Cliente eliminado');
  },
  newService: d => { const c = client(d.client); if (c) serviceForm(c); },
  editService: d => {
    const c = client(d.client), s = c?.services.find(x => x.id === d.id);
    if (s) serviceForm(c, s);
  },
  deleteService: d => {
    const c = client(d.client);
    const s = c?.services.find(x => x.id === d.id);
    if (!s || !confirm(`¿Eliminar "${s.name}"? Los meses ya cobrados se conservan.`)) return;
    c.services = c.services.filter(x => x !== s);
    closeSheet();
    commit('Cobro eliminado');
  },
  prevMonth: () => { chargeMonth = shiftMonth(chargeMonth, -1); render(); },
  nextMonth: () => { chargeMonth = shiftMonth(chargeMonth, 1); render(); },
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

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `saldo-respaldo-${todayISO()}.json`;
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
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Cuenta de Google + guardado en tu Google Drive (carpeta oculta de la app) ──
let gToken = null, gExpires = 0, gTokenClient = null, gFileId = null, driveTimer = null, driveNeedsSave = false;
let syncState = 'local';
const SYNC_TEXT = { local: 'En este dispositivo', on: 'Sincronizado', saving: 'Guardando…', error: 'Sin sincronizar' };

function setSync(s) { syncState = s; renderSync(); }
function renderSync() {
  const chip = $('syncChip');
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
  if (!el || !actions[el.dataset.act]) return;
  e.preventDefault();
  actions[el.dataset.act](el.dataset, el);
});
document.addEventListener('input', onPlanInput);
document.addEventListener('change', onPlanInput);
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
render();
