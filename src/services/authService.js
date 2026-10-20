import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

const PASS_COLLECTION = "access_passes";
const COOKIES_POOL_COLLECTION = "cookie_pool";
const CONFIG_COLLECTION = "app_config";
const CONFIG_DOC_ID = "home_settings";

const LOCAL_STORAGE_PASSES_KEY = "vip_passes_local";
const LOCAL_STORAGE_POOL_KEY = "cookie_pool_local";
const LOCAL_STORAGE_CONFIG_KEY = "home_settings_local";

// Configuración inicial por defecto del Home
export const DEFAULT_HOME_CONFIG = {
  heroTitle: "Tus series y películas favoritas",
  heroSubtitle: "al menor costo del mercado",
  heroDescription: "Brindamos acceso a cuentas de alta velocidad en Ultra HD 4K. Comienza con una hora gratis de prueba o adquiere tu pase con más del 80% de ahorro.",
  whatsappNumber: "+573001234567",
  planFreePrice: "$0.00",
  planFreeDuration: "60 Minutos de Acceso",
  plan24hPrice: "$1.99",
  plan24hDuration: "Acceso Completo 1 Día",
  planMonthlyPrice: "$3.99",
  planMonthlyDuration: "30 Días de Streaming Ilimitado"
};

// Acceso de prueba listo para usar
const DEFAULT_DEMO_PASSES = {
  "VIP-PRUEBA": {
    code: "VIP-PRUEBA",
    durationMinutes: 60,
    status: "active",
    createdAt: Date.now(),
    firstUsedAt: null,
    assignedCookie: "NetflixId=v%3D2%26ct%3DBQAOAAEBENP_demo_cookie_activa_2026; SecureNetflixId=v%3D2%26mac%3DAQEAEQ...",
    description: "Acceso de prueba rápida de 60 minutos"
  },
  "VIP-PREMIUM-2026": {
    code: "VIP-PREMIUM-2026",
    durationMinutes: 60,
    status: "active",
    createdAt: Date.now(),
    firstUsedAt: null,
    assignedCookie: "NetflixId=demo_internal_cookie_token_998822; SecureNetflixId=v%3D2...",
    description: "Pase demo de cortesía"
  }
};

function getLocalPasses() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PASSES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DEMO_PASSES;
  } catch {
    return DEFAULT_DEMO_PASSES;
  }
}

function saveLocalPasses(passes) {
  localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(passes));
}

function getLocalCookies() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POOL_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: "cookie_master_1",
        label: "Cuenta Principal Ultra HD (Familia)",
        cookieData: "NetflixId=master_cookie_token_verified_2026; SecureNetflixId=v%3D3...",
        status: "active",
        createdAt: Date.now()
      }
    ];
  } catch {
    return [];
  }
}

function saveLocalCookies(pool) {
  localStorage.setItem(LOCAL_STORAGE_POOL_KEY, JSON.stringify(pool));
}

/**
 * Validar Licencia / Pase de Acceso
 */
export async function validateAccessPass(code) {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    throw new Error("Por favor, ingresa tu código de licencia.");
  }

  try {
    const passRef = doc(db, PASS_COLLECTION, cleanCode);
    const passSnap = await getDoc(passRef);
    const now = Date.now();

    if (passSnap.exists()) {
      const data = passSnap.data();

      if (data.status === "disabled") {
        throw new Error("Este código de acceso ha sido desactivado por el administrador.");
      }

      const durationMs = (data.durationMinutes || 60) * 60 * 1000;
      let firstUsed = data.firstUsedAt ? (data.firstUsedAt.toMillis ? data.firstUsedAt.toMillis() : data.firstUsedAt) : null;

      if (!firstUsed) {
        firstUsed = now;
        await updateDoc(passRef, {
          firstUsedAt: now,
          status: "in_use",
          lastUsedAt: serverTimestamp()
        });
      }

      const elapsed = now - firstUsed;
      const remainingTimeMs = Math.max(0, durationMs - elapsed);
      const isExpired = elapsed >= durationMs;

      return {
        success: true,
        code: cleanCode,
        durationMinutes: data.durationMinutes || 60,
        firstUsedAt: firstUsed,
        remainingTimeMs,
        isExpired,
        assignedCookie: data.assignedCookie || "",
        internalCookie: data.assignedCookie || "internal_verified_cookie_token"
      };
    }
  } catch (err) {
    console.warn("Firestore offline/fallback:", err.message);
  }

  // Fallback Local Storage
  const localPasses = getLocalPasses();
  const pass = localPasses[cleanCode];

  if (!pass) {
    throw new Error("Código de licencia no encontrado o inválido.");
  }

  if (pass.status === "disabled") {
    throw new Error("Este código de acceso ha sido desactivado.");
  }

  const now = Date.now();
  const durationMs = (pass.durationMinutes || 60) * 60 * 1000;
  let firstUsed = pass.firstUsedAt;

  if (!firstUsed) {
    firstUsed = now;
    pass.firstUsedAt = now;
    pass.status = "in_use";
    localPasses[cleanCode] = pass;
    saveLocalPasses(localPasses);
  }

  const elapsed = now - firstUsed;
  const remainingTimeMs = Math.max(0, durationMs - elapsed);
  const isExpired = elapsed >= durationMs;

  return {
    success: true,
    code: cleanCode,
    durationMinutes: pass.durationMinutes || 60,
    firstUsedAt: firstUsed,
    remainingTimeMs,
    isExpired,
    assignedCookie: pass.assignedCookie || "",
    internalCookie: pass.assignedCookie
  };
}

/**
 * Obtener todos los pases para el Admin
 */
export async function getAllPasses() {
  try {
    const snap = await getDocs(collection(db, PASS_COLLECTION));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      // Si Firestore está vacío, inicializar los pases iniciales en Firestore
      const defaultEntries = Object.values(DEFAULT_DEMO_PASSES);
      for (const p of defaultEntries) {
        await setDoc(doc(db, PASS_COLLECTION, p.code), p);
      }
      return defaultEntries;
    }
  } catch (err) {
    console.warn("Fallback local para lista de pases:", err.message);
  }
  const local = getLocalPasses();
  return Object.values(local);
}

/**
 * Crear un Pase de Acceso con su cookie asociada
 */
export async function createPass({ code, durationMinutes = 60, assignedCookie = "", description = "" }) {
  const cleanCode = code.trim().toUpperCase();
  const payload = {
    code: cleanCode,
    durationMinutes: Number(durationMinutes),
    assignedCookie,
    description,
    status: "active",
    createdAt: Date.now(),
    firstUsedAt: null
  };

  try {
    await setDoc(doc(db, PASS_COLLECTION, cleanCode), payload, { merge: true });
  } catch (err) {
    console.warn("Guardando pase en fallback local:", err.message);
  }

  const local = getLocalPasses();
  local[cleanCode] = payload;
  saveLocalPasses(local);
  return payload;
}

/**
 * Actualizar la cookie asignada o datos de un pase específico
 */
export async function updatePassCookie(code, newCookie) {
  const cleanCode = code.trim().toUpperCase();
  const payload = {
    code: cleanCode,
    assignedCookie: newCookie,
    updatedAt: Date.now()
  };

  try {
    const passRef = doc(db, PASS_COLLECTION, cleanCode);
    // Usar setDoc con merge: true para que si el documento no existía aún en Firestore, se cree automáticamente
    await setDoc(passRef, payload, { merge: true });
  } catch (err) {
    console.warn("Actualizando cookie en fallback local:", err.message);
  }

  const local = getLocalPasses();
  if (local[cleanCode]) {
    local[cleanCode].assignedCookie = newCookie;
    saveLocalPasses(local);
  } else {
    local[cleanCode] = {
      code: cleanCode,
      durationMinutes: 60,
      assignedCookie: newCookie,
      status: "active",
      createdAt: Date.now(),
      firstUsedAt: null
    };
    saveLocalPasses(local);
  }
}

/**
 * Obtener cookies del pool interno
 */
export async function getCookiePool() {
  try {
    const snap = await getDocs(collection(db, COOKIES_POOL_COLLECTION));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn("Fallback local para cookies pool:", err.message);
  }
  return getLocalCookies();
}

/**
 * Guardar una cookie en el pool
 */
export async function saveCookieToPool({ label, cookieData }) {
  const id = "cookie_" + Date.now();
  const payload = {
    id,
    label: label || "Cuenta Netflix " + Date.now(),
    cookieData,
    status: "active",
    updatedAt: Date.now()
  };

  try {
    await setDoc(doc(db, COOKIES_POOL_COLLECTION, id), payload);
  } catch (err) {
    console.warn("Guardando cookie en fallback local:", err.message);
  }

  const pool = getLocalCookies();
  pool.unshift(payload);
  saveLocalCookies(pool);
  return payload;
}

/**
 * Resetear tiempo de un pase
 */
export async function resetPassTimer(code) {
  const cleanCode = code.trim().toUpperCase();
  try {
    const passRef = doc(db, PASS_COLLECTION, cleanCode);
    await updateDoc(passRef, {
      firstUsedAt: null,
      status: "active"
    });
  } catch (err) {
    console.warn("Reset local:", err.message);
  }

  const local = getLocalPasses();
  if (local[cleanCode]) {
    local[cleanCode].firstUsedAt = null;
    local[cleanCode].status = "active";
    saveLocalPasses(local);
  }
}

/**
 * Obtener configuración del Home
 */
export async function getHomeConfig() {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_HOME_CONFIG, ...docSnap.data() };
    }
  } catch (err) {
    console.warn("Fallback local para home config:", err.message);
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    return local ? { ...DEFAULT_HOME_CONFIG, ...JSON.parse(local) } : DEFAULT_HOME_CONFIG;
  } catch {
    return DEFAULT_HOME_CONFIG;
  }
}

/**
 * Guardar configuración del Home desde el Admin
 */
export async function saveHomeConfig(newConfig) {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, newConfig, { merge: true });
  } catch (err) {
    console.warn("Guardando home config en local fallback:", err.message);
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
  } catch (e) {
    console.error(e);
  }
  return newConfig;
}
