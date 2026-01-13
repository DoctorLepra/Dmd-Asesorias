import React from 'react';

type AdminView = 'dashboard' | 'templates' | 'team' | 'logos' | 'submissions';

interface AdminDashboardProps {
    setView: (view: AdminView) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div 
      className={`bg-white p-6 rounded-xl shadow-lg border border-slate-200 ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all' : ''}`}
      onClick={onClick}
    >
        <div className="flex items-start justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-full">
                {icon}
            </div>
        </div>
    </div>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ setView }) => {
  return (
    <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Panel de Administración</h2>
        <p className="text-slate-600 mb-8">
            Bienvenido. Desde aquí puedes gestionar el contenido y las funcionalidades del sitio web.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Plantillas" 
                value="Gestionar" 
                icon={<span className="material-symbols-outlined text-[#212147]">article</span>}
                onClick={() => setView('templates')}
            />
            <StatCard 
                title="Logos Clientes" 
                value="Próximamente" 
                icon={<span className="material-symbols-outlined text-[#212147]">badge</span>}
            />
             <StatCard 
                title="Formularios" 
                value="Próximamente" 
                icon={<span className="material-symbols-outlined text-[#212147]">mail</span>}
            />
        </div>

        <div className="mt-12 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Guía Rápida</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600">
                <li><b>Gestionar Plantillas:</b> Haz clic en la tarjeta de "Plantillas" para añadir, editar o eliminar las plantillas descargables para los clientes.</li>
                <li><b>Contenido Futuro:</b> Próximamente podrás gestionar los miembros del equipo, los logos de clientes y ver los mensajes del formulario de contacto directamente desde aquí.</li>
                <li><b>Seguridad:</b> Recuerda que solo los usuarios con rol de `ADMINISTRATOR` o `EDITOR` pueden acceder a este panel.</li>
            </ul>
        </div>
    </div>
  );
};

export default AdminDashboard;