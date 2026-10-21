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
  Tv,
  Edit2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { 
  getAllPasses, 
  createPass, 
  updatePassCookie,
  getCookiePool, 
  saveCookieToPool, 
  resetPassTimer,
  getHomeConfig,
  saveHomeConfig,
  DEFAULT_HOME_CONFIG,
  getAllOrders,
  approveOrder,
  rejectOrder
} from '../services/authService';

export default function AdminPanel({ onClose, onConfigUpdated }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'passes' | 'cookies' | 'home_settings'
  const [passes, setPasses] = useState([]);
  const [cookiesPool, setCookiesPool] = useState([]);
  const [orders, setOrders] = useState([]);
  const [homeConfig, setHomeConfig] = useState(DEFAULT_HOME_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Formulario Nuevo Pase / Licencia
  const [newPassCode, setNewPassCode] = useState('');
  const [newPassDuration, setNewPassDuration] = useState(60);
  const [newPassCookie, setNewPassCookie] = useState('');
  const [newPassDesc, setNewPassDesc] = useState('');

  // Formulario Nueva Cookie
  const [newCookieLabel, setNewCookieLabel] = useState('');
  const [newCookieData, setNewCookieData] = useState('');

  // Edición directa de Cookie por Pase — estilo Cookie Editor
  const [editingPass, setEditingPass] = useState(null);
  const [editCookieText, setEditCookieText] = useState('');
  const [cookieRows, setCookieRows] = useState([]);
  const [cookieEditorTab, setCookieEditorTab] = useState('fields'); // 'fields' | 'json' | 'raw'

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [fetchedPasses, fetchedCookies, fetchedConfig, fetchedOrders] = await Promise.all([
        getAllPasses(),
        getCookiePool(),
        getHomeConfig(),
        getAllOrders()
      ]);
      setPasses(fetchedPasses || []);
      setCookiesPool(fetchedCookies || []);
      setHomeConfig(fetchedConfig || DEFAULT_HOME_CONFIG);
      setOrders(fetchedOrders || []);

      if (fetchedCookies && fetchedCookies.length > 0 && !newPassCookie) {
        setNewPassCookie(fetchedCookies[0].cookieData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    if (!confirm(`¿Confirmas que verificaste el pago de la orden ${orderId} en la blockchain y deseas emitir las licencias?`)) {
      return;
    }
    setProcessingOrderId(orderId);
    try {
      await approveOrder(orderId, "Aprobado manualmente desde el panel de control.");
      await loadAllData();
      alert(`¡Orden ${orderId} aprobada con éxito! Las licencias VIP fueron generadas.`);
    } catch (err) {
      alert("Error al aprobar orden: " + err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = prompt("Ingresa el motivo de rechazo (Ej. Hash inválido o monto no recibido):", "No se detectó la transferencia con el Hash proporcionado.");
    if (reason === null) return;

    setProcessingOrderId(orderId);
    try {
      await rejectOrder(orderId, reason);
      await loadAllData();
    } catch (err) {
      alert("Error al rechazar orden: " + err.message);
    } finally {
      setProcessingOrderId(null);
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

  // Detectar y parsear cookie string en cualquier formato → filas [{name, value, domain, path, secure}]
  const parseCookieString = (str) => {
    if (!str || !str.trim()) return [];
    const trimmed = str.trim();

    // ── Formato Netscape/TSV (exportado por Cookie-Editor extensión) ──
    // Columnas: domain \t subdomains \t path \t secure \t expiry \t NAME \t VALUE
    if (trimmed.includes('\t')) {
      return trimmed
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
          const parts = line.split('\t');
          if (parts.length >= 7) {
            return {
              name: parts[5]?.trim() || '',
              value: parts[6]?.trim() || '',
              domain: parts[0]?.trim() || '.netflix.com',
              path: parts[2]?.trim() || '/',
              secure: parts[3]?.trim() === 'TRUE'
            };
          }
          return null;
        })
        .filter(r => r && r.name);
    }

    // ── Formato JSON array (Cookie-Editor → Export JSON) ──
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(c => ({
          name: c.name || '',
          value: c.value || '',
          domain: c.domain || '.netflix.com',
          path: c.path || '/',
          secure: c.secure !== false
        })).filter(r => r.name);
      }
    } catch { /* no es JSON */ }

    // ── Formato clásico: nombre=valor; nombre=valor ──
    return str.split(';').map(part => {
      const idx = part.indexOf('=');
      if (idx === -1) return { name: part.trim(), value: '', domain: '.netflix.com', path: '/', secure: true };
      return { name: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim(), domain: '.netflix.com', path: '/', secure: true };
    }).filter(r => r.name);
  };

  // Serializar filas → JSON array (para guardar con metadata completa)
  const serializeCookieRows = (rows) => {
    const valid = rows.filter(r => r.name && r.name.trim());
    if (valid.length === 0) return '';
    return JSON.stringify(valid.map(r => ({
      name: r.name.trim(),
      value: r.value || '',
      domain: r.domain || '.netflix.com',
      path: r.path || '/',
      secure: r.secure !== false,
      httpOnly: false,
      sameSite: 'None'
    })));
  };

  // Preview legible para mostrar en la UI (no se guarda así)
  const previewCookieRows = (rows) =>
    rows.filter(r => r.name && r.name.trim()).map(r => `${r.name.trim()}=${r.value}`).join('; ');

  const handleOpenEditCookie = (pass) => {
    setEditingPass(pass);
    const raw = pass.assignedCookie || '';
    setEditCookieText(raw);
    // Intentar parsear como JSON array primero
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCookieRows(parsed.map(c => ({ name: c.name || '', value: c.value || '' })));
      } else {
        setCookieRows(parseCookieString(raw));
      }
    } catch {
      setCookieRows(parseCookieString(raw));
    }
    setCookieEditorTab('fields');
  };

  const handleSaveEditCookie = async (e) => {
    e.preventDefault();
    if (!editingPass) return;
    let finalCookie = '';
    
    if (cookieEditorTab === 'fields') {
      // Serializar filas como JSON con metadata completa
      finalCookie = serializeCookieRows(cookieRows);
    } else if (cookieEditorTab === 'json') {
      // Ya es JSON — validar y normalizar
      try {
        const arr = JSON.parse(editCookieText);
        if (Array.isArray(arr)) {
          finalCookie = JSON.stringify(arr.map(c => ({
            name: c.name, value: c.value,
            domain: c.domain || '.netflix.com',
            path: c.path || '/',
            secure: c.secure !== false,
            httpOnly: false, sameSite: 'None'
          })));
        } else {
          finalCookie = editCookieText.trim();
        }
      } catch { finalCookie = editCookieText.trim(); }
    } else {
      // Raw — parsear primero con el parser universal y serializar como JSON
      const rows = parseCookieString(editCookieText);
      finalCookie = rows.length > 0 ? serializeCookieRows(rows) : editCookieText.trim();
    }
    try {
      await updatePassCookie(editingPass.code, finalCookie);
      setEditingPass(null);
      setEditCookieText('');
      setCookieRows([]);
      await loadAllData();
    } catch (err) {
      alert('Error al actualizar la cookie: ' + err.message);
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
        <div className="flex border-b border-zinc-800 space-x-6 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'orders' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span>Órdenes y Pagos ({orders.length})</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('passes')}
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 shrink-0 ${
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
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 shrink-0 ${
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
            className={`pb-3 flex items-center gap-2 font-semibold transition cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'home_settings' 
                ? 'border-[#E50914] text-white' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Personalizar Home, Precios y Wallets</span>
          </button>
        </div>

        {/* TAB 0: ÓRDENES Y PAGOS CRIPTO / USDT */}
        {activeTab === 'orders' && (
          <div className="py-6 space-y-6">
            
            {/* Header y Filtros de Órdenes */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#E50914]" />
                  <span>Verificación de Pagos y Emisión de Licencias</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Revisa el Hash de la transacción en blockchain. Al hacer clic en <strong>"Aprobar"</strong> se generarán automáticamente las claves VIP para el usuario.
                </p>
              </div>

              {/* Filtro de Estado */}
              <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-semibold">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'approved', label: 'Aprobadas' },
                  { id: 'rejected', label: 'Rechazadas' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      orderFilter === f.id
                        ? 'bg-[#E50914] text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Órdenes */}
            {orders.filter(o => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
              <div className="py-16 text-center bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm text-zinc-400">No se encontraron órdenes en esta sección.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter(o => orderFilter === 'all' || o.status === orderFilter)
                  .map((order) => (
                    <div
                      key={order.id || order.orderId}
                      className={`border rounded-xl p-5 transition bg-zinc-950/90 ${
                        order.status === 'pending'
                          ? 'border-amber-500/50 shadow-lg shadow-amber-950/20'
                          : order.status === 'approved'
                          ? 'border-emerald-500/40'
                          : 'border-zinc-800 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-mono font-black text-white">{order.orderId || order.id}</span>
                            
                            {order.status === 'pending' && (
                              <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" /> Pendiente de Verificación
                              </span>
                            )}
                            {order.status === 'approved' && (
                              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Aprobada y Entregada
                              </span>
                            )}
                            {order.status === 'rejected' && (
                              <span className="bg-red-950/80 text-red-300 border border-red-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Rechazada
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span>Cliente: <strong className="text-zinc-200">{order.customerEmail || 'No especificado'}</strong></span>
                            {order.customerName && <span>({order.customerName})</span>}
                            <span>•</span>
                            <span>Fecha: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>

                        {/* Monto Total */}
                        <div className="text-left lg:text-right">
                          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Monto a Verificar</span>
                          <span className="text-2xl font-black text-white">
                            ${order.amountUsd} <span className="text-xs text-emerald-400">USDT</span>
                          </span>
                          <span className="block text-[11px] text-zinc-400 font-mono">Red: {order.network || 'TRC20'}</span>
                        </div>
                      </div>

                      {/* Detalles del Pago e Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                        
                        {/* Datos de la Transferencia / Hash */}
                        <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800 space-y-2">
                          <span className="font-semibold text-zinc-300 uppercase tracking-wider block text-[11px]">
                            Datos de Transacción Blockchain:
                          </span>
                          
                          <div>
                            <span className="text-zinc-400">Hash / TxID proporcionado:</span>
                            <div className="flex items-center gap-1.5 mt-1 bg-black/60 p-2 rounded border border-zinc-700">
                              <code className="text-[11px] font-mono text-amber-300 break-all select-all flex-1">
                                {order.transactionHash || 'No ingresado'}
                              </code>
                              {order.transactionHash && (
                                <button
                                  onClick={() => handleCopy(order.transactionHash)}
                                  className="text-zinc-400 hover:text-white p-1"
                                  title="Copiar Hash"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {order.proofNote && (
                            <p className="text-zinc-400 italic">
                              Nota del cliente: "{order.proofNote}"
                            </p>
                          )}
                        </div>

                        {/* Items Comprados */}
                        <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800 space-y-2">
                          <span className="font-semibold text-zinc-300 uppercase tracking-wider block text-[11px]">
                            Licencias Solicitadas:
                          </span>
                          <ul className="space-y-1.5">
                            {(order.items || []).map((it, idx) => (
                              <li key={idx} className="flex items-center justify-between bg-black/40 p-2 rounded">
                                <span className="font-bold text-white">{it.title} x {it.quantity || 1}</span>
                                <span className="text-emerald-400 font-mono">{it.price}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Licencias asignadas si ya está aprobada */}
                          {order.status === 'approved' && order.assignedLicenses?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-zinc-800">
                              <span className="text-[11px] text-emerald-400 font-semibold block mb-1">
                                Claves VIP generadas para el cliente:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {order.assignedLicenses.map((lic, lIdx) => (
                                  <code key={lIdx} className="bg-red-950 border border-red-500/40 text-white font-mono px-2 py-0.5 rounded text-xs">
                                    {lic.code}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}

                          {order.status === 'rejected' && (
                            <p className="text-red-400 italic">
                              Motivo de rechazo: {order.rejectReason || 'No especificado'}
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Botones de Acción Admin */}
                      {order.status === 'pending' && (
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                          <button
                            onClick={() => handleRejectOrder(order.id || order.orderId)}
                            disabled={processingOrderId === (order.id || order.orderId)}
                            className="bg-zinc-800 hover:bg-red-950 hover:text-red-300 hover:border-red-500/40 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Rechazar Pago
                          </button>

                          <button
                            onClick={() => handleApproveOrder(order.id || order.orderId)}
                            disabled={processingOrderId === (order.id || order.orderId)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-950 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{processingOrderId === (order.id || order.orderId) ? 'Procesando...' : 'Aprobar Pago y Emitir Licencias VIP'}</span>
                          </button>
                        </div>
                      )}

                    </div>
                  ))}
              </div>
            )}

          </div>
        )}

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
                          <td className="p-3.5 text-right font-sans space-x-1.5">
                            <button
                              onClick={() => handleOpenEditCookie(p)}
                              className="text-[11px] text-amber-300 hover:text-white bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/50 px-2.5 py-1 rounded transition cursor-pointer inline-flex items-center gap-1"
                              title="Editar cookie asignada a este usuario"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Cookie</span>
                            </button>
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

                {/* Configuración de Billeteras USDT y Cripto */}
                <div className="border-t border-zinc-800 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Direcciones de Billetera para Cobro (USDT / Cripto)</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Estas direcciones son las que se le mostrarán al cliente con código QR en el carrito de compras.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* USDT TRC20 */}
                    <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">USDT (Red TRC20 - Tron)</span>
                        <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/40">Recomendado</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Dirección de depósito:</label>
                        <input
                          type="text"
                          value={homeConfig.cryptoWallets?.usdt_trc20?.address || ''}
                          onChange={(e) => setHomeConfig({
                            ...homeConfig,
                            cryptoWallets: {
                              ...homeConfig.cryptoWallets,
                              usdt_trc20: {
                                ...(homeConfig.cryptoWallets?.usdt_trc20 || { name: 'USDT (TRC20)', network: 'TRC20', enabled: true }),
                                address: e.target.value
                              }
                            }
                          })}
                          placeholder="Ej. TYDzsxdjhGjhG67b8sd8sd8923hhjksd98..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-[#E50914]"
                        />
                      </div>
                    </div>

                    {/* USDT BEP20 */}
                    <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">USDT (Red BEP20 - BSC)</span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">Bajas comisiones</span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400">Dirección de depósito:</label>
                        <input
                          type="text"
                          value={homeConfig.cryptoWallets?.usdt_bep20?.address || ''}
                          onChange={(e) => setHomeConfig({
                            ...homeConfig,
                            cryptoWallets: {
                              ...homeConfig.cryptoWallets,
                              usdt_bep20: {
                                ...(homeConfig.cryptoWallets?.usdt_bep20 || { name: 'USDT (BEP20)', network: 'BEP20 (BSC)', enabled: true }),
                                address: e.target.value
                              }
                            }
                          })}
                          placeholder="Ej. 0x71c89320e4d0b134f593b4f6e2fba6429d3c52a1..."
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-[#E50914]"
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

      {/* ═══ COOKIE EDITOR — estilo Cookie Editor Extension ═══ */}
      {editingPass && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
          <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl my-4">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Cookie className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Cookie Editor</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Licencia: <span className="text-[#E50914]">{editingPass.code}</span></p>
                </div>
              </div>
              <button onClick={() => setEditingPass(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-zinc-900 p-1 rounded-lg">
                {[['fields', '⚙ Campos'], ['json', '{ } JSON'], ['raw', '≡ Raw']].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      // Sync data between tabs
                      if (tab === 'json' && cookieEditorTab === 'fields') {
                        const jsonArr = cookieRows.filter(r => r.name).map(r => ({ name: r.name, value: r.value, domain: '.netflix.com', path: '/', secure: true, httpOnly: true }));
                        setEditCookieText(JSON.stringify(jsonArr, null, 2));
                      } else if (tab === 'raw' && cookieEditorTab === 'fields') {
                        setEditCookieText(serializeCookieRows(cookieRows));
                      } else if (tab === 'fields' && cookieEditorTab !== 'fields') {
                        try {
                          const parsed = JSON.parse(editCookieText);
                          if (Array.isArray(parsed)) setCookieRows(parsed.map(c => ({ name: c.name || '', value: c.value || '' })));
                          else setCookieRows(parseCookieString(editCookieText));
                        } catch { setCookieRows(parseCookieString(editCookieText)); }
                      }
                      setCookieEditorTab(tab);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      cookieEditorTab === tab ? 'bg-[#E50914] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Seleccionar del Pool */}
              <div className="mb-4 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <label className="block text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">⚡ Cargar desde Pool de Cuentas</label>
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const raw = e.target.value;
                    try {
                      const arr = JSON.parse(raw);
                      if (Array.isArray(arr)) { setCookieRows(arr.map(c => ({ name: c.name || '', value: c.value || '' }))); setEditCookieText(raw); }
                      else { setCookieRows(parseCookieString(raw)); setEditCookieText(raw); }
                    } catch { setCookieRows(parseCookieString(raw)); setEditCookieText(raw); }
                  }}
                  defaultValue=""
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#E50914]"
                >
                  <option value="" disabled>-- Seleccionar cuenta activa del pool --</option>
                  {cookiesPool.map((c) => (
                    <option key={c.id} value={c.cookieData}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* ── MODO CAMPOS (estilo Cookie Editor) ── */}
              {cookieEditorTab === 'fields' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold px-1">
                    <span>Nombre</span><span>Valor</span><span></span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cookieRows.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => { const r = [...cookieRows]; r[i] = { ...r[i], name: e.target.value }; setCookieRows(r); }}
                          placeholder="Nombre"
                          className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50914] w-full"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => { const r = [...cookieRows]; r[i] = { ...r[i], value: e.target.value }; setCookieRows(r); }}
                          placeholder="Valor"
                          className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50914] w-full"
                        />
                        <button
                          type="button"
                          onClick={() => setCookieRows(cookieRows.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-300 cursor-pointer p-1"
                          title="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCookieRows([...cookieRows, { name: '', value: '' }])}
                    className="w-full border border-dashed border-zinc-700 hover:border-amber-500/60 text-zinc-500 hover:text-amber-400 text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Cookie
                  </button>

                  {/* Preview */}
                  {cookieRows.filter(r => r.name).length > 0 && (
                    <div className="mt-2 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Vista previa del string final:</p>
                      <p className="text-[11px] font-mono text-zinc-300 break-all">{serializeCookieRows(cookieRows)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── MODO JSON ── */}
              {cookieEditorTab === 'json' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-400">Pega el JSON exportado por <strong className="text-white">Cookie Editor</strong> (formato array de objetos).</p>
                  <textarea
                    rows={10}
                    value={editCookieText}
                    onChange={(e) => setEditCookieText(e.target.value)}
                    placeholder={`[\n  {\n    "name": "NetflixId",\n    "value": "v%3D2%26...",\n    "domain": ".netflix.com",\n    "path": "/",\n    "secure": true\n  }\n]`}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-[#E50914] resize-none"
                  />
                </div>
              )}

              {/* ── MODO RAW ── */}
              {cookieEditorTab === 'raw' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-400">Pega el header de cookie en formato clásico <code className="text-amber-300">Nombre=Valor; ...</code></p>
                  <textarea
                    rows={6}
                    value={editCookieText}
                    onChange={(e) => setEditCookieText(e.target.value)}
                    placeholder="NetflixId=v%3D2%26ct%3DBQAOAA...; SecureNetflixId=v%3D2%26mac%3DAQ..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-[#E50914] resize-none"
                  />
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingPass(null)}
                  className="px-4 py-2 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditCookie}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white cursor-pointer transition shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cookie VIP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
