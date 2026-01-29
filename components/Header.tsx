import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Profile } from '../App.tsx';

interface HeaderProps {
  isAuthenticated: boolean;
  profile: Profile | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, profile, onLogout }) => {
  const [activeItem, setActiveItem] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Sync active item with current path
    const path = location.pathname;
    if (path === '/nosotros') setActiveItem('about');
    else if (path === '/servicios') setActiveItem('services');
    else if (path === '/ingreso') setActiveItem('portal');
    else if (path === '/') setActiveItem('about'); // Default active on landing
    else setActiveItem('');
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  const handleNavigation = (id: string, path: string = '/') => {
    // If we are already on the target path and it's landing, scroll to section
    if (location.pathname === path && path === '/') {
        if (id === 'landing') {
             window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } else {
        // Direct navigation
        navigate(path);
        
        // If it's a section on landing, scroll after a short delay
        if (path === '/' && id !== 'landing' && id !== 'about') {
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        } else {
            window.scrollTo(0, 0);
        }
    }
    
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'about', label: 'Nosotros', action: () => handleNavigation('about', '/nosotros') },
    { id: 'services', label: 'Servicios', action: () => handleNavigation('services', '/servicios') },
    { id: 'testimonials', label: 'Casos de éxito', action: () => handleNavigation('testimonials', '/') },
    { id: 'portal', label: 'Portal de clientes', action: () => isAuthenticated ? navigate('/portal') : handleNavigation('portal', '/ingreso') },
    { id: 'contact', label: 'Contacto', action: () => handleNavigation('contact', '/') },
  ];
  
  const headerBaseClasses = "w-full z-50 text-white transition-all duration-300 ease-in-out";
  const headerTopClasses = "absolute top-0";
  const headerScrolledClasses = "fixed top-4 left-0 right-0";
  
  const isTermsPage = location.pathname === '/terminos';

  return (
    <>
    <header className={`${headerBaseClasses} ${(isScrolled || isTermsPage) ? headerScrolledClasses : headerTopClasses}`}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12">
                 <div className={`col-span-12 lg:col-start-2 lg:col-span-10 transition-all duration-300 ease-in-out ${(isScrolled || isTermsPage) ? 'bg-black/30 backdrop-blur-lg rounded-full shadow-2xl' : ''}`}>
          
                    <div className={`transition-all duration-300 ease-in-out ${(isScrolled || isTermsPage) ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-20'}`}>
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-end items-center py-2 text-sm font-light space-x-6">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">mail</span>
                                    <a href="mailto:info@dmdasesorias.com" className="hover:text-indigo-200 transition-colors">info@dmdasesorias.com</a>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                    <a href="https://wa.me/573104332910" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-200 transition-colors">310 433 2910</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-[1px] bg-slate-400/30"></div>
                    </div>
                    
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className={`flex items-center justify-between transition-height duration-300 ${(isScrolled || isTermsPage) ? 'h-16' : 'h-20'}`}>
                                <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('landing', '/')}>
                                    <img src="https://i.imgur.com/T0Zirsz.png" alt="DMD Asesores Logo" className={`w-auto transition-all duration-300 ${(isScrolled || isTermsPage) ? 'h-8' : 'h-12'} brightness-0 invert`} />
                                </div>

                                <nav className="hidden md:flex items-center space-x-8 h-full">
                                    {isAuthenticated ? (
                                        <div className="flex items-center space-x-4">
                                            {profile && (
                                                <div className="flex items-center text-white cursor-pointer" onClick={() => navigate('/portal')}>
                                                    <span className="material-symbols-outlined text-3xl">account_circle</span>
                                                    <div className="ml-3 text-left">
                                                        <p className="text-sm font-bold leading-tight">{profile.full_name}</p>
                                                        <p className="text-xs opacity-80">{profile.role}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <button onClick={onLogout} className="flex items-center text-white hover:text-red-300 px-3 py-2 text-sm font-medium transition-colors">
                                                <span className="material-symbols-outlined text-xl mr-1">logout</span>
                                                Salir
                                            </button>
                                        </div>
                                    ) : (
                                        navItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={item.action}
                                                className="relative h-full px-2 text-sm font-medium transition-colors hover:text-indigo-200 flex items-center"
                                            >
                                                <span className={`absolute left-0 w-full transition-all duration-300 ${activeItem === item.id ? 'opacity-100' : 'opacity-0'} ${(isScrolled || isTermsPage) ? 'bottom-2 h-1 bg-white rounded-full' : '-top-[2px] h-[4px] bg-[#212147]'}`}></span>
                                                {item.label}
                                            </button>
                                        ))
                                    )}
                                </nav>

                                <div className="md:hidden">
                                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2">
                                        <span className="material-symbols-outlined">menu</span>
                                    </button>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div className={`fixed inset-0 bg-white z-[100] md:hidden flex flex-col p-4 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
            <img src="https://i.imgur.com/cgLkr0L.png" alt="DMD Asesores Logo" className="h-10" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-800">
                <span className="material-symbols-outlined text-3xl">close</span>
            </button>
        </div>

        <nav className="flex flex-col space-y-2">
            {isAuthenticated ? (
                 <div className="p-4 border border-slate-200 rounded-lg">
                    {profile && (
                        <div className="flex items-center text-slate-800" onClick={() => { navigate('/portal'); setIsMobileMenuOpen(false); }}>
                            <span className="material-symbols-outlined text-4xl">account_circle</span>
                            <div className="ml-3 text-left">
                                <p className="text-md font-bold leading-tight">{profile.full_name}</p>
                                <p className="text-sm text-slate-600">{profile.role}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="mt-4 w-full flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 p-3 text-md font-medium transition-colors rounded-lg">
                        <span className="material-symbols-outlined text-xl mr-2">logout</span>
                        Salir
                    </button>
                </div>
            ) : (
                navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className={`w-full text-left p-4 text-lg font-medium rounded-full transition-all duration-200 ${
                            activeItem === item.id ? 'bg-[#212147] text-white' : 'text-slate-800 hover:bg-slate-100'
                        }`}
                    >
                        {item.label}
                    </button>
                ))
            )}
        </nav>
    </div>
    </>
  );
};

export default Header;