import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService.ts';
import LoadingSpinner from './common/LoadingSpinner.tsx';

interface ImageState {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

const SupportTab: React.FC = () => {
  const [problem, setProblem] = useState<string>('');
  const [image, setImage] = useState<ImageState | null>(null);
  const [solution, setSolution] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Por favor, sube un archivo de imagen (JPG o PNG).');
      return;
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. El tamaño máximo es 4MB.');
      return;
    }
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      const base64 = preview.split(',')[1];
      setImage({ file, preview, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) {
      setError('Por favor, describe tu problema antes de continuar.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSolution('');

    const imageInput = image ? { base64: image.base64, mimeType: image.mimeType } : undefined;
    const generatedSolution = await geminiService.getSolution(problem, imageInput);
    
    if (generatedSolution.startsWith('Lo sentimos')) {
      setError(generatedSolution);
    } else {
      setSolution(generatedSolution);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Asistente de Soporte Inteligente</h2>
        <p className="text-slate-600 mb-4">
          Describe el problema y, si es posible, adjunta una captura de pantalla del error para obtener una solución más precisa.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="problem-description" className="block text-sm font-medium text-slate-700 mb-1">Descripción del Problema</label>
            <textarea
              id="problem-description"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Ej: No puedo generar el reporte de IVA del último trimestre. Me aparece un error..."
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#212147] focus:border-[#212147] transition-shadow duration-200"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Adjuntar captura de pantalla (Opcional)</label>
            {image ? (
              <div className="relative group w-fit">
                <img src={image.preview} alt="Vista previa del error" className="max-w-xs h-auto rounded-lg border border-slate-300" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  aria-label="Eliminar imagen"
                >
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative block w-full border-2 border-slate-300 border-dashed rounded-lg p-6 text-center hover:border-[#212147] cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
                <span className="material-symbols-outlined text-4xl text-slate-400 mx-auto">image</span>
                <span className="mt-2 block text-sm font-medium text-slate-600">
                  Haz clic para subir una imagen
                </span>
                <p className="text-xs text-slate-500">PNG o JPG (Max. 4MB)</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !problem.trim()}
            className="w-full flex items-center justify-center bg-[#212147] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? <LoadingSpinner /> : <><span className="material-symbols-outlined mr-2">auto_awesome</span><span>Obtener Solución</span></>}
          </button>
        </form>
      </div>

      {solution && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Solución Sugerida</h3>
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
            {solution}
          </div>
          <p className="mt-6 text-sm text-slate-500 italic">
            Si esta solución no resuelve tu problema, por favor contacta a uno de nuestros asesores especializados.
          </p>
        </div>
      )}
    </div>
  );
};

export default SupportTab;