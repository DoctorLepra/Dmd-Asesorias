import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import ConfirmModal from '../common/ConfirmModal.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

interface KnowledgeBaseEditorProps {
  onSaveSuccess: () => void;
  onCancel: () => void;
}

interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
}

const KnowledgeBaseEditor: React.FC<KnowledgeBaseEditorProps> = ({ onSaveSuccess, onCancel }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteItem, setDeleteItem] = useState<KnowledgeItem | null>(null);

  const fetchKnowledge = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
         if (error.message.includes('relation "public.ai_knowledge_base" does not exist')) {
             setError("Error: La tabla 'ai_knowledge_base' no existe. Por favor ejecute el script SQL de migración.");
         } else {
             console.error("Error fetching knowledge base:", error);
             setError("No se pudieron cargar las instrucciones.");
         }
      } else {
        setItems(data as KnowledgeItem[]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setIsModalOpen(true);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: KnowledgeItem) => {
      setDeleteItem(item);
  }

  const handleToggleActive = async (item: KnowledgeItem) => {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      
      if (!error) {
          fetchKnowledge();
      }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formTitle.trim() || !formContent.trim()) {
          alert("Título y Contenido son obligatorios");
          return;
      }

      setIsSaving(true);
      const payload = {
          title: formTitle,
          content: formContent,
      };

      let opError = null;
      if (editingItem) {
          const { error } = await supabase.from('ai_knowledge_base').update(payload).eq('id', editingItem.id);
          opError = error;
      } else {
          const { error } = await supabase.from('ai_knowledge_base').insert(payload);
          opError = error;
      }

      setIsSaving(false);
      if (opError) {
          alert("Error al guardar: " + opError.message);
      } else {
          setIsModalOpen(false);
          fetchKnowledge();
      }
  }

  const handleConfirmDelete = async () => {
      if (!deleteItem) return;
      const { error } = await supabase.from('ai_knowledge_base').delete().eq('id', deleteItem.id);
      if (error) {
          alert("Error al eliminar: " + error.message);
      }
      setDeleteItem(null);
      fetchKnowledge();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Base de Conocimiento IA</h2>
            <p className="text-slate-600 mt-1">
                Define las reglas e instrucciones que sigue el asistente. El sistema combina todas las instrucciones activas para formar la personalidad de la IA.
            </p>
          </div>
          <div className="flex gap-2">
               <button
                onClick={onCancel}
                className="py-2 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
               >
                 Volver
               </button>
               <button
                onClick={handleCreate}
                className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all"
               >
                <span className="material-symbols-outlined mr-2">add</span>
                Nueva Instrucción
               </button>
          </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
          <div className="text-center p-8 text-slate-500">Cargando instrucciones...</div>
      ) : items.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">library_books</span>
              <p className="text-slate-600">No hay instrucciones definidas.</p>
              <button onClick={handleCreate} className="text-[#212147] font-bold mt-2 hover:underline">Crear la primera instrucción</button>
          </div>
      ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                  <div key={item.id} className={`bg-white rounded-xl shadow border p-5 flex flex-col ${item.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                              {item.title}
                              {!item.is_active && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Inactivo</span>}
                          </h3>
                          <div className="flex gap-1">
                               <button 
                                  onClick={() => handleToggleActive(item)} 
                                  className={`p-1.5 rounded-full transition-colors ${item.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}
                                  title={item.is_active ? "Desactivar" : "Activar"}
                                >
                                  <span className="material-symbols-outlined text-lg">{item.is_active ? 'toggle_on' : 'toggle_off'}</span>
                                </button>
                                <button onClick={() => handleEdit(item)} className="p-1.5 text-[#212147] hover:bg-indigo-50 rounded-full transition-colors" title="Editar">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                          </div>
                      </div>
                      <div className="flex-grow">
                          <p className="text-sm text-slate-600 line-clamp-4 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                              {item.content}
                          </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-400">Creado: {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">{editingItem ? 'Editar Instrucción' : 'Nueva Instrucción'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form id="kb-form" onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Regla</label>
                            <input 
                                type="text" 
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                placeholder="Ej: Personalidad Principal, Manejo de Errores..."
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#212147] outline-none"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contenido de la Instrucción</label>
                            <p className="text-xs text-slate-500 mb-2">Describe detalladamente qué debe hacer la IA en este contexto. Si quieres usar una imagen, añade su URL aquí.</p>
                            <textarea 
                                value={formContent}
                                onChange={e => setFormContent(e.target.value)}
                                placeholder="Escribe aquí las instrucciones para el modelo..."
                                className="w-full h-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#212147] outline-none font-mono text-sm"
                                required
                            />
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                    <button 
                        form="kb-form"
                        type="submit" 
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#212147] text-white font-bold rounded-lg hover:bg-[#1b1b3a] transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isSaving && <LoadingSpinner />}
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Instrucción"
        message={<>¿Estás seguro de que deseas eliminar la regla <strong>"{deleteItem?.title}"</strong>? Esto afectará inmediatamente el comportamiento del asistente.</>}
      />

    </div>
  );
};

export default KnowledgeBaseEditor;