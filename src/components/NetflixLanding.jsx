import React, { useState } from 'react';
import { 
  ChevronRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Flame, 
  Zap, 
  ArrowRight, 
  Plus, 
  Minus, 
  MessageCircle, 
  ShoppingCart, 
  Search, 
  Check 
} from 'lucide-react';
import { DEFAULT_HOME_CONFIG } from '../services/authService';
import CheckoutModal from './CheckoutModal';

export default function NetflixLanding({ onGoToLogin, homeConfig = DEFAULT_HOME_CONFIG }) {
  const [openFaq, setOpenFaq] = useState(null);
  
  // Estado del Carrito y Modal de Checkout
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(null);

  const config = { ...DEFAULT_HOME_CONFIG, ...homeConfig };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Funciones del Carrito
  const addToCart = (plan) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === plan.id);
      if (existing) {
        return prev.map(item => item.id === plan.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
      }
      return [...prev, { ...plan, quantity: 1 }];
    });
    setAddedAnimation(plan.id);
    setTimeout(() => setAddedAnimation(null), 1500);
    setIsCheckoutOpen(true);
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const pricingPlans = [
    {
      id: "free_trial",
      title: "Prueba Gratuita VIP",
      price: config.planFreePrice || "$0.00",
      duration: config.planFreeDuration || "60 Minutos de Acceso",
      durationMinutes: 60,
      badge: "100% GRATIS",
      featured: false,
      isFree: true,
      features: [
        "Catálogo completo en Ultra HD 4K",
        "Sin tarjeta de crédito requerida",
        "Activación instantánea por código",
        "1 dispositivo simultáneo",
        "Soporte rápido en línea"
      ],
      buttonText: "Activar Prueba Gratis",
      action: () => onGoToLogin('VIP-PRUEBA')
    },
    {
      id: "pass_24h",
      title: "Pase 24 Horas",
      price: config.plan24hPrice || "$0.99",
      duration: config.plan24hDuration || "Acceso Completo 1 Día",
      durationMinutes: 1440,
      badge: "IDEAL PARA MARATÓN",
      featured: false,
      isFree: false,
      features: [
        "24 horas continuas sin interrupción",
        "Cuentas oficiales verificadas",
        "Streaming en máxima calidad (4K HDR)",
        "Acceso directo sin claves complejas",
        "Garantía de reposición inmediata"
      ],
      buttonText: "Añadir al Carrito",
      action: () => addToCart({
        id: "pass_24h",
        title: "Pase 24 Horas",
        price: config.plan24hPrice || "$0.99",
        duration: config.plan24hDuration || "Acceso Completo 1 Día",
        durationMinutes: 1440
      })
    },
    {
      id: "pass_weekly",
      title: "Pase Semanal (7 Días)",
      price: config.planWeeklyPrice || "$2.49",
      duration: config.planWeeklyDuration || "7 Días de Acceso Continuo",
      durationMinutes: 10080,
      badge: "POPULAR SEMANAL",
      featured: false,
      isFree: false,
      features: [
        "7 días seguidos de series y estrenos",
        "Calidad 4K Ultra HD garantizada",
        "Multiplataforma (TV, Móvil, PC)",
        "Soporte continuo y reposición activa",
        "Sin compromisos ni cargos ocultos"
      ],
      buttonText: "Añadir al Carrito",
      action: () => addToCart({
        id: "pass_weekly",
        title: "Pase Semanal (7 Días)",
        price: config.planWeeklyPrice || "$2.49",
        duration: config.planWeeklyDuration || "7 Días de Acceso Continuo",
        durationMinutes: 10080
      })
    },
    {
      id: "pass_biweekly",
      title: "Pase Quincenal (15 Días)",
      price: config.planBiweeklyPrice || "$3.49",
      duration: config.planBiweeklyDuration || "15 Días de Acceso VIP",
      durationMinutes: 21600,
      badge: "EXCELENTE VALOR",
      featured: false,
      isFree: false,
      features: [
        "Medio mes completo de entretenimiento",
        "Perfiles dedicados de alta estabilidad",
        "Soporte técnico prioritario 24/7",
        "Ahorro de más del 70% frente a la tarifa oficial",
        "Entrega inmediata del código"
      ],
      buttonText: "Añadir al Carrito",
      action: () => addToCart({
        id: "pass_biweekly",
        title: "Pase Quincenal (15 Días)",
        price: config.planBiweeklyPrice || "$3.49",
        duration: config.planBiweeklyDuration || "15 Días de Acceso VIP",
        durationMinutes: 21600
      })
    },
    {
      id: "monthly_vip",
      title: "Membresía Mensual VIP",
      price: config.planMonthlyPrice || "$4.99",
      duration: config.planMonthlyDuration || "30 Días de Streaming Ilimitado",
      durationMinutes: 43200,
      badge: "MÁS POPULAR • 80% AHORRO",
      featured: true,
      isFree: false,
      features: [
        "Ahorra hasta un 80% frente al precio estándar",
        "Perfil privado dedicado y seguro",
        "Disfruta en TV, Smart, PC y Móvil",
        "Descarga de contenido offline",
        "Soporte y renovación garantizada los 30 días"
      ],
      buttonText: "Comprar Membresía",
      action: () => addToCart({
        id: "monthly_vip",
        title: "Membresía Mensual VIP",
        price: config.planMonthlyPrice || "$4.99",
        duration: config.planMonthlyDuration || "30 Días de Streaming Ilimitado",
        durationMinutes: 43200
      })
    }
  ];

  const faqs = [
    {
      q: "¿Cómo funciona el acceso a cuentas de bajo costo?",
      a: "Proveemos acceso directo y verificado a cuentas premium a una fracción del costo habitual. Te entregamos un código de licencia que activa tu sesión de manera inmediata en nuestro portal sin necesidad de configurar datos personales."
    },
    {
      q: "¿Realmente puedo probarlo gratis?",
      a: "Sí. Usa el código de prueba VIP-PRUEBA para disfrutar de 60 minutos con acceso total al catálogo y probar la velocidad, la calidad 4K y la estabilidad del servicio antes de adquirir cualquier pase."
    },
    {
      q: "¿En qué dispositivos puedo ver el contenido?",
      a: "El servicio es compatible con Smart TV, computadoras (Chrome, Edge, Safari), teléfonos móviles (Android / iOS) y tablets a través de nuestro portal web adaptado."
    },
    {
      q: "¿Qué medios de pago aceptan?",
      a: "Aceptamos transferencias locales, tarjetas y billeteras digitales. Puedes contactarnos por WhatsApp o chat directo para obtener tu licencia al instante."
    }
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* SECCIÓN HERO DINÁMICA */}
      <div className="relative min-h-[92vh] flex flex-col justify-between border-b-8 border-zinc-800 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/85 to-black/80 pointer-events-none" />

        {/* HEADER */}
        <header className="relative z-20 px-6 sm:px-12 md:px-16 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-[#E50914] select-none">
              NETFLIX
            </span>
            <span className="hidden sm:inline-block bg-zinc-900/90 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded border border-amber-500/40 uppercase tracking-wider">
              Acceso VIP Económico
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón Carrito */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="relative p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white transition cursor-pointer flex items-center gap-2 px-3"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Carrito</span>
              {totalCartCount > 0 && (
                <span className="bg-[#E50914] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onGoToLogin('VIP-PRUEBA')}
              className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 px-3.5 py-1.5 rounded transition cursor-pointer font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Probar Acceso VIP Gratis</span>
            </button>

            <button
              onClick={() => onGoToLogin()}
              className="bg-[#E50914] hover:bg-[#b80710] text-white text-sm font-semibold px-4 sm:px-5 py-1.5 rounded transition cursor-pointer shadow-lg shadow-red-900/40"
            >
              Ingresar con Licencia
            </button>
          </div>
        </header>

        {/* HERO CONTENT VINCULADO AL ADMIN */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto py-12">
          
          <div className="inline-flex items-center gap-2 bg-red-950/80 border border-[#E50914]/60 px-4 py-1.5 rounded-full text-xs font-semibold text-red-200 mb-6 backdrop-blur shadow-lg">
            <Flame className="w-4 h-4 text-[#E50914]" />
            <span>Streaming Premium a precio accesible • 100% Cuentas Verificadas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4 drop-shadow-lg">
            {config.heroTitle} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#E50914]">
              {config.heroSubtitle}
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-300 mb-3 max-w-2xl leading-relaxed">
            {config.heroDescription}
          </p>

          {/* Botones de Acción Hero (El ingreso de licencia se hace exclusivamente en el Login) */}
          <div className="w-full max-w-md flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
            <button
              onClick={() => onGoToLogin()}
              className="w-full sm:w-auto bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-base px-8 py-4 rounded-xl flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xl shadow-red-900/50 hover:scale-105 active:scale-95"
            >
              <span>Ingresar con Licencia</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full sm:w-auto bg-zinc-900/90 hover:bg-zinc-800 text-white font-semibold text-sm px-6 py-4 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition cursor-pointer hover:border-zinc-500"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Comprar Acceso</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sin suscripción forzosa
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Calidad 4K Ultra HD
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Entrega inmediata
            </span>
          </div>
        </div>

        <div className="relative z-20 pb-4 text-center text-xs text-zinc-500">
          Desliza hacia abajo para conocer nuestros planes y tarifas de bajo costo ↓
        </div>
      </div>

      {/* PLANES Y TARIFAS DINÁMICOS */}
      <section className="border-b-8 border-zinc-800 py-16 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#E50914]">
            Precios y Disponibilidad
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Elige la duración de tu acceso
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Disfruta de cuentas garantizadas sin pagar el precio oficial completo. Todo gestionado con máxima rapidez y soporte 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 ${
                plan.featured 
                  ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-[#E50914] shadow-2xl shadow-red-950/50 scale-105 z-10' 
                  : 'bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                  plan.featured ? 'bg-[#E50914] text-white' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{plan.title}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-zinc-400">USD</span>
                </div>
                <p className="text-xs text-amber-400 font-semibold mb-6 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {plan.duration}
                </p>

                <div className="space-y-3 border-t border-zinc-800/80 pt-5 mb-8 text-xs text-zinc-300">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={plan.action}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  plan.featured 
                    ? 'bg-[#E50914] hover:bg-[#b80710] text-white shadow-red-900/40' 
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN BENEFICIOS */}
      <section className="border-b-8 border-zinc-800 py-16 px-6 sm:px-16 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3">
            <div className="w-12 h-12 bg-red-950/70 border border-[#E50914]/40 rounded-lg flex items-center justify-center text-[#E50914] mx-auto md:mx-0">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Activación al Instante</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sin trámites ni configuraciones engorrosas. Recibe tu código de licencia y comienza a ver tu contenido en segundos.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3">
            <div className="w-12 h-12 bg-emerald-950/70 border border-emerald-500/40 rounded-lg flex items-center justify-center text-emerald-400 mx-auto md:mx-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Ahorro Extremo de hasta 80%</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paga únicamente por el tiempo que realmente vas a usar: desde 1 hora gratis, pases de 24 horas hasta planes de 30 días.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3">
            <div className="w-12 h-12 bg-amber-950/70 border border-amber-500/40 rounded-lg flex items-center justify-center text-amber-400 mx-auto md:mx-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Cuentas Estables Garantizadas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mantenemos servidores y cuentas verificadas constantemente para evitar interrupciones o caídas de reproducción.
            </p>
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES (FAQ) */}
      <section className="border-b-8 border-zinc-800 py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-8">
          Preguntas frecuentes
        </h2>

        <div className="space-y-2 mb-10">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-zinc-900/90 hover:bg-zinc-800/90 transition border border-zinc-800 rounded">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-semibold text-base sm:text-lg flex items-center justify-between cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <Minus className="w-5 h-5 text-zinc-300 shrink-0" /> : <Plus className="w-5 h-5 text-zinc-300 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 sm:p-5 border-t border-zinc-800 text-zinc-300 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA FINAL */}
        <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-4">
          <h3 className="text-xl font-bold text-white">¿Listo para comenzar a ver?</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Activa ahora tu hora de prueba gratuita con la clave <strong>VIP-PRUEBA</strong> o adquiere tu membresía de manera inmediata con USDT/Cripto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onGoToLogin('VIP-PRUEBA')}
              className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg shadow-red-900/40 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>Entrar con Clave VIP-PRUEBA</span>
            </button>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer border border-zinc-700 w-full sm:w-auto justify-center"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Comprar con USDT / Cripto</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 sm:px-16 text-zinc-500 text-xs max-w-6xl mx-auto space-y-4 text-center sm:text-left">
        <p>Plataforma de streaming y distribución de accesos temporales © 2026</p>
        <p className="text-[11px] text-zinc-600">
          Servicio independiente de gestión y distribución de licencias de entretenimiento digital.
        </p>
      </footer>

      {/* BOTÓN FLOTANTE INFERIOR DERECHO DE CARRITO */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-[#E50914] hover:bg-[#b80710] text-white px-5 py-3 rounded-full font-bold shadow-2xl shadow-red-950 flex items-center gap-2.5 cursor-pointer border-2 border-red-500"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm">Ver Carrito ({totalCartCount})</span>
          </button>
        </div>
      )}

      {/* MODAL DE CHECKOUT Y CARRITO */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        cryptoWallets={config.cryptoWallets}
        onOrderCompleted={(order) => {
          // Si el usuario quiere continuar viendo el estado
          console.log("Orden completada:", order);
        }}
      />
    </div>
  );
}

