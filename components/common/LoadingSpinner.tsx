import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center" aria-label="Cargando...">
      <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
      <span className="ml-2">Procesando...</span>
    </div>
  );
};

export default LoadingSpinner;