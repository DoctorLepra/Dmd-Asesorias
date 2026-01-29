import React, { useRef, useState, useEffect } from 'react';
import { ServiceCard } from './common/ServiceCard.tsx';
import { supabase } from '../lib/supabaseClient.ts';

interface ServicesPageProps {}

const servicesData = [
  {
    icon: <span className="material-symbols-outlined">settings_suggest</span>,
    title: "Implementación y Parametrización",
    description: "Instalamos y configuramos Contapyme y Agrowin a la medida de tu empresa, asegurando un arranque exitoso y adaptado a tus procesos.",
  },
  {
    icon: <span className="material-symbols-outlined">school</span>,
    title: "Capacitación Especializada",
    description: "Entrenamos a tu equipo para que dominen el software y maximicen su productividad, convirtiéndolos en expertos de sus herramientas de trabajo.",
  },
  {
    icon: <span className="material-symbols-outlined">support_agent</span>,
    title: "Soporte Técnico Prioritario",
    description: "Resolvemos tus dudas y problemas técnicos de forma rápida y eficiente para que no detengas tu operación, garantizando la continuidad de tu negocio.",
  },
  {
    icon: <span className="material-symbols-outlined">sync_alt</span>,
    title: "Migración de Datos",
    description: "Traspasamos tu información contable desde otros sistemas de forma segura y confiable, cuidando la integridad de tus datos más valiosos.",
  },
  {
    icon: <span className="material-symbols-outlined">summarize</span>,
    title: "Desarrollo de Reportes a Medida",
    description: "Creamos reportes personalizados que te entregan la información clave que necesitas para tomar decisiones estratégicas e informadas.",
  },
  {
    icon: <span className="material-symbols-outlined">manage_accounts</span>,
    title: "Asesoría Contable y de Procesos",
    description: "Te ayudamos a optimizar tus flujos de trabajo y a sacar el máximo provecho de tu software contable, mejorando la eficiencia general.",
  },
];

const ServicesPage: React.FC<ServicesPageProps> = () => {
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const [isContactVisible, setIsContactVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsContactVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (contactSectionRef.current) {
      observer.observe(contactSectionRef.current);
    }
    return () => {
      if (contactSectionRef.current) {
        observer.unobserve(contactSectionRef.current);
      }
    };
  }, []);

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

  return (
    <div className="space-y-4 sm:space-y-12">
      {/* Hero Section */}
      <section 
        className="relative h-[50vh] min-h-[400px] w-full bg-cover bg-center flex items-center justify-center text-center text-white"
        style={{ backgroundImage: "url('https://imgur.com/oA0O84D.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">Nuestros Servicios</h1>
          <p className="mt-4 text-lg sm:text-xl max-w-3xl mx-auto">Soluciones integrales para potenciar la gestión de su empresa.</p>
        </div>
      </section>

      {/* Services Section */}
      <section 
        id="services-list"
        className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-8"
      >
        <div className="grid grid-cols-12 gap-6">
           <div className="col-span-12 lg:col-start-2 lg:col-span-10">
              <div className="text-center mb-12">
                <p className="text-slate-600 max-w-4xl mx-auto">
                  Ofrecemos un portafolio de servicios diseñados para adaptarse a sus necesidades, garantizando que su software contable funcione como el motor de su eficiencia.
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {servicesData.map((service, i) => (
                  <ServiceCard 
                    key={i}
                    icon={service.icon}
                    title={service.title}
                    description={service.description}
                    onClick={() => contactSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  />
                ))}
              </div>
           </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact-services" 
        ref={contactSectionRef}
        className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 transition-all duration-1000 ease-in-out ${isContactVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-start-2 lg:col-span-10">
                <div className="text-center mb-12">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex-grow h-1 bg-[#212147]"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex-shrink-0 text-center">Solicita una Cotización</h2>
                    <div className="flex-grow h-1 bg-[#212147]"></div>
                  </div>
                  <p className="text-slate-600 max-w-4xl mx-auto">
                    ¿Interesado en alguno de nuestros servicios? Cuéntenos sobre sus necesidades.
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
                        <option value="implementacion">Implementación y Parametrización</option>
                        <option value="capacitacion">Capacitación Especializada</option>
                        <option value="soporte">Soporte Técnico Prioritario</option>
                        <option value="migracion">Migración de Datos</option>
                        <option value="reportes">Desarrollo de Reportes a Medida</option>
                        <option value="asesoria">Asesoría Contable y de Procesos</option>
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

export default ServicesPage;
