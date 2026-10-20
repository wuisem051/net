# Netflix Cookie Access Platform (Prototipo Web)

Plataforma web minimalista y moderna con estética **Netflix Dark** (`#141414`, `#E50914`), diseñada para validar el acceso mediante cookies con una prueba gratuita de 60 minutos sincronizada en **Firebase Firestore**.

---

## 🚀 Características Principales

1. **Estética y UI/UX Netflix Original:**
   - Paleta de colores oficial: `#141414` (fondo oscuro profundo), `#E50914` (rojo Netflix) y tipografía sobria.
   - Banner cinematográfico interactivo (*Hero Slider/Player*).
   - Catálogo interactivo con efectos hover, modal de información y vista previa de video.
2. **Control de Acceso y Sesión por Cookies:**
   - Ingreso de cookies en formato texto plano (`key=value; ...`) o JSON exportado (`[{"name":"...", "value":"..."}]`).
   - Identificador hash determinista por cookie para almacenamiento en Firestore.
3. **Temporizador Regresivo de 60 Minutos:**
   - Cálculo automático del tiempo transcurrido desde el primer acceso.
   - Sincronización en tiempo real (segundo a segundo).
   - Bloqueo total de la interfaz (*Lockout Screen*) una vez consumidos los 60 minutos con redirección a pasarela de pago.
   - Mecanismo de contingencia (*Offline Fallback*) con `localStorage` en caso de que Firebase aún no esté conectado.
4. **Listo para Despliegue en Netlify:**
   - Archivo [netlify.toml](file:///e:/APP%20NET/netlify.toml) configurado para Single Page Applications (SPA).

---

## 🛠️ Estructura del Proyecto

```text
APP NET/
├── src/
│   ├── components/
│   │   ├── Login.jsx         # Pantalla de acceso por cookie con demo rápida
│   │   └── Dashboard.jsx     # Catálogo, temporizador, modal de video y pago
│   ├── services/
│   │   └── authService.js    # Lógica de cálculo de tiempo y Firestore
│   ├── firebase.js           # Inicialización de Firebase Auth y Firestore
│   ├── App.jsx               # Gestor de estado principal y timer
│   ├── index.css             # Estilos de Tailwind CSS v4
│   └── main.jsx
├── .env.example              # Variables de entorno para Firebase
├── netlify.toml              # Reglas de compilación y redirección para Netlify
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
