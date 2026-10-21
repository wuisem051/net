import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  LogOut,
  Play,
  ShieldCheck,
  Lock,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Wifi,
  CheckCircle2,
  Loader2,
  XCircle
} from 'lucide-react';
import { injectCookies, clearCookies, openNativeNetflixView, closeNativeNetflixView } from '../services/cookiePlugin';
import CheckoutModal from './CheckoutModal';

export default function NetflixViewer({
  sessionData,
  remainingSeconds,
  isExpired,
  onLogout
}) {
  const [launched, setLaunched] = useState(false);
  const [showExpiredOverlay, setShowExpiredOverlay] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [injectStatus, setInjectStatus] = useState('idle'); // 'idle' | 'injecting' | 'success' | 'failed' | 'web'
  const launchWindowRef = useRef(null);

  // Cuando expira: cerrar ventana de Netflix si está abierta y mostrar bloqueo
  useEffect(() => {
    if (isExpired) {
      setShowExpiredOverlay(true);
      // Cerrar visor nativo si está en APK
      closeNativeNetflixView().catch(() => {});
      // Intentar cerrar la ventana externa si se abrió en web
      if (launchWindowRef.current && !launchWindowRef.current.closed) {
        try { launchWindowRef.current.close(); } catch (_) {}
      }
      clearCookies('https://www.netflix.com').catch(() => {});
    }
  }, [isExpired]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLaunchNetflix = async () => {
    const cookieString = sessionData?.assignedCookie || '';
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

    if (isNative) {
      // ─── APK / WebView nativo en Pantalla Completa con Temporizador Flotante ───
      setInjectStatus('injecting');
      try {
        const result = await openNativeNetflixView({
          cookieString,
          durationSeconds: remainingSeconds > 0 ? remainingSeconds : 3600,
          sessionCode: sessionData?.code || 'VIP'
        });

        if (result.success) {
          setInjectStatus('success');
          setLaunched(true);
          setTimeout(() => setInjectStatus('idle'), 1000);
        } else {
          setInjectStatus('failed');
          setTimeout(() => setInjectStatus('idle'), 2000);
        }
      } catch (err) {
        console.error('[NetflixViewer] Error abriendo visor nativo:', err);
        setInjectStatus('failed');
        setTimeout(() => setInjectStatus('idle'), 2000);
      }

    } else {
      // ─── Navegador web (desarrollo / versión web) ─────────────
      setInjectStatus('web');
      setLaunched(true);
      await new Promise(r => setTimeout(r, 400));
      setInjectStatus('idle');

      // En web: abre en nueva pestaña
      window.open('https://www.netflix.com', '_blank');
    }
  };

  const handleLogout = async () => {
    // Cerrar visor nativo y limpiar cookies
    await closeNativeNetflixView().catch(() => {});
    await clearCookies('https://www.netflix.com').catch(() => {});
    onLogout();
  };


  const timerColor = isExpired
    ? 'text-red-400 border-red-500/60 bg-red-950/80'
    : remainingSeconds < 300
      ? 'text-amber-300 border-amber-500/60 bg-amber-950/80'
      : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/50';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ─── BARRA SUPERIOR FLOTANTE CON TEMPORIZADOR ─── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-black/95 backdrop-blur-md border-b border-zinc-800/80 shadow-2xl">
        {/* Logo */}
        <span className="text-2xl font-black tracking-tighter text-[#E50914] select-none">
          NETFLIX
        </span>

        {/* TEMPORIZADOR CENTRAL */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-mono font-bold tracking-widest transition-all duration-500 ${timerColor}`}>
          <Clock className="w-4 h-4" />
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Salir */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* ─── PANTALLA PRINCIPAL ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">

        {/* Tarjeta de sesión VIP activa */}
        <div className="max-w-sm w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header de tarjeta */}
          <div className="bg-gradient-to-r from-[#E50914]/20 to-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Sesión VIP Activa</p>
              <p className="text-[11px] text-zinc-400 font-mono">{sessionData?.code}</p>
            </div>
            <div className="ml-auto">
              <span className="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                ● ACTIVO
              </span>
            </div>
          </div>

          {/* Temporizador grande */}
          <div className="flex flex-col items-center py-8 gap-2 bg-zinc-950">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Tiempo restante</p>
            <div className={`text-5xl font-black font-mono tracking-wider transition-colors ${
              isExpired ? 'text-red-400' : remainingSeconds < 300 ? 'text-amber-400 animate-pulse' : 'text-white'
            }`}>
              {formatTime(remainingSeconds)}
            </div>
            <div className="w-full px-5 mt-3">
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    isExpired ? 'bg-red-500' : remainingSeconds < 300 ? 'bg-amber-400' : 'bg-[#E50914]'
                  }`}
                  style={{
                    width: `${Math.max(0, (remainingSeconds / ((sessionData?.durationMinutes || 60) * 60)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botón lanzar Netflix */}
          <div className="px-5 pb-6 space-y-3">
            {/* Estado de inyección de cookies */}
            {injectStatus === 'injecting' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-amber-300 font-mono">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aplicando sesión VIP...</span>
              </div>
            )}
            {injectStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sesión lista — abriendo Netflix</span>
              </div>
            )}
            {injectStatus === 'failed' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-amber-400 font-mono">
                <AlertTriangle className="w-4 h-4" />
                <span>Abriendo sin cookies (revisar pool)</span>
              </div>
            )}
            {injectStatus === 'web' && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 font-mono">
                <XCircle className="w-3.5 h-3.5" />
                <span>Inyección solo disponible en APK</span>
              </div>
            )}

            {!launched ? (
              <button
                onClick={handleLaunchNetflix}
                disabled={isExpired || injectStatus === 'injecting'}
                className="w-full bg-[#E50914] hover:bg-[#cc0812] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-base transition-all duration-200 shadow-lg shadow-red-900/40 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {injectStatus === 'injecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>{injectStatus === 'injecting' ? 'Preparando sesión...' : 'Abrir Netflix Ahora'}</span>
                {injectStatus !== 'injecting' && <ExternalLink className="w-4 h-4 opacity-70" />}
              </button>
            ) : (
              <button
                onClick={handleLaunchNetflix}
                disabled={isExpired || injectStatus === 'injecting'}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 text-sm transition cursor-pointer disabled:cursor-not-allowed"
              >
                <Wifi className="w-4 h-4" />
                <span>Volver a abrir Netflix</span>
              </button>
            )}
          </div>
        </div>

        {/* Info técnica */}
        <div className="max-w-sm w-full text-center space-y-1.5">
          <p className="text-xs text-zinc-500">
            Netflix se abrirá en tu navegador o en el visor integrado.
          </p>
          <p className="text-[11px] text-zinc-600">
            Al expirar el tiempo, la sesión se cerrará automáticamente.
          </p>
        </div>
      </main>

      {/* ─── OVERLAY TIEMPO EXPIRADO ─── */}
      {(isExpired || showExpiredOverlay) && (
        <div className="fixed inset-0 z-[9999] bg-black/97 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#181818] border border-red-900/60 rounded-2xl p-7 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-950/70 border border-[#E50914] rounded-full flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-[#E50914]" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Sesión Expirada</h2>
            <p className="text-sm text-zinc-400 mb-2 leading-relaxed">
              Tu acceso VIP de <strong className="text-white">{sessionData?.durationMinutes || 60} minutos</strong> ha finalizado.
            </p>
            <p className="text-xs text-zinc-500 mb-6 font-mono">
              Pase: {sessionData?.code}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                <span>Adquirir Nuevo Acceso</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
              >
                Ingresar otro código VIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE COMPRA (E-COMMERCE) ─── */}
      <CheckoutModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onGoToLogin={onLogout}
      />
    </div>
  );
}
