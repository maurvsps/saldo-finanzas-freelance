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

// ── Iconos (SVG, nunca caracteres) ──
const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  transfer: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
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
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const monthKey = s => s.slice(0, 7);
const shiftMonth = (m, n) => iso(new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1, 12)).slice(0, 7);
const lastDay = m => iso(new Date(+m.slice(0, 4), +m.slice(5, 7), 0, 12));
function addMonthsClamped(s, n, day) {
  const d = parse(s);
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  t.setDate(Math.min(day, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return iso(t);
}
const fmtDate = (s, opts = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('es-PE', opts).format(parse(s)).replace(/\./g, '');
const monthLabel = m => cap(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(parse(m + '-01')));
const monthShort = m => new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(parse(m + '-01')).replace('.', '');

function money(n, cur = 'PEN') {
  const v = Number(n) || 0;
  const s = Math.abs(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${v < 0 ? '−' : ''}${CURRENCIES[cur] || cur} ${s}`;
}
function compact(v) {
  if (v >= 1000) return `S/ ${(v / 1000).toFixed(1).replace('.0', '')}k`;
  return `S/ ${Math.round(v)}`;
}

// ── Datos ──
function blank() {
  return {
    version: 2,
    updatedAt: 0,
    rates: { USD: 3.72, EUR: 4.05, GBP: 4.72 },
    ratesDate: '',
    wallets: [
      { id: 'account', name: 'Cuenta', currency: 'PEN', balance: 0, color: 0 },
      { id: 'yape', name: 'Yape', currency: 'PEN', balance: 0, color: 1 },
      { id: 'paypal', name: 'PayPal', currency: 'USD', balance: 0, color: 2 },
    ],
    clients: [],
    recurring: [],
    movements: [],
  };
}

// Convierte cualquier versión guardada (incluida la anterior a este rediseño) al formato actual.
function migrate(raw) {
  const d = blank();
  if (!raw || typeof raw !== 'object') return d;
  if (raw.rates) for (const c of ['USD', 'EUR', 'GBP']) if (Number(raw.rates[c]) > 0) d.rates[c] = Number(raw.rates[c]);

  if (raw.version === 2) {
    return {
      ...d,
      ...raw,
      rates: d.rates,
      wallets: arr(raw.wallets).length ? raw.wallets : d.wallets,
      clients: arr(raw.clients),
      recurring: arr(raw.recurring).map(r => ({ ...r, done: arr(r.done) })),
      movements: arr(raw.movements),
    };
  }

  // Versión 1: billeteras fijas, clientes con productos, ingresos sueltos.
  if (raw.wallets && !Array.isArray(raw.wallets)) for (const w of d.wallets) w.balance = round2(raw.wallets[w.id]);
  const oldClients = arr(raw.clients);
  d.clients = oldClients.map(c => ({ id: c.id || uid(), name: String(c.name || 'Cliente'), note: String(c.description || '') }));
  const since = todayISO();
  const toRecurring = (p, clientId) => {
    const low = Number(p.low ?? 1), high = Number(p.high ?? low), price = Number(p.price) || 0;
    const frequency = ['weekly', 'monthly', 'once'].includes(p.frequency) ? p.frequency : 'monthly';
    const start = /^\d{4}-\d{2}-\d{2}$/.test(p.start || '') ? p.start : since;
    const months = Number(p.months) || 0;
    const currency = CURRENCIES[p.currency] ? p.currency : 'USD';
    return {
      id: p.id || uid(),
      name: String(p.name || 'Cobro'),
      clientId,
      amount: round2(price * (low + high) / 2),
      currency,
      frequency,
      start,
      end: frequency === 'monthly' && months > 0 ? addDays(addMonthsClamped(start, months, parse(start).getDate()), -1) : '',
      wallet: currency === 'USD' ? 'paypal' : 'account',
      active: true,
      done: [],
      since, // sin cobros atrasados heredados
    };
  };
  oldClients.forEach((c, i) => arr(c.products).forEach(p => d.recurring.push(toRecurring(p, d.clients[i].id))));
  arr(raw.products).forEach(p => d.recurring.push(toRecurring(p, '')));
  arr(raw.incomes).forEach(x => {
    const cl = d.clients.find(c => c.name === x.client);
    d.movements.push({
      id: x.id || uid(), type: 'in', date: x.date || since, amount: round2(x.amount),
      currency: CURRENCIES[x.currency] ? x.currency : 'PEN', wallet: x.currency === 'USD' ? 'paypal' : 'account',
      note: x.name || '', clientId: cl?.id || '',
      noBalance: true, // antes los ingresos no movían el saldo; se conservan sin alterarlo
    });
  });
  return d;
}

function load() {
  for (const k of [KEY, OLD_KEY]) {
    try { const raw = JSON.parse(localStorage.getItem(k)); if (raw) return migrate(raw); } catch {}
  }
  return blank();
}

let data = load();
let moveMonth = monthKey(todayISO());
let moveFilter = 'all';

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
const recurring = id => data.recurring.find(r => r.id === id);
const toPEN = (n, cur) => (Number(n) || 0) * (cur === 'PEN' ? 1 : Number(data.rates[cur]) || 0);
const convert = (n, from, to) => (from === to ? Number(n) || 0 : toPEN(n, from) / (to === 'PEN' ? 1 : Number(data.rates[to]) || 1));
const walletColor = w => COLORS[(w?.color ?? 0) % COLORS.length];
const clientColor = c => COLORS[Math.max(0, data.clients.indexOf(c)) % COLORS.length];
const initial = s => esc(String(s || '?').trim().charAt(0).toUpperCase() || '?');

// Aplica (sign = 1) o revierte (sign = -1) el efecto de un movimiento en los saldos.
function applyMove(m, sign) {
  if (m.noBalance) return;
  const w = wallet(m.wallet);
  if (m.type === 'in' && w) w.balance = round2(w.balance + sign * m.amount);
  if (m.type === 'out' && w) w.balance = round2(w.balance - sign * m.amount);
  if (m.type === 'transfer') {
    if (w) w.balance = round2(w.balance - sign * m.amount);
    const t = wallet(m.to);
    if (t) t.balance = round2(t.balance + sign * m.toAmount);
  }
}

// ── Cobros fijos ──
function occurrences(r, from, to) {
  const out = [];
  const end = r.end && r.end < to ? r.end : to;
  if (from > end) return out;
  if (r.frequency === 'once') {
    if (r.start >= from && r.start <= end) out.push(r.start);
    return out;
  }
  if (r.frequency === 'weekly') {
    let d = r.start;
    if (d < from) d = addDays(d, Math.ceil(Math.round((parse(from) - parse(d)) / 864e5) / 7) * 7);
    for (; d <= end; d = addDays(d, 7)) out.push(d);
    return out;
  }
  const s = parse(r.start), f = parse(from), day = s.getDate();
  let k = Math.max(0, (f.getFullYear() - s.getFullYear()) * 12 + f.getMonth() - s.getMonth() - 1);
  for (;;) {
    const d = addMonthsClamped(r.start, k, day);
    if (d > end) break;
    if (d >= from) out.push(d);
    k++;
  }
  return out;
}

// Cobros pendientes (incluye atrasados de los últimos 30 días) hasta la fecha indicada.
function pendingItems(to) {
  const floor = addDays(todayISO(), -30);
  const items = [];
  for (const r of data.recurring) {
    if (!r.active) continue;
    for (const date of occurrences(r, maxStr(r.since, r.start, floor), to)) if (!r.done.includes(date)) items.push({ r, date });
  }
  return items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
function nextDate(r) {
  if (!r.active) return '';
  const t = todayISO();
  return occurrences(r, maxStr(t, r.start), addDays(t, 400)).find(d => !r.done.includes(d)) || '';
}
function monthlyEquiv(r) {
  if (!r.active) return 0;
  return toPEN(r.amount, r.currency) * (r.frequency === 'weekly' ? 52 / 12 : r.frequency === 'monthly' ? 1 : 0);
}
function expectedInMonth(m) {
  const from = m + '-01', to = lastDay(m);
  return data.recurring.filter(r => r.active).reduce((s, r) => s + occurrences(r, maxStr(from, r.start), to).length * toPEN(r.amount, r.currency), 0);
}
function freqText(r) {
  let t;
  if (r.frequency === 'weekly') t = `Cada ${fmtDate(r.start, { weekday: 'long' })}`;
  else if (r.frequency === 'monthly') t = `Cada mes, el día ${parse(r.start).getDate()}`;
  else t = `Una vez, el ${fmtDate(r.start, { day: 'numeric', month: 'long' })}`;
  if (r.end && r.frequency !== 'once') t += ` hasta el ${fmtDate(r.end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return t;
}

function monthStats(m) {
  let inc = 0, out = 0;
  for (const x of data.movements) {
    if (monthKey(x.date) !== m) continue;
    if (x.type === 'in') inc += toPEN(x.amount, x.currency);
    else if (x.type === 'out') out += toPEN(x.amount, x.currency);
  }
  const pending = pendingItems(lastDay(m)).filter(x => monthKey(x.date) === m).reduce((s, x) => s + toPEN(x.r.amount, x.r.currency), 0);
  return { inc, out, pending };
}
function clientStats(id) {
  const total = data.movements.filter(m => m.type === 'in' && m.clientId === id).reduce((s, m) => s + toPEN(m.amount, m.currency), 0);
  const monthly = data.recurring.filter(r => r.clientId === id).reduce((s, r) => s + monthlyEquiv(r), 0);
  return { total, monthly };
}

// ── Vistas ──
const VIEWS = {
  inicio: { label: 'Inicio', icon: 'home', render: viewHome },
  movimientos: { label: 'Historial', icon: 'list', render: viewMovements },
  cobros: { label: 'Cobros fijos', short: 'Cobros', icon: 'repeat', render: viewRecurring },
  clientes: { label: 'Clientes', icon: 'users', render: viewClients },
  ajustes: { label: 'Ajustes', icon: 'settings', render: viewSettings },
};
const currentView = () => (VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio');

function render() {
  const name = currentView();
  $('nav').innerHTML = Object.entries(VIEWS).map(([k, v]) =>
    `<a class="nav-item${k === name ? ' active' : ''}" href="#${k}"${k === name ? ' aria-current="page"' : ''}>${icon(v.icon)}<span>${v.short || v.label}</span></a>`).join('');
  $('pageTitle').textContent = VIEWS[name].label;
  $('view').innerHTML = VIEWS[name].render();
  renderSync();
}

const emptyState = (text, action = '') => `<div class="empty"><p>${text}</p>${action}</div>`;
const quickActions = () => `<div class="quick">
  <button class="quick-btn in" data-act="newIn">${icon('arrowDown')}<span>Ingreso</span></button>
  <button class="quick-btn out" data-act="newOut">${icon('arrowUp')}<span>Gasto</span></button>
  <button class="quick-btn" data-act="newTransfer">${icon('transfer')}<span>Transferir</span></button>
</div>`;
const avatar = (text, color) => `<span class="avatar" style="--c:${color}">${initial(text)}</span>`;
const dateBadge = d => `<span class="date-badge"><b>${parse(d).getDate()}</b><small>${fmtDate(d, { month: 'short' })}</small></span>`;

function viewHome() {
  const total = data.wallets.reduce((s, w) => s + toPEN(w.balance, w.currency), 0);
  const foreign = [...new Set(data.wallets.map(w => w.currency))].filter(c => c !== 'PEN');
  const rateNote = foreign.length ? foreign.map(c => `1 ${c} = ${money(data.rates[c])}`).join(' · ') : 'Todo en soles';
  const m = monthKey(todayISO());
  const st = monthStats(m);
  const upcoming = pendingItems(addDays(todayISO(), 45)).slice(0, 3);
  return `
  <section class="card hero">
    <p class="label">Saldo total</p>
    <p class="hero-amount">${money(total)}</p>
    <p class="muted small">${esc(rateNote)}</p>
    <div class="wallet-list">${data.wallets.map(w => `
      <button class="wallet" data-act="editWallet" data-id="${w.id}" aria-label="Editar saldo de ${esc(w.name)}">
        ${avatar(w.name, walletColor(w))}
        <span class="wallet-name">${esc(w.name)}<small>${w.currency}</small></span>
        <span class="wallet-amount">${money(w.balance, w.currency)}</span>
        ${icon('edit', 'wallet-edit')}
      </button>`).join('')}
    </div>
  </section>
  ${quickActions()}
  <section class="card">
    <div class="card-head"><h2>${monthLabel(m)}</h2><a class="link" href="#movimientos">Ver historial</a></div>
    <div class="stats">
      <div class="stat"><span>Ingresos</span><b class="pos">${money(st.inc)}</b></div>
      <div class="stat"><span>Gastos</span><b class="neg">${money(st.out)}</b></div>
      <div class="stat"><span>Por cobrar</span><b>${money(st.pending)}</b></div>
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Próximos cobros</h2><a class="link" href="#cobros">Cobros fijos</a></div>
    ${upcoming.length ? `<div class="rows">${upcoming.map(pendingRow).join('')}</div>`
      : data.recurring.length ? emptyState('No tienes cobros pendientes en las próximas semanas.')
      : emptyState('Agrega lo que cobras cada semana o cada mes y aquí verás cuándo te toca.', `<button class="btn primary" data-act="newRecurring">${icon('plus')}Nuevo cobro fijo</button>`)}
  </section>
  ${forecastCard()}`;
}

function pendingRow({ r, date }) {
  const t = todayISO();
  const late = date < t;
  const when = date === t ? 'Hoy' : date === addDays(t, 1) ? 'Mañana' : late ? `Atrasado, ${fmtDate(date)}` : fmtDate(date, { weekday: 'long' });
  return `<div class="row pending${late ? ' late' : ''}">
    ${dateBadge(date)}
    <span class="row-main"><b>${esc(r.name)}</b><small>${[client(r.clientId)?.name, when].filter(Boolean).map(esc).join(' · ')}</small></span>
    <span class="amount">${money(r.amount, r.currency)}</span>
    <span class="row-actions">
      <button class="btn-sm ghost" data-act="skipOcc" data-id="${r.id}" data-date="${date}">Omitir</button>
      <button class="btn-sm primary" data-act="markPaid" data-id="${r.id}" data-date="${date}">${icon('check')}Cobrado</button>
    </span>
  </div>`;
}

function forecastCard() {
  if (!data.recurring.some(r => r.active)) return '';
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey(todayISO()), i));
  const vals = months.map(expectedInMonth);
  const max = Math.max(...vals, 1);
  return `<section class="card">
    <div class="card-head"><h2>Ingresos esperados</h2></div>
    <p class="muted small">Según tus cobros fijos activos, en soles.</p>
    <div class="bars">${months.map((m, i) => `
      <div class="bar-col">
        <span class="bar-val">${compact(vals[i])}</span>
        <span class="bar-track"><span class="bar" style="height:${Math.max(3, (vals[i] / max) * 100)}%"></span></span>
        <span class="bar-label">${monthShort(m)}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function viewMovements() {
  const list = data.movements
    .filter(m => monthKey(m.date) === moveMonth && (moveFilter === 'all' || m.type === moveFilter))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const st = monthStats(moveMonth);
  const groups = [];
  for (const m of list) {
    const last = groups[groups.length - 1];
    if (last && last.date === m.date) last.items.push(m);
    else groups.push({ date: m.date, items: [m] });
  }
  const filters = [['all', 'Todos'], ['in', 'Ingresos'], ['out', 'Gastos'], ['transfer', 'Transferencias']];
  return `
  <div class="month-switch">
    <button class="icon-btn" data-act="prevMonth" aria-label="Mes anterior">${icon('chevronLeft')}</button>
    <span>${monthLabel(moveMonth)}</span>
    <button class="icon-btn" data-act="nextMonth" aria-label="Mes siguiente">${icon('chevronRight')}</button>
  </div>
  ${quickActions()}
  <div class="stats two">
    <div class="stat"><span>Ingresos</span><b class="pos">${money(st.inc)}</b></div>
    <div class="stat"><span>Gastos</span><b class="neg">${money(st.out)}</b></div>
  </div>
  <div class="chips">${filters.map(([k, l]) => `<button class="chip${moveFilter === k ? ' active' : ''}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>
  <section class="card">
    ${groups.length ? groups.map(g => `<div class="group"><h3 class="group-date">${cap(fmtDate(g.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</h3><div class="rows">${g.items.map(movementRow).join('')}</div></div>`).join('')
      : emptyState('No hay movimientos en este mes.')}
  </section>`;
}

function movementRow(m) {
  const w = wallet(m.wallet), c = client(m.clientId);
  const wName = w ? w.name : 'Billetera eliminada';
  if (m.type === 'transfer') {
    const t = wallet(m.to);
    return `<button class="row" data-act="editMovement" data-id="${m.id}">
      <span class="move-ic">${icon('transfer')}</span>
      <span class="row-main"><b>${esc(m.note || 'Transferencia')}</b><small>De ${esc(wName)} a ${esc(t ? t.name : 'billetera eliminada')}</small></span>
      <span class="amount">${money(m.amount, m.currency)}<small>recibes ${money(m.toAmount, m.toCurrency)}</small></span>
    </button>`;
  }
  const isIn = m.type === 'in';
  const title = m.note || c?.name || (isIn ? 'Ingreso' : 'Gasto');
  const sub = [m.note && c?.name, wName].filter(Boolean).join(' · ');
  return `<button class="row" data-act="editMovement" data-id="${m.id}">
    <span class="move-ic ${m.type}">${icon(isIn ? 'arrowDown' : 'arrowUp')}</span>
    <span class="row-main"><b>${esc(title)}</b><small>${esc(sub)}</small></span>
    <span class="amount ${isIn ? 'pos' : 'neg'}">${isIn ? '+' : '−'}${money(m.amount, m.currency)}</span>
  </button>`;
}

function viewRecurring() {
  const monthly = data.recurring.reduce((s, r) => s + monthlyEquiv(r), 0);
  const list = data.recurring
    .map(r => ({ r, next: nextDate(r) }))
    .sort((a, b) => (b.r.active - a.r.active) || ((a.next || '9') < (b.next || '9') ? -1 : 1));
  return `
  <div class="page-actions">
    ${data.recurring.length ? `<div class="stat wide"><span>Cobros fijos activos al mes</span><b>≈ ${money(monthly)}</b></div>` : ''}
    <button class="btn primary" data-act="newRecurring">${icon('plus')}Nuevo cobro fijo</button>
  </div>
  <section class="card">
    ${list.length ? `<div class="rows">${list.map(({ r, next }) => {
      const c = client(r.clientId), w = wallet(r.wallet);
      return `<button class="row" data-act="editRecurring" data-id="${r.id}">
        ${avatar(r.name, c ? clientColor(c) : '#69716b')}
        <span class="row-main">
          <b>${esc(r.name)}${r.active ? '' : '<em class="tag">Pausado</em>'}</b>
          <small>${esc([c?.name, freqText(r)].filter(Boolean).join(' · '))}</small>
          <small>${next ? `Próximo: ${fmtDate(next, { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Sin cobros próximos'}${w ? ` · ${esc(w.name)}` : ''}</small>
        </span>
        <span class="amount">${money(r.amount, r.currency)}</span>
      </button>`;
    }).join('')}</div>`
      : emptyState('Aquí van los pagos que recibes de forma fija: cada semana, cada mes o una sola vez.')}
  </section>`;
}

function viewClients() {
  return `
  <div class="page-actions end"><button class="btn primary" data-act="newClient">${icon('plus')}Nuevo cliente</button></div>
  <section class="card">
    ${data.clients.length ? `<div class="rows">${data.clients.map(c => {
      const s = clientStats(c.id);
      const n = data.recurring.filter(r => r.clientId === c.id).length;
      return `<button class="row" data-act="editClient" data-id="${c.id}">
        ${avatar(c.name, clientColor(c))}
        <span class="row-main"><b>${esc(c.name)}</b><small>${esc(c.note || (n ? `${n} ${n === 1 ? 'cobro fijo' : 'cobros fijos'}` : 'Sin cobros fijos'))}</small></span>
        <span class="amount">${money(s.total)}<small>cobrado</small></span>
      </button>`;
    }).join('')}</div>`
      : emptyState('Todavía no tienes clientes.')}
  </section>`;
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
    <p class="muted small">Elimina billeteras, cobros, clientes y movimientos de este dispositivo.</p>
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
const clientOptions = sel => `<option value="">Sin cliente</option>${data.clients.map(c => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}<option value="__new">Nuevo cliente…</option>`;
const formActions = (label = 'Guardar') => `<div class="form-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cancelar</button><button class="btn primary">${label}</button></div>`;
const deleteButton = (act, id, label = 'Eliminar') => `<button type="button" class="btn danger-ghost" data-act="${act}" data-id="${id}">${icon('trash')}${label}</button>`;
const moneyField = (label, name, cur, value, attrs = 'min="0.01" required') =>
  `<label class="field"><span>${label}</span><span class="money-input"><span data-cur="${name}">${CURRENCIES[cur] || cur}</span><input name="${name}" type="number" step="0.01" inputmode="decimal" ${attrs} value="${value ?? ''}" placeholder="0.00"></span></label>`;

// Permite crear un cliente desde cualquier selector de cliente.
function bindClientSelect(select) {
  select.addEventListener('change', () => {
    if (select.value !== '__new') return;
    const name = (prompt('Nombre del cliente') || '').trim();
    if (!name) { select.value = ''; return; }
    const c = { id: uid(), name, note: '' };
    data.clients.push(c);
    persist();
    select.innerHTML = clientOptions(c.id);
  });
}

function movementForm(m = null, type = 'in') {
  type = m?.type || type;
  const title = t => (m ? 'Editar movimiento' : t === 'in' ? 'Nuevo ingreso' : 'Nuevo gasto');
  const w0 = m?.wallet || data.wallets[0].id;
  openSheet(title(type), `<form class="form">
    <div class="segmented" role="radiogroup" aria-label="Tipo">
      <label><input type="radio" name="type" value="in"${type === 'in' ? ' checked' : ''}><span>Ingreso</span></label>
      <label><input type="radio" name="type" value="out"${type === 'out' ? ' checked' : ''}><span>Gasto</span></label>
    </div>
    ${moneyField('Monto', 'amount', wallet(w0)?.currency || 'PEN', m?.amount)}
    <label class="field"><span>Billetera</span><select name="wallet">${walletOptions(w0)}</select></label>
    <label class="field" data-only-in><span>Cliente</span><select name="clientId">${clientOptions(m?.clientId)}</select></label>
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${m?.date || todayISO()}"></label>
    <label class="field"><span>Nota</span><input name="note" maxlength="80" value="${esc(m?.note || '')}" placeholder="Ej. Diseño de logo"></label>
    ${m ? deleteButton('deleteMovement', m.id) : ''}
    ${formActions()}
  </form>`, (form, el) => {
    bindClientSelect(el('clientId'));
    const sync = () => {
      const t = el('type').value;
      form.querySelector('[data-only-in]').hidden = t !== 'in';
      form.querySelector('[data-cur="amount"]').textContent = CURRENCIES[wallet(el('wallet').value)?.currency] || '';
      $('sheetTitle').textContent = title(t);
    };
    form.addEventListener('change', sync);
    sync();
    if (!m) el('amount').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const w = wallet(el('wallet').value);
      const t = el('type').value;
      const next = {
        type: t, amount: round2(el('amount').value), currency: w.currency, wallet: w.id, date: el('date').value,
        note: el('note').value.trim(), clientId: t === 'in' && el('clientId').value !== '__new' ? el('clientId').value : '',
      };
      if (!(next.amount > 0)) return toast('Ingresa un monto mayor a 0');
      if (m) { applyMove(m, -1); Object.assign(m, next); applyMove(m, 1); }
      else { const x = { id: uid(), ...next }; data.movements.push(x); applyMove(x, 1); }
      closeSheet();
      commit(m ? 'Movimiento actualizado' : t === 'in' ? 'Ingreso registrado' : 'Gasto registrado');
    };
  });
}

function transferForm(m = null) {
  if (data.wallets.length < 2) return toast('Necesitas al menos dos billeteras para transferir');
  const from = m?.wallet || (data.wallets.find(w => w.currency !== 'PEN') || data.wallets[0]).id;
  const to = m?.to || data.wallets.find(w => w.id !== from).id;
  openSheet(m ? 'Editar transferencia' : 'Transferir', `<form class="form">
    <div class="grid2">
      <label class="field"><span>Desde</span><select name="from">${walletOptions(from)}</select></label>
      <label class="field"><span>Hacia</span><select name="to">${walletOptions(to)}</select></label>
    </div>
    ${moneyField('Monto que envías', 'amount', 'PEN', m?.amount)}
    <div class="grid2">
      <label class="field"><span>Comisión (%)</span><input name="fee" type="number" step="0.01" min="0" max="100" inputmode="decimal" value="${m?.fee ?? 0}"></label>
      <label class="field"><span data-rate-label>Tipo de cambio</span><input name="rate" type="number" step="0.0001" min="0" inputmode="decimal" value="${m?.rate ?? ''}"></label>
    </div>
    ${moneyField('Monto que recibes', 'received', 'PEN', m?.toAmount, 'min="0.01" required')}
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${m?.date || todayISO()}"></label>
    <label class="field"><span>Nota</span><input name="note" maxlength="80" value="${esc(m?.note || '')}" placeholder="Ej. Retiro de PayPal"></label>
    ${m ? deleteButton('deleteMovement', m.id) : ''}
    ${formActions()}
  </form>`, (form, el) => {
    let manual = !!m; // al editar se respeta el monto recibido guardado
    const pair = () => [wallet(el('from').value), wallet(el('to').value)];
    const syncLabels = () => {
      const [a, b] = pair();
      form.querySelector('[data-cur="amount"]').textContent = CURRENCIES[a.currency];
      form.querySelector('[data-cur="received"]').textContent = CURRENCIES[b.currency];
      form.querySelector('[data-rate-label]').textContent = a.currency === b.currency ? 'Tipo de cambio' : `1 ${a.currency} en ${b.currency}`;
    };
    const syncRate = () => { const [a, b] = pair(); el('rate').value = roundTo(convert(1, a.currency, b.currency), 4); };
    const recompute = () => {
      if (manual) return;
      const v = Number(el('amount').value) * (1 - (Number(el('fee').value) || 0) / 100) * (Number(el('rate').value) || 0);
      el('received').value = v > 0 ? round2(v).toFixed(2) : '';
    };
    if (!m) syncRate();
    syncLabels();
    recompute();
    form.addEventListener('input', e => {
      const n = e.target.name;
      if (n === 'received') { manual = true; return; }
      if (n === 'from' || n === 'to') syncRate();
      if (['amount', 'fee', 'rate', 'from', 'to'].includes(n)) manual = false;
      syncLabels();
      recompute();
    });
    if (!m) el('amount').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const [a, b] = pair();
      if (a.id === b.id) return toast('Elige dos billeteras distintas');
      const next = {
        type: 'transfer', wallet: a.id, to: b.id, amount: round2(el('amount').value), currency: a.currency,
        toAmount: round2(el('received').value), toCurrency: b.currency, fee: Number(el('fee').value) || 0,
        rate: Number(el('rate').value) || 0, date: el('date').value, note: el('note').value.trim(),
      };
      if (!(next.amount > 0) || !(next.toAmount > 0)) return toast('Revisa los montos');
      if (m) { applyMove(m, -1); Object.assign(m, next); applyMove(m, 1); }
      else { const x = { id: uid(), ...next }; data.movements.push(x); applyMove(x, 1); }
      closeSheet();
      commit(m ? 'Transferencia actualizada' : 'Transferencia registrada');
    };
  });
}

function markPaidForm(r, date) {
  const t = todayISO();
  const w0 = wallet(r.wallet) ? r.wallet : data.wallets[0].id;
  const amountFor = w => round2(convert(r.amount, r.currency, w.currency));
  const c = client(r.clientId);
  openSheet('Registrar cobro', `<form class="form">
    <p class="preview">${esc(r.name)}${c ? ` · ${esc(c.name)}` : ''} · ${fmtDate(date, { day: 'numeric', month: 'long' })}</p>
    ${moneyField('Monto recibido', 'amount', wallet(w0).currency, amountFor(wallet(w0)))}
    <label class="field"><span>Billetera</span><select name="wallet">${walletOptions(w0)}</select></label>
    <label class="field"><span>Fecha</span><input name="date" type="date" required value="${date <= t ? date : t}"></label>
    ${formActions('Registrar cobro')}
  </form>`, (form, el) => {
    el('wallet').addEventListener('change', () => {
      const w = wallet(el('wallet').value);
      form.querySelector('[data-cur="amount"]').textContent = CURRENCIES[w.currency];
      el('amount').value = amountFor(w);
    });
    form.onsubmit = e => {
      e.preventDefault();
      const w = wallet(el('wallet').value);
      const x = {
        id: uid(), type: 'in', amount: round2(el('amount').value), currency: w.currency, wallet: w.id,
        date: el('date').value, note: r.name, clientId: r.clientId || '', recId: r.id, occ: date,
      };
      if (!(x.amount > 0)) return toast('Ingresa un monto mayor a 0');
      data.movements.push(x);
      applyMove(x, 1);
      if (!r.done.includes(date)) r.done.push(date);
      closeSheet();
      commit('Cobro registrado');
    };
  });
}

function recurringForm(r = null) {
  const usd = data.wallets.find(w => w.currency === 'USD');
  const cur = r?.currency || (usd ? 'USD' : 'PEN');
  const w0 = r?.wallet || (data.wallets.find(w => w.currency === cur) || data.wallets[0]).id;
  const freq = r?.frequency || 'monthly';
  openSheet(r ? 'Editar cobro fijo' : 'Nuevo cobro fijo', `<form class="form">
    <label class="field"><span>Qué cobras</span><input name="title" required maxlength="60" value="${esc(r?.name || '')}" placeholder="Ej. Diseños para redes"></label>
    <label class="field"><span>Cliente</span><select name="clientId">${clientOptions(r?.clientId)}</select></label>
    <div class="grid2">
      ${moneyField('Monto', 'amount', cur, r?.amount)}
      <label class="field"><span>Moneda</span><select name="currency">${currencyOptions(cur)}</select></label>
    </div>
    <div class="segmented" role="radiogroup" aria-label="Frecuencia">
      <label><input type="radio" name="frequency" value="weekly"${freq === 'weekly' ? ' checked' : ''}><span>Semanal</span></label>
      <label><input type="radio" name="frequency" value="monthly"${freq === 'monthly' ? ' checked' : ''}><span>Mensual</span></label>
      <label><input type="radio" name="frequency" value="once"${freq === 'once' ? ' checked' : ''}><span>Una vez</span></label>
    </div>
    <div class="grid2">
      <label class="field"><span data-start-label>Primer cobro</span><input name="start" type="date" required value="${r?.start || todayISO()}"></label>
      <label class="field" data-end><span>Último cobro</span><input name="end" type="date" value="${r?.end || ''}"></label>
    </div>
    <label class="field"><span>Lo recibes en</span><select name="wallet">${walletOptions(w0)}</select></label>
    ${r ? `<label class="switch"><span>Activo</span><input type="checkbox" name="active"${r.active ? ' checked' : ''}></label>` : ''}
    <p class="preview" data-preview></p>
    ${r ? deleteButton('deleteRecurring', r.id) : ''}
    ${formActions()}
  </form>`, (form, el) => {
    bindClientSelect(el('clientId'));
    let walletTouched = !!r;
    el('wallet').addEventListener('change', () => { walletTouched = true; });
    const draft = () => ({ frequency: el('frequency').value, start: el('start').value, end: el('end').value, active: true, done: [] });
    const sync = () => {
      const once = el('frequency').value === 'once';
      form.querySelector('[data-end]').hidden = once;
      form.querySelector('[data-start-label]').textContent = once ? 'Fecha del cobro' : 'Primer cobro';
      form.querySelector('[data-cur="amount"]').textContent = CURRENCIES[el('currency').value];
      if (!walletTouched) {
        const match = data.wallets.find(w => w.currency === el('currency').value);
        if (match) el('wallet').value = match.id;
      }
      const d = draft();
      const next = d.start ? nextDate(d) : '';
      form.querySelector('[data-preview]').textContent = d.start
        ? `${freqText(d)}. ${next ? `Próximo cobro: ${fmtDate(next, { weekday: 'long', day: 'numeric', month: 'long' })}.` : 'Sin cobros próximos.'}`
        : '';
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    sync();
    form.onsubmit = e => {
      e.preventDefault();
      const once = el('frequency').value === 'once';
      const next = {
        name: el('title').value.trim(),
        clientId: el('clientId').value === '__new' ? '' : el('clientId').value,
        amount: round2(el('amount').value), currency: el('currency').value, frequency: el('frequency').value,
        start: el('start').value, end: once ? '' : el('end').value, wallet: el('wallet').value,
        active: r ? el('active').checked : true,
      };
      if (!next.name) return toast('Escribe qué cobras');
      if (!(next.amount > 0)) return toast('Ingresa un monto mayor a 0');
      if (next.end && next.end < next.start) return toast('El último cobro no puede ser antes del primero');
      if (r) Object.assign(r, next);
      else data.recurring.push({ id: uid(), ...next, done: [], since: next.start });
      closeSheet();
      commit(r ? 'Cobro fijo actualizado' : 'Cobro fijo creado');
    };
  });
}

function clientForm(c = null) {
  const s = c ? clientStats(c.id) : null;
  openSheet(c ? 'Editar cliente' : 'Nuevo cliente', `<form class="form">
    ${c ? `<div class="stats two"><div class="stat"><span>Cobrado en total</span><b>${money(s.total)}</b></div><div class="stat"><span>Cobros fijos al mes</span><b>${money(s.monthly)}</b></div></div>` : ''}
    <label class="field"><span>Nombre</span><input name="title" required maxlength="60" value="${esc(c?.name || '')}" placeholder="Ej. Estudio Norte"></label>
    <label class="field"><span>Nota</span><input name="note" maxlength="80" value="${esc(c?.note || '')}" placeholder="Ej. Diseño para redes"></label>
    ${c ? deleteButton('deleteClient', c.id) : ''}
    ${formActions()}
  </form>`, (form, el) => {
    if (!c) el('title').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const next = { name: el('title').value.trim(), note: el('note').value.trim() };
      if (!next.name) return toast('Escribe el nombre del cliente');
      if (c) Object.assign(c, next);
      else data.clients.push({ id: uid(), ...next });
      closeSheet();
      commit(c ? 'Cliente actualizado' : 'Cliente agregado');
    };
  });
}

function walletForm(w = null) {
  const cur = w?.currency || 'PEN';
  const balance = moneyField('Saldo actual', 'balance', cur, w ? w.balance : '', '');
  const name = `<label class="field"><span>Nombre</span><input name="title" required maxlength="30" value="${esc(w?.name || '')}" placeholder="Ej. BCP, Efectivo"></label>`;
  const currency = `<label class="field"><span>Moneda</span><select name="currency">${currencyOptions(cur)}</select></label>`;
  openSheet(w ? `Saldo de ${w.name}` : 'Nueva billetera', `<form class="form">
    ${w ? balance + name + currency : name + currency + balance}
    ${w && data.wallets.length > 1 ? deleteButton('deleteWallet', w.id, 'Eliminar billetera') : ''}
    ${formActions()}
  </form>`, (form, el) => {
    el('currency').addEventListener('change', () => { form.querySelector('[data-cur="balance"]').textContent = CURRENCIES[el('currency').value]; });
    const first = w ? el('balance') : el('title');
    first.focus();
    if (w) first.select();
    form.onsubmit = e => {
      e.preventDefault();
      const next = { name: el('title').value.trim(), currency: el('currency').value, balance: round2(el('balance').value) };
      if (!next.name) return toast('Escribe un nombre');
      if (w) Object.assign(w, next);
      else data.wallets.push({ id: uid(), ...next, color: data.wallets.length % COLORS.length });
      closeSheet();
      commit(w ? 'Saldo actualizado' : 'Billetera agregada');
    };
  });
}

// ── Acciones ──
const actions = {
  closeSheet,
  newIn: () => movementForm(null, 'in'),
  newOut: () => movementForm(null, 'out'),
  newTransfer: () => transferForm(),
  editMovement: d => {
    const m = data.movements.find(x => x.id === d.id);
    if (m) (m.type === 'transfer' ? transferForm(m) : movementForm(m));
  },
  deleteMovement: d => {
    const m = data.movements.find(x => x.id === d.id);
    if (!m || !confirm('¿Eliminar este movimiento? Su efecto en el saldo se revierte.')) return;
    applyMove(m, -1);
    data.movements = data.movements.filter(x => x !== m);
    const r = m.recId && recurring(m.recId);
    if (r) r.done = r.done.filter(x => x !== m.occ);
    closeSheet();
    commit('Movimiento eliminado');
  },
  markPaid: d => { const r = recurring(d.id); if (r) markPaidForm(r, d.date); },
  skipOcc: d => {
    const r = recurring(d.id);
    if (!r || !confirm(`¿Omitir el cobro del ${fmtDate(d.date, { day: 'numeric', month: 'long' })}?`)) return;
    r.done.push(d.date);
    commit('Cobro omitido');
  },
  newRecurring: () => recurringForm(),
  editRecurring: d => { const r = recurring(d.id); if (r) recurringForm(r); },
  deleteRecurring: d => {
    const r = recurring(d.id);
    if (!r || !confirm(`¿Eliminar el cobro fijo "${r.name}"? Los cobros ya registrados se conservan.`)) return;
    data.recurring = data.recurring.filter(x => x !== r);
    closeSheet();
    commit('Cobro fijo eliminado');
  },
  newClient: () => clientForm(),
  editClient: d => { const c = client(d.id); if (c) clientForm(c); },
  deleteClient: d => {
    const c = client(d.id);
    if (!c || !confirm(`¿Eliminar a ${c.name}? Sus cobros y movimientos se conservan sin cliente.`)) return;
    data.clients = data.clients.filter(x => x !== c);
    for (const x of [...data.recurring, ...data.movements]) if (x.clientId === c.id) x.clientId = '';
    closeSheet();
    commit('Cliente eliminado');
  },
  newWallet: () => walletForm(),
  editWallet: d => { const w = wallet(d.id); if (w) walletForm(w); },
  deleteWallet: d => {
    const w = wallet(d.id);
    if (!w || data.wallets.length < 2 || !confirm(`¿Eliminar la billetera ${w.name}? Sus movimientos se conservan.`)) return;
    data.wallets = data.wallets.filter(x => x !== w);
    for (const r of data.recurring) if (r.wallet === w.id) r.wallet = data.wallets[0].id;
    closeSheet();
    commit('Billetera eliminada');
  },
  prevMonth: () => { moveMonth = shiftMonth(moveMonth, -1); render(); },
  nextMonth: () => { moveMonth = shiftMonth(moveMonth, 1); render(); },
  filter: d => { moveFilter = d.f; render(); },
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
    toast('No se pudo obtener el tipo de cambio. Ingrésalo a mano.');
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
      if (!raw || (!raw.wallets && !raw.clients && !raw.movements)) throw new Error('formato');
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
document.addEventListener('submit', e => {
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
