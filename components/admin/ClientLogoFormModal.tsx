import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { ClientLogo } from './WebsiteManager.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

interface ModalProps {
  itemToEdit: ClientLogo | null;
  onClose: () => void;
  onSave: () => void;
}

const ClientLogoFormModal: React.FC<ModalProps> = ({ itemToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({ alt_text: '', display_order: 0 });
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({ alt_text: itemToEdit.alt_text, display_order: itemToEdit.display_order });
      setLogoUrl(itemToEdit.logo_url);
    }
  }, [itemToEdit]);

  const uploadFile = async (file: File): Promise<string> => {
      const fileName = `${Date.now()}-logo-${file.name.replace(/\s/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('public_assets').upload(fileName, file);

      if (uploadError) throw new Error(`Error al subir logo: ${uploadError.message}`);
      
      const { data: urlData } = supabase.storage.from('public_assets').getPublicUrl(uploadData.path);
      
      if (!urlData.publicUrl) throw new Error('No se pudo obtener la URL pública del logo.');
      return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.alt_text.trim()) {
        setError('El texto alternativo es obligatorio.');
        return;
    }
    if (!logoFile && !itemToEdit) {
        setError('El archivo del logo es obligatorio.');
        return;
    }
    setLoading(true);
    
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadFile(logoFile);
      }
      
      const submissionData = { ...formData, logo_url: finalLogoUrl };

      const { error: submissionError } = itemToEdit
        ? await supabase.from('client_logos').update(submissionData).eq('id', itemToEdit.id)
        : await supabase.from('client_logos').insert(submissionData);

      if (submissionError) throw submissionError;
      
      onSave();
    } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
        setLoading(false);
    }
  };

  const currentLogoUrl = logoFile ? URL.createObjectURL(logoFile) : logoUrl;
  const inputClasses = "w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212147]";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"><span className="material-symbols-outlined text-3xl">cancel</span></button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{itemToEdit ? 'Editar Logo' : 'Añadir Logo'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={formData.alt_text} onChange={e => setFormData({...formData, alt_text: e.target.value})} placeholder="Nombre de la empresa (texto alternativo)" required className={inputClasses}/>
                <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value) || 0})} placeholder="Orden de visualización" required className={inputClasses}/>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivo del Logo</label>
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-[#212147] hover:file:bg-slate-100"/>
                  {currentLogoUrl && <div className="mt-2 p-4 border rounded-lg flex justify-center"><img src={currentLogoUrl} alt="Preview" className="h-16 object-contain"/></div>}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" disabled={loading} className="py-2 px-4 bg-[#212147] text-white rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400 w-36">
                        {loading ? <LoadingSpinner/> : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ClientLogoFormModal;