import React, { useState, useEffect } from 'react';
import Templates from './Templates.tsx';
import AdminDashboard from './admin/AdminDashboard.tsx';
import TemplateManager from './admin/TemplateManager.tsx';
import WebsiteManager from './admin/WebsiteManager.tsx';
import UserManager from './admin/UserManager.tsx';
import AIAssistant from './AIAssistant.tsx';
import AIManager from './admin/AIManager.tsx';
import InventoryTool from './tools/InventoryTool.tsx';
import { Profile } from '../App.tsx';
import TaskBoard from './tasks/TaskBoard';
import NotificationBell from './notifications/NotificationBell';
import ClientManager from './admin/ClientManager';

interface IntranetProps {
    profile: Profile;
    onLogout: () => void;
    highlightTaskId?: string | null;
    onHighlightComplete?: () => void;
    onNotificationClick?: (notif: any) => void;
}

type ClientView = 'dashboard' | 'templates' | 'support_ia' | 'inventory_tool' | 'tasks';
type AdminView = 'dashboard' | 'templates' | 'website' | 'users' | 'submissions' | 'ai_assistant' | 'tasks' | 'clients';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isActive
            ? 'bg-white/10 text-white shadow-sm'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        <div className={`${isActive ? 'text-white' : 'text-slate-500'} transition-colors`}>
            {icon}
        </div>
        <span className="ml-3 font-semibold">{label}</span>
    </button>
);

const ClientDashboard: React.FC<{ profile: Profile, setView: (view: ClientView) => void }> = ({ profile, setView }) => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Bienvenido, {profile.full_name.split(' ')[0]}</h2>
        <p className="text-slate-500 mb-8 font-medium">
            Gestiona tus recursos y herramientas desde un solo lugar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div 
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
                onClick={() => setView('support_ia')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('support_ia')}
            >
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">auto_awesome</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Soporte con IA</h3>
                <p className="text-slate-500 text-sm flex-grow leading-relaxed">Obtén soluciones rápidas a tus problemas con nuestro asistente virtual inteligente.</p>
                <span className="mt-5 text-sm font-bold text-[#212147] flex items-center">
                    Consultar Ahora 
                    <span className="material-symbols-outlined text-base ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
            </div>
             <div 
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
                onClick={() => setView('templates')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('templates')}
            >
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">description</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Plantillas y Formatos</h3>
                <p className="text-slate-500 text-sm flex-grow leading-relaxed">Accede a nuestra biblioteca de plantillas para agilizar tus procesos corporativos.</p>
                 <span className="mt-5 text-sm font-bold text-[#212147] flex items-center">
                    Ver Plantillas
                    <span className="material-symbols-outlined text-base ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
            </div>
             <div 
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group"
                onClick={() => setView('inventory_tool')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setView('inventory_tool')}
            >
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-50 mb-5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-[#212147]">inventory_2</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Ajuste de Inventario</h3>
                <p className="text-slate-500 text-sm flex-grow leading-relaxed">Genera archivos de importación masiva a partir de fotos de tus reportes físicos.</p>
                 <span className="mt-5 text-sm font-bold text-[#212147] flex items-center">
                    Usar Herramienta
                    <span className="material-symbols-outlined text-base ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
            </div>
        </div>
    </div>
);


const Intranet: React.FC<IntranetProps> = ({ profile, onLogout, highlightTaskId, onHighlightComplete, onNotificationClick }) => {
    const is_admin = profile.role === 'ADMINISTRATOR' || profile.role === 'EDITOR';

    const [adminView, setAdminView] = useState<AdminView>('dashboard');
    const [clientView, setClientView] = useState<ClientView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Si llega un ID para resaltar, cambiamos automáticamente a la vista de tareas
    React.useEffect(() => {
        if (highlightTaskId) {
            console.log(`[Intranet] Auto-switching to tasks view to highlight: ${highlightTaskId}`);
            if (is_admin) setAdminView('tasks');
            else setClientView('tasks');
        }
    }, [highlightTaskId, is_admin]);

    // Cerrar sidebar al cambiar de vista en móvil
    const handleViewChange = (view: any, type: 'admin' | 'client') => {
        if (type === 'admin') setAdminView(view);
        else setClientView(view);
        setIsSidebarOpen(false);
    }

    const renderAdminContent = () => {
        switch(adminView) {
            case 'dashboard': return <AdminDashboard setView={(v) => handleViewChange(v, 'admin')} />;
            case 'templates': return <TemplateManager />;
            case 'website': return <WebsiteManager />;
            case 'users': 
                if (profile.role !== 'ADMINISTRATOR') return <AdminDashboard setView={(v) => handleViewChange(v, 'admin')} />;
                return <UserManager />;
            case 'ai_assistant': return <AIManager profile={profile} />;
            case 'tasks': return <TaskBoard profile={profile} highlightId={highlightTaskId} onHighlightComplete={onHighlightComplete} />;
            case 'clients': return <ClientManager profile={profile} />;
            default: return <AdminDashboard setView={(v) => handleViewChange(v, 'admin')} />;
        }
    }

    const renderClientContent = () => {
        switch(clientView) {
            case 'dashboard': return <ClientDashboard profile={profile} setView={(v) => handleViewChange(v, 'client')} />;
            case 'templates': return <Templates />;
            case 'support_ia': return <AIAssistant profile={profile} />;
            case 'inventory_tool': return <InventoryTool />;
            case 'tasks': return <TaskBoard profile={profile} highlightId={highlightTaskId} onHighlightComplete={onHighlightComplete} />;
            default: return <ClientDashboard profile={profile} setView={(v) => handleViewChange(v, 'client')} />;
        }
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
            {/* --- OVERLAY MÓVIL --- */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- SIDEBAR IZQUIERDO --- */}
            <aside className={`fixed lg:relative w-72 bg-[#212147] h-full flex flex-col shadow-2xl z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 flex justify-between items-center">
                    <img src="https://i.imgur.com/T0Zirsz.png" alt="DMD Logo" className="h-10 w-auto brightness-0 invert" />
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto legal-scroll">
                    {is_admin ? (
                        <>
                            <NavItem icon={<span className="material-symbols-outlined">dashboard</span>} label="Dashboard" isActive={adminView === 'dashboard'} onClick={() => handleViewChange('dashboard', 'admin')} />
                            <NavItem icon={<span className="material-symbols-outlined">assignment</span>} label="Tareas" isActive={adminView === 'tasks'} onClick={() => handleViewChange('tasks', 'admin')} />
                            <NavItem icon={<span className="material-symbols-outlined">groups</span>} label="Clientes" isActive={adminView === 'clients'} onClick={() => handleViewChange('clients', 'admin')} />
                            <NavItem icon={<span className="material-symbols-outlined">auto_awesome</span>} label="Asistente IA" isActive={adminView === 'ai_assistant'} onClick={() => handleViewChange('ai_assistant', 'admin')} />
                            <NavItem icon={<span className="material-symbols-outlined">description</span>} label="Plantillas" isActive={adminView === 'templates'} onClick={() => handleViewChange('templates', 'admin')} />
                            <NavItem icon={<span className="material-symbols-outlined">web</span>} label="Contenido Web" isActive={adminView === 'website'} onClick={() => handleViewChange('website', 'admin')} />
                            {profile.role === 'ADMINISTRATOR' && (
                                <NavItem icon={<span className="material-symbols-outlined">group</span>} label="Usuarios" isActive={adminView === 'users'} onClick={() => handleViewChange('users', 'admin')} />
                            )}
                        </>
                    ) : (
                        <>
                            <NavItem icon={<span className="material-symbols-outlined">dashboard</span>} label="Dashboard" isActive={clientView === 'dashboard'} onClick={() => handleViewChange('dashboard', 'client')} />
                            <NavItem icon={<span className="material-symbols-outlined">assignment</span>} label="Mis Tareas" isActive={clientView === 'tasks'} onClick={() => handleViewChange('tasks', 'client')} />
                            <NavItem icon={<span className="material-symbols-outlined">auto_awesome</span>} label="Soporte IA" isActive={clientView === 'support_ia'} onClick={() => handleViewChange('support_ia', 'client')} />
                            <NavItem icon={<span className="material-symbols-outlined">inventory_2</span>} label="Ajuste Inventario" isActive={clientView === 'inventory_tool'} onClick={() => handleViewChange('inventory_tool', 'client')} />
                            <NavItem icon={<span className="material-symbols-outlined">description</span>} label="Plantillas" isActive={clientView === 'templates'} onClick={() => handleViewChange('templates', 'client')} />
                        </>
                    )}
                </nav>

                <div className="p-4 bg-black/10 border-t border-white/5">
                    {!is_admin && (
                        <a href="https://wa.me/573104332910" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all mb-2">
                            <span className="material-symbols-outlined">support_agent</span>
                            <span className="ml-3">Soporte Humano</span>
                        </a>
                    )}
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* --- TOPBAR --- */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm z-40">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notificaciones */}
                        <div className="flex items-center justify-center">
                            <NotificationBell onNotificationClick={onNotificationClick} />
                        </div>

                        {/* Perfil */}
                        <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-tight">{profile.full_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.role}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-[#212147] flex items-center justify-center text-white shadow-lg">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                        </div>

                        {/* Salir */}
                        <button 
                            onClick={onLogout}
                            className="flex items-center justify-center h-10 w-10 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                            title="Cerrar Sesión"
                        >
                            <span className="material-symbols-outlined text-xl">logout</span>
                        </button>
                    </div>
                </header>

                {/* --- AREA DE MODULOS --- */}
                <main className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[#f8fafc] legal-scroll">
                    <div className="w-full h-full">
                        {is_admin ? renderAdminContent() : renderClientContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Intranet;