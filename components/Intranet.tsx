import React, { useState } from 'react';
import Templates from './Templates.tsx';
import AdminDashboard from './admin/AdminDashboard.tsx';
import TemplateManager from './admin/TemplateManager.tsx';
import WebsiteManager from './admin/WebsiteManager.tsx';
import UserManager from './admin/UserManager.tsx';
import AIAssistant from './AIAssistant.tsx';
import AIManager from './admin/AIManager.tsx';
import InventoryTool from './tools/InventoryTool.tsx';
import { Profile } from '../App.tsx';

interface IntranetProps {
    profile: Profile;
}

type ClientView = 'dashboard' | 'templates' | 'support_ia' | 'inventory_tool';
type AdminView = 'dashboard' | 'templates' | 'website' | 'users' | 'submissions' | 'ai_assistant';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
            ? 'bg-slate-100 text-[#212147]'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

const ClientDashboard: React.FC<{ profile: Profile, setView: (view: ClientView) => void }> = ({ profile, setView }) => (
    <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Bienvenido, {profile.full_name.split(' ')[0]}</h2>
        <p className="text-slate-600 mb-8">
            Aquí encontrarás recursos y herramientas para gestionar tu software.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div 
                className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => setView('support_ia')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('support_ia')}
            >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">auto_awesome</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Soporte con IA</h3>
                <p className="text-slate-600 text-sm flex-grow">Obtén soluciones rápidas a tus problemas con nuestro asistente virtual inteligente.</p>
                <span className="mt-4 text-sm font-bold text-[#212147] flex items-center">
                    Consultar Ahora 
                    <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                </span>
            </div>
             <div 
                className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => setView('templates')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('templates')}
            >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">description</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Plantillas y Formatos</h3>
                <p className="text-slate-600 text-sm flex-grow">Accede a nuestra biblioteca de plantillas para agilizar tus procesos.</p>
                 <span className="mt-4 text-sm font-bold text-[#212147] flex items-center">
                    Ver Plantillas
                    <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                </span>
            </div>
             <div 
                className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => setView('inventory_tool')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('inventory_tool')}
            >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-4">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Ajuste de Inventario</h3>
                <p className="text-slate-600 text-sm flex-grow">Genera archivos de importación masiva a partir de fotos de tus reportes físicos.</p>
                 <span className="mt-4 text-sm font-bold text-[#212147] flex items-center">
                    Usar Herramienta
                    <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                </span>
            </div>
        </div>
    </div>
);


const Intranet: React.FC<IntranetProps> = ({ profile }) => {
    const is_admin = profile.role === 'ADMINISTRATOR' || profile.role === 'EDITOR';

    const [adminView, setAdminView] = useState<AdminView>('dashboard');
    const [clientView, setClientView] = useState<ClientView>('dashboard');
    
    const renderAdminContent = () => {
        switch(adminView) {
            case 'dashboard': return <AdminDashboard setView={setAdminView as any} />;
            case 'templates': return <TemplateManager />;
            case 'website': return <WebsiteManager />;
            case 'users': return <UserManager />;
            case 'ai_assistant': return <AIManager profile={profile} />;
            default: return <AdminDashboard setView={setAdminView as any} />;
        }
    }

    const renderClientContent = () => {
        switch(clientView) {
            case 'dashboard': return <ClientDashboard profile={profile} setView={setClientView} />;
            case 'templates': return <Templates />;
            case 'support_ia': return <AIAssistant profile={profile} />;
            case 'inventory_tool': return <InventoryTool />;
            default: return <ClientDashboard profile={profile} setView={setClientView} />;
        }
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar */}
                <aside className="lg:col-span-2">
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                        <nav className="space-y-2">
                            {is_admin ? (
                                <>
                                    <NavItem icon={<span className="material-symbols-outlined">dashboard</span>} label="Dashboard" isActive={adminView === 'dashboard'} onClick={() => setAdminView('dashboard')} />
                                    <NavItem icon={<span className="material-symbols-outlined">auto_awesome</span>} label="Asistente IA" isActive={adminView === 'ai_assistant'} onClick={() => setAdminView('ai_assistant')} />
                                    <NavItem icon={<span className="material-symbols-outlined">article</span>} label="Plantillas" isActive={adminView === 'templates'} onClick={() => setAdminView('templates')} />
                                    <NavItem icon={<span className="material-symbols-outlined">web</span>} label="Contenido Web" isActive={adminView === 'website'} onClick={() => setAdminView('website')} />
                                    <NavItem icon={<span className="material-symbols-outlined">group</span>} label="Usuarios" isActive={adminView === 'users'} onClick={() => setAdminView('users')} />
                                </>
                            ) : (
                                <>
                                    <NavItem icon={<span className="material-symbols-outlined">dashboard</span>} label="Dashboard" isActive={clientView === 'dashboard'} onClick={() => setClientView('dashboard')} />
                                    <NavItem icon={<span className="material-symbols-outlined">auto_awesome</span>} label="Soporte IA" isActive={clientView === 'support_ia'} onClick={() => setClientView('support_ia')} />
                                    <NavItem icon={<span className="material-symbols-outlined">inventory_2</span>} label="Ajuste Inventario" isActive={clientView === 'inventory_tool'} onClick={() => setClientView('inventory_tool')} />
                                    <NavItem icon={<span className="material-symbols-outlined">description</span>} label="Plantillas" isActive={clientView === 'templates'} onClick={() => setClientView('templates')} />
                                    <div className="pt-4 mt-4 border-t border-slate-200">
                                        <p className="text-xs text-slate-500 px-4 mb-2">¿Necesitas más ayuda?</p>
                                        <a href="#contact" className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                                            <span className="material-symbols-outlined">support_agent</span>
                                            <span className="ml-3">Contactar Asesor</span>
                                        </a>
                                    </div>
                                </>
                            )}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-10">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 min-h-[600px]">
                        {is_admin ? renderAdminContent() : renderClientContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Intranet;