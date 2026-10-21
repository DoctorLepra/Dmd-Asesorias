'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Profile } from '../../App';
import ClientModal from './ClientModal';
import ClientSidebar from './ClientSidebar';
import {
  ClientContact,
  ClientLicense,
  normalizeClientRecord
} from '../../utils/colombiaData';

export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  pais: string;
  ciudad: string;
  departamento?: string;
  municipio?: string;
  celular: string;
  correo?: string;
  contactos?: ClientContact[];
  licencias: ClientLicense[];
  vencimiento_licencia: string | null;
  codigo_comercial_licencia: string;
  vencimiento_poliza: string | null;
  proveedor_bolsa?: string;
  doc_integrales?: string;
  vencimiento_documentos: string | null;
  codigo_comercial_docs: string;
  eventos_bolsa?: string;
  vencimiento_eventos: string | null;
  codigo_comercial_eventos: string;
  created_at: string;
}

interface ClientManagerProps {
  profile: Profile;
}

export default function ClientManager({ profile }: ClientManagerProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const itemsPerPage = 10;

  useEffect(() => {
    fetchClientes();
    const subscription = subscribeToClientes();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (data) {
      const normalized = data.map(item => normalizeClientRecord(item));
      setClientes(normalized);
      if (selectedClient) {
        const updatedSelected = normalized.find(c => c.id === selectedClient.id);
        if (updatedSelected) setSelectedClient(updatedSelected);
      }
    }
    setLoading(false);
  };

  const subscribeToClientes = () => {
    return supabase
      .channel('public:clientes')
      .on(
        'postgres_changes',
        { event: '*', table: 'clientes', schema: 'public' },
        () => {
          fetchClientes();
        }
      )
      .subscribe();
  };

  const handleRenovó = async (
    clientId: string,
    field: 'vencimiento_licencia' | 'vencimiento_poliza' | { type: 'license'; index: number }
  ) => {
    const client = clientes.find(c => c.id === clientId);
    if (!client) return;

    const updateData: any = {};

    if (typeof field === 'string') {
      const currentDate = client[field] ? new Date(client[field]!) : new Date();
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      updateData[field] = currentDate.toISOString().split('T')[0];
    } else if (field.type === 'license') {
      const newLicenses = [...client.licencias];
      const targetLicense = newLicenses[field.index];
      const currentDate = targetLicense.vencimiento ? new Date(targetLicense.vencimiento) : new Date();
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      newLicenses[field.index] = {
        ...targetLicense,
        permanente: false,
        vencimiento: currentDate.toISOString().split('T')[0],
      };
      updateData.licencias = newLicenses;
    }

    const { error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', clientId);

    if (!error) {
      fetchClientes();
    }
  };

  // Filtrado y Búsqueda
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch =
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    if (monthFilter === 'all') return matchesSearch;

    const checkMonth = (dateStr: string | null | undefined) => {
      if (!dateStr) return false;
      const month = new Date(dateStr).getMonth() + 1;
      return month.toString() === monthFilter;
    };

    const matchesMonth =
      checkMonth(cliente.vencimiento_licencia) ||
      checkMonth(cliente.vencimiento_poliza) ||
      checkMonth(cliente.vencimiento_documentos) ||
      checkMonth(cliente.vencimiento_eventos) ||
      cliente.licencias.some(lic => !lic.permanente && checkMonth(lic.vencimiento));

    return matchesSearch && matchesMonth;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Clientes</h2>
          <p className="text-slate-500 font-medium">Administra el licenciamiento y vencimientos corporativos.</p>
        </div>
        <button
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros Container */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por identificación o nombre de empresa..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
            Vencimientos en:
          </label>
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-inner"
          >
            <option value="all">Cualquier Mes</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>
      </div>

      {/* Tabla Premium */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Identificación
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Empresa
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ubicación
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Contacto Principal
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                    Cargando clientes...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                currentItems.map(cliente => {
                  const ubicacionTexto = [cliente.municipio || cliente.ciudad, cliente.departamento || cliente.pais]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr
                      key={cliente.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedClient(cliente);
                        setIsSidebarOpen(true);
                      }}
                    >
                      <td className="px-6 py-4 font-bold text-blue-600 text-sm">{cliente.codigo}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{cliente.nombre}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                            {cliente.licencias?.length || 0} licencia(s)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {ubicacionTexto || 'Sin ubicación'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm whitespace-nowrap">
                            {cliente.celular || 'Sin celular'}
                          </span>
                          {cliente.correo && (
                            <span className="text-xs text-slate-400 font-medium">{cliente.correo}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedClient(cliente);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-30 enabled:hover:bg-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-30 enabled:hover:bg-white transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedClient={selectedClient}
          onSaved={fetchClientes}
        />
      )}

      {isSidebarOpen && selectedClient && (
        <ClientSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          client={selectedClient}
          onRenovó={handleRenovó}
        />
      )}
    </div>
  );
}
