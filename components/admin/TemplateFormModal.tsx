import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { Template } from './TemplateManager.tsx';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

interface TemplateFormModalProps {
  templateToEdit: Template | null;
  onClose: () => void;
  onSave: () => void;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({ templateToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    software: 'General',
    type: 'Otros',
    youtube_video_id: '',
    download_url: '',
    cover_image_url: '',
    support_images: [] as string[],
  });

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [downloadFile, setDownloadFile] = useState<File | null>(null);
  const [supportImageFiles, setSupportImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const downloadInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);

  const inputClasses = "w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#212147] transition";
  const fileInputClasses = "block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-[#212147] hover:file:bg-slate-100 cursor-pointer";

  useEffect(() => {
    if (templateToEdit) {
      const { id, created_at, ...editableData } = templateToEdit;
      setFormData({
        title: editableData.title || '',
        description: editableData.description || '',
        software: editableData.software || 'General',
        type: editableData.type || 'Otros',
        youtube_video_id: editableData.youtube_video_id || '',
        download_url: editableData.download_url || '',
        cover_image_url: editableData.cover_image_url || '',
        support_images: editableData.support_images || [],
      });
    } else {
        setFormData({
            title: '',
            description: '',
            software: 'General',
            type: 'Otros',
            youtube_video_id: '',
            download_url: '',
            cover_image_url: '',
            support_images: [],
        });
    }
  }, [templateToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const uploadFile = async (file: File, bucket: 'public_assets' | 'template_files'): Promise<string> => {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);

      if (uploadError) {
          console.error(`Error uploading to ${bucket}:`, uploadError);
          if (uploadError.message.includes('security policy')) {
              throw new Error("Error de Permisos: La política de seguridad ha bloqueado la subida. Asegúrate de que tu cuenta tenga el rol de 'ADMINISTRATOR' o 'EDITOR' y que las políticas de Storage estén correctamente configuradas en Supabase.");
          }
          throw new Error(`Error al subir el archivo: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
      
      if (!urlData.publicUrl) {
          throw new Error('No se pudo obtener la URL pública del archivo subido.');
      }
      return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.youtube_video_id.trim()) {
        setError('Por favor, completa todos los campos obligatorios: Título, Descripción y Iframe de YouTube.');
        return;
    }
    if (!coverImageFile && !formData.cover_image_url) {
        setError('La imagen de portada es obligatoria.');
        return;
    }
    if (!downloadFile && !formData.download_url) {
        setError('El archivo descargable es obligatorio.');
        return;
    }

    setLoading(true);
    
    try {
      const finalData = { ...formData };

      if (coverImageFile) {
        finalData.cover_image_url = await uploadFile(coverImageFile, 'public_assets');
      }

      if (downloadFile) {
        finalData.download_url = await uploadFile(downloadFile, 'template_files');
      }

      if (supportImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          supportImageFiles.map(file => uploadFile(file, 'public_assets'))
        );
        finalData.support_images = [...(formData.support_images || []), ...uploadedUrls];
      }
      
      let submissionError = null;

      if (templateToEdit) {
        const { error } = await supabase.from('templates').update(finalData).eq('id', templateToEdit.id);
        submissionError = error;
      } else {
        const { error } = await supabase.from('templates').insert(finalData);
        submissionError = error;
      }

      if (submissionError) {
        throw submissionError;
      }
      
      onSave();

    } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado al guardar la plantilla.');
    } finally {
        setLoading(false);
    }
  };
  
  const currentCoverImageUrl = coverImageFile ? URL.createObjectURL(coverImageFile) : formData.cover_image_url;

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    setFormData(prev => ({ ...prev, cover_image_url: '' }));
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleRemoveDownloadFile = () => {
    setDownloadFile(null);
    setFormData(prev => ({ ...prev, download_url: '' }));
    if (downloadInputRef.current) downloadInputRef.current.value = '';
  };
  
  const handleRemoveExistingSupportImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      support_images: prev.support_images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleRemoveNewSupportImage = (indexToRemove: number) => {
    const updatedFiles = supportImageFiles.filter((_, index) => index !== indexToRemove);
    setSupportImageFiles(updatedFiles);
    if (supportInputRef.current) {
      supportInputRef.current.value = '';
    }
  };
  
  const getFileNameFromUrl = (url: string) => {
    try {
      const path = new URL(url).pathname.split('/').pop();
      return path ? decodeURI(path.substring(path.indexOf('-') + 1)) : 'Archivo existente';
    } catch {
      return 'Archivo inválido';
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-3xl">cancel</span>
        </button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{templateToEdit ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Título" required className={inputClasses}/>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descripción" required className={`${inputClasses} h-24`}/>
                <div className="grid grid-cols-2 gap-4">
                    <select name="software" value={formData.software} onChange={handleInputChange} className={inputClasses}>
                        <option value="Contapyme">Contapyme</option>
                        <option value="AgroWin">AgroWin</option>
                        <option value="General">General</option>
                    </select>
                     <select name="type" value={formData.type} onChange={handleInputChange} className={inputClasses}>
                        <option value="Inventario">Inventario</option>
                        <option value="Terceros">Terceros</option>
                        <option value="Reportes">Reportes</option>
                        <option value="Contabilidad">Contabilidad</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>
                <textarea name="youtube_video_id" value={formData.youtube_video_id} onChange={handleInputChange} placeholder="Pegar código <iframe> de YouTube aquí" required className={`${inputClasses} h-24`}/>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imagen de Portada (Obligatorio)</label>
                  {!currentCoverImageUrl ? (
                     <input type="file" ref={coverInputRef} accept="image/*" onChange={e => setCoverImageFile(e.target.files ? e.target.files[0] : null)} className={fileInputClasses}/>
                  ) : (
                    <div className="relative w-32 mt-2 group">
                      <img src={currentCoverImageUrl} alt="Portada actual" className="w-32 rounded"/>
                      <button type="button" onClick={handleRemoveCoverImage} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar imagen de portada">
                          <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivo Descargable (Obligatorio)</label>
                  {!formData.download_url && !downloadFile ? (
                    <input type="file" ref={downloadInputRef} onChange={e => setDownloadFile(e.target.files ? e.target.files[0] : null)} className={fileInputClasses}/>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg text-sm">
                      <span className="material-symbols-outlined text-base text-slate-600">attach_file</span>
                      <span className="flex-1 truncate">{downloadFile ? downloadFile.name : getFileNameFromUrl(formData.download_url)}</span>
                      <button type="button" onClick={handleRemoveDownloadFile} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-100 rounded-full transition-colors" aria-label="Eliminar archivo descargable">
                         <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )}
                </div>

                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Imágenes de Soporte (Opcional)</label>
                   <input type="file" ref={supportInputRef} accept="image/*" multiple onChange={e => setSupportImageFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])])} className={fileInputClasses}/>
                   
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.support_images.map((img, index) => 
                            <div key={`existing-${index}`} className="relative group">
                                <img src={img} className="w-20 h-20 object-cover rounded" alt={`soporte ${index}`}/>
                                <button type="button" onClick={() => handleRemoveExistingSupportImage(index)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Eliminar imagen de soporte ${index + 1}`}>
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        )}
                         {supportImageFiles.map((file, index) => 
                            <div key={`new-${index}`} className="relative group">
                                <img src={URL.createObjectURL(file)} className="w-20 h-20 object-cover rounded" alt={`nuevo soporte ${index}`}/>
                                <button type="button" onClick={() => handleRemoveNewSupportImage(index)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Eliminar nueva imagen de soporte ${index + 1}`}>
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        )}
                    </div>
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

export default TemplateFormModal;