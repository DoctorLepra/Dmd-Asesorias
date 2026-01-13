import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { TeamMember } from './WebsiteManager.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

interface ModalProps {
  itemToEdit: TeamMember | null;
  onClose: () => void;
  onSave: () => void;
}

const TeamMemberFormModal: React.FC<ModalProps> = ({ itemToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', title: '', display_order: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({ name: itemToEdit.name, title: itemToEdit.title, display_order: itemToEdit.display_order });
      setImageUrl(itemToEdit.image_url);
    }
  }, [itemToEdit]);
  
  const uploadFile = async (file: File): Promise<string> => {
      const fileName = `${Date.now()}-team-${file.name.replace(/\s/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('public_assets').upload(fileName, file);

      if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);
      
      const { data: urlData } = supabase.storage.from('public_assets').getPublicUrl(uploadData.path);
      
      if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL pública de la imagen.');
      return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.title.trim()) {
        setError('Nombre y cargo son obligatorios.');
        return;
    }
     if (!imageFile && !itemToEdit) {
        setError('La imagen es obligatoria.');
        return;
    }
    setLoading(true);
    
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadFile(imageFile);
      }
      
      const submissionData = { ...formData, image_url: finalImageUrl };

      const { error: submissionError } = itemToEdit
        ? await supabase.from('team_members').update(submissionData).eq('id', itemToEdit.id)
        : await supabase.from('team_members').insert(submissionData);

      if (submissionError) throw submissionError;
      
      onSave();
    } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
        setLoading(false);
    }
  };
  
  const currentImageUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;
  const inputClasses = "w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28287c]";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><span className="material-symbols-outlined text-3xl">cancel</span></button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{itemToEdit ? 'Editar Miembro' : 'Añadir Miembro'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre Completo" required className={inputClasses}/>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Cargo" required className={inputClasses}/>
                <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} placeholder="Orden de visualización" required className={inputClasses}/>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Foto</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-[#28287c] hover:file:bg-indigo-100"/>
                  {currentImageUrl && <img src={currentImageUrl} alt="Preview" className="w-24 h-24 mt-2 rounded-full object-cover"/>}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="py-2 px-4 bg-[#28287c] text-white rounded-lg hover:bg-[#202062] disabled:bg-slate-400 w-36">
                        {loading ? <LoadingSpinner/> : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberFormModal;
