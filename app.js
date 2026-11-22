'use strict';

// ── Configuración ──
// Versión publicada: debe coincidir con version.json y con el ?v= de index.html.
const APP_VERSION = 53;
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
const COLORS = ['#0a84ff', '#b48cff', '#5fa8ff', '#ffa24c', '#5ac8fa', '#ff7a95'];
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
  Comida: ['utensils', '#ffa24c'], Transporte: ['bus', '#5fa8ff'], Vivienda: ['home', '#b48cff'], Servicios: ['bolt', '#f4cb4f'],
  Salud: ['heart', '#ff7a95'], Ocio: ['gamepad', '#5ac8fa'], Compras: ['bag', '#f472d0'], Trabajo: ['briefcase', '#0a84ff'],
  Impuestos: ['percent', '#8e8e93'], Otros: ['dots', '#7d9486'],
  Cobro: ['banknote', '#0a84ff'], 'Yape recibido': ['phone', '#b48cff'], Regalo: ['gift', '#f472d0'], Reembolso: ['refresh', '#5fa8ff'], Venta: ['tag', '#ffa24c'],
};
const CAT_ICONS = ['utensils', 'coffee', 'bus', 'car', 'home', 'bolt', 'wifi', 'heart', 'gamepad', 'bag', 'briefcase', 'percent', 'gift', 'book', 'plane', 'tag', 'star', 'user', 'banknote', 'dots'];
const CAT_COLORS = ['#0a84ff', '#5fa8ff', '#b48cff', '#f472d0', '#ff7a95', '#ffa24c', '#f4cb4f', '#5ac8fa', '#8e8e93', '#0a84ff'];
// Colores de categorías creadas antes del tema oscuro → su versión clara (mismo tono).
const OLD_CAT_COLORS = ['#2f7a59', '#2563a8', '#7b3fa0', '#c2478a', '#a8445a', '#b26a2c', '#946013', '#3f7f88', '#646c66', '#1b211e'];
const liveColor = c => (OLD_CAT_COLORS.includes(c) ? CAT_COLORS[OLD_CAT_COLORS.indexOf(c)] : c);
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
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .82.51l-2.83 10.25a1 1 0 0 1-.96.74H5.8a1 1 0 0 1-.96-.74L2.01 6.01a.5.5 0 0 1 .82-.51l4.27 3.66a1 1 0 0 0 1.52-.29z"/><path d="M5 21h14"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4M22 5h-4"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  medal: '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
};
// Iconos estilo iOS (Ionicons, MIT): contorno y, para las pestañas activas, relleno
const ION = {"home":{"o":"<path d=\"M80 212v236a16 16 0 0016 16h96V328a24 24 0 0124-24h80a24 24 0 0124 24v136h96a16 16 0 0016-16V212\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M480 256L266.89 52c-5-5.28-16.69-5.34-21.78 0L32 256M400 179V64h-48v69\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>","f":"<path d=\"M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z\"/><path d=\"M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0043 267.56L250.5 69.28a8 8 0 0111.06 0l207.52 198.28a16 16 0 0022.59-.44c6.14-6.36 5.63-16.86-.76-22.97z\"/>"},"banknote":{"o":"<rect x=\"32\" y=\"80\" width=\"448\" height=\"256\" rx=\"16\" ry=\"16\" transform=\"rotate(180 256 208)\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M64 384h384M96 432h320\"/><circle cx=\"256\" cy=\"208\" r=\"80\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M480 160a80 80 0 01-80-80M32 160a80 80 0 0080-80M480 256a80 80 0 00-80 80M32 256a80 80 0 0180 80\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>","f":"<path d=\"M448 400H64a16 16 0 010-32h384a16 16 0 010 32zM416 448H96a16 16 0 010-32h320a16 16 0 010 32zM32 272H16v48a32 32 0 0032 32h48v-16a64.07 64.07 0 00-64-64z\"/><path d=\"M480 240h16v-64h-16a96.11 96.11 0 01-96-96V64H128v16a96.11 96.11 0 01-96 96H16v64h16a96.11 96.11 0 0196 96v16h256v-16a96.11 96.11 0 0196-96zm-224 64a96 96 0 1196-96 96.11 96.11 0 01-96 96z\"/><circle cx=\"256\" cy=\"208\" r=\"64\"/><path d=\"M416 336v16h48a32 32 0 0032-32v-48h-16a64.07 64.07 0 00-64 64zM480 144h16V96a32 32 0 00-32-32h-48v16a64.07 64.07 0 0064 64zM96 80V64H48a32 32 0 00-32 32v48h16a64.07 64.07 0 0064-64z\"/>"},"users":{"o":"<path d=\"M402 168c-2.93 40.67-33.1 72-66 72s-63.12-31.32-66-72c-3-42.31 26.37-72 66-72s69 30.46 66 72z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M336 304c-65.17 0-127.84 32.37-143.54 95.41-2.08 8.34 3.15 16.59 11.72 16.59h263.65c8.57 0 13.77-8.25 11.72-16.59C463.85 335.36 401.18 304 336 304z\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><path d=\"M200 185.94c-2.34 32.48-26.72 58.06-53 58.06s-50.7-25.57-53-58.06C91.61 152.15 115.34 128 147 128s55.39 24.77 53 57.94z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M206 306c-18.05-8.27-37.93-11.45-59-11.45-52 0-102.1 25.85-114.65 76.2-1.65 6.66 2.53 13.25 9.37 13.25H154\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"32\"/>","f":"<path d=\"M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z\"/>"},"settings":{"o":"<path d=\"M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>","f":"<circle cx=\"256\" cy=\"256\" r=\"48\"/><path d=\"M470.39 300l-.47-.38-31.56-24.75a16.11 16.11 0 01-6.1-13.33v-11.56a16 16 0 016.11-13.22L469.92 212l.47-.38a26.68 26.68 0 005.9-34.06l-42.71-73.9a1.59 1.59 0 01-.13-.22A26.86 26.86 0 00401 92.14l-.35.13-37.1 14.93a15.94 15.94 0 01-14.47-1.29q-4.92-3.1-10-5.86a15.94 15.94 0 01-8.19-11.82l-5.59-39.59-.12-.72A27.22 27.22 0 00298.76 26h-85.52a26.92 26.92 0 00-26.45 22.39l-.09.56-5.57 39.67a16 16 0 01-8.13 11.82 175.21 175.21 0 00-10 5.82 15.92 15.92 0 01-14.43 1.27l-37.13-15-.35-.14a26.87 26.87 0 00-32.48 11.34l-.13.22-42.77 73.95a26.71 26.71 0 005.9 34.1l.47.38 31.56 24.75a16.11 16.11 0 016.1 13.33v11.56a16 16 0 01-6.11 13.22L42.08 300l-.47.38a26.68 26.68 0 00-5.9 34.06l42.71 73.9a1.59 1.59 0 01.13.22 26.86 26.86 0 0032.45 11.3l.35-.13 37.07-14.93a15.94 15.94 0 0114.47 1.29q4.92 3.11 10 5.86a15.94 15.94 0 018.19 11.82l5.56 39.59.12.72A27.22 27.22 0 00213.24 486h85.52a26.92 26.92 0 0026.45-22.39l.09-.56 5.57-39.67a16 16 0 018.18-11.82c3.42-1.84 6.76-3.79 10-5.82a15.92 15.92 0 0114.43-1.27l37.13 14.95.35.14a26.85 26.85 0 0032.48-11.34 2.53 2.53 0 01.13-.22l42.71-73.89a26.7 26.7 0 00-5.89-34.11zm-134.48-40.24a80 80 0 11-83.66-83.67 80.21 80.21 0 0183.66 83.67z\"/>"},"plus":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M256 112v288M400 256H112\"/>"},"minus":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M400 256H112\"/>"},"list":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"48\" d=\"M160 144h288M160 256h288M160 368h288\"/><circle cx=\"80\" cy=\"144\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"80\" cy=\"256\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"80\" cy=\"368\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"x":{"o":"<path d=\"M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z\"/>"},"check":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M416 128L192 384l-96-96\"/>"},"chevronLeft":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"48\" d=\"M328 112L184 256l144 144\"/>"},"chevronRight":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"48\" d=\"M184 112l144 144-144 144\"/>"},"chevronDown":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"48\" d=\"M112 184l144 144 144-144\"/>"},"chevronUp":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"48\" d=\"M112 328l144-144 144 144\"/>"},"edit":{"o":"<path d=\"M384 224v184a40 40 0 01-40 40H104a40 40 0 01-40-40V168a40 40 0 0140-40h167.48\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M459.94 53.25a16.06 16.06 0 00-23.22-.56L424.35 65a8 8 0 000 11.31l11.34 11.32a8 8 0 0011.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38zM399.34 90L218.82 270.2a9 9 0 00-2.31 3.93L208.16 299a3.91 3.91 0 004.86 4.86l24.85-8.35a9 9 0 003.93-2.31L422 112.66a9 9 0 000-12.66l-9.95-10a9 9 0 00-12.71 0z\"/>"},"trash":{"o":"<path d=\"M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"32\" d=\"M80 112h352\"/><path d=\"M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"cloud":{"o":"<path d=\"M400 240c-8.89-89.54-71-144-144-144-69 0-113.44 48.2-128 96-60 6-112 43.59-112 112 0 66 54 112 120 112h260c55 0 100-27.44 100-88 0-59.82-53-85.76-96-88z\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"phone":{"o":"<rect x=\"128\" y=\"16\" width=\"256\" height=\"480\" rx=\"48\" ry=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M176 16h24a8 8 0 018 8h0a16 16 0 0016 16h64a16 16 0 0016-16h0a8 8 0 018-8h24\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"upload":{"o":"<path d=\"M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69 0-113.44 45.79-128 91.2-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M320 255.79l-64-64-64 64M256 448.21V207.79\"/>"},"download":{"o":"<path d=\"M320 336h76c55 0 100-21.21 100-75.6s-53-73.47-96-75.6C391.11 99.74 329 48 256 48c-69 0-113.44 45.79-128 91.2-60 5.7-112 35.88-112 98.4S70 336 136 336h56M192 400.1l64 63.9 64-63.9M256 224v224.03\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"receipt":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M160 336V48l32 16 32-16 31.94 16 32.37-16L320 64l31.79-16 31.93 16L416 48l32.01 16L480 48v224\"/><path d=\"M480 272v112a80 80 0 01-80 80h0a80 80 0 01-80-80v-48H48a15.86 15.86 0 00-16 16c0 64 6.74 112 80 112h288\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M224 144h192M288 224h128\"/>","f":"<path d=\"M483.82 32.45a16.28 16.28 0 00-11.23 1.37L448 46.1l-24.8-12.4a16 16 0 00-14.31 0l-25.11 12.41L359 33.7a16 16 0 00-14.36 0L320 46.07l-24.45-12.34a16 16 0 00-14.35-.06L256 46.12l-24.8-12.43a16.05 16.05 0 00-14.33 0L192 46.1l-24.84-12.41a16 16 0 00-19.36 3.94 16.25 16.25 0 00-3.8 10.65V288l.05.05H336a32 32 0 0132 32V424c0 30.93 33.07 56 64 56h12a52 52 0 0052-52V48a16 16 0 00-12.18-15.55zM416 240H288.5c-8.64 0-16.1-6.64-16.48-15.28A16 16 0 01288 208h127.5c8.64 0 16.1 6.64 16.48 15.28A16 16 0 01416 240zm0-80H224.5c-8.64 0-16.1-6.64-16.48-15.28A16 16 0 01224 128h191.5c8.64 0 16.1 6.64 16.48 15.28A16 16 0 01416 160z\"/><path d=\"M336 424v-88a16 16 0 00-16-16H48a32.1 32.1 0 00-32 32.05c0 50.55 5.78 71.57 14.46 87.57C45.19 466.79 71.86 480 112 480h245.68a4 4 0 002.85-6.81C351.07 463.7 336 451 336 424z\"/>"},"utensils":{"o":"<path d=\"M57.49 47.74l368.43 368.43a37.28 37.28 0 010 52.72h0a37.29 37.29 0 01-52.72 0l-90-91.55a32 32 0 01-9.2-22.43v-5.53a32 32 0 00-9.52-22.78l-11.62-10.73a32 32 0 00-29.8-7.44h0a48.53 48.53 0 01-46.56-12.63l-85.43-85.44C40.39 159.68 21.74 83.15 57.49 47.74z\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M400 32l-77.25 77.25A64 64 0 00304 154.51v14.86a16 16 0 01-4.69 11.32L288 192M320 224l11.31-11.31a16 16 0 0111.32-4.69h14.86a64 64 0 0045.26-18.75L480 112M440 72l-80 80M200 368l-99.72 100.28a40 40 0 01-56.56 0h0a40 40 0 010-56.56L128 328\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"coffee":{"o":"<path d=\"M368 80h64a16 16 0 0116 16v34a46 46 0 01-46 46h-34M96 80h272v192a80 80 0 01-80 80H176a80 80 0 01-80-80V80h0zM64 416h336\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"bus":{"o":"<rect x=\"80\" y=\"112\" width=\"352\" height=\"192\" rx=\"32\" ry=\"32\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><rect x=\"80\" y=\"304\" width=\"352\" height=\"128\" rx=\"32\" ry=\"32\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M400 112H112a32.09 32.09 0 01-32-32h0a32.09 32.09 0 0132-32h288a32.09 32.09 0 0132 32h0a32.09 32.09 0 01-32 32zM144 432v22a10 10 0 01-10 10h-28a10 10 0 01-10-10v-22zM416 432v22a10 10 0 01-10 10h-28a10 10 0 01-10-10v-22z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"368\" cy=\"368\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"144\" cy=\"368\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M256 112v192M80 80v288M432 80v288\"/>"},"car":{"o":"<path d=\"M80 224l37.78-88.15C123.93 121.5 139.6 112 157.11 112h197.78c17.51 0 33.18 9.5 39.33 23.85L432 224M80 224h352v144H80zM112 368v32H80v-32M432 368v32h-32v-32\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"144\" cy=\"288\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"368\" cy=\"288\" r=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"bolt":{"o":"<path d=\"M315.27 33L96 304h128l-31.51 173.23a2.36 2.36 0 002.33 2.77h0a2.36 2.36 0 001.89-.95L416 208H288l31.66-173.25a2.45 2.45 0 00-2.44-2.75h0a2.42 2.42 0 00-1.95 1z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"wifi":{"o":"<path d=\"M318.586 363.5L256 424l-62.586-60.5S212 336 256 336s62.586 27.5 62.586 27.5zM407.31 278L372 312s-41-46-116-46-116 46-116 46l-35.31-34S142.5 214 256 214s151.31 64 151.31 64z\" stroke=\"currentColor\" stroke-width=\"32\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M496 192l-36.69 35.5S386.5 141 256 141 52.69 227.5 52.69 227.5L16 192S88 88 256 88s240 104 240 104z\" stroke=\"currentColor\" stroke-width=\"32\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"},"heart":{"o":"<path d=\"M352.92 80C288 80 256 144 256 144s-32-64-96.92-64c-52.76 0-94.54 44.14-95.08 96.81-1.1 109.33 86.73 187.08 183 252.42a16 16 0 0018 0c96.26-65.34 184.09-143.09 183-252.42-.54-52.67-42.32-96.81-95.08-96.81z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"gamepad":{"o":"<path d=\"M467.51 248.83c-18.4-83.18-45.69-136.24-89.43-149.17A91.5 91.5 0 00352 96c-26.89 0-48.11 16-96 16s-69.15-16-96-16a99.09 99.09 0 00-27.2 3.66C89 112.59 61.94 165.7 43.33 248.83c-19 84.91-15.56 152 21.58 164.88 26 9 49.25-9.61 71.27-37 25-31.2 55.79-40.8 119.82-40.8s93.62 9.6 118.66 40.8c22 27.41 46.11 45.79 71.42 37.16 41.02-14.01 40.44-79.13 21.43-165.04z\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><circle cx=\"292\" cy=\"224\" r=\"20\"/><path d=\"M336 288a20 20 0 1120-19.95A20 20 0 01336 288z\"/><circle cx=\"336\" cy=\"180\" r=\"20\"/><circle cx=\"380\" cy=\"224\" r=\"20\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M160 176v96M208 224h-96\"/>"},"bag":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M80 176a16 16 0 00-16 16v216c0 30.24 25.76 56 56 56h272c30.24 0 56-24.51 56-54.75V192a16 16 0 00-16-16zM160 176v-32a96 96 0 0196-96h0a96 96 0 0196 96v32\"/>"},"briefcase":{"o":"<rect x=\"32\" y=\"128\" width=\"448\" height=\"320\" rx=\"48\" ry=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M144 128V96a32 32 0 0132-32h160a32 32 0 0132 32v32M480 240H32M320 240v24a8 8 0 01-8 8H200a8 8 0 01-8-8v-24\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"gift":{"o":"<path d=\"M256 104v56h56a56 56 0 10-56-56zM256 104v56h-56a56 56 0 1156-56z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><rect x=\"64\" y=\"160\" width=\"384\" height=\"112\" rx=\"32\" ry=\"32\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M416 272v144a48 48 0 01-48 48H144a48 48 0 01-48-48V272M256 160v304\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"book":{"o":"<path d=\"M256 160c16-63.16 76.43-95.41 208-96a15.94 15.94 0 0116 16v288a16 16 0 01-16 16c-128 0-177.45 25.81-208 64-30.37-38-80-64-208-64-9.88 0-16-8.05-16-17.93V80a15.94 15.94 0 0116-16c131.57.59 192 32.84 208 96zM256 160v288\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"plane":{"o":"<path d=\"M407.72 224c-3.4 0-14.79.1-18 .3l-64.9 1.7a1.83 1.83 0 01-1.69-.9L193.55 67.56a9 9 0 00-6.66-3.56H160l73 161a2.35 2.35 0 01-2.26 3.35l-121.69 1.8a8.06 8.06 0 01-6.6-3.1l-37-45c-3-3.9-8.62-6-13.51-6H33.08c-1.29 0-1.1 1.21-.75 2.43l19.84 71.42a16.3 16.3 0 010 11.9L32.31 333c-.59 1.95-.52 3 1.77 3H52c8.14 0 9.25-1.06 13.41-6.3l37.7-45.7a8.19 8.19 0 016.6-3.1l120.68 2.7a2.7 2.7 0 012.43 3.74L160 448h26.64a9 9 0 006.65-3.55L323.14 287c.39-.6 2-.9 2.69-.9l63.9 1.7c3.3.2 14.59.3 18 .3C452 288.1 480 275.93 480 256s-27.88-32-72.28-32z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"tag":{"o":"<path d=\"M435.25 48h-122.9a14.46 14.46 0 00-10.2 4.2L56.45 297.9a28.85 28.85 0 000 40.7l117 117a28.85 28.85 0 0040.7 0L459.75 210a14.46 14.46 0 004.2-10.2v-123a28.66 28.66 0 00-28.7-28.8z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M384 160a32 32 0 1132-32 32 32 0 01-32 32z\"/>"},"star":{"o":"<path d=\"M480 208H308L256 48l-52 160H32l140 96-54 160 138-100 138 100-54-160z\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"user":{"o":"<path d=\"M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304z\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32\"/>"},"refresh":{"o":"<path d=\"M320 146s24.36-12-64-12a160 160 0 10160 160\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M256 58l80 80-80 80\"/>"},"flame":{"o":"<path d=\"M112 320c0-93 124-165 96-272 66 0 192 96 192 272a144 144 0 01-288 0z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M320 368c0 57.71-32 80-64 80s-64-22.29-64-80 40-86 32-128c42 0 96 70.29 96 128z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"trophy":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M176 464h160M256 464V336M384 224c0-50.64-.08-134.63-.12-160a16 16 0 00-16-16l-223.79.26a16 16 0 00-16 15.95c0 30.58-.13 129.17-.13 159.79 0 64.28 83 112 128 112S384 288.28 384 224z\"/><path d=\"M128 96H48v16c0 55.22 33.55 112 80 112M384 96h80v16c0 55.22-33.55 112-80 112\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>","f":"<path d=\"M464 80h-60.1a4 4 0 01-4-4V63.92a32 32 0 00-32-31.92l-223.79.26a32 32 0 00-31.94 31.93V76a4 4 0 01-4 4H48a16 16 0 00-16 16v16c0 54.53 30 112.45 76.52 125.35a7.82 7.82 0 015.55 5.9c5.77 26.89 23.52 52.5 51.41 73.61 20.91 15.83 45.85 27.5 68.27 32.48a8 8 0 016.25 7.8V444a4 4 0 01-4 4h-59.55c-8.61 0-16 6.62-16.43 15.23A16 16 0 00176 480h159.55c8.61 0 16-6.62 16.43-15.23A16 16 0 00336 448h-60a4 4 0 01-4-4v-86.86a8 8 0 016.25-7.8c22.42-5 47.36-16.65 68.27-32.48 27.89-21.11 45.64-46.72 51.41-73.61a7.82 7.82 0 015.55-5.9C450 224.45 480 166.53 480 112V96a16 16 0 00-16-16zM112 198.22a4 4 0 01-6 3.45c-10.26-6.11-17.75-15.37-22.14-21.89-11.91-17.69-19-40.67-19.79-63.63a4 4 0 014-4.15h40a4 4 0 014 4c-.02 27.45-.07 58.87-.07 82.22zm316.13-18.44c-4.39 6.52-11.87 15.78-22.13 21.89a4 4 0 01-6-3.46c0-26.51 0-56.63-.05-82.21a4 4 0 014-4h40a4 4 0 014 4.15c-.79 22.96-7.9 45.94-19.81 63.63z\"/>"},"target":{"o":"<circle cx=\"256\" cy=\"256\" r=\"208\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><circle cx=\"256\" cy=\"256\" r=\"96\" fill=\"none\" stroke=\"currentColor\" stroke-miterlimit=\"10\" stroke-width=\"32\"/><circle cx=\"256\" cy=\"256\" r=\"32\"/>"},"zap":{"o":"<path d=\"M315.27 33L96 304h128l-31.51 173.23a2.36 2.36 0 002.33 2.77h0a2.36 2.36 0 001.89-.95L416 208H288l31.66-173.25a2.45 2.45 0 00-2.44-2.75h0a2.42 2.42 0 00-1.95 1z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"lock":{"o":"<path d=\"M336 208v-95a80 80 0 00-160 0v95\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><rect x=\"96\" y=\"208\" width=\"320\" height=\"272\" rx=\"48\" ry=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"shield":{"o":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M336 176L225.2 304 176 255.8\"/><path d=\"M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"sparkles":{"o":"<path d=\"M259.92 262.91L216.4 149.77a9 9 0 00-16.8 0l-43.52 113.14a9 9 0 01-5.17 5.17L37.77 311.6a9 9 0 000 16.8l113.14 43.52a9 9 0 015.17 5.17l43.52 113.14a9 9 0 0016.8 0l43.52-113.14a9 9 0 015.17-5.17l113.14-43.52a9 9 0 000-16.8l-113.14-43.52a9 9 0 01-5.17-5.17zM108 68L88 16 68 68 16 88l52 20 20 52 20-52 52-20-52-20zM426.67 117.33L400 48l-26.67 69.33L304 144l69.33 26.67L400 240l26.67-69.33L496 144l-69.33-26.67z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"rocket":{"o":"<path d=\"M461.81 53.81a4.4 4.4 0 00-3.3-3.39c-54.38-13.3-180 34.09-248.13 102.17a294.9 294.9 0 00-33.09 39.08c-21-1.9-42-.3-59.88 7.5-50.49 22.2-65.18 80.18-69.28 105.07a9 9 0 009.8 10.4l81.07-8.9a180.29 180.29 0 001.1 18.3 18.15 18.15 0 005.3 11.09l31.39 31.39a18.15 18.15 0 0011.1 5.3 179.91 179.91 0 0018.19 1.1l-8.89 81a9 9 0 0010.39 9.79c24.9-4 83-18.69 105.07-69.17 7.8-17.9 9.4-38.79 7.6-59.69a293.91 293.91 0 0039.19-33.09c68.38-68 115.47-190.86 102.37-247.95zM298.66 213.67a42.7 42.7 0 1160.38 0 42.65 42.65 0 01-60.38 0z\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M109.64 352a45.06 45.06 0 00-26.35 12.84C65.67 382.52 64 448 64 448s65.52-1.67 83.15-19.31A44.73 44.73 0 00160 402.32\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"medal":{"o":"<circle cx=\"256\" cy=\"352\" r=\"112\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><circle cx=\"256\" cy=\"352\" r=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M147 323L41.84 159.32a32 32 0 01-1.7-31.61l31-62A32 32 0 0199.78 48h312.44a32 32 0 0128.62 17.69l31 62a32 32 0 01-1.7 31.61L365 323M371 144H37M428.74 52.6L305 250M140.55 144L207 250\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\"/>"},"link":{"o":"<path d=\"M208 352h-64a96 96 0 010-192h64M304 160h64a96 96 0 010 192h-64M163.29 256h187.42\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"36\"/>"},"wallet":{"o":"<rect x=\"48\" y=\"144\" width=\"416\" height=\"288\" rx=\"48\" ry=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M411.36 144v-30A50 50 0 00352 64.9L88.64 109.85A50 50 0 0048 159v49\" fill=\"none\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"32\"/><path d=\"M368 320a32 32 0 1132-32 32 32 0 01-32 32z\"/>"},"dots":{"o":"<circle cx=\"256\" cy=\"256\" r=\"48\"/><circle cx=\"416\" cy=\"256\" r=\"48\"/><circle cx=\"96\" cy=\"256\" r=\"48\"/>"}};
const icon = (name, cls = '', filled = false) => { const n = ION[name]; if (n) return `<svg class="ic ${cls}" width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">${filled && n.f ? n.f : n.o}</svg>`; return `<svg class="ic ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`; };

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
    planned: [], // gastos previstos: { id, amount, category, note, contact, date, repeat: 'none' | 'weekly' | 'monthly' }
    incomeCategories: [], // categorías de ingreso creadas por ti
    yape: { opening: 0 }, // saldo de Yape antes de los movimientos anotados
    catStyles: {}, // icono y color de las categorías que creas: { nombre: { icon, color } }
    contacts: [], // contactos frecuentes: { id, name, uses, lastKind, lastCategory }
    horizon: '', // fecha de la previsión en Inicio (AAAA-MM-DD); vacía = fin de este mes
    // Billetera unida a Gastos: su saldo es el que calculan tus movimientos (una sola fuente de verdad).
    spendWallet: 'yape',
    linkConflict: null, // { wallet, gastos }: saldos distintos encontrados al unir Yape (se elige uno una vez)
    goals: { income: 0, budget: 0 }, // meta de ingresos y presupuesto de gastos del mes, en soles
    game: { seen: null, level: 1, days: [], intro: false }, // logros ya celebrados, nivel celebrado, días con actividad
  };
}
// Saldo neto de una lista de movimientos de Gastos.
const netOf = list => list.reduce((t, x) => t + (x.kind === 'in' ? 1 : x.kind === 'adj' ? 1 : -1) * (x.kind === 'adj' ? Number(x.amount) || 0 : Math.abs(Number(x.amount) || 0)), 0);

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
    planned: arr(raw.planned).filter(x => x && Number(x.amount) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(x.date || '')).map(x => ({ id: x.id || uid(), amount: round2(x.amount), category: String(x.category || 'Otros'), note: String(x.note || ''), contact: String(x.contact || ''), date: x.date, repeat: x.repeat === 'weekly' || x.repeat === 'monthly' ? x.repeat : 'none' })),
    incomeCategories: arr(raw.incomeCategories).map(String),
    yape: { opening: round2(raw.yape?.opening) },
    catStyles: raw.catStyles && typeof raw.catStyles === 'object' ? raw.catStyles : {},
    contacts: arr(raw.contacts).filter(c => c && c.name).map(c => ({ id: c.id || uid(), name: String(c.name), uses: Number(c.uses) || 0, lastKind: c.lastKind === 'in' ? 'in' : 'out', lastCategory: String(c.lastCategory || '') })),
    plan: { ...d.plan, ...(raw.plan || {}) },
    horizon: raw.horizon || d.horizon,
    spendWallet: raw.spendWallet !== undefined ? String(raw.spendWallet || '') : (wallets.find(w => w.id === 'yape' && w.currency === 'PEN') || wallets.find(w => /yape/i.test(w.name) && w.currency === 'PEN'))?.id || '',
    linkConflict: raw.linkConflict || null,
    goals: { income: Math.max(0, Number(raw.goals?.income) || 0), budget: Math.max(0, Number(raw.goals?.budget) || 0) },
    game: {
      seen: Array.isArray(raw.game?.seen) ? raw.game.seen.map(String) : null,
      level: Number(raw.game?.level) || 1,
      days: arr(raw.game?.days).filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s)),
      intro: Boolean(raw.game?.intro),
    },
  };
}
// Primera vez con la billetera unida: si Gastos no tiene movimientos, su saldo arranca con el de la billetera;
// si ambos tienen saldos distintos, se le pregunta una vez cuál es el real.
function linkFirstTime(raw, d) {
  if (raw.spendWallet !== undefined) return d;
  const w = d.wallets.find(x => x.id === d.spendWallet);
  if (!w) return d;
  if (!d.expenses.length) d.yape.opening = round2(w.balance);
  else {
    const g = round2(d.yape.opening + netOf(d.expenses));
    if (Math.abs(g - w.balance) > 0.009 && w.balance) d.linkConflict = { wallet: round2(w.balance), gastos: g };
  }
  return d;
}

// Convierte cualquier versión guardada al formato actual.
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return blank();
  if (raw.version === 4) return linkFirstTime(raw, normalize(raw));
  if (raw.version === 3) return linkFirstTime(raw, normalize(fromV3(raw)));
  return linkFirstTime(raw, normalize(fromV3(raw.version === 2 ? fromV2(raw) : fromV1(raw))));
}

function load() {
  for (const k of [KEY, OLD_KEY]) {
    try { const raw = JSON.parse(localStorage.getItem(k)); if (raw) return migrate(raw); } catch {}
  }
  return blank();
}

let data = load();
let viewMonth = thisMonth();

function save() {
  syncLinked();
  data.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  queueCloudSave();
}
// Guardar después de algo que hiciste.
function persist() {
  const t = todayISO();
  if (!data.game.days.includes(t)) data.game.days = [...data.game.days, t].slice(-400);
  save();
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
// ── Iconos tipo Atajos de iOS: cuadro de color con degradado y símbolo blanco (Ionicons, MIT) ──
const TILE_GLYPHS = {"wallet":"<path d=\"M95.5 104h320a87.73 87.73 0 0111.18.71 66 66 0 00-77.51-55.56L86 94.08h-.3a66 66 0 00-41.07 26.13A87.57 87.57 0 0195.5 104zM415.5 128h-320a64.07 64.07 0 00-64 64v192a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V192a64.07 64.07 0 00-64-64zM368 320a32 32 0 1132-32 32 32 0 01-32 32z\"/><path d=\"M32 259.5V160c0-21.67 12-58 53.65-65.87C121 87.5 156 87.5 156 87.5s23 16 4 16-18.5 24.5 0 24.5 0 23.5 0 23.5L85.5 236z\"/>","card":"<path d=\"M32 376a56 56 0 0056 56h336a56 56 0 0056-56V222H32zm66-76a30 30 0 0130-30h48a30 30 0 0130 30v20a30 30 0 01-30 30h-48a30 30 0 01-30-30zM424 80H88a56 56 0 00-56 56v26h448v-26a56 56 0 00-56-56z\"/>","cash":"<path d=\"M448 400H64a16 16 0 010-32h384a16 16 0 010 32zM416 448H96a16 16 0 010-32h320a16 16 0 010 32zM32 272H16v48a32 32 0 0032 32h48v-16a64.07 64.07 0 00-64-64z\"/><path d=\"M480 240h16v-64h-16a96.11 96.11 0 01-96-96V64H128v16a96.11 96.11 0 01-96 96H16v64h16a96.11 96.11 0 0196 96v16h256v-16a96.11 96.11 0 0196-96zm-224 64a96 96 0 1196-96 96.11 96.11 0 01-96 96z\"/><circle cx=\"256\" cy=\"208\" r=\"64\"/><path d=\"M416 336v16h48a32 32 0 0032-32v-48h-16a64.07 64.07 0 00-64 64zM480 144h16V96a32 32 0 00-32-32h-48v16a64.07 64.07 0 0064 64zM96 80V64H48a32 32 0 00-32 32v48h16a64.07 64.07 0 0064-64z\"/>","business":"<path d=\"M432 176H320V64a48 48 0 00-48-48H80a48 48 0 00-48 48v416a16 16 0 0016 16h104a8 8 0 008-8v-71.55c0-8.61 6.62-16 15.23-16.43A16 16 0 01192 416v72a8 8 0 008 8h264a16 16 0 0016-16V224a48 48 0 00-48-48zM98.08 431.87a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm80 240a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm80 320a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zm0-80a16 16 0 1113.79-13.79 16 16 0 01-13.79 13.79zM444 464H320V208h112a16 16 0 0116 16v236a4 4 0 01-4 4z\"/><path d=\"M400 400a16 16 0 1016 16 16 16 0 00-16-16zM400 320a16 16 0 1016 16 16 16 0 00-16-16zM400 240a16 16 0 1016 16 16 16 0 00-16-16zM336 400a16 16 0 1016 16 16 16 0 00-16-16zM336 320a16 16 0 1016 16 16 16 0 00-16-16zM336 240a16 16 0 1016 16 16 16 0 00-16-16z\"/>","phone-portrait":"<path d=\"M336 0H176a64 64 0 00-64 64v384a64 64 0 0064 64h160a64 64 0 0064-64V64a64 64 0 00-64-64zm32 448a32 32 0 01-32 32H176a32 32 0 01-32-32V64a32 32 0 0132-32h11.35a7.94 7.94 0 017.3 4.75A32 32 0 00224 56h64a32 32 0 0029.35-19.25 7.94 7.94 0 017.3-4.75H336a32 32 0 0132 32z\"/><path d=\"M336 48a11.88 11.88 0 00-9.53 4.69A48 48 0 01288 72h-64a48 48 0 01-38.47-19.31A11.88 11.88 0 00176 48a16 16 0 00-16 16v384a16 16 0 0016 16h160a16 16 0 0016-16V64a16 16 0 00-16-16z\"/><path d=\"M336 0H176a64 64 0 00-64 64v384a64 64 0 0064 64h160a64 64 0 0064-64V64a64 64 0 00-64-64zm32 448a32 32 0 01-32 32H176a32 32 0 01-32-32V64a32 32 0 0132-32h11.35a7.94 7.94 0 017.3 4.75A32 32 0 00224 56h64a32 32 0 0029.35-19.25 7.94 7.94 0 017.3-4.75H336a32 32 0 0132 32z\"/>","globe":"<path d=\"M340.75 344.49c5.91-20.7 9.82-44.75 11.31-67.84a4.41 4.41 0 00-4.46-4.65h-71.06a4.43 4.43 0 00-4.47 4.39v55.3a4.44 4.44 0 004.14 4.38 273.51 273.51 0 0159 11.39 4.45 4.45 0 005.54-2.97zM323.58 377.31a260.05 260.05 0 00-46.6-9.09 4.42 4.42 0 00-4.91 4.29v65.24a4.47 4.47 0 006.76 3.7c15.9-9.27 29-24.84 40.84-45.43 1.94-3.36 4.89-9.15 6.67-12.69a4.29 4.29 0 00-2.76-6.02zM235.29 368.4a256.85 256.85 0 00-46.56 8.82c-2.64.76-3.75 4.4-2.55 6.79 1.79 3.56 4 8.11 5.89 11.51 13 23 26.84 37.5 41.24 45.93a4.47 4.47 0 006.76-3.7v-65.27a4.16 4.16 0 00-4.78-4.08zM235.6 272h-71.06a4.41 4.41 0 00-4.46 4.64c1.48 23.06 5.37 47.16 11.26 67.84a4.46 4.46 0 005.59 3 272.2 272.2 0 0159-11.36 4.44 4.44 0 004.15-4.38V276.4a4.43 4.43 0 00-4.48-4.4zM277 143.78a235.8 235.8 0 0046.5-9.14 4.3 4.3 0 002.76-6c-1.79-3.57-4.27-8.68-6.17-12.09-12.29-22-26.14-37.35-41.24-46a4.48 4.48 0 00-6.76 3.7v65.23a4.43 4.43 0 004.91 4.3zM276.54 240h71.06a4.39 4.39 0 004.46-4.58c-1.48-22.77-5.27-47.8-11.16-68.22a4.46 4.46 0 00-5.59-2.95c-19 5.74-38.79 10.43-59.09 12a4.4 4.4 0 00-4.15 4.32v55.11a4.4 4.4 0 004.47 4.32zM233.31 70.56c-15.42 8.57-29.17 24.43-41.47 46.37-1.91 3.41-4.19 8.11-6 11.67a4.31 4.31 0 002.76 6 225.42 225.42 0 0046.54 9.17 4.43 4.43 0 004.91-4.29V74.26a4.49 4.49 0 00-6.74-3.7zM235.92 176.26c-20.3-1.55-40.11-6.24-59.09-12a4.46 4.46 0 00-5.59 2.95c-5.89 20.42-9.68 45.45-11.16 68.22a4.39 4.39 0 004.46 4.58h71.06a4.4 4.4 0 004.47-4.34v-55.09a4.4 4.4 0 00-4.15-4.32z\"/><path d=\"M414.39 97.61A224 224 0 1097.61 414.39 224 224 0 10414.39 97.61zM176.6 430.85a219.08 219.08 0 01-12.48-19.66c-2-3.69-4.84-9.26-6.73-13.13a7.29 7.29 0 00-10.31-3.16c-4.3 2.41-10 5.72-14.13 8.43a147.29 147.29 0 01-23.57-22.43 248.83 248.83 0 0130.41-18.36c1.86-1 2.77-2.14 2.18-4.18a374.8 374.8 0 01-14.09-82.17 4.36 4.36 0 00-4.3-4.17H66.84a2 2 0 01-2-1.7A98.28 98.28 0 0164 256a96.27 96.27 0 01.86-14.29 2 2 0 012-1.7h56.74c2.29 0 4.17-1.32 4.29-3.63a372.71 372.71 0 0114-81.83 4.36 4.36 0 00-2.19-5.11 260.63 260.63 0 01-29.84-17.9 169.82 169.82 0 0123.14-22.8c4.08 2.68 9.4 5.71 13.66 8.11a7.89 7.89 0 0011-3.42c1.88-3.87 4-8.18 6.06-11.88a221.93 221.93 0 0112.54-19.91A185 185 0 01256 64c28.94 0 55.9 7 80.53 18.46a202.23 202.23 0 0112 19c2.59 4.66 5.34 10.37 7.66 15.32a4.29 4.29 0 005.92 1.94c5.38-2.91 11.21-6.26 16.34-9.63a171.36 171.36 0 0123.2 23 244.89 244.89 0 01-29.06 17.31 4.35 4.35 0 00-2.18 5.12 348.68 348.68 0 0113.85 81.4 4.33 4.33 0 004.3 4.12l56.62-.07a2 2 0 012 1.7 117.46 117.46 0 010 28.62 2 2 0 01-2 1.72h-56.67a4.35 4.35 0 00-4.3 4.17 367.4 367.4 0 01-13.87 81.3 4.45 4.45 0 002.19 5.19c5 2.59 10.57 5.48 15.37 8.42s9.55 6.08 14.13 9.34a172.73 172.73 0 01-23 22.93c-2.44-1.61-5.34-3.44-7.84-4.94-1.72-1-4.89-2.77-6.65-3.76-3.82-2.14-7.88-.54-9.79 3.4s-4.83 9.59-6.87 13.25a212.42 212.42 0 01-12.35 19.53C310.91 442.37 284.94 448 256 448s-54.77-5.63-79.4-17.15z\"/>","briefcase":"<path d=\"M336 80H176a16 16 0 00-16 16v16h192V96a16 16 0 00-16-16z\" fill=\"none\"/><path d=\"M496 176a64.07 64.07 0 00-64-64h-48V96a48.05 48.05 0 00-48-48H176a48.05 48.05 0 00-48 48v16H80a64.07 64.07 0 00-64 64v48h480zm-144-64H160V96a16 16 0 0116-16h160a16 16 0 0116 16zM336 264a24 24 0 01-24 24H200a24 24 0 01-24-24v-4a4 4 0 00-4-4H16v144a64 64 0 0064 64h352a64 64 0 0064-64V256H340a4 4 0 00-4 4z\"/>","person":"<path d=\"M332.64 64.58C313.18 43.57 286 32 256 32c-30.16 0-57.43 11.5-76.8 32.38-19.58 21.11-29.12 49.8-26.88 80.78C156.76 206.28 203.27 256 256 256s99.16-49.71 103.67-110.82c2.27-30.7-7.33-59.33-27.03-80.6zM432 480H80a31 31 0 01-24.2-11.13c-6.5-7.77-9.12-18.38-7.18-29.11C57.06 392.94 83.4 353.61 124.8 326c36.78-24.51 83.37-38 131.2-38s94.42 13.5 131.2 38c41.4 27.6 67.74 66.93 76.18 113.75 1.94 10.73-.68 21.34-7.18 29.11A31 31 0 01432 480z\"/>","people":"<path d=\"M336 256c-20.56 0-40.44-9.18-56-25.84-15.13-16.25-24.37-37.92-26-61-1.74-24.62 5.77-47.26 21.14-63.76S312 80 336 80c23.83 0 45.38 9.06 60.7 25.52 15.47 16.62 23 39.22 21.26 63.63-1.67 23.11-10.9 44.77-26 61C376.44 246.82 356.57 256 336 256zm66-88zM467.83 432H204.18a27.71 27.71 0 01-22-10.67 30.22 30.22 0 01-5.26-25.79c8.42-33.81 29.28-61.85 60.32-81.08C264.79 297.4 299.86 288 336 288c36.85 0 71 9 98.71 26.05 31.11 19.13 52 47.33 60.38 81.55a30.27 30.27 0 01-5.32 25.78A27.68 27.68 0 01467.83 432zM147 260c-35.19 0-66.13-32.72-69-72.93-1.42-20.6 5-39.65 18-53.62 12.86-13.83 31-21.45 51-21.45s38 7.66 50.93 21.57c13.1 14.08 19.5 33.09 18 53.52-2.87 40.2-33.8 72.91-68.93 72.91zM212.66 291.45c-17.59-8.6-40.42-12.9-65.65-12.9-29.46 0-58.07 7.68-80.57 21.62-25.51 15.83-42.67 38.88-49.6 66.71a27.39 27.39 0 004.79 23.36A25.32 25.32 0 0041.72 400h111a8 8 0 007.87-6.57c.11-.63.25-1.26.41-1.88 8.48-34.06 28.35-62.84 57.71-83.82a8 8 0 00-.63-13.39c-1.57-.92-3.37-1.89-5.42-2.89z\"/>","storefront":"<path d=\"M480 448h-12a4 4 0 01-4-4V273.51a4 4 0 00-5.24-3.86 104.92 104.92 0 01-28.32 4.78c-1.18 0-2.3.05-3.4.05a108.22 108.22 0 01-52.85-13.64 8.23 8.23 0 00-8 0 108.18 108.18 0 01-52.84 13.64 106.11 106.11 0 01-52.46-13.79 8.21 8.21 0 00-8.09 0 108.14 108.14 0 01-53.16 13.8 106.19 106.19 0 01-52.77-14 8.25 8.25 0 00-8.16 0 106.19 106.19 0 01-52.77 14c-1.09 0-2.19 0-3.37-.05h-.06a104.91 104.91 0 01-29.28-5.09 4 4 0 00-5.23 3.8V444a4 4 0 01-4 4H32.5c-8.64 0-16.1 6.64-16.48 15.28A16 16 0 0032 480h447.5c8.64 0 16.1-6.64 16.48-15.28A16 16 0 00480 448zm-256-68a4 4 0 01-4 4h-88a4 4 0 01-4-4v-64a12 12 0 0112-12h72a12 12 0 0112 12zm156 68h-72a4 4 0 01-4-4V316a12 12 0 0112-12h56a12 12 0 0112 12v128a4 4 0 01-4 4zM492.57 170.28l-42.92-98.49C438.41 47.62 412.74 32 384.25 32H127.7c-28.49 0-54.16 15.62-65.4 39.79l-42.92 98.49c-9 19.41 2.89 39.34 2.9 39.35l.28.45c.49.78 1.36 2 1.89 2.78.05.06.09.13.14.2l5 6.05a7.45 7.45 0 00.6.65l5 4.83.42.36a69.65 69.65 0 009.39 6.78v.05a74 74 0 0036 10.67h2.47a76.08 76.08 0 0051.89-20.31l.33-.31a7.94 7.94 0 0110.89 0l.33.31a77.3 77.3 0 00104.46 0 8 8 0 0110.87 0 77.31 77.31 0 00104.21.23 7.88 7.88 0 0110.71 0 76.81 76.81 0 0052.31 20.08h2.49a71.35 71.35 0 0035-10.7c.95-.57 1.86-1.17 2.78-1.77A71.33 71.33 0 00488 212.17l1.74-2.63q.26-.4.48-.84c1.66-3.38 10.56-20.76 2.35-38.42z\"/>","cafe":"<path d=\"M432 64H96a16 16 0 00-16 16v192a96.11 96.11 0 0096 96h112a96.11 96.11 0 0096-96v-80h18a62.07 62.07 0 0062-62V96a32 32 0 00-32-32zm0 66a30 30 0 01-30 30h-18V96h48zM400 400H64a16 16 0 000 32h336a16 16 0 000-32z\"/>","restaurant":"<path d=\"M357.57 223.94a79.48 79.48 0 0056.58-23.44l77-76.95c6.09-6.09 6.65-16 .85-22.39a16 16 0 00-23.17-.56l-68.63 68.58a12.29 12.29 0 01-17.37 0c-4.79-4.78-4.53-12.86.25-17.64l68.33-68.33a16 16 0 00-.56-23.16A15.62 15.62 0 00440.27 56a16.71 16.71 0 00-11.81 4.9l-68.27 68.26a12.29 12.29 0 01-17.37 0c-4.78-4.78-4.53-12.86.25-17.64l68.33-68.31a16 16 0 00-.56-23.16A15.62 15.62 0 00400.26 16a16.73 16.73 0 00-11.81 4.9L311.5 97.85a79.49 79.49 0 00-23.44 56.59v8.23a16 16 0 01-4.69 11.33l-35.61 35.62a4 4 0 01-5.66 0L68.82 36.33a16 16 0 00-22.58-.06C31.09 51.28 23 72.47 23 97.54c-.1 41.4 21.66 89 56.79 124.08l85.45 85.45A64.79 64.79 0 00211 326a64 64 0 0016.21-2.08 16.24 16.24 0 014.07-.53 15.93 15.93 0 0110.83 4.25l11.39 10.52a16.12 16.12 0 014.6 11.23v5.54a47.73 47.73 0 0013.77 33.65l90.05 91.57.09.1a53.29 53.29 0 0075.36-75.37L302.39 269.9a4 4 0 010-5.66L338 228.63a16 16 0 0111.32-4.69z\"/><path d=\"M211 358a97.32 97.32 0 01-68.36-28.25l-13.86-13.86a8 8 0 00-11.3 0l-85 84.56c-15.15 15.15-20.56 37.45-13.06 59.29a30.63 30.63 0 001.49 3.6C31 484 50.58 496 72 496a55.68 55.68 0 0039.64-16.44L225 365.66a4.69 4.69 0 001.32-3.72v-.26a4.63 4.63 0 00-5.15-4.27A97.09 97.09 0 01211 358z\"/>","car":"<path d=\"M447.68 220.78a16 16 0 00-1-3.08l-37.78-88.16C400.19 109.17 379 96 354.89 96H157.11c-24.09 0-45.3 13.17-54 33.54L65.29 217.7A15.72 15.72 0 0064 224v176a16 16 0 0016 16h32a16 16 0 0016-16v-16h256v16a16 16 0 0016 16h32a16 16 0 0016-16V224a16.15 16.15 0 00-.32-3.22zM144 320a32 32 0 1132-32 32 32 0 01-32 32zm224 0a32 32 0 1132-32 32 32 0 01-32 32zM104.26 208l28.23-65.85C136.11 133.69 146 128 157.11 128h197.78c11.1 0 21 5.69 24.62 14.15L407.74 208z\"/>","bus":"<path d=\"M400 32H112a48 48 0 00-48 48v320a47.91 47.91 0 0016 35.74V454a26 26 0 0026 26h28a26 26 0 0026-26v-6h192v6a26 26 0 0026 26h28a26 26 0 0026-26v-18.26A47.91 47.91 0 00448 400V80a48 48 0 00-48-48zM147.47 399.82a32 32 0 1128.35-28.35 32 32 0 01-28.35 28.35zM236 288H112a16 16 0 01-16-16V144a16 16 0 0116-16h124a4 4 0 014 4v152a4 4 0 01-4 4zm20-192H112.46c-8.6 0-16-6.6-16.44-15.19A16 16 0 01112 64h287.54c8.6 0 16 6.6 16.44 15.19A16 16 0 01400 96H256zm20 32h124a16 16 0 0116 16v128a16 16 0 01-16 16H276a4 4 0 01-4-4V132a4 4 0 014-4zm60.18 243.47a32 32 0 1128.35 28.35 32 32 0 01-28.35-28.35z\"/>","home":"<path d=\"M261.56 101.28a8 8 0 00-11.06 0L66.4 277.15a8 8 0 00-2.47 5.79L63.9 448a32 32 0 0032 32H192a16 16 0 0016-16V328a8 8 0 018-8h80a8 8 0 018 8v136a16 16 0 0016 16h96.06a32 32 0 0032-32V282.94a8 8 0 00-2.47-5.79z\"/><path d=\"M490.91 244.15l-74.8-71.56V64a16 16 0 00-16-16h-48a16 16 0 00-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0043 267.56L250.5 69.28a8 8 0 0111.06 0l207.52 198.28a16 16 0 0022.59-.44c6.14-6.36 5.63-16.86-.76-22.97z\"/>","bag":"<path d=\"M454.65 169.4A31.82 31.82 0 00432 160h-64v-16a112 112 0 00-224 0v16H80a32 32 0 00-32 32v216c0 39 33 72 72 72h272a72.22 72.22 0 0050.48-20.55 69.48 69.48 0 0021.52-50.2V192a31.75 31.75 0 00-9.35-22.6zM176 144a80 80 0 01160 0v16H176z\"/>","gift":"<path d=\"M200 144h40v-40a40 40 0 10-40 40zM352 104a40 40 0 00-80 0v40h40a40 40 0 0040-40z\" fill=\"none\"/><path d=\"M80 416a64 64 0 0064 64h92a4 4 0 004-4V292a4 4 0 00-4-4H88a8 8 0 00-8 8zM240 252V144h32v108a4 4 0 004 4h140a47.93 47.93 0 0016-2.75A48.09 48.09 0 00464 208v-16a48 48 0 00-48-48h-40.54a2 2 0 01-1.7-3A72 72 0 00256 58.82 72 72 0 00138.24 141a2 2 0 01-1.7 3H96a48 48 0 00-48 48v16a48.09 48.09 0 0032 45.25A47.93 47.93 0 0096 256h140a4 4 0 004-4zm32-148a40 40 0 1140 40h-40zm-74.86-39.9A40 40 0 01240 104v40h-40a40 40 0 01-2.86-79.89zM276 480h92a64 64 0 0064-64V296a8 8 0 00-8-8H276a4 4 0 00-4 4v184a4 4 0 004 4z\"/>","heart":"<path d=\"M256 448a32 32 0 01-18-5.57c-78.59-53.35-112.62-89.93-131.39-112.8-40-48.75-59.15-98.8-58.61-153C48.63 114.52 98.46 64 159.08 64c44.08 0 74.61 24.83 92.39 45.51a6 6 0 009.06 0C278.31 88.81 308.84 64 352.92 64c60.62 0 110.45 50.52 111.08 112.64.54 54.21-18.63 104.26-58.61 153-18.77 22.87-52.8 59.45-131.39 112.8a32 32 0 01-18 5.56z\"/>","star":"<path d=\"M394 480a16 16 0 01-9.39-3L256 383.76 127.39 477a16 16 0 01-24.55-18.08L153 310.35 23 221.2a16 16 0 019-29.2h160.38l48.4-148.95a16 16 0 0130.44 0l48.4 149H480a16 16 0 019.05 29.2L359 310.35l50.13 148.53A16 16 0 01394 480z\"/>","flash":"<path d=\"M194.82 496a18.36 18.36 0 01-18.1-21.53v-.11L204.83 320H96a16 16 0 01-12.44-26.06L302.73 23a18.45 18.45 0 0132.8 13.71c0 .3-.08.59-.13.89L307.19 192H416a16 16 0 0112.44 26.06L209.24 489a18.45 18.45 0 01-14.42 7z\"/>","flame":"<path d=\"M394.23 197.56a300.43 300.43 0 00-53.37-90C301.2 61.65 249.05 32 208 32a16 16 0 00-15.48 20c13.87 53-14.88 97.07-45.31 143.72C122 234.36 96 274.27 96 320c0 88.22 71.78 160 160 160s160-71.78 160-160c0-43.3-7.32-84.49-21.77-122.44zm-105.9 221.13C278 429.69 265.05 432 256 432s-22-2.31-32.33-13.31S208 390.24 208 368c0-25.14 8.82-44.28 17.34-62.78 4.95-10.74 10-21.67 13-33.37a8 8 0 0112.49-4.51A126.48 126.48 0 01275 292c18.17 24 29 52.42 29 76 0 22.24-5.42 39.77-15.67 50.69z\"/>","rocket":"<path d=\"M328.85 156.79a26.69 26.69 0 1018.88 7.81 26.6 26.6 0 00-18.88-7.81z\"/><path d=\"M477.44 50.06a.29.29 0 010-.09 20.4 20.4 0 00-15.13-15.3c-29.8-7.27-76.68.48-128.63 21.28-52.36 21-101.42 52-134.58 85.22A320.7 320.7 0 00169.55 175c-22.33-1-42 2.18-58.57 9.41-57.74 25.41-74.23 90.44-78.62 117.14a25 25 0 0027.19 29h.13l64.32-7.02c.08.82.17 1.57.24 2.26a34.36 34.36 0 009.9 20.72l31.39 31.41a34.27 34.27 0 0020.71 9.91l2.15.23-7 64.24v.13A25 25 0 00206 480a25.25 25.25 0 004.15-.34C237 475.34 302 459.05 327.34 401c7.17-16.46 10.34-36.05 9.45-58.34a314.78 314.78 0 0033.95-29.55c33.43-33.26 64.53-81.92 85.31-133.52 20.69-51.36 28.48-98.59 21.39-129.53zM370.38 224.94a58.77 58.77 0 110-83.07 58.3 58.3 0 010 83.07z\"/><path d=\"M161.93 386.44a16 16 0 00-11 2.67c-6.39 4.37-12.81 8.69-19.29 12.9-13.11 8.52-28.79-6.44-21-20l12.15-21a16 16 0 00-15.16-24.91A61.25 61.25 0 0072 353.56c-3.66 3.67-14.79 14.81-20.78 57.26A357.94 357.94 0 0048 447.59 16 16 0 0064 464h.4a359.87 359.87 0 0036.8-3.2c42.47-6 53.61-17.14 57.27-20.8a60.49 60.49 0 0017.39-35.74 16 16 0 00-13.93-17.82z\"/>","planet":"<path d=\"M96.85 286.62a8 8 0 00-12.53 8.25C102.07 373.28 172.3 432 256 432a175.31 175.31 0 0052.41-8 8 8 0 00.79-15 1120 1120 0 01-109.48-55.61 1126.24 1126.24 0 01-102.87-66.77zM492.72 339.51c-4.19-5.58-9.11-11.44-14.7-17.53a15.83 15.83 0 00-26.56 5.13c0 .16-.11.31-.17.47a15.75 15.75 0 003.15 16.06c22.74 25 26.42 38.51 25.48 41.36-2 2.23-17.05 6.89-58.15-3.53q-8.83-2.24-19.32-5.46-6.76-2.08-13.79-4.49a176.76 176.76 0 0019.54-27.25c.17-.29.35-.58.52-.88A175.39 175.39 0 00432 256a178.87 178.87 0 00-1-19c-9.57-88.17-84.4-157-175-157a175.37 175.37 0 00-106.4 35.89 177.4 177.4 0 00-45.83 51.84c-.16.29-.34.58-.51.87a175.48 175.48 0 00-13.83 30.52q-5.59-4.87-10.79-9.67c-5.39-5-10.17-9.63-14.42-14-29.57-30.26-33.09-45.61-32.16-48.45 2-2.23 15.54-5.87 48.62 1.31A15.82 15.82 0 0096.22 123l.36-.44a15.74 15.74 0 00-8.67-25.43A237.38 237.38 0 0064.13 93c-30.72-3.53-50.83 2.52-59.78 18-3.24 5.58-6.35 15.09-2.72 28.6C7 159.66 26.14 184 53.23 209.5c8.63 8.13 18.06 16.37 28.12 24.64 7.32 6 15 12.06 22.9 18.08q7.91 6 16.15 12T137.1 276c25.41 17.61 52.26 34.52 78.59 49.69q14.34 8.26 28.64 16t28.37 14.81c21.9 11 43.35 20.92 63.86 29.43q13.19 5.48 25.81 10.16c11.89 4.42 23.37 8.31 34.31 11.59l1.1.33c25.73 7.66 47.42 11.69 64.48 12H464c21.64 0 36.3-6.38 43.58-19 9.09-15.62 4.08-36.32-14.86-61.5z\"/>","musical-notes":"<path d=\"M421.84 37.37a25.86 25.86 0 00-22.6-4.46L199.92 86.49A32.3 32.3 0 00176 118v226c0 6.74-4.36 12.56-11.11 14.83l-.12.05-52 18C92.88 383.53 80 402 80 423.91a55.54 55.54 0 0023.23 45.63A54.78 54.78 0 00135.34 480a55.82 55.82 0 0017.75-2.93l.38-.13 21.84-7.94A47.84 47.84 0 00208 423.91v-212c0-7.29 4.77-13.21 12.16-15.07l.21-.06L395 150.14a4 4 0 015 3.86v141.93c0 6.75-4.25 12.38-11.11 14.68l-.25.09-50.89 18.11A49.09 49.09 0 00304 375.92a55.67 55.67 0 0023.23 45.8 54.63 54.63 0 0049.88 7.35l.36-.12 21.84-7.95A47.83 47.83 0 00432 375.92V58a25.74 25.74 0 00-10.16-20.63z\"/>","camera":"<circle cx=\"256\" cy=\"272\" r=\"64\"/><path d=\"M432 144h-59c-3 0-6.72-1.94-9.62-5l-25.94-40.94a15.52 15.52 0 00-1.37-1.85C327.11 85.76 315 80 302 80h-92c-13 0-25.11 5.76-34.07 16.21a15.52 15.52 0 00-1.37 1.85l-25.94 41c-2.22 2.42-5.34 5-8.62 5v-8a16 16 0 00-16-16h-24a16 16 0 00-16 16v8h-4a48.05 48.05 0 00-48 48V384a48.05 48.05 0 0048 48h352a48.05 48.05 0 0048-48V192a48.05 48.05 0 00-48-48zM256 368a96 96 0 1196-96 96.11 96.11 0 01-96 96z\"/>","film":"<path d=\"M436 80H76a44.05 44.05 0 00-44 44v264a44.05 44.05 0 0044 44h360a44.05 44.05 0 0044-44V124a44.05 44.05 0 00-44-44zM112 388a12 12 0 01-12 12H76a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12H76a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12H76a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12H76a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm241.68 124H158.32a16 16 0 010-32h195.36a16 16 0 110 32zM448 388a12 12 0 01-12 12h-24a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12h-24a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12h-24a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12zm0-80a12 12 0 01-12 12h-24a12 12 0 01-12-12v-24a12 12 0 0112-12h24a12 12 0 0112 12z\"/>","videocam":"<path d=\"M464 384.39a32 32 0 01-13-2.77 15.77 15.77 0 01-2.71-1.54l-82.71-58.22A32 32 0 01352 295.7v-79.4a32 32 0 0113.58-26.16l82.71-58.22a15.77 15.77 0 012.71-1.54 32 32 0 0145 29.24v192.76a32 32 0 01-32 32zM268 400H84a68.07 68.07 0 01-68-68V180a68.07 68.07 0 0168-68h184.48A67.6 67.6 0 01336 179.52V332a68.07 68.07 0 01-68 68z\"/>","game-controller":"<path d=\"M483.13 245.38C461.92 149.49 430 98.31 382.65 84.33A107.13 107.13 0 00352 80c-13.71 0-25.65 3.34-38.28 6.88C298.5 91.15 281.21 96 256 96s-42.51-4.84-57.76-9.11C185.6 83.34 173.67 80 160 80a115.74 115.74 0 00-31.73 4.32c-47.1 13.92-79 65.08-100.52 161C4.61 348.54 16 413.71 59.69 428.83a56.62 56.62 0 0018.64 3.22c29.93 0 53.93-24.93 70.33-45.34 18.53-23.1 40.22-34.82 107.34-34.82 59.95 0 84.76 8.13 106.19 34.82 13.47 16.78 26.2 28.52 38.9 35.91 16.89 9.82 33.77 12 50.16 6.37 25.82-8.81 40.62-32.1 44-69.24 2.57-28.48-1.39-65.89-12.12-114.37zM208 240h-32v32a16 16 0 01-32 0v-32h-32a16 16 0 010-32h32v-32a16 16 0 0132 0v32h32a16 16 0 010 32zm84 4a20 20 0 1120-20 20 20 0 01-20 20zm44 44a20 20 0 1120-19.95A20 20 0 01336 288zm0-88a20 20 0 1120-20 20 20 0 01-20 20zm44 44a20 20 0 1120-20 20 20 0 01-20 20z\"/>","laptop":"<path d=\"M496 400h-28.34A47.92 47.92 0 00480 367.86V128.14A48.2 48.2 0 00431.86 80H80.14A48.2 48.2 0 0032 128.14v239.72A47.92 47.92 0 0044.34 400H16a16 16 0 000 32h480a16 16 0 000-32z\"/>","desktop":"<path d=\"M16 352a48.05 48.05 0 0048 48h133.88l-4 32H144a16 16 0 000 32h224a16 16 0 000-32h-49.88l-4-32H448a48.05 48.05 0 0048-48v-48H16zm240-16a16 16 0 11-16 16 16 16 0 0116-16zM496 96a48.05 48.05 0 00-48-48H64a48.05 48.05 0 00-48 48v192h480z\"/>","code-slash":"<path d=\"M160 389a20.91 20.91 0 01-13.82-5.2l-128-112a21 21 0 010-31.6l128-112a21 21 0 0127.66 31.61L63.89 256l109.94 96.19A21 21 0 01160 389zM352 389a21 21 0 01-13.84-36.81L448.11 256l-109.94-96.19a21 21 0 0127.66-31.61l128 112a21 21 0 010 31.6l-128 112A20.89 20.89 0 01352 389zM208 437a21 21 0 01-20.12-27l96-320a21 21 0 1140.23 12l-96 320A21 21 0 01208 437z\"/>","brush":"<path d=\"M233.15 360.11a15.7 15.7 0 01-4.92-.77 16 16 0 01-10.92-13c-2.15-15-19.95-32.46-36.62-35.85a16 16 0 01-8.69-26.33l211.09-235.1c.19-.22.39-.43.59-.63a56.57 56.57 0 0179.89 0 56.51 56.51 0 01.11 79.78l-219 227a16 16 0 01-11.53 4.9zM119.89 480.11c-32.14 0-65.45-16.89-84.85-43a16 16 0 0112.85-25.54c5.34 0 20-4.87 20-20.57 0-39.07 31.4-70.86 70-70.86s70 31.79 70 70.86c0 49.12-39.48 89.11-88 89.11z\"/>","color-palette":"<path d=\"M441 336.2l-.06-.05c-9.93-9.18-22.78-11.34-32.16-12.92l-.69-.12c-9.05-1.49-10.48-2.5-14.58-6.17-2.44-2.17-5.35-5.65-5.35-9.94s2.91-7.77 5.34-9.94l30.28-26.87c25.92-22.91 40.2-53.66 40.2-86.59s-14.25-63.68-40.2-86.6c-35.89-31.59-85-49-138.37-49C223.72 48 162 71.37 116 112.11c-43.87 38.77-68 90.71-68 146.24s24.16 107.47 68 146.23c21.75 19.24 47.49 34.18 76.52 44.42a266.17 266.17 0 0086.87 15h1.81c61 0 119.09-20.57 159.39-56.4 9.7-8.56 15.15-20.83 15.34-34.56.21-14.17-5.37-27.95-14.93-36.84zM112 208a32 32 0 1132 32 32 32 0 01-32-32zm40 135a32 32 0 1132-32 32 32 0 01-32 32zm40-199a32 32 0 1132 32 32 32 0 01-32-32zm64 271a48 48 0 1148-48 48 48 0 01-48 48zm72-239a32 32 0 1132-32 32 32 0 01-32 32z\"/>","pencil":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"44\" d=\"M358.62 129.28L86.49 402.08 70 442l39.92-16.49 272.8-272.13-24.1-24.1zM413.07 74.84l-11.79 11.78 24.1 24.1 11.79-11.79a16.51 16.51 0 000-23.34l-.75-.75a16.51 16.51 0 00-23.35 0z\"/>","book":"<path d=\"M202.24 74C166.11 56.75 115.61 48.3 48 48a31.36 31.36 0 00-17.92 5.33A32 32 0 0016 79.9V366c0 19.34 13.76 33.93 32 33.93 71.07 0 142.36 6.64 185.06 47a4.11 4.11 0 006.94-3V106.82a15.89 15.89 0 00-5.46-12A143 143 0 00202.24 74zM481.92 53.3A31.33 31.33 0 00464 48c-67.61.3-118.11 8.71-154.24 26a143.31 143.31 0 00-32.31 20.78 15.93 15.93 0 00-5.45 12v337.13a3.93 3.93 0 006.68 2.81c25.67-25.5 70.72-46.82 185.36-46.81a32 32 0 0032-32v-288a32 32 0 00-14.12-26.61z\"/>","school":"<path d=\"M256 368a16 16 0 01-7.94-2.11L108 285.84a8 8 0 00-12 6.94V368a16 16 0 008.23 14l144 80a16 16 0 0015.54 0l144-80a16 16 0 008.23-14v-75.22a8 8 0 00-12-6.94l-140.06 80.05A16 16 0 01256 368z\"/><path d=\"M495.92 190.5v-.11a16 16 0 00-8-12.28l-224-128a16 16 0 00-15.88 0l-224 128a16 16 0 000 27.78l224 128a16 16 0 0015.88 0L461 221.28a2 2 0 013 1.74v144.53c0 8.61 6.62 16 15.23 16.43A16 16 0 00496 368V192a14.76 14.76 0 00-.08-1.5z\"/>","medkit":"<path d=\"M336 64H176a16 16 0 00-16 16v16h192V80a16 16 0 00-16-16z\" fill=\"none\"/><path d=\"M432 96h-48V80a48.05 48.05 0 00-48-48H176a48.05 48.05 0 00-48 48v16H80a64.07 64.07 0 00-64 64v256a64 64 0 0064 64h352a64 64 0 0064-64V160a64.07 64.07 0 00-64-64zm-96 208h-64v64a16 16 0 01-32 0v-64h-64a16 16 0 010-32h64v-64a16 16 0 0132 0v64h64a16 16 0 010 32zm16-208H160V80a16 16 0 0116-16h160a16 16 0 0116 16z\"/>","paw":"<path d=\"M490.39 182.75c-5.55-13.19-14.77-22.7-26.67-27.49l-.16-.06a46.46 46.46 0 00-17-3.2h-.64c-27.24.41-55.05 23.56-69.19 57.61-10.37 24.9-11.56 51.68-3.18 71.64 5.54 13.2 14.78 22.71 26.73 27.5l.13.05a46.53 46.53 0 0017 3.2c27.5 0 55.6-23.15 70-57.65 10.24-24.87 11.37-51.63 2.98-71.6zM381.55 329.61c-15.71-9.44-30.56-18.37-40.26-34.41C314.53 250.8 298.37 224 256 224s-58.57 26.8-85.39 71.2c-9.72 16.06-24.6 25-40.36 34.48-18.07 10.86-36.74 22.08-44.8 44.16a66.93 66.93 0 00-4.65 25c0 35.95 28 65.2 62.4 65.2 17.75 0 36.64-6.15 56.63-12.66 19.22-6.26 39.09-12.73 56.27-12.73s37 6.47 56.15 12.73C332.2 457.85 351 464 368.8 464c34.35 0 62.3-29.25 62.3-65.2a67 67 0 00-4.75-25c-8.06-22.1-26.74-33.33-44.8-44.19zM150 188.85c11.9 14.93 27 23.15 42.52 23.15a42.88 42.88 0 006.33-.47c32.37-4.76 52.54-44.26 45.92-90C242 102.3 234.6 84.39 224 71.11 212.12 56.21 197 48 181.49 48a42.88 42.88 0 00-6.33.47c-32.37 4.76-52.54 44.26-45.92 90 2.76 19.2 10.16 37.09 20.76 50.38zM313.16 211.53a42.88 42.88 0 006.33.47c15.53 0 30.62-8.22 42.52-23.15 10.59-13.29 17.95-31.18 20.75-50.4 6.62-45.72-13.55-85.22-45.92-90a42.88 42.88 0 00-6.33-.47C315 48 299.88 56.21 288 71.11c-10.6 13.28-18 31.19-20.76 50.44-6.62 45.72 13.55 85.22 45.92 89.98zM111.59 308.8l.14-.05c11.93-4.79 21.16-14.29 26.69-27.48 8.38-20 7.2-46.75-3.15-71.65C120.94 175.16 92.85 152 65.38 152a46.4 46.4 0 00-17 3.2l-.14.05c-11.9 4.75-21.13 14.29-26.66 27.48-8.38 20-7.2 46.75 3.15 71.65C39.06 288.84 67.15 312 94.62 312a46.4 46.4 0 0016.97-3.2z\"/>","leaf":"<path d=\"M161.35 242a16 16 0 0122.62-.68c73.63 69.36 147.51 111.56 234.45 133.07 11.73-32 12.77-67.22 2.64-101.58-13.44-45.59-44.74-85.31-90.49-114.86-40.84-26.38-81.66-33.25-121.15-39.89-49.82-8.38-96.88-16.3-141.79-63.85-5-5.26-11.81-7.37-18.32-5.66-7.44 2-12.43 7.88-14.82 17.6-5.6 22.75-2 86.51 13.75 153.82 25.29 108.14 65.65 162.86 95.06 189.73 38 34.69 87.62 53.9 136.93 53.9a186 186 0 0027.77-2.04c41.71-6.32 76.43-27.27 96-57.75-89.49-23.28-165.94-67.55-242-139.16a16 16 0 01-.65-22.65zM467.43 384.19c-16.83-2.59-33.13-5.84-49-9.77a157.71 157.71 0 01-12.13 25.68c-.73 1.25-1.5 2.49-2.29 3.71a584.21 584.21 0 0058.56 12 16 16 0 104.87-31.62z\"/>","airplane":"<path d=\"M186.62 464H160a16 16 0 01-14.57-22.6l64.46-142.25L113.1 297l-35.3 42.77C71.07 348.23 65.7 352 52 352H34.08a17.66 17.66 0 01-14.7-7.06c-2.38-3.21-4.72-8.65-2.44-16.41l19.82-71c.15-.53.33-1.06.53-1.58a.38.38 0 000-.15 14.82 14.82 0 01-.53-1.59l-19.84-71.45c-2.15-7.61.2-12.93 2.56-16.06a16.83 16.83 0 0113.6-6.7H52c10.23 0 20.16 4.59 26 12l34.57 42.05 97.32-1.44-64.44-142A16 16 0 01160 48h26.91a25 25 0 0119.35 9.8l125.05 152 57.77-1.52c4.23-.23 15.95-.31 18.66-.31C463 208 496 225.94 496 256c0 9.46-3.78 27-29.07 38.16-14.93 6.6-34.85 9.94-59.21 9.94-2.68 0-14.37-.08-18.66-.31l-57.76-1.54-125.36 152a25 25 0 01-19.32 9.75z\"/>","diamond":"<path d=\"M121.72 32a4 4 0 00-3.72 5.56l2.3 5.43 40.7 94.9a4 4 0 006.88.82L243 38.4a4 4 0 00-3.2-6.4zM419.93 58.06l-41.28 96.37a4 4 0 003.68 5.57h101a4 4 0 003.4-6.11L427 57.53a4 4 0 00-7.07.53zM85 57.57l-59.71 96.32a4 4 0 003.4 6.11h101a4 4 0 003.67-5.58L92 58.1a4 4 0 00-7-.53zM393.27 32H267.82a1.94 1.94 0 00-1.56 3.11l79.92 106.46a1.94 1.94 0 003.34-.4L391.6 43l3.4-8.34a1.92 1.92 0 00-1.7-2.66zM239 448l-89.43-253.49A3.78 3.78 0 00146 192H25.7a3.72 3.72 0 00-2.95 6l216 279.81a5.06 5.06 0 006.39 1.37 5 5 0 002.39-6.08zM486.3 192H366a3.75 3.75 0 00-3.54 2.51l-98.2 278.16a5.21 5.21 0 002.42 6.31 5.22 5.22 0 006.61-1.39L489.25 198a3.72 3.72 0 00-2.95-6zM259.2 78.93l56 74.67a4 4 0 01-3.2 6.4H200a4 4 0 01-3.2-6.4l56-74.67a4 4 0 016.4 0zm-7 310.31l-67.7-191.91a4 4 0 013.77-5.33h135.46a4 4 0 013.77 5.33l-67.73 191.91a4 4 0 01-7.54 0z\"/>","trophy":"<path d=\"M464 80h-60.1a4 4 0 01-4-4V63.92a32 32 0 00-32-31.92l-223.79.26a32 32 0 00-31.94 31.93V76a4 4 0 01-4 4H48a16 16 0 00-16 16v16c0 54.53 30 112.45 76.52 125.35a7.82 7.82 0 015.55 5.9c5.77 26.89 23.52 52.5 51.41 73.61 20.91 15.83 45.85 27.5 68.27 32.48a8 8 0 016.25 7.8V444a4 4 0 01-4 4h-59.55c-8.61 0-16 6.62-16.43 15.23A16 16 0 00176 480h159.55c8.61 0 16-6.62 16.43-15.23A16 16 0 00336 448h-60a4 4 0 01-4-4v-86.86a8 8 0 016.25-7.8c22.42-5 47.36-16.65 68.27-32.48 27.89-21.11 45.64-46.72 51.41-73.61a7.82 7.82 0 015.55-5.9C450 224.45 480 166.53 480 112V96a16 16 0 00-16-16zM112 198.22a4 4 0 01-6 3.45c-10.26-6.11-17.75-15.37-22.14-21.89-11.91-17.69-19-40.67-19.79-63.63a4 4 0 014-4.15h40a4 4 0 014 4c-.02 27.45-.07 58.87-.07 82.22zm316.13-18.44c-4.39 6.52-11.87 15.78-22.13 21.89a4 4 0 01-6-3.46c0-26.51 0-56.63-.05-82.21a4 4 0 014-4h40a4 4 0 014 4.15c-.79 22.96-7.9 45.94-19.81 63.63z\"/>","shield-checkmark":"<path d=\"M479.07 111.36a16 16 0 00-13.15-14.74c-86.5-15.52-122.61-26.74-203.33-63.2a16 16 0 00-13.18 0C168.69 69.88 132.58 81.1 46.08 96.62a16 16 0 00-13.15 14.74c-3.85 61.11 4.36 118.05 24.43 169.24A349.47 349.47 0 00129 393.11c53.47 56.73 110.24 81.37 121.07 85.73a16 16 0 0012 0c10.83-4.36 67.6-29 121.07-85.73a349.47 349.47 0 0071.5-112.51c20.07-51.19 28.28-108.13 24.43-169.24zm-131 75.11l-110.8 128a16 16 0 01-11.41 5.53h-.66a16 16 0 01-11.2-4.57l-49.2-48.2a16 16 0 1122.4-22.86l37 36.29 99.7-115.13a16 16 0 0124.2 20.94z\"/>","lock-closed":"<path d=\"M368 192h-16v-80a96 96 0 10-192 0v80h-16a64.07 64.07 0 00-64 64v176a64.07 64.07 0 0064 64h224a64.07 64.07 0 0064-64V256a64.07 64.07 0 00-64-64zm-48 0H192v-80a64 64 0 11128 0z\"/>","pricetag":"<path d=\"M467 45.2A44.45 44.45 0 00435.29 32H312.36a30.63 30.63 0 00-21.52 8.89L45.09 286.59a44.82 44.82 0 000 63.32l117 117a44.83 44.83 0 0063.34 0l245.65-245.6A30.6 30.6 0 00480 199.8v-123a44.24 44.24 0 00-13-31.6zM384 160a32 32 0 1132-32 32 32 0 01-32 32z\"/>","megaphone":"<path d=\"M48 176v.66a17.38 17.38 0 01-4.2 11.23v.05C38.4 194.32 32 205.74 32 224c0 16.55 5.3 28.23 11.68 35.91A19 19 0 0148 272a32 32 0 0032 32h8a8 8 0 008-8V152a8 8 0 00-8-8h-8a32 32 0 00-32 32zM452.18 186.55l-.93-.17a4 4 0 01-3.25-3.93V62c0-12.64-8.39-24-20.89-28.32-11.92-4.11-24.34-.76-31.68 8.53a431.18 431.18 0 01-51.31 51.69c-23.63 20-46.24 34.25-67 42.31a8 8 0 00-5.15 7.47V299a16 16 0 009.69 14.69c19.34 8.29 40.24 21.83 62 40.28a433.74 433.74 0 0151.68 52.16 26.22 26.22 0 0021.1 9.87 33.07 33.07 0 0010.44-1.74C439.71 410 448 399.05 448 386.4V265.53a4 4 0 013.33-3.94l.85-.14C461.8 258.84 480 247.67 480 224s-18.2-34.84-27.82-37.45zM240 320V152a8 8 0 00-8-8h-96a8 8 0 00-8 8v304a24 24 0 0024 24h52.45a32.66 32.66 0 0025.93-12.45 31.65 31.65 0 005.21-29.05c-1.62-5.18-3.63-11-5.77-17.19-7.91-22.9-18.34-37.07-21.12-69.32A32 32 0 00240 320z\"/>","mail":"<path d=\"M424 80H88a56.06 56.06 0 00-56 56v240a56.06 56.06 0 0056 56h336a56.06 56.06 0 0056-56V136a56.06 56.06 0 00-56-56zm-14.18 92.63l-144 112a16 16 0 01-19.64 0l-144-112a16 16 0 1119.64-25.26L256 251.73l134.18-104.36a16 16 0 0119.64 25.26z\"/>","chatbubble":"<path d=\"M76.83 480a25.69 25.69 0 01-25.57-25.74 29.13 29.13 0 011.2-7.63L70.88 380c.77-2.46-.1-4.94-1.23-6.9l-.22-.4c-.08-.13-.46-.66-.73-1.05s-.58-.81-.86-1.22l-.19-.27A215.66 215.66 0 0132 251.37c-.18-57.59 22.35-112 63.46-153.28C138 55.47 194.9 32 255.82 32A227.4 227.4 0 01398 81.84c39.45 31.75 66.87 76 77.21 124.68a213.5 213.5 0 014.78 45c0 58.93-22.64 114.28-63.76 155.87-41.48 42-97.18 65.06-156.83 65.06-21 0-47.87-5.36-60.77-9-15.52-4.34-30.23-10-31.85-10.6a15.12 15.12 0 00-5.37-1 14.75 14.75 0 00-5.8 1.15l-.85.33-67.48 24.38A29.44 29.44 0 0176.83 480zm-2-31.8zM87.48 380z\"/>","call":"<path d=\"M391 480c-19.52 0-46.94-7.06-88-30-49.93-28-88.55-53.85-138.21-103.38C116.91 298.77 93.61 267.79 61 208.45c-36.84-67-30.56-102.12-23.54-117.13C45.82 73.38 58.16 62.65 74.11 52a176.3 176.3 0 0128.64-15.2c1-.43 1.93-.84 2.76-1.21 4.95-2.23 12.45-5.6 21.95-2 6.34 2.38 12 7.25 20.86 16 18.17 17.92 43 57.83 52.16 77.43 6.15 13.21 10.22 21.93 10.23 31.71 0 11.45-5.76 20.28-12.75 29.81-1.31 1.79-2.61 3.5-3.87 5.16-7.61 10-9.28 12.89-8.18 18.05 2.23 10.37 18.86 41.24 46.19 68.51s57.31 42.85 67.72 45.07c5.38 1.15 8.33-.59 18.65-8.47 1.48-1.13 3-2.3 4.59-3.47 10.66-7.93 19.08-13.54 30.26-13.54h.06c9.73 0 18.06 4.22 31.86 11.18 18 9.08 59.11 33.59 77.14 51.78 8.77 8.84 13.66 14.48 16.05 20.81 3.6 9.53.21 17-2 22-.37.83-.78 1.74-1.21 2.75a176.49 176.49 0 01-15.29 28.58c-10.63 15.9-21.4 28.21-39.38 36.58A67.42 67.42 0 01391 480z\"/>","bulb":"<path d=\"M288 464h-64a16 16 0 000 32h64a16 16 0 000-32zM304 416h-96a16 16 0 000 32h96a16 16 0 000-32zM369.42 62.69C339.35 32.58 299.07 16 256 16A159.62 159.62 0 0096 176c0 46.62 17.87 90.23 49 119.64l4.36 4.09C167.37 316.57 192 339.64 192 360v24a16 16 0 0016 16h24a8 8 0 008-8V274.82a8 8 0 00-5.13-7.47A130.73 130.73 0 01208.71 253a16 16 0 1118.58-26c7.4 5.24 21.65 13 28.71 13s21.31-7.78 28.73-13a16 16 0 0118.56 26 130.73 130.73 0 01-26.16 14.32 8 8 0 00-5.13 7.47V392a8 8 0 008 8h24a16 16 0 0016-16v-24c0-19.88 24.36-42.93 42.15-59.77l4.91-4.66C399.08 265 416 223.61 416 176a159.16 159.16 0 00-46.58-113.31z\"/>","construct":"<path d=\"M503.58 126.2a16.85 16.85 0 00-27.07-4.55l-51.15 51.15a11.15 11.15 0 01-15.66 0l-22.48-22.48a11.17 11.17 0 010-15.67l50.88-50.89a16.85 16.85 0 00-5.27-27.4c-39.71-17-89.08-7.45-120 23.29-26.81 26.61-34.83 68-22 113.7a11 11 0 01-3.16 11.1L114.77 365.1a56.76 56.76 0 1080.14 80.18L357 272.08a11 11 0 0110.9-3.17c45 12 86 4 112.43-22 15.2-15 25.81-36.17 29.89-59.71 3.83-22.2 1.41-44.44-6.64-61z\"/><path d=\"M437.33 378.41c-13.94-11.59-43.72-38.4-74.07-66.22l-66.07 70.61c28.24 30 53.8 57.85 65 70.88l.07.08A30 30 0 00383.72 464h1.1a30.11 30.11 0 0021-8.62l.07-.07 33.43-33.37a29.46 29.46 0 00-2-43.53zM118.54 214.55a20.48 20.48 0 00-3-10.76 2.76 2.76 0 012.62-4.22h.06c.84.09 5.33.74 11.7 4.61 4.73 2.87 18.23 12.08 41.73 35.54a34.23 34.23 0 007.22 22.12l66.23-61.55a33.73 33.73 0 00-21.6-9.2 2.65 2.65 0 01-.21-.26l-.65-.69-24.54-33.84a28.45 28.45 0 01-4-26.11 35.23 35.23 0 0111.78-16.35c5.69-4.41 18.53-9.72 29.44-10.62a52.92 52.92 0 0115.19.94 65.57 65.57 0 017.06 2.13 15.46 15.46 0 002.15.63 16 16 0 0016.38-25.06c-.26-.35-1.32-1.79-2.89-3.73a91.85 91.85 0 00-9.6-10.36c-8.15-7.36-29.27-19.77-57-19.77a123.13 123.13 0 00-46.3 9c-38.37 15.45-63.47 36.58-75.01 47.79l-.09.09A222.14 222.14 0 0063.7 129.5a27 27 0 00-4.7 11.77 7.33 7.33 0 01-7.71 6.17H50.2a20.65 20.65 0 00-14.59 5.9L6.16 182.05l-.32.32a20.89 20.89 0 00-.24 28.72c.19.2.37.39.57.58L53.67 258a21 21 0 0014.65 6 20.65 20.65 0 0014.59-5.9l29.46-28.79a20.51 20.51 0 006.17-14.76z\"/>","cart":"<circle cx=\"176\" cy=\"416\" r=\"32\"/><circle cx=\"400\" cy=\"416\" r=\"32\"/><path d=\"M456.8 120.78a23.92 23.92 0 00-18.56-8.78H133.89l-6.13-34.78A16 16 0 00112 64H48a16 16 0 000 32h50.58l45.66 258.78A16 16 0 00160 368h256a16 16 0 000-32H173.42l-5.64-32h241.66A24.07 24.07 0 00433 284.71l28.8-144a24 24 0 00-5-19.93z\"/>","newspaper":"<path d=\"M439.91 112h-23.82a.09.09 0 00-.09.09V416a32 32 0 0032 32 32 32 0 0032-32V152.09A40.09 40.09 0 00439.91 112z\"/><path d=\"M384 416V72a40 40 0 00-40-40H72a40 40 0 00-40 40v352a56 56 0 0056 56h342.85a1.14 1.14 0 001.15-1.15 1.14 1.14 0 00-.85-1.1A64.11 64.11 0 01384 416zM96 128a16 16 0 0116-16h64a16 16 0 0116 16v64a16 16 0 01-16 16h-64a16 16 0 01-16-16zm208 272H112.45c-8.61 0-16-6.62-16.43-15.23A16 16 0 01112 368h191.55c8.61 0 16 6.62 16.43 15.23A16 16 0 01304 400zm0-64H112.45c-8.61 0-16-6.62-16.43-15.23A16 16 0 01112 304h191.55c8.61 0 16 6.62 16.43 15.23A16 16 0 01304 336zm0-64H112.45c-8.61 0-16-6.62-16.43-15.23A16 16 0 01112 240h191.55c8.61 0 16 6.62 16.43 15.23A16 16 0 01304 272zm0-64h-63.55c-8.61 0-16-6.62-16.43-15.23A16 16 0 01240 176h63.55c8.61 0 16 6.62 16.43 15.23A16 16 0 01304 208zm0-64h-63.55c-8.61 0-16-6.62-16.43-15.23A16 16 0 01240 112h63.55c8.61 0 16 6.62 16.43 15.23A16 16 0 01304 144z\"/>","calendar":"<path d=\"M480 128a64 64 0 00-64-64h-16V48.45c0-8.61-6.62-16-15.23-16.43A16 16 0 00368 48v16H144V48.45c0-8.61-6.62-16-15.23-16.43A16 16 0 00112 48v16H96a64 64 0 00-64 64v12a4 4 0 004 4h440a4 4 0 004-4zM32 416a64 64 0 0064 64h320a64 64 0 0064-64V179a3 3 0 00-3-3H35a3 3 0 00-3 3zm344-208a24 24 0 11-24 24 24 24 0 0124-24zm0 80a24 24 0 11-24 24 24 24 0 0124-24zm-80-80a24 24 0 11-24 24 24 24 0 0124-24zm0 80a24 24 0 11-24 24 24 24 0 0124-24zm0 80a24 24 0 11-24 24 24 24 0 0124-24zm-80-80a24 24 0 11-24 24 24 24 0 0124-24zm0 80a24 24 0 11-24 24 24 24 0 0124-24zm-80-80a24 24 0 11-24 24 24 24 0 0124-24zm0 80a24 24 0 11-24 24 24 24 0 0124-24z\"/>","time":"<path d=\"M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48zm96 240h-96a16 16 0 01-16-16V128a16 16 0 0132 0v128h80a16 16 0 010 32z\"/>","flag":"<path d=\"M80 480a16 16 0 01-16-16V68.13a24 24 0 0111.9-20.72C88 40.38 112.38 32 160 32c37.21 0 78.83 14.71 115.55 27.68C305.12 70.13 333.05 80 352 80a183.84 183.84 0 0071-14.5 18 18 0 0125 16.58v219.36a20 20 0 01-12 18.31c-8.71 3.81-40.51 16.25-84 16.25-24.14 0-54.38-7.14-86.39-14.71C229.63 312.79 192.43 304 160 304c-36.87 0-55.74 5.58-64 9.11V464a16 16 0 01-16 16z\"/>","thumbs-up":"<path d=\"M472.06 334l-144.16-6.13c-4.61-.36-23.9-1.21-23.9-25.87 0-23.81 19.16-25.33 24.14-25.88L472.06 270c12.67.13 23.94 14.43 23.94 32s-11.27 31.87-23.94 32zM330.61 202.33L437.35 194C450 194 464 210.68 464 227.88v.33c0 16.32-11.14 29.62-24.88 29.79l-108.45-1.73C304 253 304 236.83 304 229.88c0-22.88 21.8-27.15 26.61-27.55zM421.85 480l-89.37-8.93C308 470.14 304 453.82 304 443.59c0-18.38 13.41-24.6 26.67-24.6l91-3c14.54.23 26.32 14.5 26.32 32s-11.67 31.67-26.14 32.01zm34.36-71.5l-126.4-6.21c-9.39-.63-25.81-3-25.81-26.37 0-12 4.35-25.61 25-27.53l127.19-3.88c13.16.14 23.81 13.49 23.81 31.4s-10.65 32.43-23.79 32.58z\"/><path d=\"M133.55 238.06A15.85 15.85 0 01126 240a15.82 15.82 0 007.51-1.92zM174.14 168.78l.13-.23-.13.23c-20.5 35.51-30.36 54.95-33.82 62 3.47-7.07 13.34-26.51 33.82-62z\" fill=\"none\"/><path d=\"M139.34 232.84l1-2a16.27 16.27 0 01-6.77 7.25 16.35 16.35 0 005.77-5.25z\"/><path d=\"M316.06 52.62C306.63 39.32 291 32 272 32a16 16 0 00-14.31 8.84c-3 6.07-15.25 24-28.19 42.91-18 26.33-40.35 59.07-55.23 84.8l-.13.23c-20.48 35.49-30.35 54.93-33.82 62l-1 2a16.35 16.35 0 01-5.79 5.22 15.82 15.82 0 01-7.53 2h-25.31A84.69 84.69 0 0016 324.69v38.61a84.69 84.69 0 0084.69 84.7h48.79a17.55 17.55 0 019.58 2.89C182 465.87 225.34 480 272 480c7.45 0 14.19-.14 20.27-.38a8 8 0 006.2-12.68l-.1-.14C289.8 454.41 288 441 288 432a61.2 61.2 0 015.19-24.77 17.36 17.36 0 000-14.05 63.81 63.81 0 010-50.39 17.32 17.32 0 000-14 62.15 62.15 0 010-49.59 18.13 18.13 0 000-14.68A60.33 60.33 0 01288 239c0-8.2 2-21.3 8-31.19a15.63 15.63 0 001.14-13.64c-.38-1-.76-2.07-1.13-3.17a24.84 24.84 0 01-.86-11.58c3-19.34 9.67-36.29 16.74-54.16 3.08-7.78 6.27-15.82 9.22-24.26 6.14-17.57 4.3-35.2-5.05-48.38z\"/>","sparkles":"<path d=\"M208 512a24.84 24.84 0 01-23.34-16l-39.84-103.6a16.06 16.06 0 00-9.19-9.19L32 343.34a25 25 0 010-46.68l103.6-39.84a16.06 16.06 0 009.19-9.19L184.66 144a25 25 0 0146.68 0l39.84 103.6a16.06 16.06 0 009.19 9.19l103 39.63a25.49 25.49 0 0116.63 24.1 24.82 24.82 0 01-16 22.82l-103.6 39.84a16.06 16.06 0 00-9.19 9.19L231.34 496A24.84 24.84 0 01208 512zm66.85-254.84zM88 176a14.67 14.67 0 01-13.69-9.4l-16.86-43.84a7.28 7.28 0 00-4.21-4.21L9.4 101.69a14.67 14.67 0 010-27.38l43.84-16.86a7.31 7.31 0 004.21-4.21L74.16 9.79A15 15 0 0186.23.11a14.67 14.67 0 0115.46 9.29l16.86 43.84a7.31 7.31 0 004.21 4.21l43.84 16.86a14.67 14.67 0 010 27.38l-43.84 16.86a7.28 7.28 0 00-4.21 4.21l-16.86 43.84A14.67 14.67 0 0188 176zM400 256a16 16 0 01-14.93-10.26l-22.84-59.37a8 8 0 00-4.6-4.6l-59.37-22.84a16 16 0 010-29.86l59.37-22.84a8 8 0 004.6-4.6l22.67-58.95a16.45 16.45 0 0113.17-10.57 16 16 0 0116.86 10.15l22.84 59.37a8 8 0 004.6 4.6l59.37 22.84a16 16 0 010 29.86l-59.37 22.84a8 8 0 00-4.6 4.6l-22.84 59.37A16 16 0 01400 256z\"/>","football":"<path d=\"M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm143 304h-45.22a8 8 0 01-6.91-4l-16.14-27.68a8 8 0 01-.86-6l14.86-59.92a8 8 0 014.65-5.45l28.1-11.9a8 8 0 018.34 1.3l41.63 35.82a8 8 0 012.69 7.26 174.75 174.75 0 01-24.28 66.68A8 8 0 01399 352zM134.52 237.13l28.1 11.9a8 8 0 014.65 5.45l14.86 59.92a8 8 0 01-.86 6L165.13 348a8 8 0 01-6.91 4H113a8 8 0 01-6.82-3.81 174.75 174.75 0 01-24.28-66.68 8 8 0 012.69-7.26l41.63-35.82a8 8 0 018.3-1.3zm256.94-87.24l-18.07 51.38A8 8 0 01369 206l-29.58 12.53a8 8 0 01-8.26-1.24L274.9 170.1a8 8 0 01-2.9-6.1v-33.58a8 8 0 013.56-6.65l42.83-28.54a8 8 0 017.66-.67A176.92 176.92 0 01390 142a8 8 0 011.46 7.89zM193.6 95.23l42.84 28.54a8 8 0 013.56 6.65V164a8 8 0 01-2.86 6.13l-56.26 47.19a8 8 0 01-8.26 1.24L143 206a8 8 0 01-4.43-4.72L120.5 149.9a8 8 0 011.5-7.9 176.92 176.92 0 0164-47.48 8 8 0 017.6.71zm17.31 327.46L191.18 373a8 8 0 01.52-7l15.17-26a8 8 0 016.91-4h84.44a8 8 0 016.91 4l15.18 26a8 8 0 01.53 7l-19.59 49.67a8 8 0 01-5.69 4.87 176.58 176.58 0 01-79 0 8 8 0 01-5.65-4.85z\"/>","bicycle":"<path d=\"M388 448a92 92 0 1192-92 92.1 92.1 0 01-92 92zm0-152a60 60 0 1060 60 60.07 60.07 0 00-60-60zM124 448a92 92 0 1192-92 92.1 92.1 0 01-92 92zm0-152a60 60 0 1060 60 60.07 60.07 0 00-60-60zM320 128a31.89 31.89 0 0032-32.1A31.55 31.55 0 00320.2 64a32 32 0 10-.2 64z\"/><path d=\"M367.55 192h-43.76a4 4 0 01-3.51-2.08l-31.74-58.17a31 31 0 00-49.38-7.75l-69.86 70.4a32.56 32.56 0 00-9.3 22.4c0 17.4 12.6 23.6 18.5 27.1 28.5 16.42 48.57 28.43 59.58 35.1a4 4 0 011.92 3.41v69.12c0 8.61 6.62 16 15.23 16.43A16 16 0 00272 352v-86a16 16 0 00-6.66-13l-37-26.61a4 4 0 01-.58-6l42-44.79a4 4 0 016.42.79L298 215.77a16 16 0 0014 8.23h56a16 16 0 0016-16.77c-.42-8.61-7.84-15.23-16.45-15.23z\"/>","fitness":"<path d=\"M193.69 152.84a16 16 0 0129.64 2.56l36.4 121.36 30-59.92a16 16 0 0128.62 0L345.89 272h96.76A213.08 213.08 0 00464 176.65C463.37 114.54 413.54 64 352.92 64c-48.09 0-80 29.54-96.92 51-16.88-21.49-48.83-51-96.92-51C98.46 64 48.63 114.54 48 176.65A211.13 211.13 0 0056.93 240h93.18z\"/><path d=\"M321.69 295.16L304 259.78l-33.69 67.38A16 16 0 01256 336q-.67 0-1.38-.06a16 16 0 01-14-11.34l-36.4-121.36-30 59.92A16 16 0 01160 272H69.35q14 29.29 37.27 57.66c18.77 22.88 52.8 59.46 131.39 112.81a31.84 31.84 0 0036 0c78.59-53.35 112.62-89.93 131.39-112.81a316.79 316.79 0 0019-25.66H336a16 16 0 01-14.31-8.84zM464 272h-21.35a260.11 260.11 0 01-18.25 32H464a16 16 0 000-32zM48 240a16 16 0 000 32h21.35a225.22 225.22 0 01-12.42-32z\"/>","wine":"<path d=\"M414.56 94.92V80a16 16 0 00-16-16H113.44a16 16 0 00-16 16v14.92c-1.46 11.37-9.65 90.74 36.93 144.69 24.87 28.8 60.36 44.85 105.63 47.86V416h-80a16 16 0 000 32h192a16 16 0 000-32h-80V287.47c45.27-3 80.76-19.06 105.63-47.86 46.58-53.95 38.37-133.32 36.93-144.69zm-285.3 3.41a15.14 15.14 0 00.18-2.33h253.12a15.14 15.14 0 00.18 2.33 201.91 201.91 0 010 45.67H129.32a204.29 204.29 0 01-.06-45.67z\"/>","pizza":"<path d=\"M441.82 67.83C383.44 44.73 317.3 32 255.56 32 192 32 125.76 44.53 69 67.26 48.7 75.49 45.21 90 48.71 100.82L52.78 111a16 16 0 0021.31 8.69c10.8-4.76 23.93-10.54 27-11.78C145.1 89.64 198.71 80 256 80c57.47 0 108.09 9.24 154.76 28.25 4.42 1.8 14.88 6.42 26.17 11.46a16 16 0 0021.35-8.59L462 102l.34-.9c3.45-10.21.14-25.05-20.52-33.27z\"/><path d=\"M409.18 140.86C363.67 122.53 307.68 112 255.56 112a425 425 0 00-153.74 28.89c-.53.21-2.06.88-4.29 1.88a16 16 0 00-8 21.27c4 8.71 9.42 20.58 15.5 33.89C137.94 270 199.21 404 227.26 462A31.74 31.74 0 00256 480a31.73 31.73 0 0028.76-18.06l.06-.13 137.3-297.57a15.94 15.94 0 00-8.31-21.45c-2.26-.95-3.85-1.61-4.5-1.87zm-215.1 83.07a32 32 0 1129.85-29.85 32 32 0 01-29.85 29.85zm64 128a32 32 0 1129.85-29.85 32 32 0 01-29.85 29.85zm64-112a32 32 0 1129.85-29.85 32 32 0 01-29.85 29.85z\"/>","cloud":"<path d=\"M396 432H136c-36.44 0-70.36-12.57-95.51-35.41C14.38 372.88 0 340 0 304c0-36.58 13.39-68.12 38.72-91.22 18.11-16.53 42.22-28.25 69.18-33.87a16 16 0 0011.37-9.15 156.24 156.24 0 0142.05-56C187.76 91.69 220.5 80 256 80a153.57 153.57 0 01107.14 42.9c24.73 23.81 41.5 55.28 49.18 92a16 16 0 0012.12 12.39C470 237.42 512 270.43 512 328c0 33.39-12.24 60.78-35.41 79.23C456.23 423.43 428.37 432 396 432z\"/>","image":"<path d=\"M416 64H96a64.07 64.07 0 00-64 64v256a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V128a64.07 64.07 0 00-64-64zm-80 64a48 48 0 11-48 48 48.05 48.05 0 0148-48zM96 416a32 32 0 01-32-32v-67.63l94.84-84.3a48.06 48.06 0 0165.8 1.9l64.95 64.81L172.37 416zm352-32a32 32 0 01-32 32H217.63l121.42-121.42a47.72 47.72 0 0161.64-.16L448 333.84z\"/>","mic":"<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"32\" d=\"M192 448h128M384 208v32c0 70.4-57.6 128-128 128h0c-70.4 0-128-57.6-128-128v-32M256 368v80\"/><path d=\"M256 320a78.83 78.83 0 01-56.55-24.1A80.89 80.89 0 01176 239V128a79.69 79.69 0 0180-80c44.86 0 80 35.14 80 80v111c0 44.66-35.89 81-80 81z\"/>","headset":"<path d=\"M411.16 97.46C368.43 55.86 311.88 32 256 32S143.57 55.86 100.84 97.46C56.45 140.67 32 197 32 256c0 26.67 8.75 61.09 32.88 125.55S137 473 157.27 477.41c5.81 1.27 12.62 2.59 18.73 2.59a60.06 60.06 0 0030-8l14-8c15.07-8.82 19.47-28.13 10.8-43.35l-86.92-152.57a31.73 31.73 0 00-43.57-11.76l-13.69 8a56.49 56.49 0 00-14 11.59 4 4 0 01-7-2A114.68 114.68 0 0164 256c0-50.31 21-98.48 59.16-135.61C160 84.55 208.39 64 256 64s96 20.55 132.84 56.39C427 157.52 448 205.69 448 256a114.68 114.68 0 01-1.68 17.91 4 4 0 01-7 2 56.49 56.49 0 00-14-11.59l-13.69-8a31.73 31.73 0 00-43.57 11.76L281.2 420.65c-8.67 15.22-4.27 34.53 10.8 43.35l14 8a60.06 60.06 0 0030 8c6.11 0 12.92-1.32 18.73-2.59C375 473 423 446 447.12 381.55S480 282.67 480 256c0-59-24.45-115.33-68.84-158.54z\"/>","print":"<path d=\"M408 112H106a58 58 0 00-58 58v158a56 56 0 0056 56h8v39.68A40.32 40.32 0 00152.32 464h207.36A40.32 40.32 0 00400 423.68V384h8a56 56 0 0056-56V168a56 56 0 00-56-56zm-40 311.68a8.35 8.35 0 01-8.32 8.32H152.32a8.35 8.35 0 01-8.32-8.32V264.32a8.35 8.35 0 018.32-8.32h207.36a8.35 8.35 0 018.32 8.32zm26-215.76a24 24 0 1122-22 24 24 0 01-22 22zM344 48H168a56.09 56.09 0 00-55.42 48h286.84A56.09 56.09 0 00344 48z\"/>","server":"<path d=\"M125.295 40.728C159.804 25.158 206.27 16 256.5 16c50.23 0 96.466 9.159 130.748 24.748C420.143 55.706 448 80 448 112v.03c-.011 5.533-3.098 13.89-12.295 24.22-8.995 10.102-22.617 20.658-40.273 30.264C360.162 185.702 310.794 200 256 200c-54.794 0-104.162-14.298-139.432-33.486-17.656-9.606-31.278-20.162-40.273-30.264C67.081 125.901 64 117.532 64 112c0-32.428 28.246-56.36 61.295-71.272z\"/><path d=\"M410.724 194.623c9.586-5.214 18.448-11.755 26.406-18.904 4.054-3.642 10.87-.89 10.87 4.56V258c0 5.532-3.081 11.901-12.295 22.25-8.995 10.102-22.617 20.658-40.273 30.264C360.162 329.702 310.794 344 256 344c-54.794 0-104.162-14.298-139.432-33.486-17.656-9.606-31.278-20.162-40.273-30.264C67.081 269.901 64 263.532 64 258v-77.721c0-5.45 6.816-8.202 10.87-4.56 7.958 7.148 16.82 13.69 26.406 18.904C141.286 216.39 195.918 232 256 232c60.082 0 114.714-15.61 154.724-37.377z\"/><path d=\"M74.87 319.719c-4.054-3.642-10.87-.89-10.87 4.56V400c0 32.224 28.004 56.169 60.928 71.134C159.297 486.756 205.653 496 256 496c50.347 0 96.703-9.244 131.072-24.866C419.996 456.169 448 432.224 448 400v-75.721c0-5.45-6.816-8.202-10.87-4.56-7.958 7.148-16.82 13.69-26.406 18.904C370.714 360.39 316.082 376 256 376c-60.082 0-114.714-15.61-154.724-37.377-9.586-5.214-18.448-11.756-26.406-18.904z\"/>","telescope":"<path d=\"M107.56 250a16 16 0 00-21.85-5.86L36 272.81a39.71 39.71 0 00-18.8 24.91 40.9 40.9 0 004.55 30.35l4.36 7.54a40 40 0 0054.62 14.62l49.67-28.63a16 16 0 005.87-21.86z\"/><path d=\"M382.84 440.8L288.72 254a2 2 0 01.79-2.63l8.3-4.79a16 16 0 005.86-21.86l-47.53-82.33a16 16 0 00-21.86-5.87l-86.38 49.8a39.73 39.73 0 00-18.65 24.28 34.82 34.82 0 00-1.37 9.76c.06 7.6 9.2 22.7 18.12 38.28 9.59 16.75 19.24 33.88 26.34 38.15 4.52 2.72 12.5 4.9 19.21 4.9h.84l-79.32 171.6a16 16 0 1029.05 13.42l93.68-202.65a7.94 7.94 0 013.26-3.57l19.21-11.08a2 2 0 012.78.84l93.21 185a16 16 0 0028.58-14.4zM490.21 115.74L444.09 36a40.08 40.08 0 00-54.63-14.62l-93.34 53.78a39.69 39.69 0 00-18.65 24.28 32.76 32.76 0 00-1.27 13.25c1.74 12.62 13 30.4 26.41 53.89 13.58 23.73 28.91 50.48 36.93 56.27a40.18 40.18 0 0023.18 7.37 39.77 39.77 0 0019.92-5.34L476 171.07a39.72 39.72 0 0018.79-24.84 41 41 0 00-4.58-30.49z\"/>","umbrella":"<path d=\"M414.39 113.61a222.26 222.26 0 00-136.33-64.54 8.09 8.09 0 01-6.88-5.62 15.79 15.79 0 00-30.36 0 8.09 8.09 0 01-6.88 5.62A224 224 0 0032 271.52a16.41 16.41 0 007.24 13.87 16 16 0 0020.07-2.08 51.89 51.89 0 0173.31-.06 15.94 15.94 0 0022.6.15 62.59 62.59 0 0181.49-5.87 8.24 8.24 0 013.29 6.59v147.42c0 8.6-6.6 16-15.19 16.44A16 16 0 01208 432a16 16 0 00-16.29-16c-9 .16-15.9 8.11-15.7 17.1a48.06 48.06 0 0047.37 46.9c26.88.34 48.62-21.93 48.62-48.81V284.12a8.24 8.24 0 013.29-6.59 62.59 62.59 0 0181.4 5.78 16 16 0 0022.62 0 51.91 51.91 0 0173.38 0 16 16 0 0019.54 2.41 16.4 16.4 0 007.77-14.21 222.54 222.54 0 00-65.61-157.9z\"/>","sunny":"<path d=\"M256 118a22 22 0 01-22-22V48a22 22 0 0144 0v48a22 22 0 01-22 22zM256 486a22 22 0 01-22-22v-48a22 22 0 0144 0v48a22 22 0 01-22 22zM369.14 164.86a22 22 0 01-15.56-37.55l33.94-33.94a22 22 0 0131.11 31.11l-33.94 33.94a21.93 21.93 0 01-15.55 6.44zM108.92 425.08a22 22 0 01-15.55-37.56l33.94-33.94a22 22 0 1131.11 31.11l-33.94 33.94a21.94 21.94 0 01-15.56 6.45zM464 278h-48a22 22 0 010-44h48a22 22 0 010 44zM96 278H48a22 22 0 010-44h48a22 22 0 010 44zM403.08 425.08a21.94 21.94 0 01-15.56-6.45l-33.94-33.94a22 22 0 0131.11-31.11l33.94 33.94a22 22 0 01-15.55 37.56zM142.86 164.86a21.89 21.89 0 01-15.55-6.44l-33.94-33.94a22 22 0 0131.11-31.11l33.94 33.94a22 22 0 01-15.56 37.55zM256 358a102 102 0 11102-102 102.12 102.12 0 01-102 102z\"/>","moon":"<path d=\"M264 480A232 232 0 0132 248c0-94 54-178.28 137.61-214.67a16 16 0 0121.06 21.06C181.07 76.43 176 104.66 176 136c0 110.28 89.72 200 200 200 31.34 0 59.57-5.07 81.61-14.67a16 16 0 0121.06 21.06C442.28 426 358 480 264 480z\"/>","ribbon":"<path d=\"M269 335.61q-6.33.47-12.78.47c-5.23 0-10.4-.24-15.51-.69a176.11 176.11 0 01-127.67-72.94 4 4 0 00-6.77.35l-72 129.4c-2.74 5-3.17 11-.28 15.88A16.78 16.78 0 0048.22 416h78a15.28 15.28 0 0113.62 7.33L178.5 488a16.26 16.26 0 0013.75 8c5.94-.33 12.09-4.19 14.56-9.6l66.11-145.15a4 4 0 00-3.92-5.64zM477.64 391.88l-71.53-129.17a4 4 0 00-6.74-.36 176.5 176.5 0 01-78.31 61.42 16.09 16.09 0 00-8.72 8.25l-36.86 81.1a7.92 7.92 0 000 6.6l30.27 66.59c2.45 5.41 8.59 9.36 14.52 9.69a16.3 16.3 0 0013.7-8.12l38.53-64.58c2.89-4.85 8.13-7.33 13.78-7.3h78.77c6.67 0 11.72-3.48 14-10a16.92 16.92 0 00-1.41-14.12z\"/><ellipse cx=\"256.26\" cy=\"160\" rx=\"48.01\" ry=\"48\"/><path d=\"M256.26 16c-79.42 0-144 64.59-144 144s64.61 144 144 144 144-64.6 144-144-64.59-144-144-144zm0 224a80 80 0 1180-80 80.1 80.1 0 01-80 80z\"/>","basket":"<path d=\"M424.11 192H360L268.8 70.4a16 16 0 00-25.6 0L152 192H87.89a32.57 32.57 0 00-32.62 32.44 30.3 30.3 0 001.31 9l46.27 163.14a50.72 50.72 0 0048.84 36.91h208.62a51.21 51.21 0 0049-36.86l46.33-163.36a15.62 15.62 0 00.46-2.36l.53-4.93a13.3 13.3 0 00.09-1.55A32.57 32.57 0 00424.11 192zM256 106.67L320 192H192zm0 245a37.7 37.7 0 1137.88-37.7A37.87 37.87 0 01256 351.63z\"/>","receipt":"<path d=\"M483.82 32.45a16.28 16.28 0 00-11.23 1.37L448 46.1l-24.8-12.4a16 16 0 00-14.31 0l-25.11 12.41L359 33.7a16 16 0 00-14.36 0L320 46.07l-24.45-12.34a16 16 0 00-14.35-.06L256 46.12l-24.8-12.43a16.05 16.05 0 00-14.33 0L192 46.1l-24.84-12.41a16 16 0 00-19.36 3.94 16.25 16.25 0 00-3.8 10.65V288l.05.05H336a32 32 0 0132 32V424c0 30.93 33.07 56 64 56h12a52 52 0 0052-52V48a16 16 0 00-12.18-15.55zM416 240H288.5c-8.64 0-16.1-6.64-16.48-15.28A16 16 0 01288 208h127.5c8.64 0 16.1 6.64 16.48 15.28A16 16 0 01416 240zm0-80H224.5c-8.64 0-16.1-6.64-16.48-15.28A16 16 0 01224 128h191.5c8.64 0 16.1 6.64 16.48 15.28A16 16 0 01416 160z\"/><path d=\"M336 424v-88a16 16 0 00-16-16H48a32.1 32.1 0 00-32 32.05c0 50.55 5.78 71.57 14.46 87.57C45.19 466.79 71.86 480 112 480h245.68a4 4 0 002.85-6.81C351.07 463.7 336 451 336 424z\"/>","stats-chart":"<path d=\"M104 496H72a24 24 0 01-24-24V328a24 24 0 0124-24h32a24 24 0 0124 24v144a24 24 0 01-24 24zM328 496h-32a24 24 0 01-24-24V232a24 24 0 0124-24h32a24 24 0 0124 24v240a24 24 0 01-24 24zM440 496h-32a24 24 0 01-24-24V120a24 24 0 0124-24h32a24 24 0 0124 24v352a24 24 0 01-24 24zM216 496h-32a24 24 0 01-24-24V40a24 24 0 0124-24h32a24 24 0 0124 24v432a24 24 0 01-24 24z\"/>","pie-chart":"<path d=\"M66.1 357a16 16 0 01-14.61-9.46A224 224 0 01256 32a16 16 0 0116 16v208a16 16 0 01-9.47 14.61l-189.9 84.95A15.93 15.93 0 0166.1 357z\"/><path d=\"M313.59 68.18A8 8 0 00304 76v180a48.07 48.07 0 01-28.4 43.82L103.13 377a8 8 0 00-3.35 11.81 208.42 208.42 0 0048.46 50.41A206.32 206.32 0 00272 480c114.69 0 208-93.31 208-208 0-100.45-71.58-184.5-166.41-203.82z\"/>","logo-paypal":"<path d=\"M424.81 148.79c-.43 2.76-.93 5.58-1.49 8.48-19.17 98-84.76 131.8-168.54 131.8h-42.65a20.67 20.67 0 00-20.47 17.46l-21.84 137.84-6.18 39.07a10.86 10.86 0 009.07 12.42 10.72 10.72 0 001.7.13h75.65a18.18 18.18 0 0018-15.27l.74-3.83 14.24-90 .91-4.94a18.16 18.16 0 0118-15.3h11.31c73.3 0 130.67-29.62 147.44-115.32 7-35.8 3.38-65.69-15.16-86.72a72.27 72.27 0 00-20.73-15.82z\"/><path d=\"M385.52 51.09C363.84 26.52 324.71 16 274.63 16H129.25a20.75 20.75 0 00-20.54 17.48l-60.55 382a12.43 12.43 0 0010.39 14.22 12.58 12.58 0 001.94.15h89.76l22.54-142.29-.7 4.46a20.67 20.67 0 0120.47-17.46h42.65c83.77 0 149.36-33.86 168.54-131.8.57-2.9 1.05-5.72 1.49-8.48 5.7-36.22-.05-60.87-19.72-83.19z\"/>","logo-apple":"<path d=\"M349.13 136.86c-40.32 0-57.36 19.24-85.44 19.24-28.79 0-50.75-19.1-85.69-19.1-34.2 0-70.67 20.88-93.83 56.45-32.52 50.16-27 144.63 25.67 225.11 18.84 28.81 44 61.12 77 61.47h.6c28.68 0 37.2-18.78 76.67-19h.6c38.88 0 46.68 18.89 75.24 18.89h.6c33-.35 59.51-36.15 78.35-64.85 13.56-20.64 18.6-31 29-54.35-76.19-28.92-88.43-136.93-13.08-178.34-23-28.8-55.32-45.48-85.79-45.48z\"/><path d=\"M340.25 32c-24 1.63-52 16.91-68.4 36.86-14.88 18.08-27.12 44.9-22.32 70.91h1.92c25.56 0 51.72-15.39 67-35.11 14.72-18.77 25.88-45.37 21.8-72.66z\"/>","logo-google":"<path d=\"M473.16 221.48l-2.26-9.59H262.46v88.22H387c-12.93 61.4-72.93 93.72-121.94 93.72-35.66 0-73.25-15-98.13-39.11a140.08 140.08 0 01-41.8-98.88c0-37.16 16.7-74.33 41-98.78s61-38.13 97.49-38.13c41.79 0 71.74 22.19 82.94 32.31l62.69-62.36C390.86 72.72 340.34 32 261.6 32c-60.75 0-119 23.27-161.58 65.71C58 139.5 36.25 199.93 36.25 256s20.58 113.48 61.3 155.6c43.51 44.92 105.13 68.4 168.58 68.4 57.73 0 112.45-22.62 151.45-63.66 38.34-40.4 58.17-96.3 58.17-154.9 0-24.67-2.48-39.32-2.59-39.96z\"/>","logo-youtube":"<path d=\"M508.64 148.79c0-45-33.1-81.2-74-81.2C379.24 65 322.74 64 265 64h-18c-57.6 0-114.2 1-169.6 3.6C36.6 67.6 3.5 104 3.5 149 1 184.59-.06 220.19 0 255.79q-.15 53.4 3.4 106.9c0 45 33.1 81.5 73.9 81.5 58.2 2.7 117.9 3.9 178.6 3.8q91.2.3 178.6-3.8c40.9 0 74-36.5 74-81.5 2.4-35.7 3.5-71.3 3.4-107q.34-53.4-3.26-106.9zM207 353.89v-196.5l145 98.2z\"/>","logo-instagram":"<path d=\"M349.33 69.33a93.62 93.62 0 0193.34 93.34v186.66a93.62 93.62 0 01-93.34 93.34H162.67a93.62 93.62 0 01-93.34-93.34V162.67a93.62 93.62 0 0193.34-93.34h186.66m0-37.33H162.67C90.8 32 32 90.8 32 162.67v186.66C32 421.2 90.8 480 162.67 480h186.66C421.2 480 480 421.2 480 349.33V162.67C480 90.8 421.2 32 349.33 32z\"/><path d=\"M377.33 162.67a28 28 0 1128-28 27.94 27.94 0 01-28 28zM256 181.33A74.67 74.67 0 11181.33 256 74.75 74.75 0 01256 181.33m0-37.33a112 112 0 10112 112 112 112 0 00-112-112z\"/>","logo-tiktok":"<path d=\"M412.19 118.66a109.27 109.27 0 01-9.45-5.5 132.87 132.87 0 01-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14 23.9 350 16 350.13 16h-82.44v318.78c0 4.28 0 8.51-.18 12.69 0 .52-.05 1-.08 1.56 0 .23 0 .47-.05.71v.18a70 70 0 01-35.22 55.56 68.8 68.8 0 01-34.11 9c-38.41 0-69.54-31.32-69.54-70s31.13-70 69.54-70a68.9 68.9 0 0121.41 3.39l.1-83.94a153.14 153.14 0 00-118 34.52 161.79 161.79 0 00-35.3 43.53c-3.48 6-16.61 30.11-18.2 69.24-1 22.21 5.67 45.22 8.85 54.73v.2c2 5.6 9.75 24.71 22.38 40.82A167.53 167.53 0 00115 470.66v-.2l.2.2c39.91 27.12 84.16 25.34 84.16 25.34 7.66-.31 33.32 0 62.46-13.81 32.32-15.31 50.72-38.12 50.72-38.12a158.46 158.46 0 0027.64-45.93c7.46-19.61 9.95-43.13 9.95-52.53V176.49c1 .6 14.32 9.41 14.32 9.41s19.19 12.3 49.13 20.31c21.48 5.7 50.42 6.9 50.42 6.9v-81.84c-10.14 1.1-30.73-2.1-51.81-12.61z\"/>"};
const TILE_ICONS = ['wallet', 'card', 'cash', 'business', 'phone-portrait', 'globe', 'logo-paypal', 'storefront', 'briefcase', 'person', 'people', 'laptop', 'desktop', 'code-slash', 'brush', 'color-palette', 'pencil', 'camera', 'film', 'videocam', 'musical-notes', 'mic', 'headset', 'megaphone', 'newspaper', 'mail', 'chatbubble', 'call', 'book', 'school', 'bulb', 'construct', 'cart', 'bag', 'basket', 'gift', 'cafe', 'restaurant', 'pizza', 'wine', 'car', 'bus', 'bicycle', 'airplane', 'home', 'cloud', 'server', 'print', 'image', 'game-controller', 'football', 'fitness', 'heart', 'medkit', 'paw', 'leaf', 'sunny', 'moon', 'umbrella', 'telescope', 'planet', 'rocket', 'flash', 'flame', 'star', 'sparkles', 'diamond', 'trophy', 'ribbon', 'shield-checkmark', 'lock-closed', 'pricetag', 'receipt', 'stats-chart', 'pie-chart', 'calendar', 'time', 'flag', 'thumbs-up', 'logo-apple', 'logo-google', 'logo-youtube', 'logo-instagram', 'logo-tiktok'].filter(k => TILE_GLYPHS[k]);
const TILE_COLORS = [['#ff6b5e', '#ff3b30'], ['#ffb340', '#ff9500'], ['#ffd84d', '#ffcc00'], ['#5fd97f', '#30b350'], ['#4fd1c5', '#14b8a6'], ['#5ac8fa', '#0a96f0'], ['#4a9dff', '#0a6cff'], ['#7d7aff', '#5856d6'], ['#c77dff', '#af52de'], ['#ff6fa0', '#ff2d55'], ['#9aa0a6', '#6b7075']];
const tileHtml = (glyph, tint, cls = '') => {
  const [c1, c2] = TILE_COLORS[tint] || TILE_COLORS[6];
  return `<span class="tile ${cls}" style="--t1:${c1};--t2:${c2}"><svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">${TILE_GLYPHS[glyph] || TILE_GLYPHS.wallet}</svg></span>`;
};
const guessWalletGlyph = w => (/yape|plin|celular|m[oó]vil|phone/i.test(w.name) ? 'phone-portrait' : /paypal/i.test(w.name) ? 'logo-paypal' : /efectivo|cash|caja/i.test(w.name) ? 'cash' : /banco|bcp|bbva|ibk|interbank|scotia|cuenta|ahorro/i.test(w.name) ? 'business' : w.currency !== 'PEN' ? 'globe' : 'wallet');
const walletTileIdx = w => (Number.isInteger(w?.tint) ? w.tint : /yape|plin/i.test(w?.name || '') ? 8 : /paypal/i.test(w?.name || '') ? 6 : [3, 8, 6, 1, 4, 9][(w?.color ?? 0) % 6]);
const walletTile = (w, cls = '') => tileHtml(w?.icon && TILE_GLYPHS[w.icon] ? w.icon : guessWalletGlyph(w || { name: '', currency: 'PEN' }), walletTileIdx(w), cls);
const clientTileIdx = c => (Number.isInteger(c?.tint) ? c.tint : [6, 8, 1, 9, 4, 3, 7, 0][Math.max(0, data.clients.indexOf(c)) % 8]);
const clientTile = (c, cls = '') => tileHtml(c?.icon && TILE_GLYPHS[c.icon] ? c.icon : 'person', clientTileIdx(c), cls);
// Selector de icono y color para los formularios (como el de Atajos).
function tilePicker(glyph, tint) {
  return `<div class="field tile-pick">
    <span>Icono</span>
    <input type="hidden" name="icon" value="${glyph}"><input type="hidden" name="tint" value="${tint}">
    <div class="tile-preview" data-preview>${tileHtml(glyph, tint, 'big')}</div>
    <div class="tile-colors">${TILE_COLORS.map(([c1, c2], i) => `<button type="button" class="tile-color${i === tint ? ' on' : ''}" data-tint="${i}" style="--t1:${c1};--t2:${c2}" aria-label="Color ${i + 1}"></button>`).join('')}</div>
    <div class="tile-grid">${TILE_ICONS.map(k => `<button type="button" class="tile-glyph${k === glyph ? ' on' : ''}" data-glyph="${k}" aria-label="${k}"><svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">${TILE_GLYPHS[k]}</svg></button>`).join('')}</div>
  </div>`;
}
function bindTilePicker(form) {
  const gi = form.elements.icon, ti = form.elements.tint, pv = form.querySelector('[data-preview]');
  const paint = () => {
    pv.innerHTML = tileHtml(gi.value, Number(ti.value), 'big');
    form.querySelectorAll('.tile-color').forEach(b => b.classList.toggle('on', b.dataset.tint === ti.value));
    form.querySelectorAll('.tile-glyph').forEach(b => b.classList.toggle('on', b.dataset.glyph === gi.value));
  };
  form.querySelector('.tile-pick').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tint !== undefined) ti.value = b.dataset.tint;
    if (b.dataset.glyph) gi.value = b.dataset.glyph;
    paint();
  });
}
const walletColor = w => COLORS[(w?.color ?? 0) % COLORS.length];
const clientColor = c => COLORS[Math.max(0, data.clients.indexOf(c)) % COLORS.length];
const clientCur = c => c.currency || wallet(c.wallet)?.currency || 'USD';
const initial = s => esc(String(s || '?').trim().charAt(0).toUpperCase() || '?');
// La billetera unida a Gastos no guarda un saldo propio: siempre muestra el que calculan tus movimientos.
const spendWallet = () => { const w = wallet(data.spendWallet); return w && w.currency === 'PEN' ? w : null; };
const isLinked = w => Boolean(w) && spendWallet() === w;
function syncLinked() {
  const w = spendWallet();
  if (w) w.balance = yapeBalance();
}
// Escribir el saldo de una billetera. En la unida a Gastos, la diferencia queda como ajuste (devuelve su id).
function setBalance(w, value, note = '') {
  w.updated = todayISO();
  if (isLinked(w)) {
    const prev = yapeBalance(), after = round2(value), diff = round2(after - prev);
    if (!diff) return null;
    const x = { id: uid(), kind: 'adj', date: todayISO(), amount: diff, currency: 'PEN', category: 'Ajuste', note: note || 'Saldo actualizado', prev, after };
    data.expenses.push(x);
    syncLinked();
    return x.id;
  }
  w.balance = round2(value);
  return null;
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
  if (s && PATHS[s.icon]) return { icon: s.icon, color: liveColor(s.color) || CAT_COLORS[0] };
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


const realMoves = () => data.expenses.filter(x => !isAdj(x));
const entryUnits = () => data.entries.reduce((t, e) => t + (Number(e.qty) || 1), 0);
const collectedPEN = () => data.payments.reduce((t, p) => t + toPEN(p.amount, p.currency), 0);
const monthSpent = m => sumAmount(data.expenses.filter(x => isOut(x) && monthKey(x.date) === m));

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
  ajustes: { label: 'Ajustes', icon: 'settings', render: viewSettings, desk: true },
};
const ALIASES = { cobros: 'clientes' };
function currentView() {
  const h = location.hash.slice(1);
  return VIEWS[h] ? h : ALIASES[h] || 'inicio';
}

// Lente de cristal de la barra inferior: se desliza hasta la pestaña activa (solo se ve en móvil).
let navLens = null;
function placeLens() {
  const nav = $('nav');
  if (!navLens) {
    navLens = document.createElement('i');
    navLens.className = 'nav-lens';
    navLens.setAttribute('aria-hidden', 'true');
  }
  if (navLens.parentNode !== nav) { nav.appendChild(navLens); void navLens.offsetWidth; }
  const a = nav.querySelector('.nav-item.active:not(.desk)');
  if (!a || !a.offsetWidth) { navLens.style.opacity = '0'; return; }
  navLens.style.opacity = '';
  // Efecto líquido: la lente se estira en el sentido del movimiento y se aplasta un poco, y luego se asienta con rebote.
  const prev = parseFloat(navLens.style.getPropertyValue('--lx'));
  const dist = Math.abs(a.offsetLeft - prev);
  if (dist > 1 && navLens.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const sx = 1 + Math.min(dist / a.offsetWidth * 0.32, 0.9), sy = Math.max(0.86, 1 - dist / a.offsetWidth * 0.06);
    navLens.animate([{ scale: '1 1' }, { scale: sx + ' ' + sy, offset: .38 }, { scale: '0.96 1.08', offset: .72 }, { scale: '1 1' }], { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
  navLens.style.setProperty('--lx', a.offsetLeft + 'px');
  navLens.style.setProperty('--lw', a.offsetWidth + 'px');
}

// Al apoyar el dedo en la barra, la lente se infla como una gota de cristal.
document.addEventListener('pointerdown', e => { if (navLens && e.target.closest && e.target.closest('.nav-item')) navLens.classList.add('press'); });
['pointerup', 'pointercancel', 'dragend'].forEach(t => document.addEventListener(t, () => navLens && navLens.classList.remove('press')));

function render() {
  syncLinked();
  const name = currentView();
  if ($('nav').dataset.view !== name) {
    $('nav').dataset.view = name;
    $('nav').innerHTML = Object.entries(VIEWS).map(([k, v]) =>
      `<a class="nav-item${k === name ? ' active' : ''}${v.desk ? ' desk' : ''}" href="#${k}"${k === name ? ' aria-current="page"' : ''}>${icon(v.icon, '', k === name)}<span>${v.label}</span></a>`).join('');
  }
  placeLens();
  $('pageTitle').textContent = VIEWS[name].label;
  $('view').innerHTML = VIEWS[name].render();
  $('view').classList.forEach(c => { if (c.startsWith('view-')) $('view').classList.remove(c); });
  $('view').classList.add(`view-${name}`);
  enterScreen(name === 'gastos' ? `${name}:${gTab}` : name);
  animateCounts($('view'));
  enhanceSelects($('view'));
  renderSync();
}

// ── Animaciones ──
// Montos grandes: los céntimos van más pequeños y el número cuenta desde su valor anterior.
function moneyParts(n) {
  const s = money(n), i = s.lastIndexOf('.');
  return i > 0 ? `${s.slice(0, i)}<span class="dec">${s.slice(i)}</span>` : s;
}
const countNum = (key, value) => `<span class="num-anim" data-key="${key}" data-to="${round2(value)}">${moneyParts(value)}</span>`;
const lastCounts = {};
function animateCounts(root) {
  if (reducedMotion()) return;
  root.querySelectorAll('.num-anim').forEach(el => {
    const key = el.dataset.key, to = Number(el.dataset.to);
    const from = key in lastCounts ? lastCounts[key] : 0;
    lastCounts[key] = to;
    if (Math.abs(to - from) < 0.005) return;
    const t0 = performance.now(), dur = 900;
    el.classList.add('counting');
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.innerHTML = moneyParts(k < 1 ? from + (to - from) * e : to);
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
      else el.classList.remove('counting');
    };
    requestAnimationFrame(step);
    // Si el navegador pausa la animación (pestaña en segundo plano), el número final queda igual de exacto.
    setTimeout(() => { if (el.isConnected) { el.innerHTML = moneyParts(to); el.classList.remove('counting'); } }, dur + 80);
  });
}
// Entrada escalonada solo al cambiar de pantalla (no en cada toque).
let lastScreen = '';
function enterScreen(key) {
  const v = $('view');
  if (key === lastScreen || reducedMotion()) { lastScreen = key; return; }
  lastScreen = key;
  v.classList.remove('enter');
  void v.offsetWidth;
  v.classList.add('enter');
  clearTimeout(enterScreen.t);
  enterScreen.t = setTimeout(() => v.classList.remove('enter'), 1400);
}
// El número del contador "salta" al anotar o quitar.
function bumpCount(id, up = true) {
  const el = document.querySelector(`.counter [data-id="${id}"]`)?.closest('.counter')?.querySelector('.count');
  if (!el) return;
  el.classList.add(up ? 'bump' : 'bump-down');
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
  const sw = spendWallet();
  return `
  ${linkConflictCard()}
  <section class="card hero money-hero">
    ${forecastBlock()}
    <p class="hero-note">${esc(rateNote)}</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>Tus billeteras</h2><button class="btn-sm ghost" data-act="updateBalances">${icon('refresh')}Actualizar</button></div>
    <div class="wallet-list">${data.wallets.map(w => `
      <button class="wallet${isLinked(w) ? ' linked' : ''}" data-act="${isLinked(w) ? 'adjustYape' : 'editWallet'}" data-id="${w.id}" aria-label="Escribir saldo de ${esc(w.name)}">
        ${walletTile(w)}
        <span class="wallet-name">${esc(w.name)}${isLinked(w) ? `<em class="tag link-tag">${icon('link')}Gastos</em>` : ''}<small>${isLinked(w) ? 'Se mueve con tus gastos' : w.updated ? `Actualizado ${relDate(w.updated)}` : CURRENCY_NAMES[w.currency] || w.currency}</small></span>
        <span class="wallet-amount">${money(w.balance, w.currency)}${w.currency !== 'PEN' ? `<small>≈ ${money(toPEN(w.balance, w.currency))}</small>` : ''}</span>
        ${icon('chevronRight', 'wallet-edit')}
      </button>`).join('')}
    </div>
    <div class="btn-row hero-actions">
      <button class="btn ghost" data-act="newExpenseHome">${icon('receipt')}Gasto</button>
      <button class="btn primary" data-act="newWithdrawal">${icon('banknote')}Retiré</button>
    </div>
  </section>
  ${data.clients.length ? '' : `<section class="card quest">${emptyState('Agrega a tus clientes y lo que les haces para ir anotando cada entrega.', newClientButton())}</section>`}
  ${goalsCard(now)}
  ${plannedHomeCard()}
  ${pend.length ? `<section class="card">
    <div class="card-head"><h2>Por cobrar</h2><span class="count-pill">${pend.length}</span></div>
    <div class="rows">${pend.map(chargeRow).join('')}</div>
  </section>` : ''}
  ${nextWithdrawalCard()}`;
}


// Una sola vez: al unir Yape con Gastos había dos saldos distintos. Eliges cuál es el real.
function linkConflictCard() {
  const c = data.linkConflict, w = spendWallet();
  if (!c || !w) return '';
  return `<section class="card notice">
    <div class="card-head"><h2>${icon('link')}Un solo saldo de ${esc(w.name)}</h2></div>
    <p class="muted">Antes tenías ${esc(w.name)} en dos sitios. Ahora es una sola billetera: lo que anotas en Gastos cambia su saldo. ¿Cuál es tu saldo real hoy?</p>
    <div class="btn-row">
      <button class="btn ghost" data-act="pickLink" data-v="gastos">${money(c.gastos)}<small>el de Gastos</small></button>
      <button class="btn ghost" data-act="pickLink" data-v="wallet">${money(c.wallet)}<small>el de Inicio</small></button>
      <button class="btn-sm ghost" data-act="adjustYape">Otro monto</button>
    </div>
  </section>`;
}


// Meta de ingresos del mes (anillo) y presupuesto de gastos (barra de vida).
function goalsCard(m) {
  const g = data.goals, t = monthTotals(m);
  if (!(g.income > 0) && !(g.budget > 0)) {
    return `<section class="card quest">
      <div class="card-head"><h2>${icon('target')}Ponte metas</h2></div>
      <p class="muted">Elige cuánto quieres ganar este mes y cuánto gastar como máximo. Verás tu avance en cada mes.</p>
      <div class="btn-row"><button class="btn primary" data-act="goals">${icon('target')}Elegir mis metas</button></div>
    </section>`;
  }
  const R = 46, C = 2 * Math.PI * R;
  const pct = g.income > 0 ? Math.min(1, t.logged / g.income) : 0;
  const reached = g.income > 0 && t.logged >= g.income;
  const spent = monthSpent(m), left = g.budget - spent;
  const daysLeft = dayDiff(todayISO(), lastDay(m)) + 1;
  const hp = g.budget > 0 ? Math.max(0, Math.min(1, left / g.budget)) : 0;
  const hpCls = hp > 0.5 ? 'ok' : hp > 0.2 ? 'mid' : 'low';
  return `<section class="card goals">
    <div class="card-head"><h2>Metas de ${monthName(m)}</h2><button class="btn-sm ghost" data-act="goals">${icon('edit')}Editar</button></div>
    ${g.income > 0 ? `<div class="goal-ring${reached ? ' reached' : ''}">
      <svg viewBox="0 0 110 110" class="ring" aria-hidden="true"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a84ff"/><stop offset="1" stop-color="#64d2ff"/></linearGradient></defs>
        <circle cx="55" cy="55" r="${R}" class="ring-bg"/>
        <circle cx="55" cy="55" r="${R}" class="ring-fg" stroke-dasharray="${(pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/>
      </svg>
      <span class="ring-pct">${reached ? icon('trophy') : `${Math.round(pct * 100)}%`}</span>
      <div class="goal-text">
        <span class="label">Ingresos anotados</span>
        <b>${money(t.logged)} <small>de ${money(g.income)}</small></b>
        <small>${reached ? '¡Meta cumplida! Todo lo que sigue es extra.' : `Te faltan ${money(g.income - t.logged)}.${t.expected >= g.income ? ' Con tu ritmo, llegas.' : ` Con tu ritmo llegarías a ${money(t.expected)}.`}`}</small>
      </div>
    </div>` : ''}
    ${g.budget > 0 ? `<div class="hp">
      <div class="hp-head"><span class="label">${icon('shield')}Presupuesto de gastos</span><b class="${left < 0 ? 'neg' : ''}">${left < 0 ? `Te pasaste ${money(-left)}` : `Te quedan ${money(left)}`}</b></div>
      <div class="hp-bar ${hpCls}"><i style="width:${Math.round(hp * 100)}%"></i></div>
      <small class="muted">Gastaste ${money(spent)} de ${money(g.budget)}${left > 0 && daysLeft > 0 ? ` · ${money(left / daysLeft)} por día hasta fin de mes` : ''}</small>
    </div>` : ''}
    <div class="stats goal-stats">
      <div class="stat"><span>Cobrado</span><b class="pos">${money(t.collected)}</b></div>
      <div class="stat"><span>Estimado a fin de mes</span><b>${money(t.expected)}</b></div>
    </div>
  </section>`;
}


function forecastBlock() {
  const until = horizonDate(data.horizon), f = forecast(until);
  const day = fmtDate(until, { day: 'numeric', month: 'short', year: until.slice(0, 4) === todayISO().slice(0, 4) ? undefined : 'numeric' });
  const gain = f.total - f.now;
  return `<p class="label">Tu dinero hoy</p>
  <p class="hero-amount">${countNum('hero', f.now)}</p>
  <button class="fc-chip" data-act="forecastDetail" aria-label="Ver qué incluye la previsión">
    <span class="fc-chip-ic">${icon('rocket')}</span>
    <span>Al ${day} tendrías <b>${money(f.total)}</b>${gain > 0.005 ? ` <em>+${moneyShort(gain)}</em>` : ''}</span>
    ${icon('chevronRight', 'fc-more')}
  </button>
  <div class="fc-breakdown">
    <span><small>Por cobrar</small><b>${money(f.pending)}</b></span>
    <span><small>Por hacer</small><b>${money(f.future)}</b></span>
    ${plannedTotal(until) > 0 ? `<span><small>Previstos</small><b>−${money(plannedTotal(until))}</b></span>` : ''}
    ${f.costs.count ? `<span><small>Comisiones</small><b>−${money(f.costs.total)}</b></span>` : ''}
  </div>`;
}

function chargeRow({ c, m, due }) {
  const now = thisMonth(), late = m < now;
  return `<div class="row${late ? ' late' : ''}">
    ${clientTile(c)}
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
        ${clientTile(c)}
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
        ${walletTile(w)}
        <span class="row-main"><b>${esc(w.name)}</b><small>${CURRENCY_NAMES[w.currency] || w.currency}</small></span>
        <span class="amount">${money(w.balance, w.currency)}</span>
      </button>`).join('')}
    </div>
    <label class="field link-field"><span>${icon('link')}Billetera de gastos</span>
      <select id="spendWalletSel">${data.wallets.filter(w => w.currency === 'PEN').map(w => `<option value="${w.id}"${isLinked(w) ? ' selected' : ''}>${esc(w.name)}</option>`).join('')}<option value=""${spendWallet() ? '' : ' selected'}>Ninguna (Gastos va aparte)</option></select>
      <small class="field-hint">Su saldo lo calculan tus gastos e ingresos: no lo escribes dos veces. Solo billeteras en soles.</small>
    </label>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('target')}Metas</h2><button class="btn-sm ghost" data-act="goals">${icon('edit')}Editar</button></div>
    <p class="muted small">Ingresos al mes: <b class="ink">${data.goals.income ? money(data.goals.income) : 'sin meta'}</b> · Presupuesto de gastos: <b class="ink">${data.goals.budget ? money(data.goals.budget) : 'sin presupuesto'}</b></p>
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
    <div class="card-head"><h2>${icon('zap')}Atajo del iPhone</h2><span class="count-pill">${inboxCfg() ? 'Activo' : 'Sin conectar'}</span></div>
    <p class="muted small">Anota gastos e ingresos con «Tocar atrás» desde la app Atajos, sin abrir Saldo. Pega la dirección y la clave de tu hoja de Google (guía en la carpeta <b class="ink">ios/</b>).</p>
    <form class="form" id="inboxForm" autocomplete="off">
      <label class="field"><span>Dirección del buzón</span><input name="url" type="url" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(inboxCfg()?.url || '')}"></label>
      <label class="field"><span>Clave</span><input name="token" type="text" autocapitalize="off" spellcheck="false" placeholder="La misma que pusiste en el script" value="${esc(inboxCfg()?.token || '')}"></label>
      <div class="form-actions">
        <button type="button" class="btn ghost" data-act="inboxPull"${inboxCfg() ? '' : ' disabled'}>${icon('refresh')}Revisar ahora</button>
        <button class="btn primary">Guardar</button>
      </div>
    </form>
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

// Teclado en pantalla. La hoja no se mueve: al abrirse el teclado gana espacio al final (--kb) y se sube el campo a la parte alta;
// al cerrarse, la pantalla vuelve a donde estaba. Si el sistema da la altura real del teclado (VirtualKeyboard API), se usa y avisa
// también al cerrarlo con el gesto de atrás; si no, se estima y se vuelve al soltar el campo.
const kbRoot = document.documentElement;
const isTextField = el => el && /^(INPUT|TEXTAREA)$/.test(el.tagName) && !['checkbox', 'radio', 'button', 'submit', 'file', 'hidden', 'range', 'color', 'date', 'time', 'month', 'week', 'datetime-local'].includes(el.type);
let baseHeight = window.innerHeight;
const baseH = () => Math.max(baseHeight, window.innerHeight); // por si la página cargó con la ventana aún sin tamaño
let kbTimer = 0;
let savedScroll = null; // dónde estaba la pantalla antes de subir el campo
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
// Teclado cerrado: se quita el espacio extra y la pantalla vuelve a donde estaba.
function closeKeyboard() {
  setKb(0);
  const sv = savedScroll;
  savedScroll = null;
  if (!sv) return;
  if (sv.box && sv.box.isConnected) sv.box.scrollTop = sv.top;
  else if (!sv.box) window.scrollTo(0, sv.top);
}
// iPhone: el teclado no cambia el tamaño de la página, la tapa y Safari la desplaza. En vez de estimar el teclado,
// la hoja sigue el área realmente visible (visualViewport): --vvh es su alto y --vvt cuánto se desplazó.
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (IS_IOS && window.visualViewport) {
  const vv = window.visualViewport;
  const syncVV = () => {
    const open = vv.scale <= 1.01 && window.innerHeight - vv.height - vv.offsetTop > 80 && isTextField(document.activeElement);
    kbRoot.style.setProperty('--vvh', Math.round(vv.height) + 'px');
    kbRoot.style.setProperty('--vvt', Math.round(vv.offsetTop) + 'px');
    kbRoot.classList.toggle('ios-kb', open);
  };
  vv.addEventListener('resize', syncVV);
  vv.addEventListener('scroll', syncVV);
  document.addEventListener('focusout', () => setTimeout(syncVV, 250));
}
// Si el campo enfocado (con su etiqueta) queda cortado arriba o abajo, lo acomoda dentro de la hoja. Si ya se ve, no mueve nada.
function iosReveal(field) {
  const box = field.closest('.sheet');
  if (!box || document.activeElement !== field) return;
  const el = field.closest('.field') || field;
  const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
  const top = r.top - b.top, bottom = r.bottom - b.top;
  const pad = 56; // espacio para la cabecera de la hoja
  if (top < pad) box.scrollBy({ top: top - pad, behavior: 'smooth' });
  else if (bottom > box.clientHeight - 12) box.scrollBy({ top: bottom - box.clientHeight + 24, behavior: 'smooth' });
}
document.addEventListener('focusin', e => {
  if (!isTextField(e.target) || !window.matchMedia('(pointer: coarse)').matches) return;
  const field = e.target;
  if (IS_IOS) { setTimeout(() => { if (window.visualViewport) window.visualViewport.dispatchEvent(new Event('resize')); iosReveal(field); }, 380); return; }
  clearTimeout(kbTimer);
  if (!savedScroll) { const box = field.closest('.sheet'); savedScroll = { box, top: box ? box.scrollTop : window.scrollY }; }
  if (!kbRoot.style.getPropertyValue('--kb') || kbRoot.style.getPropertyValue('--kb') === '0px') setKb(Math.round(baseH() * 0.45));
  kbTimer = setTimeout(() => { if (windowShrunk()) setKb(0); revealField(field); }, 350);
});
document.addEventListener('focusout', () => {
  clearTimeout(kbTimer);
  kbTimer = setTimeout(() => { if (!isTextField(document.activeElement)) closeKeyboard(); }, 200);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') closeKeyboard(); });
window.addEventListener('resize', () => { if (!isTextField(document.activeElement)) baseHeight = window.innerHeight; });
if (navigator.virtualKeyboard) {
  const vk = navigator.virtualKeyboard;
  try { vk.overlaysContent = true; } catch {}
  vk.addEventListener('geometrychange', () => {
    const h = Math.round(vk.boundingRect.height);
    if (h > 0) {
      clearTimeout(kbTimer);
      setKb(h);
      kbTimer = setTimeout(() => revealField(document.activeElement), 120);
    } else if (savedScroll) {
      clearTimeout(kbTimer);
      closeKeyboard();
    }
  });
}

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
  savedScroll = null;
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
    <div data-balwrap>${moneyField('', 'balance', wallet(w0).currency, '', pay ? 'placeholder="Sin cambios"' : '', ' ')}</div>
    <p class="preview" data-linked hidden></p>
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
      setText(form, '[data-hint="balance"]', pay ? `Ahora: ${money(w.balance, w.currency)}. Déjalo vacío si no cambió.` : `Antes de este cobro: ${money(w.balance, w.currency)}. Déjalo vacío si aún no lo revisas.`);
      // En la billetera de gastos no se escribe el saldo: el cobro se anota como ingreso y el saldo sube solo.
      const linked = isLinked(w);
      form.querySelector('[data-balwrap]').hidden = linked;
      form.querySelector('[data-linked]').hidden = !linked;
      if (linked) setText(form, '[data-linked]', `Se anota como ingreso en Gastos${amount > 0 ? ` (+${money(convert(amount, cc, 'PEN'))})` : ''} y tu saldo de ${w.name} sube solo.`);
    };
    el('wallet').addEventListener('change', sync);
    el('amount').addEventListener('input', sync);
    sync();
    if (!pay && !isLinked(wallet(el('wallet').value))) el('balance').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const w = wallet(el('wallet').value);
      const amount = round2(el('amount').value);
      if (!(amount > 0)) return toast('Escribe cuánto te pagó');
      const date = el('date').value;
      const linked = isLinked(w);
      const typed = linked ? '' : el('balance').value;
      const before = w.balance;
      if (typed !== '') setBalance(w, typed);
      // Movimiento de ingreso en Gastos cuando el cobro llega a la billetera de gastos.
      let moveId = pay?.moveId || '';
      const mv = moveId && data.expenses.find(x => x.id === moveId);
      if (linked) {
        const amt = round2(convert(amount, cc, 'PEN'));
        if (mv) Object.assign(mv, { amount: amt, date });
        else {
          moveId = uid();
          data.expenses.push({ id: moveId, kind: 'in', date, amount: amt, currency: 'PEN', category: 'Cobro', contact: c.name, note: `Cobro de ${monthName(m)}` });
        }
      } else if (mv) {
        data.expenses = data.expenses.filter(x => x !== mv);
        moveId = '';
      }
      syncLinked();
      if (pay) {
        Object.assign(pay, { amount, currency: cc, wallet: w.id, date, moveId });
        if (typed !== '' || linked) Object.assign(pay, { balanceBefore: before, balanceAfter: w.balance });
      } else {
        data.payments.push({ id: uid(), clientId: c.id, month: m, amount, currency: cc, wallet: w.id, date, balanceBefore: before, balanceAfter: w.balance, moveId });
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
// Curva suave entre puntos (Catmull-Rom → Bézier), sin pasar por debajo de la base.
function smoothPath(pts, floor) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(floor, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(floor, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function gTimeChart(list) {
  const { mode, items, label, title } = gBuckets(list);
  const series = gf.type === 'out' ? ['out'] : gf.type === 'in' ? ['in'] : ['in', 'out'];
  const max = Math.max(1, ...items.flatMap(b => series.map(s => b[s])));
  // Se dibuja al ancho real de la tarjeta: así el texto mide lo mismo en celular y en escritorio.
  const W = Math.round(Math.max(280, Math.min(780, ($('view').clientWidth || 640) - 72))), H = 200, padB = 26, padT = 34, padX = 8, n = items.length;
  const x = i => padX + (n === 1 ? (W - 2 * padX) / 2 : (i * (W - 2 * padX)) / (n - 1));
  const y = v => H - padB - (v / max) * (H - padB - padT);
  const base = H - padB;
  const col = { in: ['#0a84ff', '#64d2ff'], out: ['#ff8a6b', '#ff6f61'] };
  const grid = [0.25, 0.5, 0.75, 1].map(f => `<line x1="0" x2="${W}" y1="${y(max * f).toFixed(1)}" y2="${y(max * f).toFixed(1)}" class="chart-grid"/>`).join('');
  const defs = series.map(s => `<linearGradient id="ln-${s}" x1="0" x2="1"><stop offset="0" stop-color="${col[s][0]}"/><stop offset="1" stop-color="${col[s][1]}"/></linearGradient>
    <linearGradient id="ar-${s}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col[s][1]}" stop-opacity=".38"/><stop offset="1" stop-color="${col[s][1]}" stop-opacity="0"/></linearGradient>`).join('');
  const paths = series.map(s => {
    const pts = items.map((b, i) => [x(i), y(b[s])]);
    const line = smoothPath(pts, base);
    return `<path d="${line} L${x(n - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z" fill="url(#ar-${s})" class="chart-area"/>
      <path d="${line}" fill="none" stroke="url(#ln-${s})" stroke-width="3" stroke-linecap="round" pathLength="1" class="chart-line"/>`;
  }).join('');
  // El punto más alto de la serie principal, marcado como en una app de banco.
  const main = series[series.length - 1];
  const top = items.reduce((a, b, i) => (b[main] > items[a][main] ? i : a), 0);
  const tx = x(top), ty = y(items[top][main]);
  const tipW = 118, tipX = Math.max(0, Math.min(W - tipW, tx - tipW / 2));
  const marker = items[top][main] > 0 ? `<line x1="${tx}" x2="${tx}" y1="${ty}" y2="${base}" class="chart-guide"/>
    <circle cx="${tx}" cy="${ty}" r="6" class="chart-dot" style="--c:${col[main][1]}"/>
    <g class="chart-tip"><rect x="${tipX}" y="${Math.max(0, ty - 40)}" width="${tipW}" height="28" rx="8"/>
    <text x="${tipX + tipW / 2}" y="${Math.max(0, ty - 40) + 18}" text-anchor="middle">${esc(label(items[top].key))} · ${esc(moneyShort(items[top][main]))}</text></g>` : '';
  const hits = items.map((b, i) => `<rect x="${(x(i) - (W / n) / 2).toFixed(1)}" y="0" width="${(W / n).toFixed(1)}" height="${H}" fill="transparent"><title>${esc(title(b.key))}: ${series.map(s => money(b[s])).join(' / ')}</title></rect>`).join('');
  const step = Math.ceil(n / 7);
  const labels = items.map((b, i) => (i % step && i !== n - 1 ? '' : `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" class="chart-t">${esc(label(b.key))}</text>`)).join('');
  const unit = mode === 'day' ? 'por día' : mode === 'week' ? 'por semana' : 'por mes';
  return `<section class="card">
    <div class="card-head"><h2>${gf.type === 'in' ? 'Ingresos' : gf.type === 'out' ? 'Gastos' : 'Ingresos y gastos'} ${unit}</h2>${series.length > 1 ? '<span class="legend"><i style="background:#64d2ff"></i>Ingresos <i style="background:#ff6f61"></i>Gastos</span>' : ''}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica ${unit}">
      <defs>${defs}</defs>${grid}${paths}${marker}${labels}${hits}
    </svg>
  </section>`;
}
// Dona con segmentos redondeados y separados.
function gDonut(cats, total) {
  const R = 60, C = 2 * Math.PI * R, gap = cats.length > 1 ? 7 : 0;
  let off = 0;
  const arcs = cats.map((c, i) => {
    const len = (c.total / total) * C, vis = Math.max(0.01, len - gap);
    const el = `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${catMeta(c.category).color}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${vis.toFixed(2)} ${(C - vis).toFixed(2)}" stroke-dashoffset="${(-off - gap / 2).toFixed(2)}" transform="rotate(-90 80 80)" class="donut-seg" style="--i:${i}"><title>${esc(c.category)}: ${money(c.total)}</title></circle>`;
    off += len;
    return el;
  }).join('');
  return `<svg class="donut" viewBox="0 0 160 160" role="img" aria-label="Por categoría"><circle cx="80" cy="80" r="${R}" fill="none" class="donut-bg" stroke-width="16"/>${arcs}<text x="80" y="76" text-anchor="middle" class="donut-k">Total</text><text x="80" y="97" text-anchor="middle" class="donut-v">${esc(moneyShort(total))}</text></svg>`;
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
    case 'category': return isAdj(x) ? `<span class="cell-cat"><span class="cat-ic sm" style="--c:#8e8e93">${icon('refresh')}</span>Ajuste de saldo</span>` : `<span class="cell-cat">${catBadge(x.category, true)}${esc(x.category)}</span>`;
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
      <span class="cat-ic" style="--c:#8e8e93">${icon('refresh')}</span>
      <span class="row-main"><b>${esc(x.note || 'Ajuste de saldo')}</b><small>Ajuste · no cuenta en estadísticas · ${fmtDate(x.date)}</small></span>
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
  const sw = spendWallet(), b = data.goals.budget, left = b - outT;
  return `
  <section class="card hero spend-hero">
    <p class="label">${sw ? `Saldo de ${esc(sw.name)}` : 'Saldo de gastos'}</p>
    <p class="hero-amount ${yapeBalance() < 0 ? 'neg' : ''}">${countNum('spend', yapeBalance())}</p>
    <p class="hero-note">${sw ? `${icon('link')}Misma billetera que en Inicio` : 'No está unida a ninguna billetera (Ajustes)'}</p>
    <div class="btn-row"><button class="btn ghost on-dark" data-act="adjustYape">${icon('edit')}Ajustar saldo</button></div>
  </section>
  <div class="btn-row big-actions">
    <button class="btn out big" data-act="newExpense">${icon('minus')}Gasto</button>
    <button class="btn in big" data-act="newIncome">${icon('plus')}Ingreso</button>
  </div>
  ${b > 0 ? `<section class="card hp">
    <div class="hp-head"><span class="label">${icon('shield')}Presupuesto de ${monthName(m)}</span><b class="${left < 0 ? 'neg' : ''}">${left < 0 ? `Te pasaste ${money(-left)}` : `Te quedan ${money(left)}`}</b></div>
    <div class="hp-bar ${left / b > 0.5 ? 'ok' : left / b > 0.2 ? 'mid' : 'low'}"><i style="width:${Math.round(Math.max(0, Math.min(1, left / b)) * 100)}%"></i></div>
    <small class="muted">Gastos ${money(outT)} · Ingresos ${money(inT)}</small>
  </section>` : `<div class="stats two">
    <div class="stat"><span>Gastos de ${monthName(m)}</span><b class="neg">${money(outT)}</b></div>
    <div class="stat"><span>Ingresos de ${monthName(m)}</span><b class="pos">${money(inT)}</b></div>
  </div>`}
  ${plannedCard()}
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
  const name = spendWallet()?.name || 'Yape';
  openSheet(`Ajustar saldo de ${name}`, `<form class="form">
    ${moneyField(`Cuánto tienes ahora en ${esc(name)}`, 'balance', 'PEN', yapeBalance(), 'required')}
    <label class="field"><span>Motivo</span><input name="note" maxlength="80" placeholder="Opcional. Ej. Cuadré con la app de Yape"></label>
    <p class="muted small">Se anota como ajuste de saldo: cambia tu saldo pero no cuenta como gasto ni ingreso.</p>
    ${formActions()}
  </form>`, (form, el) => {
    el('balance').focus();
    form.onsubmit = e => {
      e.preventDefault();
      if (el('balance').value === '' || !Number.isFinite(Number(el('balance').value))) return toast('Escribe tu saldo');
      const prev = yapeBalance(), after = round2(el('balance').value), diff = round2(after - prev);
      const hadConflict = Boolean(data.linkConflict);
      data.linkConflict = null;
      if (spendWallet()) spendWallet().updated = todayISO();
      if (!diff) { closeSheet(); return commit(hadConflict ? 'Saldo confirmado' : 'Ya tienes ese saldo'); }
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

// ── Gastos previstos ──
const REPEATS = { none: 'Una vez', weekly: 'Cada semana', monthly: 'Cada mes' };
const nextDue = p => (p.repeat === 'weekly' ? addDays(p.date, 7) : p.repeat === 'monthly' ? addMonthsClamped(p.date, 1) : '');
const plannedSorted = () => [...data.planned].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
// Veces que toca pagar un gasto previsto hasta una fecha (lo atrasado cuenta una vez).
function plannedCount(p, until) {
  let n = 0;
  while (p.date && p.date <= until && n < 60) {
    n++;
    const d = nextDue(p);
    if (!d) break;
    p = { ...p, date: d };
  }
  return n;
}
const plannedTotal = until => data.planned.reduce((t, p) => t + p.amount * plannedCount(p, until), 0);
const monthEnd = () => addDays(addMonthsClamped(`${thisMonth()}-01`, 1), -1);
function plannedRow(p) {
  const late = p.date < todayISO();
  return `<button class="row${late ? ' late' : ''}" data-act="editPlanned" data-id="${p.id}">
    ${catBadge(p.category)}
    <span class="row-main"><b>${esc(p.note || p.contact || p.category)}</b><small>${late ? 'Vencido · ' : ''}${cap(relDate(p.date))}${p.repeat !== 'none' ? ` · ${REPEATS[p.repeat].toLowerCase()}` : ''} · ${esc(p.category)}</small></span>
    <span class="amount neg">−${money(p.amount)}</span>
  </button>`;
}
function plannedCard() {
  const list = plannedSorted(), tot = plannedTotal(monthEnd());
  return `<section class="card">
    <div class="card-head"><h2>Gastos previstos</h2>${list.length ? `<span class="count-pill">${list.length}</span>` : ''}</div>
    ${list.length ? `<div class="rows">${list.slice(0, 6).map(plannedRow).join('')}</div>
      <p class="muted small planned-note">Hasta fin de ${monthName(thisMonth())}: ${money(tot)} · tu saldo quedaría en ${money(yapeBalance() - tot)}</p>` : emptyState('Anota lo que sabes que vas a pagar (alquiler, recibos, suscripciones) y verás cuánto te quedaría.')}
    <div class="btn-row"><button class="btn ghost" data-act="newPlanned">${icon('plus')}Añadir previsto</button>${list.length > 6 ? `<button class="btn ghost" data-act="allPlanned">Ver todos (${list.length})</button>` : ''}</div>
  </section>`;
}
function plannedHomeCard() {
  if (!data.planned.length) return '';
  const list = plannedSorted(), tot = plannedTotal(monthEnd());
  return `<section class="card">
    <div class="card-head"><h2>Gastos previstos</h2><a class="link" href="#gastos">Ver</a></div>
    <div class="rows">${list.slice(0, 3).map(plannedRow).join('')}</div>
    <p class="muted small planned-note">Hasta fin de ${monthName(thisMonth())}: ${money(tot)}</p>
  </section>`;
}
function plannedForm(x = null) {
  const catOptions = sel => kindCategories('out').map(c => { const m = catMeta(c); return `<option value="${esc(c)}" data-icon="${m.icon}" data-color="${m.color}"${c === sel ? ' selected' : ''}>${esc(c)}</option>`; }).join('');
  openSheet(x ? 'Editar previsto' : 'Gasto previsto', `<form class="form">
    ${moneyField('Monto', 'amount', 'PEN', x?.amount)}
    <label class="field"><span>Categoría</span><select name="category">${catOptions(x?.category)}</select></label>
    <label class="field"><span>Detalle</span><input name="note" maxlength="80" value="${esc(x?.note || '')}" placeholder="Ej. Alquiler"></label>
    <label class="field"><span>Fecha prevista</span><input name="date" type="date" required value="${x?.date || todayISO()}"></label>
    <label class="field"><span>Se repite</span><select name="repeat">${Object.entries(REPEATS).map(([k, l]) => `<option value="${k}"${(x?.repeat || 'none') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    ${x ? `<button type="button" class="btn primary" data-act="payPlanned" data-id="${x.id}">${icon('check')}Marcar como pagado</button>${deleteButton('deletePlanned', x.id)}` : ''}
    ${formActions(x ? 'Guardar' : 'Añadir')}
  </form>`, (form, el) => {
    if (!x) el('amount').focus();
    form.onsubmit = e => {
      e.preventDefault();
      const amount = round2(el('amount').value);
      if (!(amount > 0)) return toast('Escribe el monto');
      const next = { amount, category: el('category').value, note: el('note').value.trim(), date: el('date').value, repeat: el('repeat').value, contact: x?.contact || '' };
      if (x) Object.assign(x, next); else data.planned.push({ id: uid(), ...next });
      closeSheet();
      commit(x ? 'Previsto actualizado' : 'Gasto previsto añadido');
    };
  });
}
function plannedAllSheet() {
  openSheet('Gastos previstos', `<div class="form"><div class="rows">${plannedSorted().map(plannedRow).join('')}</div></div>`);
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
      const moves = [
        setBalance(a, Math.max(0, fromBefore - amount), `Retiro hacia ${b.name}`),
        setBalance(b, toAfter, `Retiro desde ${a.name}`),
      ].filter(Boolean);
      data.withdrawals.push({ id: uid(), date: el('date').value, from: a.id, to: b.id, amount, received, fromBefore, fromAfter: a.balance, toBefore, toAfter, note: el('note').value.trim(), moves });
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
    <label class="field"><span>Ver previsión al</span><input type="date" id="horizonDate" value="${until}" min="${addDays(todayISO(), 1)}"></label>
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
    ${data.wallets.map(w => moneyField(esc(w.name), `w_${w.id}`, w.currency, w.balance, '', isLinked(w) ? 'Billetera de gastos: si lo cambias, la diferencia se anota como ajuste.' : w.updated ? `Actualizado ${relDate(w.updated)}` : '')).join('')}
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
    ${tilePicker(w?.icon && TILE_GLYPHS[w.icon] ? w.icon : guessWalletGlyph(w || { name: '', currency: cur }), walletTileIdx(w))}
    ${w && data.wallets.length > 1 ? deleteButton('deleteWallet', w.id, 'Eliminar billetera') : ''}
    ${formActions()}
  </form>`, (form, el) => {
    el('currency').addEventListener('change', () => setText(form, '[data-cur="balance"]', CURRENCIES[el('currency').value]));
    bindTilePicker(form);
    const first = w ? el('balance') : el('title');
    first.focus();
    if (w) first.select();
    form.onsubmit = e => {
      e.preventDefault();
      const name = el('title').value.trim();
      if (!name) return toast('Escribe un nombre');
      if (w) {
        Object.assign(w, { name, currency: el('currency').value, icon: el('icon').value, tint: Number(el('tint').value) });
        setBalance(w, el('balance').value);
      } else {
        data.wallets.push({ id: uid(), name, currency: el('currency').value, balance: round2(el('balance').value), color: data.wallets.length % COLORS.length, icon: el('icon').value, tint: Number(el('tint').value), updated: todayISO() });
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
    ${tilePicker(c?.icon && TILE_GLYPHS[c.icon] ? c.icon : 'person', clientTileIdx(c || {}))}
    ${c ? deleteButton('deleteClient', c.id) : ''}
    ${formActions(c ? 'Guardar' : 'Siguiente')}
  </form>`, (form, el) => {
    if (!c) el('title').focus();
    bindTilePicker(form);
    form.onsubmit = e => {
      e.preventDefault();
      const next = { name: el('title').value.trim(), currency: el('currency').value, wallet: el('wallet').value, note: el('note').value.trim(), icon: el('icon').value, tint: Number(el('tint').value) };
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

// ── Metas ──
function goalsForm() {
  openSheet('Tus metas del mes', `<form class="form">
    ${moneyField('Quiero ganar al mes', 'income', 'PEN', data.goals.income || '', 'min="0"', 'Lo anotado de todos tus clientes, en soles. Déjalo vacío si no quieres esta meta.')}
    ${moneyField('Quiero gastar como máximo', 'budget', 'PEN', data.goals.budget || '', 'min="0"', 'Tus gastos del mes en la sección Gastos. Vacío: sin presupuesto.')}
    ${formActions()}
  </form>`, (form, el) => {
    el('income').focus();
    form.onsubmit = e => {
      e.preventDefault();
      data.goals = { income: Math.max(0, round2(el('income').value)), budget: Math.max(0, round2(el('budget').value)) };
      closeSheet();
      commit('Metas guardadas');
    };
  });
}

let lastTap = { x: innerWidth / 2, y: innerHeight / 2 };
document.addEventListener('pointerdown', e => { lastTap = { x: e.clientX, y: e.clientY }; }, true);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Acciones ──
function findEntry(id) { return data.entries.find(e => e.id === id); }
const actions = {
  closeSheet,
  inboxPull: async () => {
    const n = await pullInbox();
    if (n === 0) toast('No hay movimientos nuevos');
  },
  goals: () => goalsForm(),
  goClients: () => { location.hash = '#clientes'; },
  newExpenseHome: () => expenseForm(null, 'out'),
  newPlanned: () => plannedForm(),
  allPlanned: () => plannedAllSheet(),
  editPlanned: d => { const x = data.planned.find(y => y.id === d.id); if (x) plannedForm(x); },
  deletePlanned: d => {
    const x = data.planned.find(y => y.id === d.id);
    if (!x || !confirm('¿Eliminar este gasto previsto?')) return;
    data.planned = data.planned.filter(y => y !== x);
    closeSheet();
    commit('Previsto eliminado');
  },
  payPlanned: d => {
    const x = data.planned.find(y => y.id === d.id);
    if (!x) return;
    data.expenses.push({ id: uid(), kind: 'out', date: todayISO(), amount: x.amount, currency: 'PEN', category: x.category, note: x.note, ...(x.contact ? { contact: x.contact } : {}) });
    const nd = nextDue(x);
    if (nd) x.date = nd; else data.planned = data.planned.filter(y => y !== x);
    closeSheet();
    commit('Pagado y anotado en tus gastos');
  },

  pickLink: d => {
    const c = data.linkConflict;
    if (!c) return;
    data.linkConflict = null;
    const w = spendWallet();
    if (w && d.v === 'wallet') setBalance(w, c.wallet, 'Saldo unificado con Inicio');
    commit(`Listo: un solo saldo de ${w ? w.name : 'Yape'}`);
  },
  log: d => {
    const c = client(d.client), p = product(c, d.id);
    if (!p) return;
    data.entries.push({ id: uid(), clientId: c.id, productId: p.id, name: p.name, price: p.price, qty: 1, date: logDate(d.month) });
    if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
    commit(`${p.name}: ${productCount(c, p, d.month)} en ${monthName(d.month)}`);
    bumpCount(p.id);
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
    bumpCount(p.id, false);
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
    // Si el cobro se anotó como ingreso en Gastos, se quita ese movimiento.
    if (p.moveId) data.expenses = data.expenses.filter(x => x.id !== p.moveId);
    // Si el saldo no se ha tocado desde el cobro, vuelve al valor anterior.
    else if (w && !isLinked(w) && p.balanceBefore != null && w.balance === p.balanceAfter) setBalance(w, p.balanceBefore);
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
    // Los ajustes que el retiro hizo en la billetera de gastos se quitan.
    const moves = arr(x.moves);
    if (moves.length) { data.expenses = data.expenses.filter(y => !moves.includes(y.id)); syncLinked(); }
    // En las demás, si el saldo sigue como quedó tras el retiro, se restaura.
    for (const [w, before, after] of [[a, x.fromBefore, x.fromAfter], [b, x.toBefore, x.toAfter]]) {
      if (w && !isLinked(w) && before != null && w.balance === after) setBalance(w, before);
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
    if (data.spendWallet === w.id) data.spendWallet = '';
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
    syncInbox();
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
$('gearBtn').innerHTML = icon('settings');
$('syncChip').onclick = () => { location.hash = '#ajustes'; };
$('sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
$('importFile').onchange = e => { importFile(e.target.files?.[0]); e.target.value = ''; };
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('sheet').hidden) closeSheet();
});
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
// Elegir la billetera unida a Gastos: su saldo actual se conserva (la diferencia queda como ajuste).
document.addEventListener('change', e => {
  if (e.target.id !== 'spendWalletSel') return;
  const w = wallet(e.target.value);
  if (w) {
    const diff = round2(w.balance - yapeBalance());
    if (diff) data.expenses.push({ id: uid(), kind: 'adj', date: todayISO(), amount: diff, currency: 'PEN', category: 'Ajuste', note: `${w.name} unida a Gastos`, prev: yapeBalance(), after: round2(w.balance) });
  }
  data.spendWallet = w ? w.id : '';
  data.linkConflict = null;
  commit(w ? `${w.name} ahora es tu billetera de gastos` : 'Gastos ya no está unido a una billetera');
});
document.addEventListener('change', e => {
  if (e.target.id === 'horizonDate' && e.target.value > todayISO()) {
    data.horizon = e.target.value;
    persist();
    render();
    if (!$('sheet').hidden) forecastDetail();
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'inboxForm') {
    e.preventDefault();
    const f = new FormData(e.target);
    const url = String(f.get('url') || '').trim(), token = String(f.get('token') || '').trim();
    if (!url && !token) { try { localStorage.removeItem(INBOX_KEY); } catch {} render(); return toast('Atajo desconectado'); }
    if (!/^https:\/\//i.test(url) || !token) return toast('Escribe la dirección (https://…) y la clave');
    try { localStorage.setItem(INBOX_KEY, JSON.stringify({ url, token })); } catch {}
    sessionStorage.removeItem('saldo-meta-t');
    const n = await pullInbox();
    render();
    if (n >= 0) { toast(n ? `Buzón conectado · ${n} movimiento${n === 1 ? '' : 's'} nuevo${n === 1 ? '' : 's'}` : 'Buzón conectado'); pushInboxMeta(); }
    return;
  }
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
window.addEventListener('resize', placeLens);

// ── Liquid Glass: cabecera que se vuelve cristal al hacer scroll ──
let scrolledTop = false;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (!scrolledTop && y > 36) { scrolledTop = true; document.body.classList.add('scrolled'); }
  else if (scrolledTop && y < 8) { scrolledTop = false; document.body.classList.remove('scrolled'); }
}, { passive: true });

// ── Liquid Glass: el cristal se ilumina donde lo tocas ──
document.addEventListener('pointerdown', e => {
  if (!e.target.closest || !e.target.closest('.btn, .btn-sm, .icon-btn, .nav-item, .sidebar, .chip, .seg button, .segmented label, .sheet-head, .fc-chip, .player, .picker-btn, .month-switch')) return;
  const g = document.createElement('i');
  g.className = 'touch-glow';
  g.style.left = e.clientX + 'px';
  g.style.top = e.clientY + 'px';
  document.body.appendChild(g);
  setTimeout(() => g.remove(), 650);
}, { passive: true });

// ── Hojas: en el móvil se cierran arrastrando hacia abajo desde el agarrador o el título ──
(() => {
  const sheet = document.querySelector('.sheet');
  let y0 = 0, dy = 0, t0 = 0, pid = null;
  const mobile = () => window.matchMedia('(max-width: 899px)').matches;
  const start = e => {
    if (!mobile() || e.target.closest('button')) return;
    pid = e.pointerId; y0 = e.clientY; dy = 0; t0 = e.timeStamp;
    sheet.style.transition = 'none';
    try { e.currentTarget.setPointerCapture(pid); } catch {}
  };
  const move = e => {
    if (e.pointerId !== pid) return;
    dy = Math.max(0, e.clientY - y0);
    sheet.style.transform = `translateY(${dy}px)`;
  };
  const end = e => {
    if (e.pointerId !== pid) return;
    pid = null;
    const v = dy / Math.max(1, e.timeStamp - t0);
    if (dy > 120 || (dy > 30 && v > 0.7)) {
      sheet.style.transition = 'transform .22s ease-in';
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => { closeSheet(); sheet.style.transition = ''; sheet.style.transform = ''; }, 200);
    } else {
      sheet.style.transition = 'transform .4s var(--spring)';
      sheet.style.transform = '';
      setTimeout(() => { sheet.style.transition = ''; }, 420);
    }
  };
  for (const el of [sheet.querySelector('.sheet-grab'), sheet.querySelector('.sheet-head')]) {
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
})();

// ── Buzón de atajos (Google Sheets + Apps Script) ──
// El atajo del iPhone (Tocar atrás) manda cada movimiento al script, que lo guarda en la hoja «Pendientes».
// Aquí los traemos, los sumamos a tus movimientos y los marcamos como recibidos. Se guarda aparte de tus
// datos para que la clave no viaje en los respaldos ni en Drive.
const INBOX_KEY = 'saldo-inbox';
function inboxCfg() {
  try { const c = JSON.parse(localStorage.getItem(INBOX_KEY)); return c && c.url && c.token ? c : null; } catch { return null; }
}
async function inboxCall(cfg, params, body) {
  const u = new URL(cfg.url);
  let r;
  if (body) {
    r = await fetch(u.toString(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ token: cfg.token, ...body }) });
  } else {
    for (const [k, v] of Object.entries({ token: cfg.token, ...params })) u.searchParams.set(k, v);
    r = await fetch(u.toString());
  }
  const res = await r.json();
  if (!res || res.ok === false) throw new Error((res && res.error) || 'inbox');
  return res;
}
let inboxBusy = false;
// Devuelve cuántos movimientos nuevos entraron, o -1 si no se pudo conectar.
async function pullInbox() {
  const cfg = inboxCfg();
  if (!cfg || inboxBusy) return 0;
  inboxBusy = true;
  try {
    const { items } = await inboxCall(cfg, { action: 'pending' });
    const list = Array.isArray(items) ? items : [];
    const known = new Set(data.expenses.map(x => x.id));
    let added = 0;
    for (const it of list) {
      const id = String(it.id || '').slice(0, 64);
      const amount = round2(it.amount);
      if (!id || known.has(id) || !(amount > 0)) continue;
      known.add(id);
      const kind = it.kind === 'in' ? 'in' : 'out';
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(it.date)) ? String(it.date) : todayISO();
      let category = String(it.category || '').trim() || 'Otros';
      const found = kindCategories(kind).find(c => c.toLowerCase() === category.toLowerCase());
      if (found) category = found;
      else (kind === 'in' ? data.incomeCategories : data.customCategories).push(category);
      const contact = String(it.contact || '').trim().replace(/\s+/g, ' ');
      const note = String(it.note || '').trim();
      data.expenses.push({ id, kind, date, amount, currency: 'PEN', category, note, ...(contact ? { contact } : {}), via: 'atajo' });
      if (contact) {
        const c = data.contacts.find(y => contactKey(y.name) === contactKey(contact));
        if (c) { c.uses++; c.lastKind = kind; c.lastCategory = category; }
        else data.contacts.push({ id: uid(), name: contact, uses: 1, lastKind: kind, lastCategory: category });
      }
      added++;
    }
    if (added) commit(`${added} movimiento${added === 1 ? '' : 's'} del atajo`);
    if (list.length) await inboxCall(cfg, null, { action: 'ack', ids: list.map(i => String(i.id)) });
    return added;
  } catch {
    toast('No pude conectar con el buzón del atajo');
    return -1;
  } finally {
    inboxBusy = false;
  }
}
// Le dice al atajo qué categorías y contactos existen, para que sus listas se mantengan al día.
async function pushInboxMeta() {
  const cfg = inboxCfg();
  if (!cfg) return;
  if (Date.now() - (Number(sessionStorage.getItem('saldo-meta-t')) || 0) < 600000) return;
  sessionStorage.setItem('saldo-meta-t', String(Date.now()));
  try {
    await inboxCall(cfg, null, { action: 'setmeta', expense: kindCategories('out'), income: kindCategories('in'), contacts: frequentContacts().slice(0, 8).map(c => c.name) });
  } catch {}
}
function syncInbox() { pullInbox().then(() => pushInboxMeta()); }
if (!GOOGLE_ENABLED || !localStorage.getItem(DRIVE_CONNECTED)) window.addEventListener('load', () => setTimeout(syncInbox, 700));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncInbox(); });

// ── App instalable (iPhone/Android): funciona sin internet y pide que no borren tus datos ──
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
try { navigator.storage?.persist?.(); } catch {}

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
// Acceso directo «?nuevo=out|in»: abre Gastos con el formulario listo.
const quickNew = new URLSearchParams(location.search).get('nuevo');
if (quickNew === 'out' || quickNew === 'in') history.replaceState(null, '', `${location.pathname}#gastos`);
render();
if (quickNew === 'out' || quickNew === 'in') setTimeout(() => expenseForm(null, quickNew), 200);

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

// ── Arrastre de la lente (como Liquidum / iOS 26): la lente se levanta, sigue al dedo estirándose
//    según la velocidad y, al soltar, se asienta en la pestaña más cercana con rebote. ──
(() => {
  let drag = null, suppressClick = false;
  const items = () => [...document.querySelectorAll('#nav .nav-item:not(.desk)')];
  document.addEventListener('pointerdown', e => {
    if (!navLens || !matchMedia('(max-width: 899px)').matches) return;
    const it = e.target.closest && e.target.closest('#nav .nav-item');
    if (!it) return;
    const nav = $('nav'), r = nav.getBoundingClientRect();
    drag = { x0: e.clientX, lx0: parseFloat(navLens.style.getPropertyValue('--lx')) || 0, w: navLens.offsetWidth, nw: r.width, left: r.left, moved: false, lx: 0, t: performance.now(), px: e.clientX, v: 0, id: e.pointerId };
    drag.lx = drag.lx0;
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) < 8) return;
    if (!drag.moved) { drag.moved = true; navLens.classList.add('drag', 'press'); }
    const now = performance.now(), dt = Math.max(now - drag.t, 1);
    drag.v = drag.v * 0.6 + ((e.clientX - drag.px) / dt) * 0.4; drag.t = now; drag.px = e.clientX;
    drag.lx = Math.min(Math.max(drag.lx0 + dx, 0), drag.nw - drag.w);
    navLens.style.setProperty('--lx', drag.lx + 'px');
    const k = Math.min(Math.abs(drag.v) * 0.45, 0.4);
    navLens.style.scale = (1.14 + k) + ' ' + (1.22 - k * 0.5);
    const c = drag.lx + drag.w / 2;
    items().forEach(a => a.classList.toggle('peek', c >= a.offsetLeft && c < a.offsetLeft + a.offsetWidth));
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 60);
    navLens.classList.remove('drag', 'press'); navLens.style.scale = '';
    items().forEach(a => a.classList.remove('peek'));
    const c = d.lx + d.w / 2;
    const hit = items().find(a => c >= a.offsetLeft && c < a.offsetLeft + a.offsetWidth);
    if (hit && !hit.classList.contains('active')) location.hash = hit.getAttribute('href');
    else placeLens();
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  document.addEventListener('click', e => { if (suppressClick && e.target.closest && e.target.closest('#nav')) { e.preventDefault(); e.stopPropagation(); } }, true);
})();
