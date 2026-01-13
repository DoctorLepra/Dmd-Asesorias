

import React, { useState, useEffect, useRef } from 'react';
import { View } from '../App.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import Typewriter from './common/Typewriter.tsx';
import { ServiceCard } from './common/ServiceCard.tsx';

interface LandingPageProps {
  setView: (view: View) => void;
}

interface ClientLogoData {
  id:string;
  alt_text: string;
  logo_url: string;
  link_url?: string;
}

interface TestimonialData {
  id: string;
  name: string;
  company: string;
  quote: string;
  image_url: string;
}

const getVisibleTestimonials = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth >= 1024) return 3; // lg
    if (window.innerWidth >= 768) return 2;  // md
    return 1; // sm
};

const SuccessCaseCard: React.FC<{ testimonial: TestimonialData }> = ({ testimonial }) => (
    <div className="bg-indigo-900/30 p-6 rounded-2xl border border-indigo-400/60 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
          <img src={testimonial.image_url || 'https://via.placeholder.com/40'} alt={`Logo ${testimonial.company}`} className="w-10 h-10 rounded-full object-contain" />
        </div>
        <div>
          <p className="font-bold text-white">{testimonial.name}</p>
          <p className="text-sm text-indigo-200">{testimonial.company}</p>
        </div>
      </div>
      <blockquote className="text-white/90 text-sm italic flex-grow">
        "{testimonial.quote}"
      </blockquote>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [clientLogos, setClientLogos] = useState<ClientLogoData[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState(getVisibleTestimonials());


  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const experienceSectionRef = useRef<HTMLDivElement>(null);
  const [isExperienceVisible, setIsExperienceVisible] = useState(false);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const [isServicesVisible, setIsServicesVisible] = useState(false);
  const clientsSectionRef = useRef<HTMLDivElement>(null);
  const [isClientsVisible, setIsClientsVisible] = useState(false);
  const portalSectionRef = useRef<HTMLDivElement>(null);
  const [isPortalVisible, setIsPortalVisible] = useState(false);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const [isContactVisible, setIsContactVisible] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      const { data: logoData } = await supabase
        .from('client_logos')
        .select('*')
        .order('display_order');
      if (logoData) setClientLogos(logoData);

      const { data: testimonialData } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order');
      if (testimonialData) setTestimonials(testimonialData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target === aboutSectionRef.current) setIsAboutVisible(true);
                else if (entry.target === experienceSectionRef.current) setIsExperienceVisible(true);
                else if (entry.target === statsSectionRef.current) setIsStatsVisible(true);
                else if (entry.target === servicesSectionRef.current) setIsServicesVisible(true);
                else if (entry.target === clientsSectionRef.current) setIsClientsVisible(true);
                else if (entry.target === portalSectionRef.current) setIsPortalVisible(true);
                else if (entry.target === contactSectionRef.current) setIsContactVisible(true);
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });

    const refs = [aboutSectionRef.current, experienceSectionRef.current, statsSectionRef.current, servicesSectionRef.current, clientsSectionRef.current, portalSectionRef.current, contactSectionRef.current];
    refs.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    const handleResize = () => {
        const newVisibleCount = getVisibleTestimonials();
        setVisibleTestimonials(newVisibleCount);
        // Adjust index if it's out of bounds after resize
        setCurrentTestimonialIndex(prev => Math.min(prev, testimonials.length - newVisibleCount));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      refs.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
      window.removeEventListener('resize', handleResize);
    };
  }, [testimonials.length]);
  
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submission = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      interest: formData.get('interest'),
      message: formData.get('message'),
    };

    // @ts-ignore
    const { error } = await supabase.from('contact_submissions').insert(submission);
    
    if (error) {
      alert('Error al enviar el formulario. Por favor, inténtelo de nuevo.');
    } else {
      alert('¡Gracias! Su solicitud ha sido enviada con éxito.');
      e.currentTarget.reset();
    }
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex(prev => Math.min(prev + 1, testimonials.length - visibleTestimonials));
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex(prev => Math.max(prev - 1, 0));
  };
  
  const translateXPercentage = currentTestimonialIndex * (100 / visibleTestimonials);


  return (
    <div className="space-y-4 sm:space-y-12">
      {/* Hero Section */}
      <section 
        id="seccion1" 
        className="relative h-screen md:h-[calc(100vh-50px)] xl:h-screen min-h-[600px] w-full bg-cover bg-center flex items-center"
        style={{
            backgroundImage: "url('https://imgur.com/1PVTwNQ.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-start-2 lg:col-span-8 text-left text-white">
                <p className="text-[12px] font-medium tracking-wider uppercase mb-2">
                    Bienvenido a la real productividad
                </p>
                <div className="w-[230px] h-[2px] bg-white mb-6"></div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-8">
                  <Typewriter text="Maximizamos la eficiencia de su empresa con soporte y capacitación especializada en Contapyme y Agrowin." />
                </h1>
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} 
                        className="bg-[#212147] text-white font-bold py-3 px-8 rounded-[150px] hover:bg-[#1b1b3a] transition-colors uppercase text-sm tracking-wide"
                    >
                        Cotiza
                    </button>
                    <button 
                        onClick={() => setView('auth')} 
                        className="bg-transparent border border-white text-white font-bold py-3 px-8 rounded-[150px] hover:bg-white/10 transition-colors uppercase text-sm tracking-wide"
                    >
                        Portal de clientes
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Nosotros Section */}
      <section 
        id="team" 
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
                  <h2 className="text-3xl font-bold text-slate-900">Nosotros</h2>
                </div>
                <h3 className="text-4xl font-bold text-slate-800 mb-6">El tiempo nos respalda</h3>
                <p className="text-slate-600 mt-5 mb-8 text-left">
                  En DMD Asesorías, fusionamos más de una década de experiencia contable con una profunda especialización en software para transformar la gestión de su empresa.
                  <br/><br/>
                  No solo implementamos herramientas; construimos alianzas estratégicas para asegurar que cada módulo de Contapyme y Agrowin trabaje a su máximo potencial, alineado con sus objetivos de negocio.
                </p>
                <button 
                  onClick={() => setView('about')} 
                  className="bg-transparent border border-slate-800 text-slate-800 font-bold py-3 px-10 rounded-[150px] hover:bg-slate-800 hover:text-white transition-colors text-base"
                >
                  Conocer más
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
                        <h2 className="text-3xl font-bold text-slate-900">Experiencia</h2>
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


      {/* Services Section */}
      <section 
        id="services" 
        ref={servicesSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-1000 ease-in-out mb-24 ${isServicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
           <div className="col-span-12 lg:col-start-2 lg:col-span-10">
              <div className="text-center mb-12">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex-grow h-1 bg-[#212147]"></div>
                  <h2 className="text-3xl font-bold text-slate-900 flex-shrink-0">Nuestros servicios</h2>
                  <div className="flex-grow h-1 bg-[#212147]"></div>
                </div>
                <p className="text-slate-600 max-w-4xl mx-auto">
                  Ofrecemos un portafolio de servicios diseñados para adaptarse a sus necesidades, garantizando que su software contable funcione como el motor de su eficiencia.
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <ServiceCard 
                    key={i}
                    icon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                    title={`Servicio ${i + 1}`}
                    description="Descripción breve del servicio, explicando el valor que aporta y el problema que soluciona para el cliente."
                    onClick={() => setView('services')}
                  />
                ))}
              </div>
           </div>
        </div>
      </section>

      {/* New Clients & Testimonials Section */}
      <section 
        id="testimonials" 
        ref={clientsSectionRef}
        className={`relative bg-[#212147] text-white pt-24 pb-32 sm:pt-32 sm:pb-40 transition-all duration-1000 ease-in-out ${isClientsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Curved top shape */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[95px] fill-white">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V121H1200V95.83C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
          </svg>
        </div>
        
        <div className="relative z-20 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-start-2 lg:col-span-10">
              {/* Client Logos */}
              <div className="mt-24 mb-16">
                <div className="flex justify-start items-center mb-16">
                  <div className="h-1 w-10 bg-white mr-4"></div>
                  <h2 className="text-3xl font-bold text-white text-left">+50 Empresas confian en nuestra experiencia</h2>
                </div>
                
                <div className="logo-carousel">
                  <div className="logo-carousel-track">
                    {[...(clientLogos.length > 0 ? clientLogos : [...Array(20)].map((_,i) => ({id: `${i}`, logo_url: 'https://via.placeholder.com/150x60/FFFFFF/000000?text=Logo', alt_text:`Cliente ${i+1}`, link_url: '#'}))), ...(clientLogos.length > 0 ? clientLogos : [...Array(20)].map((_,i) => ({id: `d-${i}`, logo_url: 'https://via.placeholder.com/150x60/FFFFFF/000000?text=Logo', alt_text:`Cliente ${i+1}`, link_url: '#'})))]
                    .map((logo, i) => (
                      <a key={logo.id + i} href={logo?.link_url || '#'} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-48 flex justify-center items-center mx-4">
                        <img src={logo.logo_url} alt={logo.alt_text} className="h-14 object-contain grayscale hover:grayscale-0 hover:scale-110 transition-all duration-300 ease-in-out" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Success Cases */}
              <div className="mb-24">
                <div className="flex justify-end items-center mt-10 mb-10">
                  <div className="h-1 w-10 bg-white mr-4"></div>
                  <h2 className="text-3xl font-bold text-white">Casos de exito</h2>
                </div>
                
                <div className="relative">
                  <div className="relative mb-8">
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${translateXPercentage}%)` }}
                        >
                            {testimonials.map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="flex-shrink-0 px-4"
                                    style={{ width: `${100 / visibleTestimonials}%` }}
                                >
                                    <SuccessCaseCard testimonial={testimonial} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                     {testimonials.length > visibleTestimonials && (
                      <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                        <button 
                          onClick={handlePrevTestimonial}
                          disabled={currentTestimonialIndex === 0}
                          className="pointer-events-auto bg-white/10 text-white rounded-full p-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all -ml-4 md:-ml-6"
                          aria-label="Anterior testimonio"
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button 
                          onClick={handleNextTestimonial}
                          disabled={currentTestimonialIndex >= testimonials.length - visibleTestimonials}
                          className="pointer-events-auto bg-white/10 text-white rounded-full p-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all -mr-4 md:-mr-6"
                          aria-label="Siguiente testimonio"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                   {/* Indicators */}
                  {testimonials.length > visibleTestimonials && (
                    <div className="flex justify-center items-center space-x-2">
                      {Array.from({ length: Math.ceil(testimonials.length / (visibleTestimonials > 1 ? visibleTestimonials - (visibleTestimonials-1) : 1)) - (visibleTestimonials-1)  }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentTestimonialIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                            currentTestimonialIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Ir al testimonio ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Curved bottom shape */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[95px] fill-white">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V121H1200V95.83C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* Portal de Clientes Section */}
      <section 
        id="portal" 
        className={`border-t-0 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 transition-all duration-1000 ease-in-out ${isPortalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        ref={portalSectionRef}
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-start">
                <div className="flex items-center mb-4">
                  <div className="h-1 w-10 bg-[#212147] mr-4"></div>
                  <h2 className="text-3xl font-bold text-slate-900">Portal de clientes</h2>
                </div>
                <h3 className="text-4xl font-bold text-slate-800 mb-6">No más esperas</h3>
                <p className="text-slate-600 mb-11 text-left">
                  Accede a nuestro portal exclusivo para clientes donde podrás gestionar tus tickets de soporte, consultar nuestra base de conocimientos con IA, y descargar plantillas y formatos para agilizar tus procesos contables.
                </p>
                <button 
                  onClick={() => setView('auth')} 
                  className="bg-transparent border border-slate-800 text-slate-800 font-bold py-3 px-10 rounded-[150px] hover:bg-slate-800 hover:text-white transition-colors text-base"
                >
                  Ingresar
                </button>
              </div>
              <div>
                <img 
                  src="https://imgur.com/oA0O84D.jpg" 
                  alt="Vista previa del portal de clientes" 
                  className="w-full h-96 object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact" 
        ref={contactSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 transition-all duration-1000 ease-in-out ${isContactVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-start-2 lg:col-span-10">
                <div className="text-center mb-12">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex-grow h-1 bg-[#212147]"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex-shrink-0 text-center">Contacto y Cotizaciones</h2>
                    <div className="flex-grow h-1 bg-[#212147]"></div>
                  </div>
                  <p className="text-slate-600 max-w-4xl mx-auto">
                    ¿Listo para empezar? Cuéntenos sobre sus necesidades.
                  </p>
                </div>

                <form className="space-y-6 max-w-4xl mx-auto" onSubmit={handleContactSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="text" name="name" placeholder="Nombre completo" required className="w-full p-3 bg-slate-100 border border-slate-300 rounded-[150px] focus:ring-2 focus:ring-[#212147] focus:border-[#212147]" />
                        <input type="email" name="email" placeholder="Correo Electrónico" required className="w-full p-3 bg-slate-100 border border-slate-300 rounded-[150px] focus:ring-2 focus:ring-[#212147] focus:border-[#212147]" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input type="tel" name="phone" placeholder="Celular" required className="w-full p-3 bg-slate-100 border border-slate-300 rounded-[150px] focus:ring-2 focus:ring-[#212147] focus:border-[#212147]" />
                        <input type="text" name="company" placeholder="Empresa" required className="w-full p-3 bg-slate-100 border border-slate-300 rounded-[150px] focus:ring-2 focus:ring-[#212147] focus:border-[#212147]" />
                    </div>
                    <select name="interest" required className="w-full p-3 bg-slate-100 border border-slate-300 rounded-[150px] focus:ring-2 focus:ring-[#212147] focus:border-[#212147] appearance-none text-left px-4">
                        <option value="" disabled selected>Estoy interesado en...</option>
                        <option value="Soporte tecnico">Soporte tecnico</option>
                        <option value="asesoria">Asesoría</option>
                        <option value="capacitacion">Capacitación</option>
                        <option value="compra de licencia">Compra de licencia</option>
                        <option value="documentacion de procesos de mi sistema">Documentación de procesos</option>
                        <option value="otros">Otros</option>
                    </select>
                    <textarea name="message" placeholder="Mensaje" rows={5} required className="w-full p-4 bg-slate-100 border border-slate-300 rounded-3xl focus:ring-2 focus:ring-[#212147] focus:border-[#212147]"></textarea>
                    <button type="submit" className="w-full bg-[#212147] text-white font-bold py-3 px-4 rounded-[150px] hover:bg-[#1b1b3a] transition-all duration-300">
                        Enviar Solicitud
                    </button>
                </form>
            </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;