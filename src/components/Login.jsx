import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Lock,
  Tv,
  HelpCircle,
  MessageCircle
} from 'lucide-react';

export default function Login({ onLoginSuccess, onOpenAdmin, onBackToHome, initialCode = '' }) {
  const [accessCode, setAccessCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!accessCode.trim()) {
      setError('Por favor ingresa tu código de licencia o acceso.');
      return;
    }

    setLoading(true);
    try {
      await onLoginSuccess(accessCode);
    } catch (err) {
      setError(err.message || 'Licencia no válida o vencida. Contacta al administrador para obtener un acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoPass = () => {
    setAccessCode('VIP-PREMIUM-2026');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#141414] px-4 py-12 overflow-hidden selection:bg-[#E50914] selection:text-white">
      {/* Fondo cinematográfico con viñeta */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 pointer-events-none filter blur-sm"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/90 to-[#141414]/75 pointer-events-none" />

      {/* Header superior */}
      <header className="relative z-10 w-full max-w-6xl mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 transition px-3 py-1.5 rounded-md border border-zinc-800 mr-2 cursor-pointer"
            >
              ← Volver
            </button>
          )}
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#E50914] drop-shadow-md select-none">
            NETFLIX
          </span>
          <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold border border-amber-500/40 px-2 py-0.5 rounded ml-2 bg-amber-500/10">
            ACCESO PRIVADO
          </span>
        </div>

        {/* Espacio reservado para balancear el header */}
        <div />
      </header>

      {/* Tarjeta de Login: Solo licencias proporcionadas, registro deshabilitado */}
      <div className="relative z-10 w-full max-w-md bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl transition-all">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tv className="w-5 h-5 text-[#E50914]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Plataforma Privada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Ingreso por Licencia
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            El autoregistro público está desactivado. Ingresa la clave de licencia asignada para activar tu sesión.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-950/70 border border-red-500/50 rounded-lg text-red-200 text-xs sm:text-sm animate-shake">
            <ShieldAlert className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Clave de Licencia / Pase Asignado
            </label>
            <div className="relative">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Ej. VIP-XXXXX"
                required
                className="w-full bg-zinc-900/90 text-white placeholder-zinc-500 text-sm font-mono tracking-widest uppercase rounded-lg px-4 py-3.5 border border-zinc-700 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition"
              />
              <div className="absolute right-3.5 top-3.5 pointer-events-none text-zinc-500">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Activación automática e inmediata</span>
              <button 
                type="button" 
                onClick={handleUseDemoPass}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Licencia Demo
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E50914] hover:bg-[#b80710] disabled:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-red-900/40 cursor-pointer disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Activar Licencia y Entrar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Sección explicativa: Registro cerrado, solo por soporte / admin */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-zinc-400">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>Las licencias son personales, generadas y autorizadas directamente por el administrador.</span>
          </div>
          
          <div className="flex items-start gap-2.5 text-xs text-zinc-400">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>El tiempo de uso comienza a correr desde el primer ingreso a la plataforma.</span>
          </div>

          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg flex items-center justify-between text-xs text-zinc-400 mt-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#E50914]" />
              <span>¿No tienes una licencia aún?</span>
            </div>
            <a 
              href="https://wa.me/" 
              target="_blank" 
              rel="noreferrer"
              className="text-[#E50914] hover:underline font-semibold"
            >
              Contactar Soporte
            </a>
          </div>
        </div>
      </div>

      <footer className="relative z-10 mt-12 text-center text-xs text-zinc-600">
        <p>Sistema de acceso restringido por licencia © 2026</p>
      </footer>
    </div>
  );
}
