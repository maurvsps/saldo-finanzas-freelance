/**
 * Saldo · buzón de atajos (Google Apps Script)
 *
 * Qué hace:
 *  - El atajo del iPhone (Tocar atrás) le manda cada gasto o ingreso (acción "add").
 *    Queda como una fila en la hoja «Pendientes».
 *  - La app Saldo pide los pendientes (acción "pending"), los suma a tus movimientos y
 *    los marca como recibidos (acción "ack").
 *  - La app le avisa qué categorías y contactos existen (acción "setmeta"), y el atajo las
 *    pide (acción "meta") para ofrecértelas como lista.
 *
 * Instalación: ver ios/GUIA-IPHONE.md. Resumen:
 *  1. Crea una hoja de cálculo de Google nueva. Menú Extensiones → Apps Script.
 *  2. Pega este archivo, cambia TOKEN por una clave larga tuya y guarda.
 *  3. Ejecuta una vez la función «configurar» (te pedirá permisos).
 *  4. Implementar → Nueva implementación → Aplicación web.
 *     Ejecutar como: Yo. Quién tiene acceso: Cualquier persona. Copia la URL que termina en /exec.
 */

// ── Cámbiala: es lo que impide que otra persona use tu buzón. Usa letras y números, sin espacios. ──
const TOKEN = 'CAMBIA-ESTA-CLAVE';
// Zona horaria para la fecha de cada movimiento.
const TZ = 'America/Lima';

const SHEET_PENDING = 'Pendientes';
const HEADERS = ['id', 'fecha', 'tipo', 'monto', 'categoria', 'contacto', 'nota', 'estado', 'recibido'];
const DEFAULT_META = {
  expense: ['Comida', 'Transporte', 'Vivienda', 'Servicios', 'Salud', 'Ocio', 'Compras', 'Trabajo', 'Impuestos', 'Otros'],
  income: ['Cobro', 'Yape recibido', 'Regalo', 'Reembolso', 'Venta', 'Otros'],
  contacts: [],
};

/** Ejecútala una vez a mano: crea la hoja «Pendientes» y autoriza los permisos. */
function configurar() {
  sheet_();
  Logger.log('Listo. Ahora publica el script como aplicación web.');
}

function doGet(e) {
  return respond_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ ok: false, error: 'json' });
  }
  return respond_(body);
}

function respond_(p) {
  if (!p.token || String(p.token) !== TOKEN) return out_({ ok: false, error: 'clave' });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return out_({ ok: false, error: 'ocupado' });
  }
  try {
    switch (String(p.action || 'ping')) {
      case 'ping': return out_({ ok: true });
      case 'add': return out_(add_(p));
      case 'pending': return out_(pending_());
      case 'ack': return out_(ack_(p.ids));
      case 'meta': return out_(Object.assign({ ok: true }, getMeta_()));
      case 'setmeta': return out_(setMeta_(p));
      default: return out_({ ok: false, error: 'accion' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_PENDING);
  if (!sh) {
    sh = ss.insertSheet(SHEET_PENDING);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  sh.getRange('A:B').setNumberFormat('@'); // id y fecha como texto, para que Sheets no los convierta
  return sh;
}

function today_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function dateText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v || '');
}

function add_(p) {
  const amount = Number(String(p.amount === undefined ? '' : p.amount).replace(',', '.'));
  if (!(amount > 0)) return { ok: false, error: 'monto' };
  const id = String(p.id || Utilities.getUuid()).slice(0, 64);
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last > 1) {
    const ids = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) return { ok: true, duplicado: true, id: id };
    }
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) ? String(p.date) : today_();
  sh.appendRow([
    id,
    date,
    p.kind === 'in' ? 'in' : 'out',
    Math.round(amount * 100) / 100,
    String(p.category || '').trim() || 'Otros',
    String(p.contact || '').trim(),
    String(p.note || '').trim(),
    'pendiente',
    '',
  ]);
  return { ok: true, id: id };
}

function pending_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  const items = [];
  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (String(r[7]) !== 'pendiente') continue;
      items.push({
        id: String(r[0]),
        date: dateText_(r[1]),
        kind: r[2] === 'in' ? 'in' : 'out',
        amount: Number(r[3]) || 0,
        category: String(r[4] || ''),
        contact: String(r[5] || ''),
        note: String(r[6] || ''),
      });
    }
  }
  return { ok: true, items: items };
}

function ack_(ids) {
  const set = {};
  (Array.isArray(ids) ? ids : []).forEach(function (id) { set[String(id)] = true; });
  const sh = sheet_();
  const last = sh.getLastRow();
  let n = 0;
  if (last > 1) {
    const range = sh.getRange(2, 1, last - 1, HEADERS.length);
    const rows = range.getValues();
    const stamp = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm');
    rows.forEach(function (r) {
      if (set[String(r[0])] && String(r[7]) === 'pendiente') { r[7] = 'recibido'; r[8] = stamp; n++; }
    });
    if (n) range.setValues(rows);
  }
  return { ok: true, marcados: n };
}

function getMeta_() {
  const raw = PropertiesService.getScriptProperties().getProperty('meta');
  if (!raw) return DEFAULT_META;
  try {
    const m = JSON.parse(raw);
    return {
      expense: Array.isArray(m.expense) && m.expense.length ? m.expense : DEFAULT_META.expense,
      income: Array.isArray(m.income) && m.income.length ? m.income : DEFAULT_META.income,
      contacts: Array.isArray(m.contacts) ? m.contacts : [],
    };
  } catch (err) {
    return DEFAULT_META;
  }
}

function setMeta_(p) {
  const clean = function (a) {
    return (Array.isArray(a) ? a : []).map(function (x) { return String(x).trim(); }).filter(Boolean).slice(0, 60);
  };
  PropertiesService.getScriptProperties().setProperty('meta', JSON.stringify({
    expense: clean(p.expense),
    income: clean(p.income),
    contacts: clean(p.contacts),
  }));
  return { ok: true };
}
