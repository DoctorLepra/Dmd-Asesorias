import React, { useState, useEffect } from 'react';
import { View, Profile } from '../App.tsx';
import NotificationBell from './notifications/NotificationBell.tsx';

interface HeaderProps {
  isAuthenticated: boolean;
  profile: Profile | null;
  setView: (view: View) => void;
  onLogout: () => void;
  view: View;
  onNotificationClick?: (notif: any) => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, profile, setView, onLogout, view, onNotificationClick }) => {
  const [activeItem, setActiveItem] = useState<string>('about');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // This effect synchronizes the active menu item with the current view prop from App.
    if (view === 'about') {
      setActiveItem('about');
    } else if (view === 'services') {
      setActiveItem('services');
    } else if (view === 'auth') {
      setActiveItem('portal');
    } else if (view === 'landing') {
      // Default to the first main section when on the landing page
      setActiveItem('about');
    }
  }, [view]);

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
      document.body.style.overflow = 'auto'; // Cleanup on component unmount
    };
  }, [isMobileMenuOpen]);


  const handleNavigation = (id: string, view: View = 'landing') => {
    setActiveItem(id);
    setView(view);

    if (view === 'landing') {
        // If we're going to the landing page, we might need to scroll to a section
        setTimeout(() => {
            if (id === 'landing') {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 100); // Timeout to allow the landing page to render before scrolling
    } else {
        // For any other view, just scroll to the top
        window.scrollTo(0, 0);
    }

    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'about', label: 'Nosotros', action: () => handleNavigation('about', 'about') },
    { id: 'services', label: 'Servicios', action: () => handleNavigation('services', 'services') },
    { id: 'testimonials', label: 'Casos de éxito', action: () => handleNavigation('testimonials', 'landing') },
    { id: 'portal', label: 'Portal de clientes', action: () => isAuthenticated ? setView('landing') : handleNavigation('portal', 'auth') },
    { id: 'contact', label: 'Contacto', action: () => handleNavigation('contact', 'landing') },
  ];
  
  const isLanding = view === 'landing';
  const shouldBeSolid = isScrolled || !isLanding || isAuthenticated;
  
  const headerBaseClasses = "w-full z-50 text-white transition-all duration-300 ease-in-out";
  // En landing transparente arriba, en otros casos siempre fixed/solid
  const headerPositionClasses = (isLanding && !isScrolled) ? "absolute top-0" : "fixed top-0 md:top-4";

  return (
    <>
    <header className={`${headerBaseClasses} ${headerPositionClasses}`}>
        {/* Container to match page content alignment */}
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12">
                 {/* This column matches the content width (10/12 cols, centered on large screens) */}
                 <div className={`col-span-12 lg:col-start-2 lg:col-span-10 transition-all duration-300 ease-in-out ${shouldBeSolid ? 'bg-[#212147] md:rounded-full shadow-2xl border border-white/10' : ''}`}>
          
                    {/* Top Contact Info (Only visible when not scrolled on landing) */}
                    <div className={`transition-all duration-300 ease-in-out ${(isScrolled || !isLanding || isAuthenticated) ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100 max-h-20'}`}>
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
                    
                    {/* Main Navbar */}
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className={`flex items-center justify-between transition-height duration-300 ${isScrolled ? 'h-16' : 'h-20'}`}>
                                {/* Izquierda: Logo */}
                                <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('landing', 'landing')}>
                                    <img src="https://i.imgur.com/T0Zirsz.png" alt="DMD Asesores Logo" className={`w-auto transition-all duration-300 ${isScrolled ? 'h-8' : 'h-12'} brightness-0 invert`} />
                                </div>

                                {/* Derecha: Lista de items */}
                                <nav className="hidden md:flex items-center space-x-8 h-full">
                                    {isAuthenticated ? (
                                        <div className="flex items-center space-x-4">
                                            <NotificationBell onNotificationClick={onNotificationClick} />
                                            {profile && (
                                                <div className="flex items-center text-white">
                                                    <span className="material-symbols-outlined text-3xl cursor-pointer" onClick={() => setView('landing')}>account_circle</span>
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
                                                {/* Line Indicator - changes style on scroll */}
                                                <span className={`absolute left-0 w-full transition-all duration-300 ${activeItem === item.id ? 'opacity-100' : 'opacity-0'} ${isScrolled ? 'bottom-2 h-1 bg-white rounded-full' : '-top-[2px] h-[4px] bg-[#212147]'}`}></span>
                                                
                                                {item.label}
                                            </button>
                                        ))
                                    )}
                                </nav>

                                {/* Mobile Menu/Notifications */}
                                <div className="md:hidden flex items-center gap-2">
                                    {isAuthenticated && <NotificationBell onNotificationClick={onNotificationClick} />}
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

    {/* Mobile Menu Overlay */}
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
                        <div className="flex items-center text-slate-800">
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