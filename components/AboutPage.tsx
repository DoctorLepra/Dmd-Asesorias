
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AboutPageProps {}

const AboutPage: React.FC<AboutPageProps> = () => {
  const navigate = useNavigate();
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const experienceSectionRef = useRef<HTMLDivElement>(null);
  const [isExperienceVisible, setIsExperienceVisible] = useState(false);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target === aboutSectionRef.current) setIsAboutVisible(true);
                else if (entry.target === experienceSectionRef.current) setIsExperienceVisible(true);
                else if (entry.target === statsSectionRef.current) setIsStatsVisible(true);
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });

    const refs = [aboutSectionRef.current, experienceSectionRef.current, statsSectionRef.current];
    refs.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      refs.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-12">
      {/* Hero Section */}
      <section 
        className="relative h-[50vh] min-h-[400px] w-full bg-cover bg-center flex items-center justify-center text-center text-white"
        style={{ backgroundImage: "url('https://imgur.com/1PVTwNQ.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">Sobre DMD Asesorías</h1>
          <p className="mt-4 text-lg sm:text-xl max-w-3xl mx-auto">Transformando la gestión de su empresa con experiencia y tecnología.</p>
        </div>
      </section>

      {/* Nosotros Section */}
      <section 
        ref={aboutSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-1000 ease-in-out ${isAboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <img 
                  src="https://imgur.com/1PVTwNQ.jpg"
                  alt="Equipo de DMD Asesores en una oficina moderna" 
                  className="rounded-2xl border border-slate-200 shadow-lg w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center mb-4">
                  <div className="h-1 w-10 bg-[#212147] mr-4"></div>
                  <h2 className="text-3xl font-bold text-slate-900">Nuestra Historia</h2>
                </div>
                <h3 className="text-4xl font-bold text-slate-800 mb-6">El tiempo nos respalda</h3>
                <p className="text-slate-600 mt-5 mb-8 text-left">
                  En DMD Asesorías, fusionamos más de una década de experiencia contable con una profunda especialización en software para transformar la gestión de su empresa.
                  <br/><br/>
                  No solo implementamos herramientas; construimos alianzas estratégicas para asegurar que cada módulo de Contapyme y Agrowin trabaje a su máximo potencial, alineado con sus objetivos de negocio.
                </p>
                <button 
                  onClick={() => navigate('/servicios')} 
                  className="bg-[#212147] text-white font-bold py-3 px-10 rounded-[150px] hover:bg-[#1b1b3a] transition-colors text-base"
                >
                  Ver Nuestros Servicios
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Experience Section */}
      <section
        ref={experienceSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-1000 ease-in-out ${isExperienceVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col items-start">
                    <div className="flex items-center mb-4">
                        <div className="h-1 w-10 bg-[#212147] mr-4"></div>
                        <h2 className="text-3xl font-bold text-slate-900">Metodología</h2>
                    </div>
                    <h3 className="text-4xl font-bold text-slate-800">No improvisamos, sabemos lo que hacemos</h3>
                </div>
                <div>
                    <p className="text-slate-600 text-left">
                        Nuestra trayectoria es la base de nuestra metodología. Cada problema que enfrentan nuestros clientes es una oportunidad para aplicar el conocimiento acumulado y ofrecer soluciones que no solo resuelven el presente, sino que previenen futuros inconvenientes.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-1000 ease-in-out ${isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 text-center">
              <div className="flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-6xl text-[#212147] mb-5">work_history</span>
                <p className="text-6xl font-bold text-slate-900">+20</p>
                <p className="text-lg text-slate-600 mt-2 leading-tight">Años<br/>de experiencia</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 md:border-l md:border-r border-slate-300">
                <span className="material-symbols-outlined text-6xl text-[#212147] mb-5">domain</span>
                <p className="text-6xl font-bold text-slate-900">+50</p>
                <p className="text-lg text-slate-600 mt-2 leading-tight">Empresas<br/>confían en nosotros</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-6xl text-[#212147] mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <p className="text-6xl font-bold text-slate-900">5</p>
                <p className="text-lg text-slate-600 mt-2 leading-tight">Calificación<br/>en Soporte tecnico</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
