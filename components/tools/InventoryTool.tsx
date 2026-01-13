import React, { useState, useRef } from 'react';
import { geminiService } from '../../services/geminiService.ts';
import LoadingSpinner from '../common/LoadingSpinner.tsx';
import * as XLSX from 'xlsx';

interface InventoryItem {
  code: string;
  quantity: number;
  cost: number;
}

const InventoryTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string>('');
  
  // Configuration for Excel generation
  const [config, setConfig] = useState({
    bodega: '01',
    centroCostos: '001',
    nitTercero: '999999999',
    detalleOperacion: 'Ajuste Automático por IA'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
        setError("Solo se permiten imágenes (JPG, PNG, WEBP).");
        return;
      }
      setFile(selectedFile);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const processImage = async () => {
    if (!preview || !file) return;
    setIsLoading(true);
    setError('');

    try {
      const base64 = preview.split(',')[1];
      const extractedItems = await geminiService.extractInventoryData({ 
        base64, 
        mimeType: file.type 
      });
      
      if (extractedItems.length === 0) {
        setError("La IA no pudo detectar items en la imagen. Intenta con una imagen más clara.");
      } else {
        setItems(extractedItems);
        setStep(2);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al procesar la imagen: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof InventoryItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addNewItem = () => {
    setItems([...items, { code: '', quantity: 0, cost: 0 }]);
  };

  const downloadExcel = () => {
    // Estructura plana estándar compatible con importadores contables
    // Ajustar cabeceras según requerimientos específicos de Contapyme
    const wsData = [
      ["Bodega", "Centro Costos", "Fecha", "Nit Tercero", "Referencia", "Cantidad", "Valor Unitario", "Detalle"], // Header Row
      ...items.map(item => [
        config.bodega,
        config.centroCostos,
        new Date().toISOString().split('T')[0], // YYYY-MM-DD
        config.nitTercero,
        item.code,
        item.quantity,
        item.cost,
        config.detalleOperacion
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AjusteInventario");
    
    // Generate file
    XLSX.writeFile(wb, "Importar_Contapyme_Ajuste.xlsx");
    setStep(3);
  };

  const resetTool = () => {
    setFile(null);
    setPreview(null);
    setItems([]);
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generador de Ajustes de Inventario</h2>
        <p className="text-slate-600 mb-6">
          Sube una foto de tu conteo físico o reporte. La IA extraerá los datos y generará un archivo Excel listo para importar en Contapyme.
        </p>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
             <div
                onClick={() => fileInputRef.current?.click()}
                className="relative block w-full border-2 border-slate-300 border-dashed rounded-lg p-12 text-center hover:border-[#212147] cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                />
                {preview ? (
                   <img src={preview} alt="Preview" className="mx-auto h-64 object-contain rounded shadow-sm" />
                ) : (
                    <>
                        <span className="material-symbols-outlined text-5xl text-slate-400 mx-auto">add_a_photo</span>
                        <span className="mt-2 block text-sm font-medium text-slate-600">
                        Haz clic para subir foto del reporte
                        </span>
                        <p className="text-xs text-slate-500">Formatos soportados: JPG, PNG</p>
                    </>
                )}
              </div>
              
              {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</p>}

              <div className="flex justify-end">
                <button
                    onClick={processImage}
                    disabled={!file || isLoading}
                    className="flex items-center bg-[#212147] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? <LoadingSpinner /> : <><span className="material-symbols-outlined mr-2">smart_toy</span> Procesar con IA</>}
                </button>
              </div>
          </div>
        )}

        {/* STEP 2: VERIFY DATA */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Bodega</label>
                    <input type="text" value={config.bodega} onChange={e => setConfig({...config, bodega: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-1 text-sm"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Centro Costos</label>
                    <input type="text" value={config.centroCostos} onChange={e => setConfig({...config, centroCostos: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-1 text-sm"/>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Nit Tercero</label>
                    <input type="text" value={config.nitTercero} onChange={e => setConfig({...config, nitTercero: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-1 text-sm"/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Detalle Operación</label>
                    <input type="text" value={config.detalleOperacion} onChange={e => setConfig({...config, detalleOperacion: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-1 text-sm"/>
                </div>
             </div>

             <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            <th className="px-4 py-3">Código / Referencia</th>
                            <th className="px-4 py-3">Cantidad</th>
                            <th className="px-4 py-3">Costo Unitario</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        value={item.code} 
                                        onChange={(e) => handleItemChange(index, 'code', e.target.value)}
                                        className="w-full border-gray-300 rounded p-1 focus:ring-[#212147] focus:border-[#212147]"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                     <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                        className="w-full border-gray-300 rounded p-1 focus:ring-[#212147] focus:border-[#212147]"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                     <input 
                                        type="number" 
                                        value={item.cost} 
                                        onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value))}
                                        className="w-full border-gray-300 rounded p-1 focus:ring-[#212147] focus:border-[#212147]"
                                    />
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => deleteItem(index)} className="text-red-500 hover:text-red-700">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             
             <button onClick={addNewItem} className="text-sm text-[#212147] font-bold flex items-center hover:underline">
                <span className="material-symbols-outlined mr-1">add</span> Agregar Fila
             </button>

             <div className="flex justify-between pt-4 border-t border-slate-200">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800">
                    Atrás
                </button>
                <button
                    onClick={downloadExcel}
                    className="flex items-center bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-all"
                >
                    <span className="material-symbols-outlined mr-2">download</span> Descargar Excel
                </button>
             </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
            <div className="text-center py-12 animate-fade-in">
                <span className="material-symbols-outlined text-6xl text-green-500 mb-4">check_circle</span>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Archivo Generado!</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Tu archivo Excel se ha descargado. Ahora ve a Contapyme, entra a <strong>Operaciones &gt; Importar desde Excel</strong> y selecciona este archivo.
                </p>
                <button
                    onClick={resetTool}
                    className="bg-[#212147] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#1b1b3a] transition-all"
                >
                    Procesar otro archivo
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default InventoryTool;