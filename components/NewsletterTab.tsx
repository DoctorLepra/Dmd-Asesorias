import React, { useState } from 'react';
import { geminiService } from '../services/geminiService.ts';
import LoadingSpinner from './common/LoadingSpinner.tsx';

const NewsletterTab: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [newsletter, setNewsletter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Por favor, introduce un tema para el boletín.');
      return;
    }
    setIsLoading(true);
    setError('');
    setNewsletter('');

    const generatedNewsletter = await geminiService.generateNewsletter(topic);
    if (generatedNewsletter.startsWith('Lo sentimos')) {
        setError(generatedNewsletter);
    } else {
        setNewsletter(generatedNewsletter);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generador de Boletines</h2>
        <p className="text-slate-600 mb-4">
          Introduce un tema o una lista de novedades y la IA creará un borrador profesional para tu próximo boletín informativo.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Novedades de la versión 4.2, mejoras en reportes..."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#212147] focus:border-[#212147] transition-shadow duration-200"
            disabled={isLoading}
          />
           {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="w-full flex items-center justify-center bg-[#212147] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? <LoadingSpinner /> : <><span className="material-symbols-outlined mr-2">auto_awesome</span><span>Generar Boletín</span></>}
          </button>
        </form>
      </div>

      {newsletter && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Borrador del Boletín</h3>
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
            {newsletter}
          </div>
          <p className="mt-6 text-sm text-slate-500 italic">
            Este es un borrador generado por IA. Por favor, revísalo y ajústalo según sea necesario antes de publicarlo.
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsletterTab;