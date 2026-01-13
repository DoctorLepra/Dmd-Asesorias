import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.ts';

// Define the type for a template object from the database
interface Template {
  id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  download_url: string;
  cover_image_url: string;
  support_images?: string[];
}


const TemplateCard: React.FC<{ template: Template; onView: (template: Template) => void }> = ({ template, onView }) => (
  <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col group">
    <div className="relative h-48 overflow-hidden">
      <img src={template.cover_image_url} alt={`Imagen de ${template.title}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-lg font-bold text-slate-800 mb-2">{template.title}</h3>
      <p className="text-slate-600 text-sm mb-4 flex-grow line-clamp-3">{template.description}</p>
      <div className="mt-auto flex items-center gap-2">
        <button
            onClick={() => onView(template)}
            className="flex-1 text-center bg-white border border-[#212147] text-[#212147] font-bold py-2 px-4 rounded-lg hover:bg-[#212147] hover:text-white transition-all duration-300"
            >
            Ver Detalles
        </button>
        <a
            href={template.download_url}
            download
            className="flex-1 inline-flex items-center justify-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
            >
            <span className="material-symbols-outlined text-base mr-2">download</span>
            Descargar
        </a>
      </div>
    </div>
  </div>
);

// Export TemplateModal to be used in other components like TemplateManager
export const TemplateModal: React.FC<{ template: Template; onClose: () => void }> = ({ template, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-3xl">cancel</span>
        </button>

        <div className="p-8">
          <h2 id="template-modal-title" className="text-2xl font-bold text-slate-800 mb-4 pr-8">{template.title}</h2>
          <p className="text-slate-600 mb-6">{template.description}</p>

          {template.support_images && template.support_images.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-slate-700 mb-3">Imágenes de ejemplo:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {template.support_images.map((img, index) => (
                  <a href={img} target="_blank" rel="noopener noreferrer" key={index} className="block overflow-hidden rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
                    <img 
                      src={img} 
                      alt={`Ejemplo ${index + 1} para ${template.title}`} 
                      className="w-full h-auto object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-6">
             <div 
                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                dangerouslySetInnerHTML={{ __html: template.youtube_video_id }} 
            />
          </div>

          <a
            href={template.download_url}
            download
            className="w-full inline-flex items-center justify-center bg-[#212147] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all duration-300 transform hover:scale-105"
          >
            <span className="material-symbols-outlined mr-2">download</span>
            Descargar Plantilla
          </a>
        </div>
      </div>
    </div>
  );
};


const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          setTemplates(data as Template[]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-2">Plantillas y Formatos</h2>
      <p className="text-slate-600 mb-8">
        Descarga las plantillas que necesitas para agilizar tus procesos de carga de información en Contapyme y Agrowin.
      </p>
      {loading ? (
        <p>Cargando plantillas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onView={setSelectedTemplate} />
          ))}
        </div>
      )}

      {selectedTemplate && (
        <TemplateModal template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />
      )}
    </div>
  );
};

export default Templates;