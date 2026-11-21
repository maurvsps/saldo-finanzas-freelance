# Saldo en iPhone: instalar, Tocar atrás y atajos

Tres pasos, en este orden: **1)** instalar la app, **2)** crear el buzón en Google Sheets, **3)** crear los atajos y ponerlos en «Tocar atrás».

---

## 1. Instalar Saldo en la pantalla de inicio

1. Abre la web de Saldo en **Safari** (no en Chrome).
2. Toca **Compartir** (el cuadrado con la flecha) → **Añadir a pantalla de inicio** → **Añadir**.
3. Abre Saldo desde el icono nuevo. Se ve a pantalla completa, sin barra de Safari.

> Los datos de la web en Safari y los de la app instalada **no se comparten**. Si ya tenías datos en Safari, en Safari ve a Ajustes → **Descargar respaldo**, y en la app instalada → **Importar respaldo**.

---

## 2. Crear el buzón (Google Sheets + Apps Script)

Una sola vez. Es gratis y usa tu cuenta de Google.

1. Entra a [sheets.new](https://sheets.new) (hoja nueva). Ponle de nombre «Saldo buzón».
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya y pega **todo** el contenido de `ios/apps-script/Code.gs`.
4. Arriba del archivo cambia `CAMBIA-ESTA-CLAVE` por una clave tuya (letras y números, sin espacios, 20 o más caracteres). Guárdala: la usarás dos veces más.
5. Guarda (icono del disquete). En la barra elige la función **configurar** y pulsa **Ejecutar**. Acepta los permisos (puede salir «Google no verificó esta app»: **Configuración avanzada → Ir a … (no seguro)**; es tu propio script).
6. **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
7. **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
8. En Saldo → **Ajustes → Atajo del iPhone**, pega la URL y la clave y toca **Guardar**. Debe decir «Buzón conectado».

Si más adelante cambias el código del script: **Implementar → Administrar implementaciones → editar (lápiz) → Versión nueva → Implementar**. La URL no cambia.

La hoja «Pendientes» queda como un registro de todo lo que mandaron tus atajos (pendiente → recibido).

---

## 3. Crear los atajos

Abre la app **Atajos**. Crea dos atajos: **Gasto rápido** y **Ingreso rápido**. Son casi iguales: solo cambia el `kind` (`out` para gasto, `in` para ingreso) y los textos.

Mismo `URL` y `CLAVE` que en el paso 2.

### Gasto rápido

1. **Texto** → pega tu URL `/exec` (ponle de nombre de variable `URL`).
2. **Texto** → pega tu clave (variable `CLAVE`).
3. **Solicitar entrada** → tipo **Número**, pregunta «¿Cuánto gastaste?». Variable `Monto`.
4. **Obtener contenido de URL**
   - URL: `URL` seguido de `?action=meta&token=` y la variable `CLAVE`.
   - Método: **GET**.
5. **Obtener valor del diccionario** → valor de la clave `expense` (del resultado del paso 4).
6. **Elegir de la lista** → prompt «Categoría». Variable `Categoria`.
7. *(Opcional)* **Solicitar entrada** → tipo **Texto**, pregunta «¿A quién? (opcional)». Variable `Quien`. Si no lo quieres, sáltate este paso y quita `contact` del paso 8.
8. **Obtener contenido de URL**
   - URL: `URL`
   - Método: **POST**
   - Cuerpo de la solicitud: **JSON**, con estos campos:
     | Clave | Tipo | Valor |
     |---|---|---|
     | `token` | Texto | `CLAVE` |
     | `action` | Texto | `add` |
     | `kind` | Texto | `out` |
     | `amount` | Número | `Monto` |
     | `category` | Texto | `Categoria` |
     | `contact` | Texto | `Quien` |
9. **Mostrar notificación** → «Gasto anotado: S/ » seguido de `Monto`.

### Ingreso rápido

Duplica el atajo anterior y cambia:
- Paso 3: «¿Cuánto recibiste?»
- Paso 5: usa la clave `income` en vez de `expense`.
- Paso 7: «¿De quién? (opcional)».
- Paso 8: `kind` = `in`.
- Paso 9: «Ingreso anotado».

> La lista de categorías y los contactos se piden al buzón cada vez. Cada vez que abres Saldo, la app actualiza esas listas (cada 10 minutos como máximo), así que si creas una categoría nueva en la app aparece sola en el atajo.

---

## 4. Ponerlos en «Tocar atrás»

**Ajustes → Accesibilidad → Tocar → Tocar atrás**:

- **Doble toque** → Atajos → **Gasto rápido**
- **Triple toque** → Atajos → **Ingreso rápido**

Toca la parte de atrás del iPhone dos o tres veces seguidas, con ritmo firme. Funciona en iPhone 8 o posterior con iOS 14 o más. Una funda muy gruesa puede dificultar la detección.

---

## Cómo llega a la app

1. El atajo manda el movimiento al buzón (queda «pendiente» en la hoja).
2. Cuando abres Saldo o vuelves a ella, la app trae los pendientes, los suma a tus movimientos (con su XP y racha) y los marca «recibido».
3. También puedes forzarlo en **Ajustes → Atajo del iPhone → Revisar ahora**.

La fecha se pone sola (zona horaria de Lima; se cambia en la línea `TZ` del script).

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El atajo muestra `{"ok":false,"error":"clave"}` | La clave del atajo no es igual a la del script. |
| «No pude conectar con el buzón» en Saldo | La URL no termina en `/exec`, o la implementación no es «Cualquier persona». |
| Cambié el script y sigue igual | Hay que crear una **versión nueva** de la implementación (ver paso 2). |
| El gasto no aparece en la app | Ábrela, o toca «Revisar ahora». Mira la hoja «Pendientes»: si dice `pendiente`, aún no la leyó. |
| Un movimiento aparece dos veces | No debería: cada movimiento lleva un id único. Si pasa, avísame. |

## Seguridad

La URL del script es larga y difícil de adivinar, y además exige tu clave. Aun así, no compartas ninguna de las dos. Si crees que se filtraron, cambia `TOKEN` en el script, crea una versión nueva y actualiza la clave en los atajos y en Ajustes.
