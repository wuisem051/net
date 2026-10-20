package com.appnet.app;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

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

    private Dialog netflixDialog = null;
    private WebView netflixWebView = null;
    private Handler timerHandler = null;
    private Runnable timerRunnable = null;
    private long remainingSeconds = 3600;
    private TextView timerTextView = null;

    /**
     * openNetflixView - Inyecta cookies y abre un WebView nativo en pantalla completa
     * con un banner flotante con temporizador regresivo y botón de cierre.
     * Al terminar el tiempo o pulsar salir, cierra el visor y limpia las cookies.
     */
    @PluginMethod
    public void openNetflixView(PluginCall call) {
        final String cookieString = call.getString("cookieString", "");
        final int durationSeconds = call.getInt("durationSeconds", 3600);
        final String sessionCode = call.getString("sessionCode", "VIP");

        final AppCompatActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    // 1. Inyectar cookies en CookieManager nativo
                    injectCookiesInternal(cookieString);

                    // 2. Si ya hay un visor abierto, cerrarlo
                    closeNetflixViewInternal();

                    remainingSeconds = durationSeconds;

                    // 3. Crear diálogo a pantalla completa
                    netflixDialog = new Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                    Window window = netflixDialog.getWindow();
                    if (window != null) {
                        window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            window.setStatusBarColor(Color.BLACK);
                            window.setNavigationBarColor(Color.BLACK);
                        }
                    }

                    // Contenedor principal
                    FrameLayout rootLayout = new FrameLayout(activity);
                    rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    rootLayout.setBackgroundColor(Color.BLACK);

                    // 4. Configurar el WebView nativo para Netflix
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

                    // User Agent moderno de Chrome Desktop/Android para compatibilidad con Netflix
                    String defaultUA = settings.getUserAgentString();
                    if (defaultUA == null || defaultUA.isEmpty()) {
                        settings.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");
                    }

                    // Asegurar cookies para el WebView
                    CookieManager cookieManager = CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        cookieManager.setAcceptThirdPartyCookies(netflixWebView, true);
                    }

                    netflixWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            // Mantener toda la navegación dentro de este WebView
                            view.loadUrl(url);
                            return true;
                        }
                    });

                    netflixWebView.setWebChromeClient(new WebChromeClient());

                    rootLayout.addView(netflixWebView);

                    // 5. BANNER FLOTANTE SUPERIOR CON TEMPORIZADOR Y BOTÓN SALIR
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

                    // Logo / Título VIP
                    TextView vipLabel = new TextView(activity);
                    vipLabel.setText("VIP NETFLIX");
                    vipLabel.setTextColor(Color.parseColor("#E50914"));
                    vipLabel.setTextSize(13);
                    vipLabel.setTypeface(null, Typeface.BOLD);
                    LinearLayout.LayoutParams vipParams = new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.WRAP_CONTENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                    vipParams.weight = 0;
                    topBar.addView(vipLabel, vipParams);

                    // Temporizador en el centro
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
                    int tPadH = dpToPx(activity, 12);
                    int tPadV = dpToPx(activity, 4);
                    timerTextView.setPadding(tPadH, tPadV, tPadH, tPadV);

                    LinearLayout.LayoutParams timerParams = new LinearLayout.LayoutParams(
                            0,
                            ViewGroup.LayoutParams.WRAP_CONTENT,
                            1.0f
                    );
                    timerParams.setMargins(dpToPx(activity, 8), 0, dpToPx(activity, 8), 0);
                    topBar.addView(timerTextView, timerParams);

                    // Botón de salir
                    TextView closeBtn = new TextView(activity);
                    closeBtn.setText("✕ Salir");
                    closeBtn.setTextColor(Color.parseColor("#CCCCCC"));
                    closeBtn.setTextSize(12);
                    closeBtn.setTypeface(null, Typeface.BOLD);

                    GradientDrawable btnBg = new GradientDrawable();
                    btnBg.setColor(Color.parseColor("#33FFFFFF"));
                    btnBg.setCornerRadius(dpToPx(activity, 12));
                    closeBtn.setBackground(btnBg);
                    int bPadH = dpToPx(activity, 10);
                    int bPadV = dpToPx(activity, 5);
                    closeBtn.setPadding(bPadH, bPadV, bPadH, bPadV);

                    closeBtn.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            closeNetflixViewInternal();
                        }
                    });

                    topBar.addView(closeBtn);
                    rootLayout.addView(topBar);

                    // Iniciar el temporizador regresivo
                    timerHandler = new Handler(Looper.getMainLooper());
                    timerRunnable = new Runnable() {
                        @Override
                        public void run() {
                            remainingSeconds--;
                            if (timerTextView != null) {
                                timerTextView.setText(formatSeconds(Math.max(0, remainingSeconds)));
                                if (remainingSeconds < 300) {
                                    // Rojo cuando falten menos de 5 min
                                    GradientDrawable warningBg = new GradientDrawable();
                                    warningBg.setColor(Color.parseColor("#40EF4444"));
                                    warningBg.setCornerRadius(dpToPx(activity, 12));
                                    warningBg.setStroke(dpToPx(activity, 1), Color.parseColor("#EF4444"));
                                    timerTextView.setBackground(warningBg);
                                    timerTextView.setTextColor(Color.parseColor("#FCA5A5"));
                                }
                            }

                            if (remainingSeconds <= 0) {
                                // Al expirar el tiempo, cerrar y limpiar sesión
                                closeNetflixViewInternal();
                            } else {
                                timerHandler.postDelayed(this, 1000);
                            }
                        }
                    };
                    timerHandler.postDelayed(timerRunnable, 1000);

                    // Cargar Netflix
                    netflixWebView.loadUrl("https://www.netflix.com");

                    netflixDialog.setContentView(rootLayout);
                    netflixDialog.show();

                    JSObject res = new JSObject();
                    res.put("success", true);
                    call.resolve(res);

                } catch (Exception e) {
                    call.reject("Error opening Netflix view: " + e.getMessage());
                }
            }
        });
    }

    /**
     * closeNetflixView - Cierra el visor de Netflix si está abierto y borra cookies.
     */
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
                    cookieManager.setCookie("https://netflix.com", expired);
                }
            }
            cookieManager.flush();
        } catch (Exception ignored) {}
    }

    private void injectCookiesInternal(String cookieString) {
        if (cookieString == null || cookieString.trim().isEmpty()) return;

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        String trimmedStr = cookieString.trim();

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
                    cookieVal.append("; SameSite=None");

                    cookieManager.setCookie("https://www.netflix.com", cookieVal.toString());
                    cookieManager.setCookie("https://netflix.com", cookieVal.toString());
                }
            } catch (Exception ignored) {}
        } else {
            String[] pairs = cookieString.split(";");
            for (String pair : pairs) {
                String trimmed = pair.trim();
                if (!trimmed.isEmpty()) {
                    String cookieEntry = trimmed + "; Domain=.netflix.com; Path=/; Secure; SameSite=None";
                    cookieManager.setCookie("https://www.netflix.com", cookieEntry);
                    cookieManager.setCookie("https://netflix.com", cookieEntry);
                }
            }
        }

        cookieManager.flush();
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

    private String formatSeconds(long seconds) {
        long mins = seconds / 60;
        long secs = seconds % 60;
        return String.format(Locale.getDefault(), "%02d:%02d", mins, secs);
    }

    private int dpToPx(Context context, int dp) {
        return Math.round(dp * context.getResources().getDisplayMetrics().density);
    }
}
