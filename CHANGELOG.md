# 📋 CHANGELOG — APP NET VIP

Historial de versiones y actualizaciones del sistema.

---

## [v1.3.1] — 2026-10-21

### 🚀 Novedades y Mejoras
- **Compilación APK v1.3.1 (`versionCode 4`):** Generado archivo ejecutable `app-net-1.3.1.apk`.
- **Sistema E-commerce de Compra con Criptomonedas (USDT):**
  - Renovación completa del Home/Landing con carrito de compras interactivo (`CheckoutModal.jsx`).
  - Catálogo de 5 planes de suscripción: Prueba Gratis, 24 Horas, Semanal (7 días), Quincenal (15 días) y Mensual (30 días), dispuestos en cuadrícula armónica (3 superiores y 2 inferiores).
  - Pasarela con dirección de billetera USDT (TRC20 / BEP20 / Polygon), código QR dinámico y formulario de registro del Hash (TxID) de la transacción.
  - Validación de pedidos en Firestore (`orders`) y seguimiento en tiempo real del estado de la orden (pendiente, aprobada, rechazada).
- **Gestión Avanzada en el Panel Administrativo:**
  - **Eliminación individual de licencias:** Botón para revocar/borrar licencias generadas directamente en la tabla de pases.
  - **Gestión del Pool de Cookies:** Botones dedicados para copiar al portapapeles y eliminar cookies obsoletas del pool.
  - **Dispositivos Simultáneos:** Configuración editable del número de pantallas permitidas en simultáneo para cada uno de los 5 planes.
  - **Aprobación de Órdenes Crypto:** Verificación de pagos y generación de licencias en 1 clic.
- **Optimización Nativa del Reproductor WebView y DRM (`CookiePlugin.java` & `AndroidManifest.xml`):**
  - User Agent actualizado a Chrome Desktop (Windows NT 10.0 x64) para máxima compatibilidad.
  - Aceleración por hardware forzada (`setLayerType(View.LAYER_TYPE_HARDWARE)`).
  - Prevención de suspensión de pantalla durante reproducción (`setKeepScreenOn(true)` y permiso `WAKE_LOCK`).
  - Inyección de JavaScript para forzar reproducción y mitigación de errores de carga en sub-frames.
  - Permisos de conectividad y tráfico `usesCleartextTraffic="true"` para streaming fluido.
- **Ajustes de UI / UX:**
  - Retiro del botón de acceso al panel admin desde la vista de login.
  - Unificación del flujo: el Home ofrece botón directo a "Ingresar", reservando la validación del código VIP exclusivamente a la pantalla de Login sin duplicar campos.

---

## [v1.3.0] — 2026-10-21

### ✨ Novedades
- Nueva estructura de diseño del Home con navegación simplificada.
- Integración preliminar de planes semanales y quincenales.
- Personalización del ícono y splash nativo de la app para Android.

---

## [v1.1] — 2026-10-20

### ✨ Novedades
- **Ícono personalizado de la app:** Diseño estilo Netflix con badge dorado VIP y descuento, visible en el lanzador de Android.
- **Edición individual de cookies por licencia VIP:** El administrador puede editar la cookie asignada a cada usuario directamente desde la tabla de licencias en el Panel Admin.
- **Selección rápida desde el Pool:** En el modal de edición, se puede elegir una cuenta activa del pool mediante menú desplegable.
- **Función `updatePassCookie` en authService:** Actualiza la cookie en Firebase Firestore y en localStorage de respaldo.
- **Versión Android:** `versionCode 2` / `versionName "1.1"` en `build.gradle`.

### 🐛 Correcciones
- Corregido el comando de copia de APK en PowerShell (Copy-Item en lugar de copy /Y).
- Agregados scripts `cap:sync` y `cap:open` en package.json.

---

## [v1.0] — 2026-10-20

### 🚀 Lanzamiento inicial
- Conversión de la app web React/Vite a APK Android mediante **Capacitor**.
- Configuración con ID `com.appnet.app` y web-dir `dist`.
- Generación del proyecto nativo Android en la carpeta `android/`.
- Compilación del primer APK de debug usando JDK 21 y Android SDK en `E:\`.
- Sistema de autenticación por códigos VIP validados contra Firebase con fallback a localStorage.
- Panel de Administración protegido por PIN con:
  - Gestión de licencias y pases de acceso.
  - Pool de cookies asignables.
  - Configuración de textos y precios del Home.
- Dashboard interno tipo Netflix con temporizador de sesión en vivo.
- Pantalla de expiración y modal de pago al agotar el tiempo de licencia.

---

## 📌 Próximas mejoras planeadas
- [ ] Firma de la APK en modo release para distribución pública.
- [ ] Notificación cuando queden 10 minutos de sesión.
- [ ] WhatsApp integrado con número dinámico desde el panel admin.
- [ ] Splash screen con ícono de la app.
- [ ] Versión iOS con Capacitor.

