import React, { useState } from 'react';
import { 
  ShoppingCart, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Clock, 
  QrCode, 
  Upload, 
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  Key
} from 'lucide-react';
import { createOrder, getOrderById } from '../services/authService';

export default function CheckoutModal({
  isOpen,
  onClose,
  cart: cartProp,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  cryptoWallets = {},
  onOrderCompleted,
  onGoToLogin
}) {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success' | 'lookup'
  const [selectedWalletKey, setSelectedWalletKey] = useState('usdt_trc20');
  const [internalCart, setInternalCart] = useState([]);
  
  // Cart unificado: si viene de props usamos ese, si no usamos el interno
  const cart = cartProp !== undefined ? cartProp : internalCart;
  const handleUpdateQuantity = onUpdateQuantity || ((id, qty) => {
    if (qty <= 0) setInternalCart(prev => prev.filter(i => i.id !== id));
    else setInternalCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  });
  const handleRemoveItem = onRemoveItem || ((id) => setInternalCart(prev => prev.filter(i => i.id !== id)));
  const handleClearCart = onClearCart || (() => setInternalCart([]));

  // Planes de renovación (para cuando el carrito está vacío o se llega desde NetflixViewer)
  const renewalPlans = [
    { id: 'pass_24h', title: 'Pase 24 Horas', price: '$0.99', duration: 'Acceso Completo 1 Día', durationMinutes: 1440 },
    { id: 'pass_weekly', title: 'Pase Semanal (7 Días)', price: '$2.49', duration: '7 Días de Acceso Continuo', durationMinutes: 10080 },
    { id: 'pass_biweekly', title: 'Pase Quincenal (15 Días)', price: '$3.49', duration: '15 Días de Acceso VIP', durationMinutes: 21600 },
    { id: 'monthly_vip', title: 'Membresía Mensual VIP', price: '$4.99', duration: '30 Días de Streaming Ilimitado', durationMinutes: 43200 },
  ];
  
  // Datos del cliente
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [proofNote, setProofNote] = useState('');
  
  // Estado de procesamiento
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  
  // Consulta de órdenes previas
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => {
    const rawPrice = parseFloat((item.price || "0").replace(/[^0-9.]/g, '')) || 0;
    return sum + (rawPrice * (item.quantity || 1));
  }, 0);

  const activeWallets = Object.entries(cryptoWallets || {}).filter(([_, w]) => w.enabled !== false);
  const currentWallet = cryptoWallets[selectedWalletKey] || (activeWallets[0] ? activeWallets[0][1] : {
    name: 'USDT (TRC20)',
    address: 'TYDzsxdjhGjhG67b8sd8sd8923hhjksd98',
    network: 'TRC20'
  });

  const handleCopyWallet = () => {
    if (!currentWallet?.address) return;
    navigator.clipboard.writeText(currentWallet.address);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!transactionHash.trim()) {
      alert("Por favor ingresa el Hash de Transacción (TxID) o la referencia de tu pago.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart,
        customerEmail,
        customerName,
        paymentMethod: selectedWalletKey,
        walletAddress: currentWallet.address,
        network: currentWallet.network,
        amountUsd: totalAmount.toFixed(2),
        transactionHash,
        proofNote
      });

      setCompletedOrder(order);
      handleClearCart();
      setStep('success');
      if (onOrderCompleted) onOrderCompleted(order);
    } catch (err) {
      alert("Error al registrar orden: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupOrder = async (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await getOrderById(lookupId);
      if (!res) {
        setLookupError("No se encontró ninguna orden con el código ingresado. Verifica las mayúsculas y guiones.");
      } else {
        setLookupResult(res);
      }
    } catch (err) {
      setLookupError("Error al consultar: " + err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // Generador de URL de código QR pública para la wallet
  const qrCodeUrl = currentWallet.address 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentWallet.address)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-white">
      <div className="relative w-full max-w-2xl bg-[#181818] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-[#E50914]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {step === 'cart' && "Carrito de Compras"}
                {step === 'checkout' && "Checkout Seguro USDT / Cripto"}
                {step === 'success' && "¡Pedido Recibido con Éxito!"}
                {step === 'lookup' && "Consultar Estado de mi Pedido"}
              </h2>
              <p className="text-xs text-zinc-400">
                {step === 'cart' && "Revisa tus licencias antes de pagar"}
                {step === 'checkout' && "Transfiere a nuestra billetera oficial y envía el Hash"}
                {step === 'success' && "El administrador revisará el Hash para emitir tus claves"}
                {step === 'lookup' && "Verifica la aprobación de tu orden e ingresa tu código"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step !== 'lookup' && (
              <button
                onClick={() => setStep('lookup')}
                className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                title="Consultar orden previa"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buscar mi Orden</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN STEP */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* STEP 1: CARRITO */}
          {step === 'cart' && (
            <div>
              {cart.length === 0 ? (
                <div className="py-6 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-[#E50914]" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Renueva tu Acceso VIP</h3>
                    <p className="text-xs text-zinc-400">Selecciona un plan para continuar disfrutando:</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renewalPlans.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => {
                          setInternalCart([{ ...plan, quantity: 1 }]);
                          setStep('checkout');
                        }}
                        className="w-full text-left p-4 bg-zinc-900 border border-zinc-700 hover:border-[#E50914] rounded-xl transition group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white group-hover:text-[#E50914] transition">{plan.title}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{plan.duration}</p>
                        <p className="text-lg font-black text-[#E50914] mt-2">{plan.price} <span className="text-xs text-zinc-400 font-normal">USDT</span></p>
                      </button>
                    ))}
                  </div>
                  {onGoToLogin && (
                    <p className="text-center text-xs text-zinc-500">
                      ¿Ya tienes un código? {' '}
                      <button onClick={onGoToLogin} className="text-amber-400 font-semibold cursor-pointer hover:underline">
                        Úsalo aquí
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                          <p className="text-xs text-zinc-400">{item.duration}</p>
                          <span className="text-xs font-semibold text-emerald-400">{item.price} c/u</span>
                        </div>

                        {/* Cantidad */}
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold px-1.5">{item.quantity || 1}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-white">
                            ${((parseFloat((item.price || "0").replace(/[^0-9.]/g, '')) || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-500 hover:text-red-400 text-xs transition cursor-pointer mt-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5 ml-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-400 uppercase tracking-wider block">Total a Pagar</span>
                      <span className="text-2xl font-black text-white">${totalAmount.toFixed(2)} <span className="text-xs text-emerald-400 font-semibold">USDT</span></span>
                    </div>

                    <button
                      onClick={() => setStep('checkout')}
                      className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/40 transition cursor-pointer"
                    >
                      <span>Proceder al Pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHECKOUT CON CRIPTO / USDT */}
          {step === 'checkout' && (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              
              {/* Selección de Red Cripto */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  1. Selecciona la Criptomoneda / Red de Pago:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeWallets.map(([key, wallet]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedWalletKey(key)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        selectedWalletKey === key
                          ? 'bg-red-950/40 border-[#E50914] text-white shadow-md shadow-red-950/50'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{wallet.name}</div>
                        <div className="text-[11px] text-zinc-400">Red: {wallet.network}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedWalletKey === key ? 'border-[#E50914] bg-[#E50914]' : 'border-zinc-600'
                      }`}>
                        {selectedWalletKey === key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Billetera y Código QR */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {qrCodeUrl && (
                    <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                      <img src={qrCodeUrl} alt="Wallet QR" className="w-28 h-28 object-contain" />
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold block">
                      Dirección de depósito oficial ({currentWallet.network}):
                    </span>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-amber-300 break-all select-all">
                        {currentWallet.address}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyWallet}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-2.5 py-1.5 rounded flex items-center gap-1 shrink-0 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedWallet ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Transfiere exactamente: <strong>${totalAmount.toFixed(2)} USDT</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de Confirmación y Hash */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  2. Ingresa los datos de tu transferencia:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Tu Correo Electrónico (Para recibir la licencia)</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Nombre o Alias (Opcional)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Hash de Transacción / TxID o Referencia de Pago <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Ej. 0x8a7f9c2d1e... ó ID de transferencia de Binance / Wallet"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Pega el Hash proporcionado por tu exchange (Binance, Bybit, TrustWallet, etc.) para que el admin lo valide al instante.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nota adicional o referencia (Opcional)</label>
                  <input
                    type="text"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Ej: Enviado desde cuenta Binance personal"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Volver al Carrito
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#E50914] hover:bg-[#b80710] disabled:bg-zinc-800 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/40 transition cursor-pointer"
                >
                  {submitting ? (
                    <span>Registrando Pedido...</span>
                  ) : (
                    <>
                      <span>Confirmar Pago de ${totalAmount.toFixed(2)} USDT</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* STEP 3: PEDIDO EXITOSO */}
          {step === 'success' && completedOrder && (
            <div className="py-4 space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">¡Orden Recibida con Éxito!</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Tu orden ha sido registrada. Nuestro administrador verificará la transacción en la blockchain y activará tu clave VIP.
                </p>
              </div>

              {/* Tarjeta de Código de Orden */}
              <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs text-zinc-400">Código de Orden:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-mono font-bold text-amber-400">{completedOrder.orderId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(completedOrder.orderId);
                        setCopiedTx(true);
                        setTimeout(() => setCopiedTx(false), 2000);
                      }}
                      className="text-zinc-400 hover:text-white p-1"
                      title="Copiar código de orden"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total a validar:</span>
                  <span className="font-bold text-white">${completedOrder.amountUsd} USDT</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Estado actual:</span>
                  <span className="bg-amber-950/60 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> En revisión por Admin
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 max-w-md mx-auto text-left">
                💡 <strong>¿Cómo ver mi clave?</strong> Guarda tu código de orden <code>{completedOrder.orderId}</code>. Puedes volver a abrir esta ventana y pulsar <strong>"Buscar mi Orden"</strong> en cualquier momento para obtener tus claves de licencia apenas sean aprobadas.
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setLookupId(completedOrder.orderId);
                    setStep('lookup');
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
                >
                  Consultar estado de esta Orden
                </button>
                <button
                  onClick={onClose}
                  className="bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition cursor-pointer"
                >
                  Listo, Cerrar
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BUSCAR ORDEN PREVIA */}
          {step === 'lookup' && (
            <div className="space-y-6">
              <form onSubmit={handleLookupOrder} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value.toUpperCase())}
                  placeholder="Ingresa tu ID de Orden (Ej: ORD-4920-A1B2C)"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#E50914]"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="bg-[#E50914] hover:bg-[#b80710] disabled:bg-zinc-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? 'Buscando...' : 'Consultar'}</span>
                </button>
              </form>

              {lookupError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs">
                  {lookupError}
                </div>
              )}

              {lookupResult && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">ID de Orden</span>
                      <span className="text-base font-mono font-bold text-white">{lookupResult.orderId}</span>
                    </div>

                    <div>
                      {lookupResult.status === 'approved' && (
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada
                        </span>
                      )}
                      {lookupResult.status === 'pending' && (
                        <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Pendiente de Verificación
                        </span>
                      )}
                      {lookupResult.status === 'rejected' && (
                        <span className="bg-red-950/80 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          Rechazada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Total pagado:</span>
                      <span className="font-bold text-white">${lookupResult.amountUsd} USDT</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Red de pago:</span>
                      <span className="font-bold text-white">{lookupResult.network}</span>
                    </div>
                  </div>

                  {/* Si está aprobada, mostrar las licencias generadas */}
                  {lookupResult.status === 'approved' && lookupResult.assignedLicenses?.length > 0 && (
                    <div className="bg-gradient-to-br from-red-950/40 to-black border border-[#E50914]/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Key className="w-4 h-4 text-[#E50914]" />
                        <span>¡Tu Licencia VIP está lista para usarse!</span>
                      </div>

                      <div className="space-y-2">
                        {lookupResult.assignedLicenses.map((lic, idx) => (
                          <div key={idx} className="bg-black/80 border border-zinc-700 rounded-lg p-3 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-xs text-zinc-400">{lic.planTitle}</div>
                              <code className="text-base font-mono font-bold text-amber-300 select-all">
                                {lic.code}
                              </code>
                            </div>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lic.code);
                                alert(`¡Código ${lic.code} copiado al portapapeles! Ya puedes ingresarlo en el Home.`);
                              }}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Clave</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lookupResult.status === 'pending' && (
                    <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900/50 p-3 rounded-xl">
                      El administrador está revisando tu transacción ({lookupResult.transactionHash}). Apenas confirme la recepción en la blockchain, tus códigos aparecerán aquí automáticamente.
                    </p>
                  )}

                  {lookupResult.status === 'rejected' && (
                    <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-xl">
                      Esta orden fue rechazada. Motivo: {lookupResult.rejectReason || "Transacción no localizada en la blockchain."}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer block"
              >
                ← Volver al Carrito
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
