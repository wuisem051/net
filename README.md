# Netflix Plus (v1.3.1) — Plataforma de Gestión y Acceso VIP a Netflix

Plataforma híbrida (Web + Android APK vía Capacitor) con estética **Netflix Dark** (`#141414`, `#E50914`), diseñada para la gestión, venta e inyección de sesiones VIP a Netflix mediante cookies, carrito de compras con pagos en criptomonedas (USDT), temporizador en vivo y sincronización con **Firebase Firestore**.

---

## 🚀 Características Principales (v1.3.1)

1. **Estética y UI/UX Netflix Original:**
   - Paleta de colores oficial: `#141414` (fondo oscuro profundo), `#E50914` (rojo Netflix) y tipografía moderna.
   - Banner cinematográfico interactivo (*Hero Slider/Player*).
   - Catálogo interactivo con efectos hover, modal de información y vista previa.
2. **Tienda E-Commerce y Pagos en Criptomonedas (USDT):**
   - Carrito de compras integrado en la cabecera y botón flotante.
   - Selector de 5 planes de suscripción (Prueba Gratis, 24h, Semanal 7d, Quincenal 15d y Mensual 30d).
   - Pasarela con QR dinámico, dirección de billetera USDT (TRC20 / BEP20 / Polygon) y envío de Hash de transacción (TxID).
   - Aprobación/rechazo de pedidos desde el Panel Admin con emisión automática de licencias.
3. **Control de Acceso y Visor Nativo In-App (Android APK):**
   - Acceso exclusivo mediante licencias/pases VIP y cookies de sesión.
   - Inyección automática de cookies en WebView nativo a pantalla completa sin salir de la app.
   - User Agent optimizado para Chrome Desktop en Windows, aceleración por hardware y permisos de reproducción DRM Widevine.
   - Banner flotante con temporizador regresivo en vivo y botón de auto-cierre con purga de cookies.
4. **Panel de Administración Completo (`/admin` o PIN `2026`):**
   - Generación y **eliminación individual** de licencias generadas.
   - Editor de cookies avanzado (TSV/Netscape, JSON y key=value).
   - Gestión del Pool de Cookies con botones para copiar y borrar cuentas obsoletas.
   - Configuración de dispositivos simultáneos permitidos por plan.
5. **Listo para Web y APK Android:**
   - Web lista para despliegue en Netlify / Vercel.
   - APK nativo Android compilado: `app-net-1.3.1.apk`.

---

## 🛠️ Estructura del Proyecto

```text
APP NET/
├── android/                                    # Proyecto nativo Android (Capacitor)
│   ├── app/src/main/java/com/appnet/app/
│   │   ├── MainActivity.java
│   │   └── CookiePlugin.java                   # Inyección nativa, WebView, DRM y temporizador
│   └── build/outputs/apk/debug/app-debug.apk
├── src/
│   ├── components/
│   │   ├── NetflixLanding.jsx                  # Landing con catálogo, 5 planes y carrito
│   │   ├── CheckoutModal.jsx                   # Pasarela de pago USDT/Cripto y tracking
│   │   ├── Login.jsx                           # Validación de códigos VIP
│   │   ├── NetflixViewer.jsx                   # Dashboard VIP y temporizador
│   │   └── AdminPanel.jsx                      # Panel administrativo integral
│   ├── services/
│   │   ├── authService.js                      # Lógica de pases, órdenes crypto y Firestore
│   │   ├── firebase.js                         # Inicialización de Firebase Auth y Firestore
│   │   └── cookiePlugin.js                     # Puente React <-> Plugin Android
│   ├── App.jsx                                 # Gestor de estado principal y navegación
│   ├── index.css                               # Estilos Tailwind CSS v4
│   └── main.jsx
├── app-net-1.3.1.apk                           # 📦 APK compilado v1.3.1
├── CHANGELOG.md                                # Historial completo de versiones
├── README_APP_NET.md                           # Documentación técnica extendida
├── netlify.toml                                # Reglas de compilación y redirección
├── package.json
└── vite.config.js
```

---

## 💻 Instrucciones para Ejecutar en Local

### 1. Clonar o abrir la carpeta del proyecto
Abre una terminal en el directorio del proyecto `e:\APP NET`.

### 2. Instalar dependencias (ya instaladas)
```bash
npm install
```

### 3. Configurar Firebase (Opcional para pruebas)
Copia [.env.example](file:///e:/APP%20NET/.env.example) a un nuevo archivo `.env`:
```bash
cp .env.example .env
```
Coloca tus claves del proyecto de Firebase en el archivo `.env`.  
*Nota: La aplicación cuenta con un fallback automático local, por lo que puedes probarla inmediatamente incluso antes de vincular tu base de datos de Firebase.*

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre la URL proporcionada en la terminal (usualmente `http://localhost:5173`).

---

## 🌐 Despliegue en Netlify

1. Sube tu código a un repositorio en **GitHub**.
2. Ve a [Netlify](https://app.netlify.com) y selecciona **Add new site > Import an existing project**.
3. Selecciona tu repositorio de GitHub.
4. Netlify detectará automáticamente el archivo [netlify.toml](file:///e:/APP%20NET/netlify.toml):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. En **Site configuration > Environment variables**, añade las variables de tu `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Presiona **Deploy site**.
