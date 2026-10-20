/**
 * cookiePlugin.js
 * 
 * Wrapper para el plugin nativo Android "CookiePlugin" de Capacitor.
 * Permite inyectar, leer y limpiar cookies en el WebView nativo ANTES de navegar.
 * 
 * En el APK:  usa Capacitor.Plugins.CookiePlugin (CookieManager nativo de Android)
 * En el web:  no hace nada (las cookies externas no son accesibles en browser)
 */

const isCapacitor = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

/**
 * Inyecta un string de cookies en el WebView para el dominio dado.
 * @param {string} cookieString - Ej: "NetflixId=abc123; SecureNetflixId=xyz"
 * @param {string} domain - Ej: "https://www.netflix.com"
 * @returns {Promise<{success: boolean, cookiesSet: number}>}
 */
export async function injectCookies(cookieString, domain = 'https://www.netflix.com') {
  if (!cookieString || !cookieString.trim()) {
    console.warn('[CookiePlugin] No cookieString provided, skipping injection.');
    return { success: false, cookiesSet: 0 };
  }

  if (isCapacitor) {
    try {
      const { CookiePlugin } = window.Capacitor.Plugins;
      if (!CookiePlugin) {
        console.warn('[CookiePlugin] Plugin no encontrado en Capacitor.Plugins');
        return { success: false };
      }
      const result = await CookiePlugin.setCookies({ domain, cookieString });
      console.log('[CookiePlugin] Cookies inyectadas:', result);
      return result;
    } catch (err) {
      console.error('[CookiePlugin] Error al inyectar cookies:', err);
      return { success: false, error: err.message };
    }
  } else {
    // En web browser: solo para demostracion / desarrollo
    console.info('[CookiePlugin] Entorno web — inyeccion nativa no disponible.');
    console.info('[CookiePlugin] Cookies que se inyectarian:', cookieString);
    return { success: false, reason: 'web_environment' };
  }
}

/**
 * Lee las cookies actuales del WebView para el dominio dado.
 * @param {string} domain
 * @returns {Promise<string>} - Cookie string actual
 */
export async function readCookies(domain = 'https://www.netflix.com') {
  if (isCapacitor) {
    try {
      const { CookiePlugin } = window.Capacitor.Plugins;
      if (!CookiePlugin) return '';
      const result = await CookiePlugin.getCookies({ domain });
      return result.cookies || '';
    } catch (err) {
      console.error('[CookiePlugin] Error al leer cookies:', err);
      return '';
    }
  }
  return '';
}

/**
 * Limpia todas las cookies del dominio dado del WebView.
 * @param {string} domain
 * @returns {Promise<{success: boolean}>}
 */
export async function clearCookies(domain = 'https://www.netflix.com') {
  if (isCapacitor) {
    try {
      const { CookiePlugin } = window.Capacitor.Plugins;
      if (!CookiePlugin) return { success: false };
      const result = await CookiePlugin.clearCookies({ domain });
      console.log('[CookiePlugin] Cookies limpiadas:', result);
      return result;
    } catch (err) {
      console.error('[CookiePlugin] Error al limpiar cookies:', err);
      return { success: false };
    }
  }
  return { success: false, reason: 'web_environment' };
}

/**
 * Abre el visor nativo de Netflix en pantalla completa con temporizador flotante.
 * @param {Object} options
 * @param {string} options.cookieString - Cookie serializada
 * @param {number} options.durationSeconds - Segundos restantes
 * @param {string} options.sessionCode - Código de pase VIP
 * @returns {Promise<{success: boolean}>}
 */
export async function openNativeNetflixView({ cookieString, durationSeconds, sessionCode }) {
  if (isCapacitor) {
    try {
      const { CookiePlugin } = window.Capacitor.Plugins;
      if (!CookiePlugin) return { success: false };
      return await CookiePlugin.openNetflixView({
        cookieString: cookieString || '',
        durationSeconds: durationSeconds || 3600,
        sessionCode: sessionCode || 'VIP'
      });
    } catch (err) {
      console.error('[CookiePlugin] Error abriendo visor nativo:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, reason: 'web_environment' };
}

/**
 * Cierra el visor nativo de Netflix y limpia cookies.
 */
export async function closeNativeNetflixView() {
  if (isCapacitor) {
    try {
      const { CookiePlugin } = window.Capacitor.Plugins;
      if (!CookiePlugin) return { success: false };
      return await CookiePlugin.closeNetflixView();
    } catch (err) {
      console.error('[CookiePlugin] Error cerrando visor nativo:', err);
      return { success: false };
    }
  }
  return { success: false };
}

