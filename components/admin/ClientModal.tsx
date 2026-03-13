'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface License {
  codigo: string;
  nombre: string;
  vencimiento?: string | null;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: any | null;
}

export default function ClientModal({ isOpen, onClose, selectedClient }: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [licencias, setLicencias] = useState<License[]>([]);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    pais: 'Colombia',
    ciudad: '',
    celular: '',
    vencimiento_licencia: '',
    codigo_comercial_licencia: '',
    vencimiento_poliza: '',
    vencimiento_documentos: '',
    codigo_comercial_docs: '',
    vencimiento_eventos: '',
    codigo_comercial_eventos: '',
    is_licencia_permanente: false,
    is_poliza_permanente: false,
  });

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        codigo: selectedClient.codigo || '',
        nombre: selectedClient.nombre || '',
        pais: selectedClient.pais || 'Colombia',
        ciudad: selectedClient.ciudad || '',
        celular: selectedClient.celular || '',
        vencimiento_licencia: selectedClient.vencimiento_licencia || '',
        codigo_comercial_licencia: selectedClient.codigo_comercial_licencia || '',
        vencimiento_poliza: selectedClient.vencimiento_poliza || '',
        vencimiento_documentos: selectedClient.vencimiento_documentos || '',
        codigo_comercial_docs: selectedClient.codigo_comercial_docs || '',
        vencimiento_eventos: selectedClient.vencimiento_eventos || '',
        codigo_comercial_eventos: selectedClient.codigo_comercial_eventos || '',
        is_licencia_permanente: !selectedClient.vencimiento_licencia,
        is_poliza_permanente: !selectedClient.vencimiento_poliza,
      });
      setLicencias(selectedClient.licencias || []);
    }
  }, [selectedClient]);

  const addLicense = () => {
    setLicencias([...licencias, { codigo: '', nombre: '', vencimiento: '' }]);
  };

  const removeLicense = (index: number) => {
    setLicencias(licencias.filter((_, i) => i !== index));
  };

  const updateLicense = (index: number, field: keyof License, value: string) => {
    const newLicenses = [...licencias];
    newLicenses[index][field] = value;
    setLicencias(newLicenses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      licencias,
      vencimiento_licencia: formData.is_licencia_permanente ? null : formData.vencimiento_licencia,
      vencimiento_poliza: formData.is_poliza_permanente ? null : formData.vencimiento_poliza,
    };

    // Remove internal UI toggles before saving
    const { is_licencia_permanente, is_poliza_permanente, ...cleanData } = dataToSave as any;

    try {
      if (selectedClient) {
        const { error } = await supabase
          .from('clientes')
          .update(cleanData)
          .eq('id', selectedClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([cleanData]);
        if (error) throw error;
      }
      onClose();
    } catch (err) {
      console.error("Error saving client:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-[#f8fafc] w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800">{selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Formulario de registro corporativo</p>
          </div>
          <button onClick={onClose} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 legal-scroll">
          {/* Seccion 1: Datos Básicos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg text-lg">person_book</span>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Información Básica</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código Único</label>
                <input
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ej: CL-001"
                  value={formData.codigo}
                  onChange={e => setFormData({...formData, codigo: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre de la Empresa / Cliente</label>
                <input
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ej: Inversiones Globales S.A."
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">País</label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.pais}
                  onChange={e => setFormData({...formData, pais: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ciudad</label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.ciudad}
                  onChange={e => setFormData({...formData, ciudad: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Celular / WhatsApp</label>
                <input
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="+57 321..."
                  value={formData.celular}
                  onChange={e => setFormData({...formData, celular: e.target.value})}
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Seccion 2: Licencias Dinámicas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-1.5 rounded-lg text-lg">loyalty</span>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Cartera de Licencias</h4>
                </div>
                <button 
                  type="button" 
                  onClick={addLicense}
                  className="text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100"
                >
                  + Agregar Licencia
                </button>
            </div>
            <div className="space-y-3">
              {licencias.map((license, index) => (
                <div key={index} className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-2 duration-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                     <input
                        placeholder="Cód. Licencia"
                        className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={license.codigo}
                        onChange={e => updateLicense(index, 'codigo', e.target.value)}
                     />
                     <input
                        placeholder="Nombre Producto"
                        className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={license.nombre}
                        onChange={e => updateLicense(index, 'nombre', e.target.value)}
                     />
                     <input
                        type="date"
                        className="bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 text-slate-500"
                        value={license.vencimiento || ''}
                        onChange={e => updateLicense(index, 'vencimiento', e.target.value)}
                     />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeLicense(index)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
              {licencias.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-xs font-bold italic bg-slate-100/50 rounded-2xl">No hay licencias asignadas</p>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Seccion 3: Vencimientos y Pólizas */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-600 bg-orange-50 p-1.5 rounded-lg text-lg">calendar_clock</span>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Vencimientos y Seguimiento</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Licencia General */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencimiento Licencia</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-[10px] font-black text-blue-600 uppercase">Permanente</span>
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                checked={formData.is_licencia_permanente}
                                onChange={e => setFormData({...formData, is_licencia_permanente: e.target.checked})}
                            />
                        </label>
                    </div>
                    {!formData.is_licencia_permanente && (
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-600 shadow-inner"
                            value={formData.vencimiento_licencia}
                            onChange={e => setFormData({...formData, vencimiento_licencia: e.target.value})}
                        />
                    )}
                    <input
                        placeholder="Cód. Comercial Licencia"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold shadow-inner"
                        value={formData.codigo_comercial_licencia}
                        onChange={e => setFormData({...formData, codigo_comercial_licencia: e.target.value})}
                    />
                </div>

                {/* Póliza */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vencimiento Póliza</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-[10px] font-black text-blue-600 uppercase">Permanente</span>
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                checked={formData.is_poliza_permanente}
                                onChange={e => setFormData({...formData, is_poliza_permanente: e.target.checked})}
                            />
                        </label>
                    </div>
                    {!formData.is_poliza_permanente && (
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-600 shadow-inner"
                            value={formData.vencimiento_poliza}
                            onChange={e => setFormData({...formData, vencimiento_poliza: e.target.value})}
                        />
                    )}
                </div>
            </div>

            {/* Sub-seccion: Otros Documentos */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Docs Integrales & Eventos</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-300 uppercase">Venc. Documentos</label>
                            <input type="date" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold" value={formData.vencimiento_documentos} onChange={e => setFormData({...formData, vencimiento_documentos: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-300 uppercase">Cód. Comercial Docs</label>
                            <input placeholder="Cód..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold" value={formData.codigo_comercial_docs} onChange={e => setFormData({...formData, codigo_comercial_docs: e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eventos Corporativos</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-300 uppercase">Venc. Eventos</label>
                            <input type="date" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold" value={formData.vencimiento_eventos} onChange={e => setFormData({...formData, vencimiento_eventos: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-300 uppercase">Cód. Comercial Ev.</label>
                            <input placeholder="Cód..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold" value={formData.codigo_comercial_eventos} onChange={e => setFormData({...formData, codigo_comercial_eventos: e.target.value})} />
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-slate-900 hover:bg-black text-white px-10 py-3 rounded-xl font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest"
          >
            {loading ? 'Guardando...' : selectedClient ? 'Actualizar Cliente' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
