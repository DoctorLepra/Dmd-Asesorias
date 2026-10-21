'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  COLOMBIA_DEPARTAMENTOS,
  SISTEMAS_LICENCIA,
  PROVEEDORES_BOLSA,
  PAQUETES_DOCUMENTOS,
  ClientContact,
  ClientLicense,
  normalizeClientRecord
} from '../../utils/colombiaData';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: any | null;
  onSaved?: () => void;
}

const createEmptyLicense = (): ClientLicense => ({
  sistema: 'ContaPyme',
  numero_licencia: '',
  codigo_producto: '',
  vencimiento: '',
  permanente: false,
});

const createEmptyContact = (): ClientContact => ({
  celular: '',
  correo: '',
});

export default function ClientModal({ isOpen, onClose, selectedClient, onSaved }: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    identificacion: '',
    nombre: '',
    departamento: '',
    municipio: '',
    vencimiento_poliza: '',
    proveedor_bolsa: '',
    doc_integrales: '',
    vencimiento_documentos: '',
    eventos_bolsa: '',
    vencimiento_eventos: '',
  });

  const [contactos, setContactos] = useState<ClientContact[]>([createEmptyContact()]);
  const [licencias, setLicencias] = useState<ClientLicense[]>([createEmptyLicense()]);

  useEffect(() => {
    setErrorMessage(null);
    if (selectedClient) {
      const normalized = normalizeClientRecord(selectedClient);
      setFormData({
        identificacion: String(normalized.codigo || '').replace(/\D/g, ''),
        nombre: (normalized.nombre || '').slice(0, 255),
        departamento: normalized.departamento || '',
        municipio: normalized.municipio || '',
        vencimiento_poliza: normalized.vencimiento_poliza || '',
        proveedor_bolsa: normalized.proveedor_bolsa || '',
        doc_integrales: normalized.doc_integrales || '',
        vencimiento_documentos: normalized.vencimiento_documentos || '',
        eventos_bolsa: normalized.proveedor_bolsa === 'Insoft' ? '' : (normalized.eventos_bolsa || ''),
        vencimiento_eventos: normalized.proveedor_bolsa === 'Insoft' ? '' : (normalized.vencimiento_eventos || ''),
      });
      setContactos(
        normalized.contactos && normalized.contactos.length > 0
          ? normalized.contactos
          : [createEmptyContact()]
      );
      setLicencias(
        normalized.licencias && normalized.licencias.length > 0
          ? normalized.licencias.map((lic: ClientLicense) => ({
              sistema: lic.sistema || 'ContaPyme',
              numero_licencia: lic.numero_licencia || '',
              codigo_producto: lic.codigo_producto || '',
              vencimiento: lic.permanente ? '' : (lic.vencimiento || ''),
              permanente: Boolean(lic.permanente),
            }))
          : [createEmptyLicense()]
      );
    } else {
      setFormData({
        identificacion: '',
        nombre: '',
        departamento: '',
        municipio: '',
        vencimiento_poliza: '',
        proveedor_bolsa: '',
        doc_integrales: '',
        vencimiento_documentos: '',
        eventos_bolsa: '',
        vencimiento_eventos: '',
      });
      setContactos([createEmptyContact()]);
      setLicencias([createEmptyLicense()]);
    }
  }, [selectedClient, isOpen]);

  const municipiosDisponibles = useMemo(() => {
    const found = COLOMBIA_DEPARTAMENTOS.find(d => d.departamento === formData.departamento);
    return found ? found.municipios : [];
  }, [formData.departamento]);

  const handleDepartamentoChange = (nuevoDepartamento: string) => {
    setFormData(prev => ({
      ...prev,
      departamento: nuevoDepartamento,
      municipio: '',
    }));
  };

  const handleProveedorChange = (nuevoProveedor: string) => {
    setFormData(prev => ({
      ...prev,
      proveedor_bolsa: nuevoProveedor,
      eventos_bolsa: nuevoProveedor === 'Insoft' ? '' : prev.eventos_bolsa,
      vencimiento_eventos: nuevoProveedor === 'Insoft' ? '' : prev.vencimiento_eventos,
    }));
  };

  // Gestión de Contactos
  const addContact = () => {
    setContactos(prev => [...prev, createEmptyContact()]);
  };

  const removeContact = (index: number) => {
    if (contactos.length <= 1) return;
    setContactos(prev => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ClientContact, value: string) => {
    setContactos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Gestión de Licencias
  const addLicense = () => {
    setLicencias(prev => [...prev, createEmptyLicense()]);
  };

  const removeLicense = (index: number) => {
    if (licencias.length <= 1) return;
    setLicencias(prev => prev.filter((_, i) => i !== index));
  };

  const updateLicense = (index: number, field: keyof ClientLicense, value: any) => {
    setLicencias(prev => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      if (field === 'permanente' && value === true) {
        current.vencimiento = '';
      }
      updated[index] = current;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const isInsoft = formData.proveedor_bolsa === 'Insoft';

    const formattedLicenses: ClientLicense[] = licencias.map(lic => ({
      sistema: lic.sistema,
      numero_licencia: lic.numero_licencia.trim(),
      codigo_producto: lic.codigo_producto.trim(),
      vencimiento: lic.permanente ? null : (lic.vencimiento || null),
      permanente: Boolean(lic.permanente),
      // Retrocompatibilidad con estructura previa
      codigo: lic.numero_licencia.trim(),
      nombre: lic.sistema,
    }));

    const firstExpiringLicense = formattedLicenses.find(l => !l.permanente && l.vencimiento);
    const primaryContact = contactos[0] || { celular: '', correo: '' };

    const metadataJson = JSON.stringify({
      departamento: formData.departamento,
      municipio: formData.municipio,
      correo: primaryContact.correo.trim(),
      contactos,
      proveedor_bolsa: formData.proveedor_bolsa || null,
      doc_integrales: formData.doc_integrales || null,
      eventos_bolsa: isInsoft ? null : (formData.eventos_bolsa || null),
    });

    const basePayload = {
      codigo: formData.identificacion.trim(),
      nombre: formData.nombre.trim().slice(0, 255),
      pais: formData.departamento,
      ciudad: formData.municipio,
      celular: primaryContact.celular.trim(),
      licencias: formattedLicenses,
      vencimiento_licencia: firstExpiringLicense ? firstExpiringLicense.vencimiento : null,
      codigo_comercial_licencia: metadataJson,
      vencimiento_poliza: formData.vencimiento_poliza || null,
      vencimiento_documentos: formData.vencimiento_documentos || null,
      codigo_comercial_docs: formData.proveedor_bolsa
        ? `${formData.proveedor_bolsa}:${formData.doc_integrales || ''}`
        : (formData.doc_integrales || ''),
      vencimiento_eventos: isInsoft ? null : (formData.vencimiento_eventos || null),
      codigo_comercial_eventos: isInsoft ? '' : (formData.eventos_bolsa || ''),
    };

    const extendedPayload = {
      ...basePayload,
      departamento: formData.departamento,
      municipio: formData.municipio,
      correo: primaryContact.correo.trim(),
      contactos,
      proveedor_bolsa: formData.proveedor_bolsa || null,
      doc_integrales: formData.doc_integrales || null,
      eventos_bolsa: isInsoft ? null : (formData.eventos_bolsa || null),
    };

    try {
      if (selectedClient) {
        let { error } = await supabase
          .from('clientes')
          .update(extendedPayload)
          .eq('id', selectedClient.id);

        if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
          const fallbackRes = await supabase
            .from('clientes')
            .update(basePayload)
            .eq('id', selectedClient.id);
          error = fallbackRes.error;
        }
        if (error) throw error;
      } else {
        let { error } = await supabase
          .from('clientes')
          .insert([extendedPayload]);

        if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
          const fallbackRes = await supabase
            .from('clientes')
            .insert([basePayload]);
          error = fallbackRes.error;
        }
        if (error) throw error;
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving client:', err);
      if (err?.code === '23505') {
        setErrorMessage('Ya existe un cliente registrado con ese número de identificación.');
      } else {
        setErrorMessage(err?.message || 'Ocurrió un error al guardar el cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isInsoft = formData.proveedor_bolsa === 'Insoft';

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
            <h3 className="text-2xl font-black text-slate-800">
              {selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              Formulario de registro corporativo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <form
          id="client-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-8 legal-scroll"
        >
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Información Básica */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg text-lg">
                person_book
              </span>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                Información Básica
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Identificación <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  title="Ingrese únicamente números"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ej: 900123456"
                  value={formData.identificacion}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      identificacion: e.target.value.replace(/\D/g, ''),
                    })
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Nombre de la empresa <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-300">
                    {formData.nombre.length}/255
                  </span>
                </div>
                <input
                  required
                  maxLength={255}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ej: Inversiones Globales S.A.S."
                  value={formData.nombre}
                  onChange={e =>
                    setFormData({ ...formData, nombre: e.target.value.slice(0, 255) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.departamento}
                  onChange={e => handleDepartamentoChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="">Seleccione un departamento...</option>
                  {COLOMBIA_DEPARTAMENTOS.map(item => (
                    <option key={item.departamento} value={item.departamento}>
                      {item.departamento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={!formData.departamento}
                  value={formData.municipio}
                  onChange={e => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.departamento
                      ? 'Seleccione un municipio...'
                      : 'Primero seleccione un departamento'}
                  </option>
                  {municipiosDisponibles.map(mun => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {contactos.map((contacto, index) => (
                <div
                  key={index}
                  className="flex items-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-2 duration-200"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Celular / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="Ej: 3101234567"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={contacto.celular}
                        onChange={e => updateContact(index, 'celular', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="Ej: contacto@empresa.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={contacto.correo}
                        onChange={e => updateContact(index, 'correo', e.target.value)}
                      />
                    </div>
                  </div>
                  {contactos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors mb-0.5"
                      title="Eliminar contacto"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addContact}
                  className="text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100 bg-white shadow-sm"
                >
                  + Agregar Contacto
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. Cartera de Licencias */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-1.5 rounded-lg text-lg">
                  loyalty
                </span>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                  Cartera de Licencias
                </h4>
              </div>
              <button
                type="button"
                onClick={addLicense}
                className="text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-blue-100"
              >
                + Agregar Licencia
              </button>
            </div>

            <div className="space-y-4">
              {licencias.map((license, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-right-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                      Licencia #{index + 1}
                    </span>
                    {licencias.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLicense(index)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        title="Eliminar licencia"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Sistema <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={license.sistema}
                        onChange={e => updateLicense(index, 'sistema', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {SISTEMAS_LICENCIA.map(sis => (
                          <option key={sis} value={sis}>
                            {sis}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Número de licencia <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        placeholder="Ej: 123456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={license.numero_licencia}
                        onChange={e => updateLicense(index, 'numero_licencia', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Código del producto
                      </label>
                      <input
                        placeholder="Ej: CCOCA395"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        value={license.codigo_producto}
                        onChange={e => updateLicense(index, 'codigo_producto', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Fecha de vencimiento
                      </label>
                      <input
                        type="date"
                        disabled={license.permanente}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                        value={license.permanente ? '' : (license.vencimiento || '')}
                        onChange={e => updateLicense(index, 'vencimiento', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center h-[42px] px-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none w-full">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          checked={license.permanente}
                          onChange={e => updateLicense(index, 'permanente', e.target.checked)}
                        />
                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                          Permanente (Sin fecha de vencimiento)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 5. Póliza */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-orange-600 bg-orange-50 p-1.5 rounded-lg text-lg">
                verified_user
              </span>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                Póliza
              </h4>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                value={formData.vencimiento_poliza}
                onChange={e => setFormData({ ...formData, vencimiento_poliza: e.target.value })}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 6. Bolsas de Documentos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-1.5 rounded-lg text-lg">
                description
              </span>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                Bolsas de Documentos
              </h4>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Proveedor */}
              <div className="max-w-xs space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Proveedor
                </label>
                <select
                  value={formData.proveedor_bolsa}
                  onChange={e => handleProveedorChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Seleccione proveedor...</option>
                  {PROVEEDORES_BOLSA.map(prov => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Doc Integrales */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Documentos Integrales
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Doc Integrales
                    </label>
                    <select
                      value={formData.doc_integrales}
                      onChange={e => setFormData({ ...formData, doc_integrales: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Seleccione cantidad...</option>
                      {PAQUETES_DOCUMENTOS.map(cant => (
                        <option key={cant} value={cant}>
                          {cant}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                      value={formData.vencimiento_documentos}
                      onChange={e =>
                        setFormData({ ...formData, vencimiento_documentos: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Eventos */}
                <div
                  className={`p-4 rounded-2xl border space-y-4 transition-all ${
                    isInsoft
                      ? 'bg-slate-100/80 border-slate-200 opacity-60'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Eventos
                    </p>
                    {isInsoft && (
                      <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                        No aplica para Insoft
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Eventos
                    </label>
                    <select
                      disabled={isInsoft}
                      value={isInsoft ? '' : formData.eventos_bolsa}
                      onChange={e => setFormData({ ...formData, eventos_bolsa: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione cantidad...</option>
                      {PAQUETES_DOCUMENTOS.map(cant => (
                        <option key={cant} value={cant}>
                          {cant}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      disabled={isInsoft}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      value={isInsoft ? '' : formData.vencimiento_eventos}
                      onChange={e =>
                        setFormData({ ...formData, vencimiento_eventos: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="client-form"
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
