import React from 'react';

const ConfirmationPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 h-[calc(100vh-200px)]">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200 text-center">
        <span className="material-symbols-outlined mx-auto h-12 w-12 text-[#212147] animate-pulse" style={{fontSize: '48px'}}>auto_awesome</span>
        <h2 className="text-2xl font-bold text-slate-900">Verificando tu cuenta...</h2>
        <p className="text-slate-600">
          Un momento por favor, estamos confirmando tu registro. Serás redirigido automáticamente en unos segundos.
        </p>
        <div className="flex justify-center items-center pt-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#212147]">progress_activity</span>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;