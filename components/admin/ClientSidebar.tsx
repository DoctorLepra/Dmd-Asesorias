'use client';

import React from 'react';
import { normalizeClientRecord, ClientContact, ClientLicense } from '../../utils/colombiaData';

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onRenovó: (
    clientId: string,
    field: 'vencimiento_licencia' | 'vencimiento_poliza' | { type: 'license'; index: number }
  ) => void;
}

export default function ClientSidebar({ isOpen, onClose, client: rawClient, onRenovó }: ClientSidebarProps) {
  if (!isOpen || !rawClient) return null;

  const client = normalizeClientRecord(rawClient);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string | null | undefined, isPermanent = false) => {
    if (isPermanent) return 'Permanente';
    if (!dateStr) return 'No registrada';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString();
  };

  const isExpired = (dateStr: string | null | undefined, isPermanent = false) => {
    if (isPermanent || !dateStr) return false;
    return new Date(`${dateStr}T00:00:00`) < new Date();
  };

  const isNearExpiry = (dateStr: string | null | undefined, isPermanent = false) => {
    if (isPermanent || !dateStr) return false;
    const diffTime = new Date(`${dateStr}T00:00:00`).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const ubicacionTexto = [client.municipio || client.ciudad, client.departamento || client.pais]
    .filter(Boolean)
    .join(', ');

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
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                ID: {client.codigo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-800 transition-all border border-slate-100 shadow-sm"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 legal-scroll">
          {/* Ubicación Geográfica */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-lg">location_on</span>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
                Datos Geográficos
              </h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                Municipio y Departamento
              </p>
              <p className="font-bold text-slate-700 text-sm">
                {ubicacionTexto || 'No registrado'}
              </p>
            </div>
          </section>

          {/* Canales de Contacto */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">contact_phone</span>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
                Contactos ({client.contactos?.length || 1})
              </h4>
            </div>
            <div className="space-y-3">
              {client.contactos?.map((c: ClientContact, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                      Celular / WhatsApp
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-700 text-sm">
                        {c.celular || 'No registrado'}
                      </span>
                      {c.celular && (
                        <button
                          onClick={() => copyToClipboard(c.celular)}
                          className="text-slate-300 hover:text-blue-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                      Correo Electrónico
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-700 text-xs truncate">
                        {c.correo || 'No registrado'}
                      </span>
                      {c.correo && (
                        <button
                          onClick={() => copyToClipboard(c.correo)}
                          className="text-slate-300 hover:text-blue-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cartera de Licencias */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-lg">inventory_2</span>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
                Cartera de Licencias
              </h4>
            </div>
            <div className="space-y-3">
              {client.licencias?.map((lic: ClientLicense, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">key</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{lic.sistema}</p>
                        <p className="text-xs font-bold text-slate-500">
                          Licencia: {lic.numero_licencia}
                        </p>
                        {lic.codigo_producto && (
                          <p className="text-[11px] font-bold text-slate-400">
                            Cód. Producto: {lic.codigo_producto}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(lic.numero_licencia)}
                      className="p-2 text-slate-300 hover:text-teal-600 transition-all"
                      title="Copiar número de licencia"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isExpired(lic.vencimiento, lic.permanente)
                            ? 'bg-red-500'
                            : isNearExpiry(lic.vencimiento, lic.permanente)
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                      ></div>
                      <span
                        className={`text-[10px] font-black uppercase ${
                          isExpired(lic.vencimiento, lic.permanente)
                            ? 'text-red-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {lic.permanente
                          ? 'Licencia Permanente'
                          : `Expira: ${formatDate(lic.vencimiento, lic.permanente)}`}
                      </span>
                    </div>
                    {!lic.permanente && lic.vencimiento && (
                      <button
                        onClick={() => onRenovó(client.id, { type: 'license', index: idx })}
                        className="bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-600 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                      >
                        Renovar (+1 Año)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Póliza */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-lg">verified_user</span>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
                Póliza
              </h4>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isExpired(client.vencimiento_poliza) ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  ></div>
                  <p className="text-sm font-bold text-slate-700">Fecha de vencimiento</p>
                </div>
                <span className="text-xs font-black uppercase text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                  {formatDate(client.vencimiento_poliza)}
                </span>
              </div>
              {client.vencimiento_poliza && (
                <button
                  onClick={() => onRenovó(client.id, 'vencimiento_poliza')}
                  className="w-full bg-white hover:bg-slate-900 hover:text-white text-slate-600 text-[10px] font-black uppercase py-2.5 rounded-xl transition-all border border-slate-200 shadow-sm"
                >
                  Renovar Póliza (+1 Año)
                </button>
              )}
            </div>
          </section>

          {/* Bolsas de Documentos */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 text-lg">description</span>
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">
                Bolsas de Documentos
              </h4>
            </div>
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-5 shadow-inner">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Proveedor
                </span>
                <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
                  {client.proveedor_bolsa || 'No especificado'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Doc Integrales</span>
                  <span>Vencimiento</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    {client.doc_integrales ? `${client.doc_integrales} docs` : 'No aplica'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {formatDate(client.vencimiento_documentos)}
                  </span>
                </div>
              </div>

              {client.proveedor_bolsa !== 'Insoft' && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Eventos</span>
                    <span>Vencimiento</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      {client.eventos_bolsa ? `${client.eventos_bolsa} eventos` : 'No aplica'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formatDate(client.vencimiento_eventos)}
                    </span>
                  </div>
                </div>
              )}
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
