import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import ClientLogoFormModal from './ClientLogoFormModal.tsx';
import TestimonialFormModal from './TestimonialFormModal.tsx';

export interface ClientLogo {
  id: string;
  alt_text: string;
  logo_url: string;
  display_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  quote: string;
  image_url: string;
  display_order: number;
}

// FIX: Export the 'TeamMember' interface to resolve the import error in other components.
export interface TeamMember {
  id: string;
  name: string;
  title: string;
  image_url: string;
  display_order: number;
}


const WebsiteManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'logos' | 'testimonials'>('logos');

    const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
    const [logoLoading, setLogoLoading] = useState(true);
    const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
    const [editingClientLogo, setEditingClientLogo] = useState<ClientLogo | null>(null);

    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [testimonialsLoading, setTestimonialsLoading] = useState(true);
    const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

    const fetchClientLogos = useCallback(async () => {
        setLogoLoading(true);
        const { data, error } = await supabase.from('client_logos').select('*').order('display_order');
        if (error) console.error('Error fetching client logos:', error);
        else setClientLogos(data as ClientLogo[]);
        setLogoLoading(false);
    }, []);

    const fetchTestimonials = useCallback(async () => {
        setTestimonialsLoading(true);
        const { data, error } = await supabase.from('testimonials').select('*').order('display_order');
        if (error) console.error('Error fetching testimonials:', error);
        else setTestimonials(data as Testimonial[]);
        setTestimonialsLoading(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'logos') fetchClientLogos();
        if (activeTab === 'testimonials') fetchTestimonials();
    }, [activeTab, fetchClientLogos, fetchTestimonials]);
    
    const deleteFileFromUrl = async (fileUrl: string) => {
        try {
            const url = new URL(fileUrl);
            const bucketName = url.pathname.split('/')[3]; // e.g., 'public_assets'
            const path = url.pathname.split(`/${bucketName}/`)[1];
            if (path && bucketName) {
                await supabase.storage.from(bucketName).remove([path]);
            }
        } catch (error) {
            console.error("Error deleting file from storage:", error);
        }
    };

    const handleDeleteClientLogo = async (logo: ClientLogo) => {
        if (window.confirm(`¿Seguro que quieres eliminar el logo de ${logo.alt_text}?`)) {
            await deleteFileFromUrl(logo.logo_url);
            const { error } = await supabase.from('client_logos').delete().eq('id', logo.id);
            if (error) alert(`Error: ${error.message}`);
            else {
                alert('Logo eliminado.');
                fetchClientLogos();
            }
        }
    };

    const handleDeleteTestimonial = async (testimonial: Testimonial) => {
        if (window.confirm(`¿Seguro que quieres eliminar el testimonio de ${testimonial.name}?`)) {
            await deleteFileFromUrl(testimonial.image_url);
            const { error } = await supabase.from('testimonials').delete().eq('id', testimonial.id);
            if (error) alert(`Error: ${error.message}`);
            else {
                alert('Testimonio eliminado.');
                fetchTestimonials();
            }
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Gestión de Contenido Web</h2>
            <p className="text-slate-600 mt-1 mb-6">Administra el contenido dinámico de la página principal.</p>

            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('logos')} className={`${activeTab === 'logos' ? 'border-[#212147] text-[#212147]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Logos de Clientes</button>
                    <button onClick={() => setActiveTab('testimonials')} className={`${activeTab === 'testimonials' ? 'border-[#212147] text-[#212147]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Testimonios</button>
                </nav>
            </div>

            {activeTab === 'logos' && (
                 <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => { setEditingClientLogo(null); setIsLogoModalOpen(true); }} className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all"><span className="material-symbols-outlined mr-2">add</span>Añadir Logo</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                        {logoLoading ? <p className="text-center p-4">Cargando...</p> : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {clientLogos.map(logo => (
                                    <div key={logo.id} className="relative p-4 border rounded-lg flex flex-col items-center justify-center group">
                                        <img src={logo.logo_url} alt={logo.alt_text} className="h-16 object-contain"/>
                                        <p className="text-xs mt-2 text-slate-500">{logo.alt_text}</p>
                                        <p className="text-xs text-slate-400">Orden: {logo.display_order}</p>
                                        <div className="absolute top-1 right-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingClientLogo(logo); setIsLogoModalOpen(true); }} className="p-1.5 bg-slate-100 rounded-md text-[#212147] hover:bg-slate-200"><span className="material-symbols-outlined text-base">edit</span></button>
                                            <button onClick={() => handleDeleteClientLogo(logo)} className="p-1.5 bg-slate-100 rounded-md text-red-600 hover:bg-slate-200 ml-1"><span className="material-symbols-outlined text-base">delete</span></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

             {activeTab === 'testimonials' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => { setEditingTestimonial(null); setIsTestimonialModalOpen(true); }} className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all"><span className="material-symbols-outlined mr-2">add</span>Añadir Testimonio</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                             <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Orden</th>
                                    <th className="px-6 py-3">Imagen</th>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Cita</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testimonialsLoading ? <tr><td colSpan={5} className="text-center p-4">Cargando...</td></tr> : testimonials.map(item => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4">{item.display_order}</td>
                                        <td className="px-6 py-4"><img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-full object-cover"/></td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{item.name}<br/><span className="text-xs text-slate-500">{item.company}</span></td>
                                        <td className="px-6 py-4 text-xs italic">"{item.quote.substring(0, 50)}..."</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => { setEditingTestimonial(item); setIsTestimonialModalOpen(true); }} className="p-2 text-[#212147]"><span className="material-symbols-outlined">edit</span></button>
                                            <button onClick={() => handleDeleteTestimonial(item)} className="p-2 text-red-600 ml-2"><span className="material-symbols-outlined">delete</span></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isLogoModalOpen && <ClientLogoFormModal itemToEdit={editingClientLogo} onClose={() => setIsLogoModalOpen(false)} onSave={() => { setIsLogoModalOpen(false); fetchClientLogos(); }} />}
            {isTestimonialModalOpen && <TestimonialFormModal itemToEdit={editingTestimonial} onClose={() => setIsTestimonialModalOpen(false)} onSave={() => { setIsTestimonialModalOpen(false); fetchTestimonials(); }} />}
        </div>
    );
};

export default WebsiteManager;