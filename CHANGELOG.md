# 📋 CHANGELOG — APP NET VIP

Historial de versiones y actualizaciones del sistema.

---

## [v1.2] — 2026-10-20

### ✨ Novedades
- **Editor de Cookies estilo Cookie-Editor (Extensión):** Modal interactivo con 3 pestañas (`⚙ Campos`, `{ } JSON`, `≡ Raw`) para editar, importar o exportar cookies de cada cuenta VIP individualmente.
- **Flujo Directo con Netflix:** Al ingresar código VIP, se activa la pantalla de sesión VIP con contador flotante y botón de acceso directo a Netflix (`netflix.com`).
- **Bloqueo y Cierre automático:** Overlay de expiración cuando se agota el tiempo asignado a la licencia.

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

