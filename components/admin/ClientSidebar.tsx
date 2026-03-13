'use client';

import React from 'react';

interface License {
  codigo: string;
  nombre: string;
  vencimiento?: string | null;
}

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onRenovó: (clientId: string, field: 'vencimiento_licencia' | 'vencimiento_poliza' | { type: 'license', index: number }) => void;
}

export default function ClientSidebar({ isOpen, onClose, client, onRenovó }: ClientSidebarProps) {
  
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    // Opcional: Mostrar tostada de éxito
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Permanente';
    return new Date(dateStr).toLocaleDateString();
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isNearExpiry = (dateStr: string | null) => {
    if (!dateStr) return false;
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-fade-in" 
        onClick={onClose}
      ></div>
      
      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <span className="material-symbols-outlined text-3xl">corporate_fare</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 leading-tight">{client.nombre}</h3>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{client.codigo}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-800 transition-all border border-slate-100 shadow-sm">
             <span className="material-symbols-outlined">chevron_right</span>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 legal-scroll">
          
          {/* Seccion 1: Contacto Principal */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">contact_phone</span>
                <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Canales de Contacto</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:border-blue-200 group">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Celular / WhatsApp</p>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{client.celular || 'No registrado'}</span>
                    {client.celular && (
                        <button onClick={() => copyToClipboard(client.celular)} className="text-slate-300 hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                    )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Ubicación</p>
                <p className="font-bold text-slate-700 text-sm">{client.ciudad}, {client.pais}</p>
              </div>
            </div>
          </section>

          {/* Seccion 2: Carteras y Licencias */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-lg">inventory_2</span>
                <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Licenciamiento Activo</h4>
            </div>
            <div className="space-y-4">
              {client.licencias?.map((lic: any, idx: number) => (
                <div key={idx} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-4 group hover:shadow-md transition-all">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">key</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{lic.nombre}</p>
                          <p className="text-xs font-bold text-slate-400 tracking-tighter">{lic.codigo}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(lic.codigo)}
                        className="p-2 text-slate-300 hover:text-teal-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">content_copy</span>
                      </button>
                   </div>
                   
                   <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isExpired(lic.vencimiento) ? 'bg-red-500' : isNearExpiry(lic.vencimiento) ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        <span className={`text-[10px] font-black uppercase ${isExpired(lic.vencimiento) ? 'text-red-600' : 'text-slate-400'}`}>
                          Expira: {formatDate(lic.vencimiento)}
                        </span>
                      </div>
                      {lic.vencimiento && (
                        <button 
                          onClick={() => onRenovó(client.id, { type: 'license', index: idx })}
                          className="bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-600 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                        >
                          Renovar
                        </button>
                      )}
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seccion 3: Vencimientos y Renovación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-lg">history_toggle_off</span>
                <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Línea de Tiempo y Pólizas</h4>
            </div>
            
            <div className="space-y-4">
               {/* Item Vencimiento Licencia */}
               <div className="flex items-start gap-4">
                  <div className={`mt-1.5 h-2 w-2 rounded-full ${isExpired(client.vencimiento_licencia) ? 'bg-red-500 animate-pulse' : isNearExpiry(client.vencimiento_licencia) ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">Vencimiento Licencia</p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isExpired(client.vencimiento_licencia) ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                            {formatDate(client.vencimiento_licencia)}
                        </span>
                    </div>
                    {client.vencimiento_licencia && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onRenovó(client.id, 'vencimiento_licencia')}
                                className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-[10px] font-black uppercase py-2 rounded-xl transition-all"
                            >
                                Marcar Renovó (+1 Año)
                            </button>
                            <button className="flex-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-[10px] font-black uppercase py-2 rounded-xl transition-all">
                                No Renovó
                            </button>
                        </div>
                    )}
                  </div>
               </div>

               {/* Item Póliza */}
               <div className="flex items-start gap-4">
                  <div className={`mt-1.5 h-2 w-2 rounded-full ${isExpired(client.vencimiento_poliza) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">Vencimiento Póliza</p>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {formatDate(client.vencimiento_poliza)}
                        </span>
                    </div>
                    {client.vencimiento_poliza && (
                        <button 
                            onClick={() => onRenovó(client.id, 'vencimiento_poliza')}
                            className="w-full bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 text-[10px] font-black uppercase py-2 rounded-xl transition-all border border-slate-200 shadow-sm"
                        >
                            Renovar Póliza (+1 Año)
                        </button>
                    )}
                  </div>
               </div>
            </div>
          </section>

          {/* Seccion 4: Documentos Integrales */}
           <section className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-lg">description</span>
                <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">Documentación Integral</h4>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6 shadow-inner">
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Docs & Código Comercial</span>
                        <span>Expiración</span>
                    </div>
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">{client.codigo_comercial_docs || 'S/N'}</span>
                            <button onClick={() => copyToClipboard(client.codigo_comercial_docs)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-purple-600 transition-all">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{formatDate(client.vencimiento_documentos)}</span>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Eventos Corporativos</span>
                        <span>Fecha</span>
                    </div>
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">{client.codigo_comercial_eventos || 'S/N'}</span>
                            <button onClick={() => copyToClipboard(client.codigo_comercial_eventos)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-600 transition-all">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{formatDate(client.vencimiento_eventos)}</span>
                    </div>
                </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
             <button 
                onClick={onClose}
                className="w-full bg-white border border-slate-200 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm active:scale-95"
             >
                Cerrar Detalle
             </button>
        </div>
      </div>
    </div>
  );
}
