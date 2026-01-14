import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import LandingPage from './components/LandingPage.tsx';
import AboutPage from './components/AboutPage.tsx';
import ServicesPage from './components/ServicesPage.tsx';
import AuthPage from './components/AuthPage.tsx';
import Intranet from './components/Intranet.tsx';
import ConfirmationPage from './components/ConfirmationPage.tsx';
import UpdatePasswordPage from './components/UpdatePasswordPage.tsx';
import { FacebookIcon, InstagramIcon, WhatsappIcon } from './components/common/Icons.tsx';
import { supabase } from './lib/supabaseClient.ts';
import type { Session, User } from '@supabase/supabase-js';
import ScrollToTopButton from './components/common/ScrollToTopButton.tsx';

export type View = 'landing' | 'auth' | 'about' | 'services';

export interface Profile {
  id: string;
  full_name: string;
  company: string;
  contact_number: string;
  role: 'ADMINISTRATOR' | 'EDITOR' | 'VISITOR';
}

// --- CONFIGURACIÓN DE DESARROLLO ---
// Cambia 'enable' a TRUE para saltar el login y entrar directo.
// Cambia 'role' para probar diferentes vistas: 'ADMINISTRATOR', 'VISITOR', 'EDITOR'
const DEV_MODE = {
  enable: false, 
  profile: {
    id: 'dev-user-id',
    full_name: 'Desarrollador (Modo Prueba)',
    company: 'DMD Dev Environment',
    contact_number: '0000000000',
    role: 'ADMINISTRATOR' as 'ADMINISTRATOR' | 'EDITOR' | 'VISITOR',
  }
};
// ------------------------------------

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>('landing');
  const [loading, setLoading] = useState(true); // Manages the initial "Cargando..." screen
  const [isConfirming, setIsConfirming] = useState(
    typeof window !== 'undefined' && window.location.hash.includes('type=signup')
  );
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );

  // Effect 1: Auth Gatekeeper - Manages session state
  useEffect(() => {
    // --- LÓGICA DE BYPASS PARA DESARROLLO ---
    if (DEV_MODE.enable) {
      console.log("🚧 MODO DESARROLLO ACTIVO: Saltando autenticación...");
      // Simulamos una sesión válida
      setSession({
        access_token: 'fake-dev-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-dev-refresh',
        user: { 
          id: DEV_MODE.profile.id, 
          aud: 'authenticated', 
          role: 'authenticated', 
          email: 'dev@dmd.com',
          app_metadata: {}, 
          user_metadata: {} 
        } as User
      });
      // Inyectamos el perfil mock
      setProfile(DEV_MODE.profile);
      setLoading(false);
      return; // Detenemos la ejecución para ignorar a Supabase real
    }
    // ----------------------------------------

    // Step 1: Immediately check for an existing session. This is fast and unblocks the initial loading screen.
    supabase.auth.getSession().then(({ data: { session: initialSession }}) => {
      console.log("[Auth Gatekeeper] Initial session from storage:", !!initialSession);
      setSession(initialSession);
      setLoading(false); // Unlock the UI right after the check.
    });

    // Step 2: Set up a listener for any subsequent auth events (SIGN_IN, SIGN_OUT).
    const { data: { subscription }} = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`[Auth Gatekeeper] Auth event received: ${event}. Session: ${!!newSession}`);
      setSession(newSession);
      
      // Handle the specific case of returning from a confirmation email link
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
          setIsConfirming(false);
          window.history.replaceState(null, document.title, window.location.pathname);
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      }
    });

    return () => {
      console.log("[Auth Gatekeeper] Cleaning up listener.");
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Profile Fetcher - Runs only when the session state changes.
  useEffect(() => {
    // Si estamos en modo desarrollo, no intentamos fetchear el perfil de Supabase
    if (DEV_MODE.enable) return;

    if (session?.user) {
      const fetchUserProfile = async () => {
        try {
          console.log(`[Profile Fetcher] Session found. Fetching profile for user: ${session.user.id}`);
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          
          console.log("[Profile Fetcher] Profile fetched successfully.");
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching profile, signing out:", error);
          await supabase.auth.signOut();
          setProfile(null);
        }
      };
      
      fetchUserProfile();
    } else {
      // If session is null, clear the profile
      setProfile(null);
    }
  }, [session]);


  const handleLogout = async () => {
    if (DEV_MODE.enable) {
      // En modo desarrollo, "cerrar sesión" simplemente recarga la página o va al landing
      // para simular la salida, pero al refrescar volverás a entrar.
      setSession(null);
      setProfile(null);
      setView('landing');
      alert("En MODO DESARROLLO, refresca la página para volver a iniciar sesión automáticamente.");
      return;
    }

    await supabase.auth.signOut();
    setView('landing');
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
    }
    if (isUpdatingPassword && session) {
        return <UpdatePasswordPage onUpdate={() => {
            setIsUpdatingPassword(false);
            window.history.replaceState(null, document.title, window.location.pathname);
        }}/>
    }
    if (isConfirming && !session) {
      return <ConfirmationPage />;
    }
    if (session && profile) {
      return <Intranet profile={profile} />;
    }
    switch (view) {
      case 'auth':
        return <AuthPage setView={setView} />;
      case 'about':
        return <AboutPage setView={setView} />;
      case 'services':
        return <ServicesPage setView={setView} />;
      case 'landing':
      default:
        return <LandingPage setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {DEV_MODE.enable && (
        <div className="bg-yellow-400 text-black text-xs font-bold text-center py-1 px-4">
          🚧 MODO DESARROLLO ACTIVO - LOGIN SUSPENDIDO ({DEV_MODE.profile.role}) 🚧
        </div>
      )}
      <Header isAuthenticated={!!session} profile={profile} setView={setView} onLogout={handleLogout} view={view} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <footer className="border-t-0 text-center p-6 mt-10 text-sm text-slate-500">
        <div className="flex justify-center items-center gap-6 mb-4">
            <a href="https://www.facebook.com/profile.php?id=61558340549778" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon className="w-6 h-6 text-slate-500 hover:text-[#212147] transition-colors" />
            </a>
            <a href="https://www.instagram.com/dmdasesorias/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon className="w-6 h-6 text-slate-500 hover:text-[#212147] transition-colors" />
            </a>
            <a href="mailto:info@dmdasesorias.com" aria-label="Correo Electrónico">
                <span className="material-symbols-outlined w-6 h-6 text-slate-500 hover:text-[#212147] transition-colors">mail</span>
            </a>
            <a href="https://wa.me/573104332910" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <WhatsappIcon className="w-6 h-6 text-slate-500 hover:text-[#212147] transition-colors" />
            </a>
        </div>
        <p>&copy; {new Date().getFullYear()} DMD Asesorías. Todos los derechos reservados.</p>
      </footer>
      <ScrollToTopButton />
    </div>
  );
};

export default App;