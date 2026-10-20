import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Cookie, 
  Settings, 
  Plus, 
  RefreshCw, 
  Clock, 
  Check, 
  X, 
  Copy, 
  ArrowLeft,
  DollarSign,
  Save,
  MessageCircle,
  HelpCircle,
  Tv
} from 'lucide-react';
import { 
  getAllPasses, 
  createPass, 
  getCookiePool, 
  saveCookieToPool, 
  resetPassTimer,
  getHomeConfig,
  saveHomeConfig,
  DEFAULT_HOME_CONFIG
} from '../services/authService';

export default function AdminPanel({ onClose, onConfigUpdated }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'cookies' | 'home_settings'
  const [passes, setPasses] = useState([]);
  const [cookiesPool, setCookiesPool] = useState([]);
  const [homeConfig, setHomeConfig] = useState(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Formulario Nuevo Pase / Licencia
  const [newPassCode, setNewPassCode] = useState('');
  const [newPassDuration, setNewPassDuration] = useState(60);
  const [newPassCookie, setNewPassCookie] = useState('');
  const [newPassDesc, setNewPassDesc] = useState('');

  // Formulario Nueva Cookie
  const [newCookieLabel, setNewCookieLabel] = useState('');
  const [newCookieData, setNewCookieData] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedPasses, fetchedCookies, fetchedConfig] = await Promise.all([
        getAllPasses(),
        getCookiePool(),
        getHomeConfig()
      ]);
      setPasses(fetchedPasses || []);
      setCookiesPool(fetchedCookies || []);
      setHomeConfig(fetchedConfig || DEFAULT_HOME_CONFIG);

      if (fetchedCookies && fetchedCookies.length > 0 && !newPassCookie) {
        setNewPassCookie(fetchedCookies[0].cookieData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAllData();
    }
  }, [isAdminAuthenticated]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === '2026' || adminPin === 'admin123') {
      setIsAdminAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('PIN de seguridad incorrecto.');
    }
  };

  const generateRandomCode = () => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    setNewPassCode(`VIP-${random}`);
  };

  // Crear Licencia con Cookie
  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!newPassCode.trim()) return;

    try {
      await createPass({
        code: newPassCode,
        durationMinutes: newPassDuration,
        assignedCookie: newPassCookie,
        description: newPassDesc
      });
      setNewPassCode('');
      setNewPassDesc('');
      await loadAllData();
    } catch (err) {
      alert("Error al crear pase: " + err.message);
    }
  };

  // Guardar Cookie en Pool
  const handleSaveCookie = async (e) => {
    e.preventDefault();
    if (!newCookieData.trim()) return;

    try {
      await saveCookieToPool({
        label: newCookieLabel || "Cuenta Netflix " + (cookiesPool.length + 1),
        cookieData: newCookieData
      });
      setNewCookieLabel('');
      setNewCookieData('');
      await loadAllData();
    } catch (err) {
      alert("Error al guardar cookie: " + err.message);
    }
  };

  // Guardar configuración del Home
  const handleSaveHomeConfig = async (e) => {
    e.preventDefault();
    try {
      await saveHomeConfig(homeConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onConfigUpdated) onConfigUpdated(homeConfig);
    } catch (err) {
      alert("Error al guardar configuración: " + err.message);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResetPass = async (code) => {
    if (window.confirm(`¿Resetear el temporizador para ${code}?`)) {
      await resetPassTimer(code);
      await loadAllData();
    }
  };

  // 1. PIN de Bloqueo
  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-[#E50914] tracking-wider uppercase">Acceso Administrador</span>
            <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white mb-1">Panel de Control Maestro</h2>
          <p className="text-xs text-zinc-400 mb-5">Ingresa el PIN para administrar licencias, cookies y precios del Home.</p>

          {authError && (
            <div className="p-2.5 mb-4 bg-red-950/60 border border-red-500/40 rounded text-red-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">PIN (Default: 2026)</label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Ingresa PIN..."
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-center tracking-widest text-lg font-mono focus:outline-none focus:border-[#E50914]"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer"
            >
              Entrar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Panel Admin Completo
  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] overflow-y-auto text-white">
      {/* Header Admin */}
      <header className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914]" />
              Panel de Administración Central
            </h1>
            <p className="text-[11px] text-zinc-400">
              Gestiona precios del Home, pases con cookies vinculadas y pool de cuentas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md font-medium transition cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-20">
        <div className="flex border-b border-zinc-800 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('passes')}
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'passes' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Licencias y Pases ({passes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'cookies' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Pool de Cookies ({cookiesPool.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('home_settings')}
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'home_settings' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Personalizar Home y Precios</span>
          </button>
        </div>

        {/* TAB 1: LICENCIAS Y PASES CON COOKIES */}
        {activeTab === 'passes' && (
          <div className="py-6 space-y-8">
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E50914]" />
                Generar Nueva Licencia con Cookie Asociada
              </h3>

              <form onSubmit={handleCreatePass} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Código de Licencia</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newPassCode}
                      onChange={(e) => setNewPassCode(e.target.value.toUpperCase())}
                      placeholder="Ej. VIP-PRUEBA2"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-[#E50914]"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1.5 rounded text-[11px] text-zinc-300 cursor-pointer"
                      title="Generar código automático"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Duración (Minutos)</label>
                  <input
                    type="number"
                    value={newPassDuration}
                    onChange={(e) => setNewPassDuration(e.target.value)}
                    min="1"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                  />
                  <span className="text-[10px] text-zinc-500">60 = 1 hora • 1440 = 24h</span>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Cookie Válida a Asignar</label>
                  <select
                    value={newPassCookie}
                    onChange={(e) => setNewPassCookie(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#E50914]"
                  >
                    {cookiesPool.length === 0 && (
                      <option value="cookie_default_verified">Cuenta Demo Activa</option>
                    )}
                    {cookiesPool.map((c) => (
                      <option key={c.id} value={c.cookieData}>
                        {c.label} ({c.cookieData.substring(0, 18)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-semibold py-2 px-4 rounded text-xs transition cursor-pointer shadow-md"
                  >
                    Crear y Activar Licencia
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Pases */}
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Licencias en el Sistema</h3>
                <span className="text-xs text-zinc-400">Total: {passes.length} licencias</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Código</th>
                      <th className="p-3.5">Duración</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5">Primer Acceso</th>
                      <th className="p-3.5">Cookie Asignada</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 font-mono">
                    {passes.map((p) => {
                      const isUsed = Boolean(p.firstUsedAt);
                      let isExpired = false;
                      if (p.firstUsedAt) {
                        const elapsed = Date.now() - p.firstUsedAt;
                        isExpired = elapsed >= (p.durationMinutes || 60) * 60 * 1000;
                      }

                      return (
                        <tr key={p.code} className="hover:bg-zinc-900/50 transition">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span>{p.code}</span>
                            <button
                              onClick={() => handleCopy(p.code)}
                              className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
                              title="Copiar código"
                            >
                              {copiedCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="p-3.5 text-zinc-300 font-sans">{p.durationMinutes || 60} min</td>
                          <td className="p-3.5 font-sans">
                            {isExpired ? (
                              <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40 text-[10px] font-semibold">
                                Expirado
                              </span>
                            ) : isUsed ? (
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40 text-[10px] font-semibold">
                                En Uso
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold">
                                Disponible / Nuevo
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-zinc-400 font-sans text-[11px]">
                            {p.firstUsedAt ? new Date(p.firstUsedAt).toLocaleTimeString() : 'Sin usar'}
                          </td>
                          <td className="p-3.5 text-zinc-500 text-[11px] truncate max-w-[140px]">
                            {p.assignedCookie ? p.assignedCookie.substring(0, 20) + "..." : "Por defecto"}
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <button
                              onClick={() => handleResetPass(p.code)}
                              className="text-[11px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded transition cursor-pointer"
                            >
                              Reiniciar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POOL DE COOKIES VALIDAS */}
        {activeTab === 'cookies' && (
          <div className="py-6 space-y-8">
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Cookie className="w-4 h-4 text-[#E50914]" />
                Añadir Cookie Válida al Pool
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Pega las cookies activas de Netflix obtenidas con Cookie-Editor. Estas se asignan internamente a cada licencia generada.
              </p>

              <form onSubmit={handleSaveCookie} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nombre o Etiqueta de la Cuenta</label>
                  <input
                    type="text"
                    value={newCookieLabel}
                    onChange={(e) => setNewCookieLabel(e.target.value)}
                    placeholder="Ej. Netflix Cuenta 1 - Ultra HD 4K"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Contenido de la Cookie (Header o JSON)</label>
                  <textarea
                    rows={4}
                    value={newCookieData}
                    onChange={(e) => setNewCookieData(e.target.value)}
                    placeholder="NetflixId=...; SecureNetflixId=... o formato JSON"
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50914] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#E50914] hover:bg-[#b80710] text-white font-semibold py-2 px-5 rounded text-xs transition cursor-pointer shadow-md"
                >
                  Guardar Cookie en Pool
                </button>
              </form>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white mb-2">Cookies Disponibles en el Pool ({cookiesPool.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cookiesPool.map((c) => (
                  <div key={c.id} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">{c.label}</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-600/30">
                        {c.status || 'Activa'}
                      </span>
                    </div>
                    <p className="text-zinc-500 font-mono text-[11px] truncate">
                      {c.cookieData}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMINISTRAR TEXTOS, PRECIOS Y WHATSAPP DEL HOME */}
        {activeTab === 'home_settings' && (
          <div className="py-6 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#E50914]" />
                    Administrar Precios y Textos del Home
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Modifica los precios y duraciones de los planes que ven los visitantes en la portada.
                  </p>
                </div>

                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
                    <Check className="w-4 h-4" /> ¡Guardado correctamente!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveHomeConfig} className="space-y-6">
                {/* Textos del Hero */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Título Principal</label>
                    <input
                      type="text"
                      value={homeConfig.heroTitle}
                      onChange={(e) => setHomeConfig({ ...homeConfig, heroTitle: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E50914]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Subtítulo Destacado</label>
                    <input
                      type="text"
                      value={homeConfig.heroSubtitle}
                      onChange={(e) => setHomeConfig({ ...homeConfig, heroSubtitle: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E50914]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Descripción del Hero</label>
                    <textarea
                      rows={2}
                      value={homeConfig.heroDescription}
                      onChange={(e) => setHomeConfig({ ...homeConfig, heroDescription: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-2.5 text-xs focus:outline-none focus:border-[#E50914] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Número de WhatsApp (con código de país)</label>
                    <input
                      type="text"
                      value={homeConfig.whatsappNumber}
                      onChange={(e) => setHomeConfig({ ...homeConfig, whatsappNumber: e.target.value })}
                      placeholder="Ej. +573001234567"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                </div>

                {/* Precios y Duraciones de los Planes */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Configuración de Planes y Tarifas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Plan Gratis */}
                    <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-lg space-y-2">
                      <p className="text-xs font-bold text-white">Plan 1: Prueba Gratuita</p>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Precio Mostrado</label>
                        <input
                          type="text"
                          value={homeConfig.planFreePrice}
                          onChange={(e) => setHomeConfig({ ...homeConfig, planFreePrice: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Texto Duración</label>
                        <input
                          type="text"
                          value={homeConfig.planFreeDuration}
                          onChange={(e) => setHomeConfig({ ...homeConfig, planFreeDuration: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Plan 24 Horas */}
                    <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-lg space-y-2">
                      <p className="text-xs font-bold text-white">Plan 2: Pase Diario 24H</p>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Precio Mostrado</label>
                        <input
                          type="text"
                          value={homeConfig.plan24hPrice}
                          onChange={(e) => setHomeConfig({ ...homeConfig, plan24hPrice: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Texto Duración</label>
                        <input
                          type="text"
                          value={homeConfig.plan24hDuration}
                          onChange={(e) => setHomeConfig({ ...homeConfig, plan24hDuration: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Plan Mensual */}
                    <div className="bg-zinc-900/60 p-4 border border-[#E50914]/50 rounded-lg space-y-2">
                      <p className="text-xs font-bold text-white">Plan 3: Membresía Mensual</p>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Precio Mostrado</label>
                        <input
                          type="text"
                          value={homeConfig.planMonthlyPrice}
                          onChange={(e) => setHomeConfig({ ...homeConfig, planMonthlyPrice: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Texto Duración</label>
                        <input
                          type="text"
                          value={homeConfig.planMonthlyDuration}
                          onChange={(e) => setHomeConfig({ ...homeConfig, planMonthlyDuration: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-6 rounded-lg text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios del Home</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
