// Hace que la app aparezca en el botón "Compartir" de otras apps (por ejemplo Yape)
// cuando comparten una imagen. La imagen se guarda en memoria y la web la recoge
// con window.SaldoShare.take() al abrirse o al volver a la app.
const fs = require('fs');
const path = require('path');

const main = path.join(__dirname, '..', 'android', 'app', 'src', 'main');

// 1) Manifiesto: aceptar imágenes compartidas.
const manifestFile = path.join(main, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestFile, 'utf8');
if (!manifest.includes('android.intent.action.SEND')) {
  const filter = `
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="image/*" />
            </intent-filter>
        `;
  const before = manifest;
  manifest = manifest.replace('</activity>', `${filter}</activity>`);
  if (manifest === before) throw new Error('No se encontró </activity> en ' + manifestFile);
  fs.writeFileSync(manifestFile, manifest);
}

// 2) MainActivity: leer la imagen compartida y dejarla lista para la web.
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'capacitor.config.json'), 'utf8')).appId;
const dir = path.join(main, 'java', ...pkg.split('.'));
const java = `package ${pkg};

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    private volatile String pendingImage = null;

    /** Lo que la web puede pedir: la imagen compartida (una sola vez). */
    public class ShareBridge {
        @JavascriptInterface
        public String take() {
            String image = pendingImage;
            pendingImage = null;
            return image == null ? "" : image;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new ShareBridge(), "SaldoShare");
        readShared(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (readShared(intent)) {
            // La app ya estaba abierta: avisa a la web para que recoja la imagen.
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript("window.saldoCheckShare && window.saldoCheckShare()", null));
        }
    }

    @SuppressWarnings("deprecation")
    private boolean readShared(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return false;
        String type = intent.getType();
        if (type == null || !type.startsWith("image/")) return false;
        Uri uri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return false;
        try (InputStream in = getContentResolver().openInputStream(uri);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (in == null) return false;
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            pendingImage = "data:" + type + ";base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            intent.setAction(Intent.ACTION_MAIN); // no volver a leerla al rotar o reanudar
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
`;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'MainActivity.java'), java);
console.log('Compartir imágenes habilitado');
