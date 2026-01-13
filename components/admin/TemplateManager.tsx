import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import TemplateFormModal from './TemplateFormModal.tsx';
import { TemplateModal } from '../Templates.tsx'; 
import ConfirmModal from '../common/ConfirmModal.tsx';

export interface Template {
  id: string;
  created_at: string;
  title: string;
  description: string;
  software: 'Contapyme' | 'AgroWin' | 'General';
  type: 'Inventario' | 'Terceros' | 'Reportes' | 'Contabilidad' | 'Otros';
  youtube_video_id: string;
  download_url: string;
  cover_image_url: string;
  support_images?: string[];
}

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      alert('Error al cargar las plantillas.');
    } else {
      setTemplates(data as Template[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };
  
  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleOpenDeleteConfirm = (template: Template) => {
    setTemplateToDelete(template);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from('templates').delete().eq('id', templateToDelete.id);
    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    }
    
    setIsDeleting(false);
    setIsConfirmModalOpen(false);
    setTemplateToDelete(null);
    fetchTemplates();
  };

  const handleSave = () => {
    setIsModalOpen(false);
    fetchTemplates();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Gestión de Plantillas</h2>
            <p className="text-slate-600 mt-1">Crea, edita y elimina las plantillas del portal de clientes.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Crear Plantilla
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3">Título</th>
              <th scope="col" className="px-6 py-3">Software</th>
              <th scope="col" className="px-6 py-3">Tipo</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center p-6">Cargando...</td></tr>
            ) : templates.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-6">No hay plantillas creadas.</td></tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{template.title}</td>
                  <td className="px-6 py-4">{template.software}</td>
                  <td className="px-6 py-4">{template.type}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handlePreview(template)} className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors" aria-label="Visualizar">
                        <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button onClick={() => handleEdit(template)} className="p-2 rounded-full text-[#212147] hover:bg-slate-100 transition-colors ml-1" aria-label="Editar">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => handleOpenDeleteConfirm(template)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors ml-1" aria-label="Eliminar">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <TemplateFormModal
          templateToEdit={editingTemplate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
      
      {previewTemplate && (
        <TemplateModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={
            <>
                ¿Estás seguro de que quieres eliminar la plantilla "<strong>{templateToDelete?.title}</strong>"? Esta acción no se puede deshacer.
            </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TemplateManager;