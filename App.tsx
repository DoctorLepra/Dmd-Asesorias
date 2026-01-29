import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header.tsx';
import LandingPage from './components/LandingPage.tsx';
import AboutPage from './components/AboutPage.tsx';
import ServicesPage from './components/ServicesPage.tsx';
import AuthPage from './components/AuthPage.tsx';
import Intranet from './components/Intranet.tsx';
import ConfirmationPage from './components/ConfirmationPage.tsx';
import UpdatePasswordPage from './components/UpdatePasswordPage.tsx';
import TermsPage from './components/TermsPage.tsx';
import { FacebookIcon, InstagramIcon, WhatsappIcon } from './components/common/Icons.tsx';
import { supabase } from './lib/supabaseClient.ts';
import type { Session, User } from '@supabase/supabase-js';
import ScrollToTopButton from './components/common/ScrollToTopButton.tsx';

// No longer using state-based View type

export interface Profile {
  id: string;
  full_name: string;
  company: string;
  contact_number: string;
  role: 'ADMINISTRATOR' | 'EDITOR' | 'VISITOR';
}

// --- CONFIGURACIÓN DE DESARROLLO ---
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

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(
    typeof window !== 'undefined' && window.location.hash.includes('type=signup')
  );
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(
    typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Auth Gatekeeper
  useEffect(() => {
    if (DEV_MODE.enable) {
      setSession({
        access_token: 'fake-dev-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-dev-refresh',
        user: { id: DEV_MODE.profile.id, aud: 'authenticated', role: 'authenticated', email: 'dev@dmd.com' } as User
      });
      setProfile(DEV_MODE.profile);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: initialSession }}) => {
      setSession(initialSession);
      setLoading(false);
    });

    const { data: { subscription }} = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
          setIsConfirming(false);
          window.history.replaceState(null, document.title, window.location.pathname);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Profile Fetcher
  useEffect(() => {
    if (DEV_MODE.enable || !session?.user) {
      if (!session?.user) setProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setProfile(userProfile);
      } catch (error) {
        console.error("Error fetching profile, signing out:", error);
        await supabase.auth.signOut();
        setProfile(null);
      }
    };
    
    fetchUserProfile();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
  }

  // Handle specialized views
  if (isUpdatingPassword && session) {
    return <UpdatePasswordPage onUpdate={() => {
        setIsUpdatingPassword(false);
        window.history.replaceState(null, document.title, window.location.pathname);
        navigate('/');
    }}/>
  }

  if (isConfirming && !session) {
    return <ConfirmationPage />;
  }

  // Determine if it's a public path
  const publicPaths = ['/', '/nosotros', '/servicios', '/terminos', '/ingreso'];
  const isPublicView = publicPaths.includes(location.pathname) || !session;

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {DEV_MODE.enable && (
        <div className="bg-yellow-400 text-black text-xs font-bold text-center py-1 px-4">
          🚧 MODO DESARROLLO ACTIVO - LOGIN SUSPENDIDO ({DEV_MODE.profile.role}) 🚧
        </div>
      )}
      
      {/* HEADER: Only rendered in public views or auth page */}
      {isPublicView && location.pathname !== '/portal' && (
        <Header 
          isAuthenticated={!!session} 
          profile={profile} 
          onLogout={handleLogout} 
        />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/ingreso" element={session ? <Navigate to="/portal" /> : <AuthPage />} />
          
          <Route 
            path="/portal" 
            element={session && profile ? <Intranet profile={profile} onLogout={handleLogout} /> : <Navigate to="/ingreso" />} 
          />
          
          {/* Legacy redirects */}
          <Route path="/terms" element={<Navigate to="/terminos" />} />
          <Route path="/about" element={<Navigate to="/nosotros" />} />
          <Route path="/services" element={<Navigate to="/servicios" />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* FOOTER: Only rendered in public views */}
      {isPublicView && location.pathname !== '/portal' && (
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
            <button 
                onClick={() => navigate('/terminos')} 
                className="mt-2 hover:text-primary transition-colors underline underline-offset-4 cursor-pointer"
            >
                Términos y condiciones
            </button>
        </footer>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default App;