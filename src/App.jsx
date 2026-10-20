import React, { useState, useEffect } from 'react';
import NetflixLanding from './components/NetflixLanding';
import Login from './components/Login';
import NetflixViewer from './components/NetflixViewer';
import AdminPanel from './components/AdminPanel';
import { validateAccessPass, resetPassTimer, getHomeConfig, DEFAULT_HOME_CONFIG } from './services/authService';

const SESSION_STORAGE_KEY = 'netflix_active_vip_pass';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'session' | 'admin'
  const [sessionData, setSessionData] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [isExpired, setIsExpired] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [prefilledCode, setPrefilledCode] = useState('');
  const [homeConfig, setHomeConfig] = useState(DEFAULT_HOME_CONFIG);

  // Escuchar la URL del navegador para detectar rutas directas como /admin o /login
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/' || window.location.hash === '#admin') {
        setShowAdmin(true);
      } else if (path === '/login' || path === '/login/') {
        setCurrentView('login');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Cargar configuración de Home y sesión previa
  useEffect(() => {
    const initApp = async () => {
      try {
        const config = await getHomeConfig();
        if (config) setHomeConfig(config);

        const savedPass = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedPass) {
          const authResult = await validateAccessPass(savedPass);
          applySessionResult(authResult);
          // Si no está navegando a /admin, entra al dashboard
          if (window.location.pathname.toLowerCase() !== '/admin') {
            setCurrentView('session');
          }
        }
      } catch (err) {
        console.warn("Inicialización de sesión:", err.message);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setCheckingAuth(false);
      }
    };

    initApp();
  }, []);

  // Temporizador regresivo en vivo
  useEffect(() => {
    if (!sessionData || !sessionData.firstUsedAt) return;

    const durationMs = (sessionData.durationMinutes || 60) * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - sessionData.firstUsedAt;
      const remainingMs = durationMs - elapsed;

      if (remainingMs <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
      } else {
        setRemainingSeconds(Math.floor(remainingMs / 1000));
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData]);

  const applySessionResult = (authResult) => {
    setSessionData(authResult);
    setRemainingSeconds(Math.floor(authResult.remainingTimeMs / 1000));
    setIsExpired(authResult.isExpired);
  };

  const handleLoginSuccess = async (code) => {
    const authResult = await validateAccessPass(code);
    localStorage.setItem(SESSION_STORAGE_KEY, code);
    applySessionResult(authResult);
    setCurrentView('session');
    window.history.pushState({}, '', '/');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionData(null);
    setRemainingSeconds(3600);
    setIsExpired(false);
    setCurrentView('landing');
    window.history.pushState({}, '', '/');
  };

  const handleResetTrialDemo = async () => {
    if (!sessionData) return;
    await resetPassTimer(sessionData.code);
    const authResult = await validateAccessPass(sessionData.code);
    applySessionResult(authResult);
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    if (window.location.pathname.toLowerCase().includes('admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-xs tracking-wider uppercase font-semibold">Cargando Plataforma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Panel de Administración (visible cuando tipeas /admin en la URL o das click en el botón) */}
      {showAdmin && (
        <AdminPanel 
          onClose={handleCloseAdmin} 
          onConfigUpdated={(updated) => setHomeConfig(updated)}
        />
      )}

      {/* RENDERIZADO DE VISTAS */}
      {currentView === 'landing' && (
        <NetflixLanding 
          homeConfig={homeConfig}
          onGoToLogin={(optionalCode = '') => {
            setPrefilledCode(optionalCode);
            setCurrentView('login');
            window.history.pushState({}, '', '/login');
          }} 
        />
      )}

      {currentView === 'login' && (
        <Login 
          initialCode={prefilledCode}
          onLoginSuccess={handleLoginSuccess} 
          onOpenAdmin={() => {
            setShowAdmin(true);
            window.history.pushState({}, '', '/admin');
          }}
          onBackToHome={() => {
            setCurrentView('landing');
            window.history.pushState({}, '', '/');
          }}
        />
      )}

      {currentView === 'session' && sessionData && (
        <NetflixViewer
          sessionData={sessionData}
          remainingSeconds={remainingSeconds}
          isExpired={isExpired}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
