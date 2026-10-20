package com.appnet.app;

import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "CookiePlugin")
public class CookiePlugin extends Plugin {

    /**
     * setCookies — inyecta un string de cookies en el CookieManager del WebView nativo.
     * Llamado desde JS con: Capacitor.Plugins.CookiePlugin.setCookies({ domain, cookieString })
     *
     * @param call - contiene:
     *   domain: e.g. "https://www.netflix.com"
     *   cookieString: e.g. "NetflixId=abc; SecureNetflixId=xyz"
     */
    @PluginMethod
    public void setCookies(PluginCall call) {
        String domain = call.getString("domain", "https://www.netflix.com");
        String cookieString = call.getString("cookieString", "");

        if (cookieString == null || cookieString.isEmpty()) {
            call.reject("cookieString is required");
            return;
        }

        try {
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);

            // Parsear y aplicar cada cookie individual
            String[] pairs = cookieString.split(";");
            for (String pair : pairs) {
                String trimmed = pair.trim();
                if (!trimmed.isEmpty()) {
                    // Formato: "nombre=valor" -> agregar atributos de seguridad
                    String cookieEntry = trimmed + "; Domain=.netflix.com; Path=/; Secure; SameSite=None";
                    cookieManager.setCookie(domain, cookieEntry);
                }
            }

            cookieManager.flush();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("cookiesSet", pairs.length);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Error setting cookies: " + e.getMessage());
        }
    }

    /**
     * clearCookies — limpia todas las cookies del WebView para el dominio dado.
     */
    @PluginMethod
    public void clearCookies(PluginCall call) {
        String domain = call.getString("domain", "https://www.netflix.com");
        try {
            CookieManager cookieManager = CookieManager.getInstance();
            // Eliminar todas las cookies del domain
            String existingCookies = cookieManager.getCookie(domain);
            if (existingCookies != null) {
                String[] pairs = existingCookies.split(";");
                for (String pair : pairs) {
                    String name = pair.split("=")[0].trim();
                    String expiredCookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=.netflix.com; Path=/";
                    cookieManager.setCookie(domain, expiredCookie);
                }
            }
            cookieManager.flush();
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error clearing cookies: " + e.getMessage());
        }
    }

    /**
     * getCookies — devuelve el string actual de cookies para el dominio.
     */
    @PluginMethod
    public void getCookies(PluginCall call) {
        String domain = call.getString("domain", "https://www.netflix.com");
        try {
            CookieManager cookieManager = CookieManager.getInstance();
            String cookies = cookieManager.getCookie(domain);
            JSObject result = new JSObject();
            result.put("cookies", cookies != null ? cookies : "");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error getting cookies: " + e.getMessage());
        }
    }
}
