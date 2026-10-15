# Saldo · Finanzas freelance

App personal para anotar lo que haces para cada cliente, cobrarlo a fin de mes, saber cuánto tienes en cada billetera y planear tus retiros.

## Secciones

- **Inicio**: arriba, lo que tienes hoy y lo que tendrías en la fecha que elijas en el calendario, sumando lo que falta cobrar y lo que estimas hacer, y restando la comisión fija de los retiros que tu plan haría hasta esa fecha (al tocar el monto ves el detalle por billetera, cliente y producto); luego cada billetera, lo que falta cobrar, el resumen del mes y tu próximo retiro según el plan.
- **Clientes**: la cuenta de cada cliente por mes, en su propia moneda (USD, EUR, GBP o soles). Cada producto (por ejemplo, un gráfico a $8.50, unas 5 veces por semana, con sus notas) tiene un contador: «+» anota una entrega con la fecha de hoy y «−» quita la última. Cada entrega aparece debajo del producto y se le puede poner un título; en «Anotaciones» se copia (o comparte en la app) el resumen del mes para enviarlo al cliente. Al final del mes, «Cobrar octubre» registra el pago y te pide cuánto tienes ahora en PayPal.
- **Retiros**: con «Retiré» indicas cuánto sacaste y cuánto tienes ahora en tu cuenta; la app calcula cuánto recibiste y a qué tipo de cambio. El planificador proyecta 12 meses con lo anotado y cuántas veces por semana o al mes haces cada producto, y compara retirar cada mes, cada 2 o 3 meses o al juntar un monto.
- **Ajustes**: billeteras, tipo de cambio (manual o el del día), Google Drive, respaldo y borrar datos.

Los saldos los escribes tú: la app no suma ni resta sola.

## Abrir

Abre `index.html` en un navegador moderno. No requiere instalación. GitHub Pages publica la carpeta `dist`, que es una copia de los archivos de la raíz.

## Datos

Todo se guarda en el navegador. Si entras con Google, se guarda una copia en una carpeta oculta de tu Google Drive para usar la app en varios dispositivos. Los datos de versiones anteriores se convierten automáticamente.

## App de Android

La carpeta `android-app/` convierte la web en una app de Android con [Capacitor](https://capacitorjs.com/). La app abre la web publicada, así que los cambios de la web llegan solos sin reinstalar.

El workflow **APK de Android** compila el APK cuando cambia `android-app/` (o a mano desde la pestaña Actions) y lo publica en **Releases** como `saldo.apk`. Para instalarlo, ábrelo desde el teléfono y permite la instalación desde esa fuente.

La app guarda sus datos aparte del navegador: para pasar tus datos, usa **Descargar respaldo** en la web e **Importar respaldo** en la app.

Para firmar con una clave propia (y poder actualizar el APK sin desinstalar), añade en el repo los secretos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` y `ANDROID_KEY_ALIAS`.

## Publicar una versión

Al cambiar la web, sube el mismo número en tres sitios: `APP_VERSION` en `app.js`, `version.json` y el `?v=` de `styles.css` y `app.js` en `index.html`. Luego copia `index.html`, `app.js`, `styles.css` y `version.json` a `dist/`. La app de Android revisa `version.json` al abrirse o al volver a ella y se recarga sola si hay una versión nueva.
