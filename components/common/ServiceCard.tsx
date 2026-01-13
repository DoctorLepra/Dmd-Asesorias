
import React from 'react';

export const ServiceCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick?: () => void; }> = ({ icon, title, description, onClick }) => (
    <div className="group bg-[#212147] p-8 rounded-2xl border border-[#212147] flex flex-col text-center items-center h-full transition-all duration-300 hover:scale-105 hover:bg-white">
      <div className="text-4xl text-white mb-4 group-hover:text-slate-800 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-slate-900 transition-colors duration-300">{title}</h3>
      <p className="text-white/80 text-sm mb-6 flex-grow group-hover:text-slate-600 transition-colors duration-300">{description}</p>
      <button onClick={onClick} className="mt-auto bg-transparent border border-white text-white font-semibold py-2 px-6 rounded-[150px] group-hover:bg-[#212147] group-hover:text-white group-hover:border-[#212147] transition-colors duration-300 text-sm">
        Conocer más
      </button>
    </div>
);
