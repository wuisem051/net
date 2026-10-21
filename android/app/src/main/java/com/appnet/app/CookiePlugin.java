package com.appnet.app;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.content.Intent;
import android.net.Uri;
import android.provider.Browser;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

@CapacitorPlugin(name = "CookiePlugin")
public class CookiePlugin extends Plugin {

    private static final String TAG = "CookiePlugin";
    private Dialog netflixDialog = null;
    private WebView netflixWebView = null;
    private Handler timerHandler = null;
    private Runnable timerRunnable = null;
    private long remainingSeconds = 3600;
    private TextView timerTextView = null;
    private TextView uaLabelView = null;
    private int currentUaIndex = 0;

    // User-Agents optimizados para evitar Widevine L1 y reproducir con DRM software (L3)
    private static final String[] USER_AGENTS = {
        // Opción 1 – Samsung Smart TV (Netflix lo sirve en HTML5 sin EME estricto)
        "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1",
        // Opción 2 – Amazon Fire TV (WebView con Widevine L3 suficiente)
        "Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7233; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 AmazonWebAppPlatform/4.0",
        // Opción 3 – ChromeOS Tablet (Google-safe UA con L3 habilitado)
        "Mozilla/5.0 (X11; CrOS aarch64 15183.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    };

    private String[] UA_LABELS = {"📺 Smart TV", "🔥 Fire TV", "💻 ChromeOS"};

    /**
     * openNetflixView - Inyecta cookies y abre un WebView nativo en pantalla completa
     * con un banner flotante con temporizador regresivo y botón de cierre.
     */
    @PluginMethod
    public void openNetflixView(PluginCall call) {
        final String cookieString = call.getString("cookieString", "");
        final int durationSeconds = call.getInt("durationSeconds", 3600);
        final String sessionCode = call.getString("sessionCode", "VIP");

        Log.d(TAG, "openNetflixView called with cookie length: " + (cookieString != null ? cookieString.length() : 0));

        final AppCompatActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    // 1. Limpiar visor anterior si existe
                    if (netflixDialog != null && netflixDialog.isShowing()) {
                        netflixDialog.dismiss();
                        netflixDialog = null;
                    }
                    if (timerHandler != null && timerRunnable != null) {
                        timerHandler.removeCallbacks(timerRunnable);
                        timerHandler = null;
                    }

                    remainingSeconds = durationSeconds;

                    // 2. Crear diálogo a pantalla completa
                    netflixDialog = new Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    Window window = netflixDialog.getWindow();
                    if (window != null) {
                        window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            window.setStatusBarColor(Color.BLACK);
                            window.setNavigationBarColor(Color.BLACK);
                        }
                    }

                    // Layout raíz
                    FrameLayout rootLayout = new FrameLayout(activity);
                    rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    rootLayout.setBackgroundColor(Color.BLACK);

                    // 3. Crear y configurar WebView nativo
                    netflixWebView = new WebView(activity);
                    netflixWebView.setLayoutParams(new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    ));

                    WebSettings settings = netflixWebView.getSettings();
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);
                    settings.setDatabaseEnabled(true);
                    settings.setUseWideViewPort(true);
                    settings.setLoadWithOverviewMode(true);
                    settings.setSupportZoom(true);
                    settings.setBuiltInZoomControls(true);
                    settings.setDisplayZoomControls(false);
                    settings.setAllowFileAccess(true);
                    settings.setAllowContentAccess(true);
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                    settings.setJavaScriptCanOpenWindowsAutomatically(true);

                    // Permitir contenido mixto HTTPS/HTTP (necesario para streaming y assets)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    }

                    // Aceleración por hardware para decodificación de video
                    netflixWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    netflixWebView.setKeepScreenOn(true);

                    // User Agent rotativo: TV / FireTV / ChromeOS para evitar DRM L1
                    settings.setUserAgentString(USER_AGENTS[currentUaIndex]);
                    Log.d(TAG, "Using UA [" + currentUaIndex + "]: " + USER_AGENTS[currentUaIndex]);

                    // 4. Habilitar CookieManager explícitamente para este WebView
                    final CookieManager cookieManager = CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        cookieManager.setAcceptThirdPartyCookies(netflixWebView, true);
                    }

                    // 5. Inyectar cookies de forma síncrona/directa antes de cargar
                    injectCookiesInternal(cookieString);

                    // Verificar qué cookies ve el CookieManager
                    String activeCookies = cookieManager.getCookie("https://www.netflix.com");
                    Log.d(TAG, "Active cookies for https://www.netflix.com: " + (activeCookies != null ? activeCookies.substring(0, Math.min(100, activeCookies.length())) + "..." : "NONE"));

                    netflixWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            String reqUrl = request.getUrl().toString();
                            // Dejar que el WebView intente reproducir internamente
                            // Solo redirigir si dominio sale de netflix
                            if (!reqUrl.contains("netflix.com") && !reqUrl.contains("nflxvideo.net") && !reqUrl.contains("nflximg.net")) {
                                Log.d(TAG, "External URL intercepted: " + reqUrl);
                                return true; // bloquear URLs externas
                            }
                            return false; // dejar pasar a Netflix y sus CDNs
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            if (url != null && !url.contains("netflix.com") && !url.contains("nflxvideo.net")) {
                                return true;
                            }
                            return false;
                        }

                        @Override
                        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                            super.onPageStarted(view, url, favicon);
                            // Inyectar spoofer DRM antes de que cargue la página
                            injectDrmSpoofer(view);
                        }

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            Log.d(TAG, "Page finished loading: " + url);

                            // Re-inyectar spoofer y hooks SPA al terminar carga
                            injectDrmSpoofer(view);

                            // Interceptar navegación SPA (pushState/replaceState)
                            String jsInterceptor =
                                "(function(){" +
                                "  if (window._netflixBridgeAttached) return;" +
                                "  window._netflixBridgeAttached = true;" +
                                "  var origPush = history.pushState;" +
                                "  history.pushState = function() {" +
                                "    origPush.apply(this, arguments);" +
                                "    setTimeout(function(){ window._nfDrmCheck && window._nfDrmCheck(); }, 200);" +
                                "  };" +
                                "  var origReplace = history.replaceState;" +
                                "  history.replaceState = function() {" +
                                "    origReplace.apply(this, arguments);" +
                                "    setTimeout(function(){ window._nfDrmCheck && window._nfDrmCheck(); }, 200);" +
                                "  };" +
                                "  window.addEventListener('popstate', function(){" +
                                "    setTimeout(function(){ window._nfDrmCheck && window._nfDrmCheck(); }, 200);" +
                                "  });" +
                                "})();";
                            view.evaluateJavascript(jsInterceptor, null);
                        }

                        @Override
                        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                            super.onReceivedError(view, request, error);
                            if (request != null && request.isForMainFrame()) {
                                int errorCode = 0;
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                    errorCode = error != null ? error.getErrorCode() : 0;
                                }
                                Log.w(TAG, "WebView main frame error code=" + errorCode +
                                    " desc=" + (error != null ? error.getDescription() : "unknown") +
                                    " | URL: " + request.getUrl());
                            }
                        }

                        @Override
                        public void onReceivedHttpError(WebView view, WebResourceRequest request,
                                android.webkit.WebResourceResponse errorResponse) {
                            super.onReceivedHttpError(view, request, errorResponse);
                            if (request != null && request.isForMainFrame()) {
                                int statusCode = errorResponse != null ? errorResponse.getStatusCode() : 0;
                                Log.w(TAG, "HTTP error " + statusCode + " for: " + request.getUrl());
                            }
                        }
                    });

                    // Autorizar automáticamente permisos de contenido protegido DRM (Widevine) y medios
                    netflixWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    try {
                                        // Conceder todos los permisos solicitados (RESOURCE_PROTECTED_MEDIA_ID, AUDIO, VIDEO)
                                        request.grant(request.getResources());
                                        Log.d(TAG, "DRM / Media permissions granted: " + java.util.Arrays.toString(request.getResources()));
                                    } catch (Exception e) {
                                        Log.e(TAG, "Error granting media permissions", e);
                                    }
                                }
                            });
                        }
                    });

                    // Puente JavaScript: AndroidBridge expone openPlayer para fallback externo
                    netflixWebView.addJavascriptInterface(new Object() {
                        @JavascriptInterface
                        public void openPlayer(final String url) {
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    Log.d(TAG, "AndroidBridge openPlayer called (fallback externo): " + url);
                                    launchExternalPlayer(activity, url);
                                }
                            });
                        }

                        @JavascriptInterface
                        public void rotateUserAgent() {
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    rotatUaAndReload(activity);
                                }
                            });
                        }
                    }, "AndroidBridge");

                    rootLayout.addView(netflixWebView);

                    // 6. Barra flotante con temporizador
                    LinearLayout topBar = new LinearLayout(activity);
                    topBar.setOrientation(LinearLayout.HORIZONTAL);
                    topBar.setGravity(Gravity.CENTER_VERTICAL);
                    int padH = dpToPx(activity, 14);
                    int padV = dpToPx(activity, 8);
                    topBar.setPadding(padH, padV, padH, padV);

                    GradientDrawable barBg = new GradientDrawable();
                    barBg.setColor(Color.parseColor("#E60A0A0A"));
                    barBg.setCornerRadius(dpToPx(activity, 20));
                    barBg.setStroke(dpToPx(activity, 1), Color.parseColor("#33FFFFFF"));
                    topBar.setBackground(barBg);

                    FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    barParams.gravity = Gravity.TOP;
                    barParams.setMargins(dpToPx(activity, 12), dpToPx(activity, 16), dpToPx(activity, 12), 0);
                    topBar.setLayoutParams(barParams);

                    // Logo VIP
                    TextView vipLabel = new TextView(activity);
                    vipLabel.setText("VIP NETFLIX");
                    vipLabel.setTextColor(Color.parseColor("#E50914"));
                    vipLabel.setTextSize(13);
                    vipLabel.setTypeface(null, Typeface.BOLD);
                    topBar.addView(vipLabel, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

                    // Contador
                    timerTextView = new TextView(activity);
                    timerTextView.setText(formatSeconds(remainingSeconds));
                    timerTextView.setTextColor(Color.WHITE);
                    timerTextView.setTextSize(14);
                    timerTextView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
                    timerTextView.setGravity(Gravity.CENTER);

                    GradientDrawable timerBg = new GradientDrawable();
                    timerBg.setColor(Color.parseColor("#26000000"));
                    timerBg.setCornerRadius(dpToPx(activity, 12));
                    timerBg.setStroke(dpToPx(activity, 1), Color.parseColor("#22C55E"));
                    timerTextView.setBackground(timerBg);
                    timerTextView.setPadding(dpToPx(activity, 12), dpToPx(activity, 4), dpToPx(activity, 12), dpToPx(activity, 4));

                    LinearLayout.LayoutParams timerParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
                    timerParams.setMargins(dpToPx(activity, 8), 0, dpToPx(activity, 8), 0);
                    topBar.addView(timerTextView, timerParams);

                    // Botón: rotar User-Agent
                    uaLabelView = new TextView(activity);
                    uaLabelView.setText(UA_LABELS[currentUaIndex]);
                    uaLabelView.setTextColor(Color.parseColor("#FACC15"));
                    uaLabelView.setTextSize(11);
                    uaLabelView.setTypeface(null, Typeface.BOLD);

                    GradientDrawable uaBg = new GradientDrawable();
                    uaBg.setColor(Color.parseColor("#2A2A2A"));
                    uaBg.setCornerRadius(dpToPx(activity, 12));
                    uaBg.setStroke(dpToPx(activity, 1), Color.parseColor("#FACC15"));
                    uaLabelView.setBackground(uaBg);
                    uaLabelView.setPadding(dpToPx(activity, 8), dpToPx(activity, 4), dpToPx(activity, 8), dpToPx(activity, 4));
                    uaLabelView.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            rotatUaAndReload(activity);
                        }
                    });
                    topBar.addView(uaLabelView);

                    // Margen
                    View uaSpacer = new View(activity);
                    topBar.addView(uaSpacer, new LinearLayout.LayoutParams(dpToPx(activity, 6), 1));

                    // Botón Reproducir en Navegador (fallback externo)
                    TextView playExtBtn = new TextView(activity);
                    playExtBtn.setText("▶ HD");
                    playExtBtn.setTextColor(Color.WHITE);
                    playExtBtn.setTextSize(12);
                    playExtBtn.setTypeface(null, Typeface.BOLD);

                    GradientDrawable playBg = new GradientDrawable();
                    playBg.setColor(Color.parseColor("#E50914"));
                    playBg.setCornerRadius(dpToPx(activity, 12));
                    playExtBtn.setBackground(playBg);
                    playExtBtn.setPadding(dpToPx(activity, 10), dpToPx(activity, 5), dpToPx(activity, 10), dpToPx(activity, 5));

                    playExtBtn.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            try {
                                String currentUrl = netflixWebView != null ? netflixWebView.getUrl() : "https://www.netflix.com/browse";
                                if (currentUrl == null || currentUrl.isEmpty()) {
                                    currentUrl = "https://www.netflix.com/browse";
                                }
                                launchExternalPlayer(activity, currentUrl);
                            } catch (Exception ex) {
                                Log.e(TAG, "Error launching external player", ex);
                            }
                        }
                    });
                    topBar.addView(playExtBtn);

                    // Margen entre botones
                    View spacer = new View(activity);
                    topBar.addView(spacer, new LinearLayout.LayoutParams(dpToPx(activity, 6), 1));

                    // Botón Salir
                    TextView closeBtn = new TextView(activity);
                    closeBtn.setText("✕ Salir");
                    closeBtn.setTextColor(Color.parseColor("#CCCCCC"));
                    closeBtn.setTextSize(12);
                    closeBtn.setTypeface(null, Typeface.BOLD);

                    GradientDrawable btnBg = new GradientDrawable();
                    btnBg.setColor(Color.parseColor("#33FFFFFF"));
                    btnBg.setCornerRadius(dpToPx(activity, 12));
                    closeBtn.setBackground(btnBg);
                    closeBtn.setPadding(dpToPx(activity, 10), dpToPx(activity, 5), dpToPx(activity, 10), dpToPx(activity, 5));

                    closeBtn.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            closeNetflixViewInternal();
                        }
                    });
                    topBar.addView(closeBtn);
                    rootLayout.addView(topBar);

                    // 7. Timer Runnable
                    timerHandler = new Handler(Looper.getMainLooper());
                    timerRunnable = new Runnable() {
                        @Override
                        public void run() {
                            remainingSeconds--;
                            if (timerTextView != null) {
                                timerTextView.setText(formatSeconds(Math.max(0, remainingSeconds)));
                                if (remainingSeconds < 300) {
                                    GradientDrawable warningBg = new GradientDrawable();
                                    warningBg.setColor(Color.parseColor("#40EF4444"));
                                    warningBg.setCornerRadius(dpToPx(activity, 12));
                                    warningBg.setStroke(dpToPx(activity, 1), Color.parseColor("#EF4444"));
                                    timerTextView.setBackground(warningBg);
                                    timerTextView.setTextColor(Color.parseColor("#FCA5A5"));
                                }
                            }

                            if (remainingSeconds <= 0) {
                                closeNetflixViewInternal();
                            } else {
                                timerHandler.postDelayed(this, 1000);
                            }
                        }
                    };
                    timerHandler.postDelayed(timerRunnable, 1000);

                    // 8. Cargar página principal de Netflix
                    netflixWebView.loadUrl("https://www.netflix.com/browse");

                    netflixDialog.setContentView(rootLayout);
                    netflixDialog.show();

                    JSObject res = new JSObject();
                    res.put("success", true);
                    call.resolve(res);

                } catch (Exception e) {
                    Log.e(TAG, "Error opening Netflix view", e);
                    call.reject("Error opening Netflix view: " + e.getMessage());
                }
            }
        });
    }

    @PluginMethod
    public void closeNetflixView(PluginCall call) {
        AppCompatActivity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    closeNetflixViewInternal();
                }
            });
        }
        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    private void closeNetflixViewInternal() {
        if (timerHandler != null && timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
            timerHandler = null;
            timerRunnable = null;
        }
        if (netflixWebView != null) {
            netflixWebView.stopLoading();
            netflixWebView.loadUrl("about:blank");
            netflixWebView.clearHistory();
            netflixWebView.clearCache(true);
            netflixWebView.destroy();
            netflixWebView = null;
        }
        if (netflixDialog != null && netflixDialog.isShowing()) {
            netflixDialog.dismiss();
            netflixDialog = null;
        }

        // Limpiar cookies de Netflix al cerrar
        try {
            CookieManager cookieManager = CookieManager.getInstance();
            String existingCookies = cookieManager.getCookie("https://www.netflix.com");
            if (existingCookies != null) {
                String[] pairs = existingCookies.split(";");
                for (String pair : pairs) {
                    String name = pair.split("=")[0].trim();
                    String expired = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Domain=.netflix.com; Path=/";
                    cookieManager.setCookie("https://www.netflix.com", expired);
                    cookieManager.setCookie(".netflix.com", expired);
                }
            }
            cookieManager.flush();
        } catch (Exception ignored) {}
    }

    private void injectCookiesInternal(String cookieString) {
        if (cookieString == null || cookieString.trim().isEmpty()) {
            Log.w(TAG, "injectCookiesInternal: cookieString is empty");
            return;
        }

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        String trimmedStr = cookieString.trim();
        int injectedCount = 0;

        if (trimmedStr.startsWith("[")) {
            try {
                JSONArray arr = new JSONArray(trimmedStr);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    String name = obj.optString("name", "").trim();
                    String val = obj.optString("value", "");
                    if (name.isEmpty()) continue;

                    String cookieDomain = obj.optString("domain", ".netflix.com").trim();
                    String path = obj.optString("path", "/").trim();
                    boolean secure = obj.optBoolean("secure", true);

                    if (cookieDomain.isEmpty()) cookieDomain = ".netflix.com";
                    if (path.isEmpty()) path = "/";

                    StringBuilder cookieVal = new StringBuilder();
                    cookieVal.append(name).append("=").append(val);
                    cookieVal.append("; Domain=").append(cookieDomain);
                    cookieVal.append("; Path=").append(path);
                    if (secure) {
                        cookieVal.append("; Secure");
                    }

                    cookieManager.setCookie("https://www.netflix.com", cookieVal.toString());
                    cookieManager.setCookie("https://netflix.com", cookieVal.toString());
                    cookieManager.setCookie(".netflix.com", cookieVal.toString());
                    cookieManager.setCookie("https://www.netflix.com/", cookieVal.toString());
                    injectedCount++;
                }
            } catch (Exception e) {
                Log.e(TAG, "Error parsing JSON cookie array", e);
            }
        } else if (trimmedStr.contains("\t")) {
            // ── Formato Netscape / TSV de Cookie-Editor (separado por tabulaciones) ──
            // Columnas: domain \t subdomains \t path \t secure \t expiry \t NAME \t VALUE
            String[] lines = trimmedStr.split("\\r?\\n");
            for (String line : lines) {
                String lineTrim = line.trim();
                if (lineTrim.isEmpty() || lineTrim.startsWith("#")) continue;
                String[] parts = lineTrim.split("\t");
                if (parts.length >= 7) {
                    String domain = parts[0].trim();
                    String path = parts[2].trim();
                    boolean secure = "TRUE".equalsIgnoreCase(parts[3].trim());
                    String name = parts[5].trim();
                    String val = parts[6].trim();

                    if (!name.isEmpty()) {
                        StringBuilder cookieVal = new StringBuilder();
                        cookieVal.append(name).append("=").append(val);
                        cookieVal.append("; Domain=").append(!domain.isEmpty() ? domain : ".netflix.com");
                        cookieVal.append("; Path=").append(!path.isEmpty() ? path : "/");
                        if (secure) {
                            cookieVal.append("; Secure");
                        }

                        cookieManager.setCookie("https://www.netflix.com", cookieVal.toString());
                        cookieManager.setCookie("https://netflix.com", cookieVal.toString());
                        cookieManager.setCookie(".netflix.com", cookieVal.toString());
                        cookieManager.setCookie("https://www.netflix.com/", cookieVal.toString());
                        injectedCount++;
                    }
                }
            }
        } else {
            String[] pairs = cookieString.split(";");
            for (String pair : pairs) {
                String trimmed = pair.trim();
                if (!trimmed.isEmpty()) {
                    String cookieEntry = trimmed + "; Domain=.netflix.com; Path=/; Secure";
                    cookieManager.setCookie("https://www.netflix.com", cookieEntry);
                    cookieManager.setCookie("https://netflix.com", cookieEntry);
                    cookieManager.setCookie(".netflix.com", cookieEntry);
                    injectedCount++;
                }
            }
        }

        cookieManager.flush();
        Log.d(TAG, "Injected cookies count: " + injectedCount);
    }

    @PluginMethod
    public void setCookies(PluginCall call) {
        String cookieString = call.getString("cookieString", "");
        try {
            injectCookiesInternal(cookieString);
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error setting cookies: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearCookies(PluginCall call) {
        try {
            closeNetflixViewInternal();
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error clearing cookies: " + e.getMessage());
        }
    }

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

    private void launchExternalPlayer(Context context, String url) {
        try {
            if (url == null || url.isEmpty()) {
                url = "https://www.netflix.com/browse";
            }
            Uri targetUri = Uri.parse(url);

            // Obtener cookies actuales
            CookieManager cookieManager = CookieManager.getInstance();
            String cookies = cookieManager.getCookie("https://www.netflix.com");

            Intent intent = new Intent(Intent.ACTION_VIEW, targetUri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (cookies != null && !cookies.isEmpty()) {
                Bundle bundle = new Bundle();
                bundle.putString("Cookie", cookies);
                intent.putExtra(Browser.EXTRA_HEADERS, bundle);
            }

            // Intentar abrir con Google Chrome (soporta Widevine L1/L3 completo)
            intent.setPackage("com.android.chrome");
            try {
                context.startActivity(intent);
                return;
            } catch (Exception chromeNotFound) {
                Log.w(TAG, "Chrome not found, trying general browser intent");
            }

            // Si Chrome no está, intentar con el navegador por defecto
            Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, targetUri);
            fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(fallbackIntent);

        } catch (Exception e) {
            Log.e(TAG, "Failed to launch external player", e);
        }
    }

    /**
     * Inyecta en el WebView un spoofer de DRM que:
     * 1. Hace que requestMediaKeySystemAccess reporte soporte para Widevine (software L3)
     * 2. Elimina chequeos de protectedMedia y flags de error de Netflix
     * 3. Fuerza calidad de video aceptable para L3
     */
    private void injectDrmSpoofer(WebView view) {
        String drmJs =
            "(function() {" +
            "  if (window._drmSpoofed) return;" +
            "  window._drmSpoofed = true;" +
            // Spoofear EME: reportar que Widevine es soportado con robustez SW
            "  if (navigator.requestMediaKeySystemAccess) {" +
            "    var _origRMKSA = navigator.requestMediaKeySystemAccess.bind(navigator);" +
            "    navigator.requestMediaKeySystemAccess = function(keySystem, configs) {" +
            "      var patched = configs.map(function(cfg) {" +
            "        var pc = Object.assign({}, cfg);" +
            "        if (pc.videoCapabilities) {" +
            "          pc.videoCapabilities = pc.videoCapabilities.map(function(cap) {" +
            "            return { contentType: cap.contentType, robustness: 'SW_SECURE_CRYPTO' };" +
            "          });" +
            "        }" +
            "        if (pc.audioCapabilities) {" +
            "          pc.audioCapabilities = pc.audioCapabilities.map(function(cap) {" +
            "            return { contentType: cap.contentType, robustness: 'SW_SECURE_CRYPTO' };" +
            "          });" +
            "        }" +
            "        return pc;" +
            "      });" +
            "      return _origRMKSA(keySystem, patched).catch(function() {" +
            "        return _origRMKSA(keySystem, configs);" +
            "      });" +
            "    };" +
            "  }" +
            // Eliminar eventos de error DRM de Netflix (NfError overlay)
            "  window._nfDrmCheck = function() {" +
            "    var errDivs = document.querySelectorAll('[class*=\"error\"], [class*=\"Error\"], [id*=\"error\"]');" +
            "    errDivs.forEach(function(el) {" +
            "      if (el.innerText && (el.innerText.indexOf('E100') !== -1 ||" +
            "          el.innerText.indexOf('C7701') !== -1 ||" +
            "          el.innerText.indexOf('1044') !== -1)) {" +
            "        el.style.display = 'none';" +
            "      }" +
            "    });" +
            "  };" +
            // Monitorear y ocultar overlays de error cada 2s
            "  setInterval(window._nfDrmCheck, 2000);" +
            "})();";
        view.evaluateJavascript(drmJs, null);
    }

    /**
     * Rota al siguiente User-Agent y recarga el WebView
     */
    private void rotatUaAndReload(AppCompatActivity activity) {
        currentUaIndex = (currentUaIndex + 1) % USER_AGENTS.length;
        Log.d(TAG, "Rotating UA to index " + currentUaIndex + ": " + USER_AGENTS[currentUaIndex]);
        if (uaLabelView != null) {
            uaLabelView.setText(UA_LABELS[currentUaIndex]);
        }
        if (netflixWebView != null) {
            WebSettings settings = netflixWebView.getSettings();
            settings.setUserAgentString(USER_AGENTS[currentUaIndex]);
            netflixWebView.reload();
        }
    }

    private String formatSeconds(long seconds) {
        long mins = seconds / 60;
        long secs = seconds % 60;
        return String.format(Locale.getDefault(), "%02d:%02d", mins, secs);
    }

    private int dpToPx(Context context, int dp) {
        return Math.round(dp * context.getResources().getDisplayMetrics().density);
    }
}
