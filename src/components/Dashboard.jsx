import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Info, 
  Lock, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Volume2,
  VolumeX,
  Plus,
  ThumbsUp,
  Check,
  X
} from 'lucide-react';
import { NETFLIX_CATEGORIES, FEATURED_HERO } from '../data/catalog';

export default function Dashboard({ 
  sessionData, 
  remainingSeconds, 
  isExpired, 
  onLogout,
  onResetTrialDemo
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [myList, setMyList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Inicio');

  // Controlar fondo oscuro de la barra al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMyList = (id) => {
    if (myList.includes(id)) {
      setMyList(myList.filter(item => item !== id));
    } else {
      setMyList([...myList, id]);
    }
  };

  const handlePlayMedia = (item) => {
    if (isExpired) {
      setShowPaymentModal(true);
      return;
    }
    setPlayingVideo(item);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-[#E50914] selection:text-white pb-24 overflow-x-hidden font-sans">
      
      {/* NAVBAR NETFLIX IDÉNTICA */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 px-4 sm:px-12 py-3.5 flex items-center justify-between ${
        isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-2xl border-b border-zinc-800/50' : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}>
        <div className="flex items-center space-x-8">
          <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#E50914] select-none cursor-pointer">
            NETFLIX
          </span>
          <div className="hidden md:flex items-center space-x-5 text-sm text-zinc-300 font-medium">
            {['Inicio', 'Series TV', 'Películas', 'Novedades populares', 'Mi lista'].map((tab) => (
              <span
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`cursor-pointer transition hover:text-zinc-300 ${activeCategory === tab ? 'text-white font-bold' : 'text-zinc-400'}`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* CONTROLES DERECHA / TEMPORIZADOR INTEGRADO DISCRETAMENTE */}
        <div className="flex items-center space-x-4">
          <button className="text-zinc-300 hover:text-white cursor-pointer hidden sm:block">
            <Search className="w-4 h-4" />
          </button>
          
          <button className="text-zinc-300 hover:text-white cursor-pointer hidden sm:block">
            <Bell className="w-4 h-4" />
          </button>

          {/* TEMPORIZADOR CON ESTÉTICA NETFLIX VIP */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider transition ${
            isExpired 
              ? 'bg-red-950/90 text-red-300 border border-red-500/50 animate-pulse' 
              : remainingSeconds < 300 
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                : 'bg-black/60 border border-zinc-700/70 text-zinc-300 backdrop-blur'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-400' : 'text-[#E50914]'}`} />
            <span className="font-bold">{formatTime(remainingSeconds)}</span>
          </div>

          {isExpired ? (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold px-3.5 py-1.5 rounded transition cursor-pointer animate-bounce shadow-lg"
            >
              Renovar
            </button>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Profile avatar"
                className="w-7 h-7 rounded object-cover border border-zinc-700"
              />
            </div>
          )}

          <button
            onClick={onLogout}
            title="Salir de la sesión"
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800/80 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* HERO BANNER CINEMATOGRÁFICO DE NETFLIX */}
      <div className="relative h-[85vh] sm:h-[90vh] w-full flex items-center px-6 sm:px-16 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{
            backgroundImage: `url('${FEATURED_HERO.backdropUrl}')`,
          }}
        />
        {/* Degradados oficiales de Netflix: viñeta oscura izquierda, arriba y abajo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/50" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141414] to-transparent" />

        {/* Contenido del Banner */}
        <div className="relative z-10 max-w-2xl space-y-4 pt-12">
          <div className="flex items-center gap-2">
            <span className="bg-[#E50914] text-white font-black text-[11px] tracking-widest px-2 py-0.5 rounded shadow">
              TOP 10
            </span>
            <span className="text-white text-xs font-bold tracking-wider uppercase drop-shadow">
              {FEATURED_HERO.badgeText}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter drop-shadow-2xl leading-none text-white">
            {FEATURED_HERO.title}
          </h1>

          <p className="text-xs font-semibold text-amber-400 tracking-wider">
            {FEATURED_HERO.seasonBadge}
          </p>

          <p className="text-sm sm:text-base text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-md font-normal">
            {FEATURED_HERO.synopsis}
          </p>

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => handlePlayMedia(FEATURED_HERO)}
              className="bg-white hover:bg-zinc-200 text-black font-bold text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded flex items-center gap-2 transition cursor-pointer shadow-xl hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Reproducir</span>
            </button>

            <button
              onClick={() => setSelectedItem(FEATURED_HERO)}
              className="bg-zinc-600/70 hover:bg-zinc-600/90 text-white font-semibold text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3 rounded flex items-center gap-2 transition cursor-pointer backdrop-blur border border-zinc-500/50"
            >
              <Info className="w-5 h-5 text-zinc-100" />
              <span>Más información</span>
            </button>
          </div>
        </div>

        {/* Botón de audio lateral tipo Netflix */}
        <div className="absolute right-6 sm:right-16 bottom-28 z-20 flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full border border-zinc-500/70 bg-black/40 backdrop-blur flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer hover:border-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="border-l-2 border-zinc-300 pl-3 py-1 bg-black/40 text-xs text-zinc-300 font-semibold uppercase tracking-wider backdrop-blur">
            16+
          </div>
        </div>
      </div>

      {/* CATÁLOGO EN FILAS HORIZONTALES (IDÉNTICO A NETFLIX) */}
      <main className="relative z-20 px-4 sm:px-12 -mt-24 sm:-mt-28 space-y-12">
        {NETFLIX_CATEGORIES.map((category) => (
          <section key={category.id} className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2 group cursor-pointer">
              <span>{category.title}</span>
              <ChevronRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>

            {/* Fila Top 10 con Números Gigantes */}
            {category.isTop10 ? (
              <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="relative flex-none flex items-center group cursor-pointer transition-transform duration-300 hover:scale-105"
                  >
                    {/* Número gigante oficial Netflix */}
                    <span 
                      className="text-8xl sm:text-9xl font-black leading-none select-none -mr-4 sm:-mr-6 z-0 text-transparent"
                      style={{
                        WebkitTextStroke: '4px #595959',
                        fontFamily: 'impact, sans-serif'
                      }}
                    >
                      {item.rank}
                    </span>

                    {/* Poster vertical */}
                    <div className="relative z-10 w-28 sm:w-36 aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-[#E50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        TOP 10
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fila estándar con tarjetas panorámicas */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group relative rounded-md overflow-hidden bg-zinc-900 border border-zinc-800/80 cursor-pointer transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl hover:border-zinc-500"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-zinc-900">
                      <img
                        src={item.backdrop}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    {/* Tarjeta hover enriquecida */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-xs font-bold text-white mb-1">{item.title}</p>
                      <div className="flex items-center gap-2 mb-2 text-[10px]">
                        <span className="text-emerald-400 font-bold">{item.match}</span>
                        <span className="border border-zinc-500 px-1 py-0.5 text-zinc-300 rounded text-[9px]">{item.age}</span>
                        <span className="text-zinc-300">{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayMedia(item);
                          }}
                          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMyList(item.id);
                          }}
                          className="w-7 h-7 rounded-full border border-zinc-400 bg-zinc-900/80 flex items-center justify-center hover:border-white transition cursor-pointer"
                        >
                          {myList.includes(item.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="w-7 h-7 rounded-full border border-zinc-400 bg-zinc-900/80 flex items-center justify-center hover:border-white transition cursor-pointer ml-auto"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* BANNER INFORMATIVO VIP */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sesión Activa - Perfil Ultra HD</p>
              <p className="text-xs text-zinc-400">Pase activo: <span className="font-mono text-zinc-300">{sessionData?.code}</span> • Límite asignado: 60 minutos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetTrialDemo}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded border border-zinc-800 transition cursor-pointer"
            >
              Reiniciar Tiempo Demo
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-xs text-white bg-[#E50914] hover:bg-[#b80710] px-4 py-1.5 rounded font-bold transition cursor-pointer shadow-md"
            >
              Adquirir Membresía Completa
            </button>
          </div>
        </div>
      </main>

      {/* MODAL DETALLADO DE SERIE/PELÍCULA (ESTILO NETFLIX ORIGINAL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#181818] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header del modal con imagen / trailer */}
            <div className="relative aspect-video w-full bg-black">
              <img
                src={selectedItem.backdrop}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/40" />
              
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer transition border border-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
                <button
                  onClick={() => handlePlayMedia(selectedItem)}
                  className="bg-white hover:bg-zinc-200 text-black font-bold px-7 py-2.5 rounded flex items-center gap-2 transition cursor-pointer shadow-xl hover:scale-105 active:scale-95 text-sm"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Reproducir</span>
                </button>

                <button
                  onClick={() => toggleMyList(selectedItem.id)}
                  className="w-10 h-10 rounded-full border border-zinc-400 bg-black/60 flex items-center justify-center hover:border-white transition cursor-pointer"
                >
                  {myList.includes(selectedItem.id) ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            {/* Ficha técnica y sinopsis */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">{selectedItem.title}</h3>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-emerald-400 font-bold">{selectedItem.match || "98% para ti"}</span>
                    <span className="border border-zinc-500 px-1.5 py-0.5 rounded text-zinc-300 font-semibold">{selectedItem.age || "16+"}</span>
                    <span className="text-zinc-300">{selectedItem.duration || "Película"}</span>
                    <span className="border border-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-400 rounded">ULTRA HD 4K</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400">
                  <span className="block"><strong className="text-zinc-200">Género:</strong> {selectedItem.genre}</span>
                  {selectedItem.cast && <span className="block mt-0.5"><strong className="text-zinc-200">Elenco:</strong> {selectedItem.cast}</span>}
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedItem.description}
              </p>

              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between text-xs text-zinc-400">
                <span>Audio y subtítulos en Español e Inglés disponibles</span>
                <span className="text-emerald-400 font-semibold">Incluido con tu pase VIP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPRODUCTOR EN PANTALLA COMPLETA */}
      {playingVideo && !isExpired && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-white hover:text-zinc-300 p-2 rounded-full hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <div>
                <h4 className="font-bold text-white text-base">{playingVideo.title}</h4>
                <p className="text-xs text-zinc-400">{playingVideo.genre || "Transmisión en Ultra HD"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-black/60 px-3 py-1.5 rounded-full border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Tiempo de pase: {formatTime(remainingSeconds)}</span>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center bg-black">
            <video
              controls
              autoPlay
              className="w-full h-full max-h-[85vh] object-contain"
              src={playingVideo.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
            />
          </div>

          <div className="p-3 bg-gradient-to-t from-black/80 to-transparent text-center text-xs text-zinc-400">
            <span>Reproducción activa bajo token de sesión seguro</span>
          </div>
        </div>
      )}

      {/* OVERLAY DE BLOQUEO POR TIEMPO EXPIRADO */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/94 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#181818] border border-red-900/60 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-950/70 border border-[#E50914] rounded-full flex items-center justify-center mx-auto mb-5 text-[#E50914]">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              Tu hora de prueba gratuita ha expirado
            </h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              El tiempo de tu pase temporal de 60 minutos ha finalizado. Realiza el pago para continuar disfrutando de todas las series y películas sin límite.
            </p>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-3.5 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Pase utilizado:</span>
                <span className="font-semibold text-white font-mono">{sessionData?.code}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tiempo consumido:</span>
                <span className="font-semibold text-white">60 minutos (100%)</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-red-900/40 cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pagar Suscripción Ahora ($3.99 / mes)</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 px-4 rounded-lg text-xs transition cursor-pointer"
              >
                Ingresar otro pase de acceso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHECKOUT / PAGO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#181818] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-950/70 border border-[#E50914] rounded-full flex items-center justify-center mx-auto mb-3 text-[#E50914]">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Adquiere Acceso Completo</h3>
              <p className="text-xs text-zinc-400 mt-1">Elige tu plan y renueva tu acceso de inmediato.</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-zinc-900 border border-[#E50914] rounded-lg flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-xs text-white">Pase Diario 24H</p>
                  <p className="text-[11px] text-zinc-400">Acceso VIP 1 día completo</p>
                </div>
                <span className="font-bold text-sm text-[#E50914]">$1.99 USD</span>
              </div>

              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between cursor-pointer hover:border-zinc-700">
                <div>
                  <p className="font-semibold text-xs text-white">Membresía Mensual</p>
                  <p className="text-[11px] text-zinc-400">Acceso ilimitado 30 días</p>
                </div>
                <span className="font-bold text-sm text-zinc-300">$3.99 USD</span>
              </div>
            </div>

            <a
              href="https://stripe.com" 
              target="_blank" 
              rel="noreferrer"
              className="block w-full text-center bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-3 px-4 rounded-lg text-sm transition shadow-lg cursor-pointer"
            >
              Proceder al Pago Seguro
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
