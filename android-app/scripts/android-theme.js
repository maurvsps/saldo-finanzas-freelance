// Ajusta el tema de Android que genera Capacitor: barras del sistema del color
// de la app con íconos oscuros, también cuando el teléfono está en modo oscuro.
const fs = require('fs');
const path = require('path');

const BG = '#f5f5f0';
const file = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');

let xml = fs.readFileSync(file, 'utf8');
if (!xml.includes('xmlns:tools')) xml = xml.replace('<resources>', '<resources xmlns:tools="http://schemas.android.com/tools">');

const items = `
        <item name="android:windowBackground">@color/saldoBackground</item>
        <item name="android:statusBarColor">@color/saldoBackground</item>
        <item name="android:navigationBarColor">@color/saldoBackground</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">true</item>`;

const before = xml;
xml = xml.replace(
  /<style name="AppTheme\.NoActionBar" parent="[^"]*">([\s\S]*?)<\/style>/,
  (_, body) => `<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar">${body.trimEnd()}${items}\n    </style>`
);
if (xml === before) throw new Error('No se encontró el estilo AppTheme.NoActionBar en ' + file);
fs.writeFileSync(file, xml);

const colors = path.join(path.dirname(file), 'saldo_colors.xml');
fs.writeFileSync(colors, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="saldoBackground">${BG}</color>\n</resources>\n`);
console.log('Tema de Android ajustado');
