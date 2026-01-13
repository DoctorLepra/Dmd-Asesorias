import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { WhatsappIcon } from '../common/Icons.tsx';
import UserFormModal from './UserFormModal.tsx';
import ConfirmModal from '../common/ConfirmModal.tsx';

export interface UserData {
    id: string;
    email: string;
    full_name: string | null;
    company: string | null;
    contact_number: string | null;
    role: 'ADMINISTRATOR' | 'EDITOR' | 'VISITOR';
}

const UserManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'team' | 'clients'>('team');
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_users');
            if (rpcError) {
                if (rpcError.message.includes('function get_all_users() does not exist')) {
                     setError("Configuración requerida: La función 'get_all_users' no existe en la base de datos. Por favor, pida al administrador que ejecute el script SQL proporcionado.");
                     setUsers([]);
                     return;
                }
                throw rpcError;
            }
            setUsers(data as UserData[]);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || 'Ocurrió un error al cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const { teamMembers, clients } = useMemo(() => {
        const team: UserData[] = [];
        const clientList: UserData[] = [];
        users.forEach(user => {
            if (user.role === 'ADMINISTRATOR' || user.role === 'EDITOR') {
                team.push(user);
            } else {
                clientList.push(user);
            }
        });
        return { teamMembers: team, clients: clientList };
    }, [users]);
    
    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    
    const handleOpenDeleteConfirm = (user: UserData) => {
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        try {
            const response = await fetch('/api/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userToDelete.id }),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete user');
            }
            alert('Usuario eliminado con éxito.');
            fetchUsers();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }

        setIsDeleting(false);
        setIsConfirmModalOpen(false);
        setUserToDelete(null);
    };


    const roleDisplayNames = {
      ADMINISTRATOR: 'Administrador',
      EDITOR: 'Editor',
      VISITOR: 'Cliente',
    };

    const renderTable = (data: UserData[], isClientTable: boolean) => (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nombre Completo</th>
                        {isClientTable && <th scope="col" className="px-6 py-3">Empresa</th>}
                        <th scope="col" className="px-6 py-3">Email</th>
                        {!isClientTable && <th scope="col" className="px-6 py-3">Rol</th>}
                        <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(user => (
                        <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{user.full_name || 'N/A'}</td>
                            {isClientTable && <td className="px-6 py-4">{user.company || 'N/A'}</td>}
                            <td className="px-6 py-4">{user.email}</td>
                            {!isClientTable && <td className="px-6 py-4">{roleDisplayNames[user.role] || user.role}</td>}
                            <td className="px-6 py-4 text-right">
                                {isClientTable ? (
                                    <>
                                        {user.contact_number && (
                                            <a href={`https://wa.me/${user.contact_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-block p-2 text-green-600 hover:text-green-800" aria-label="Contactar por WhatsApp">
                                                <WhatsappIcon className="w-5 h-5"/>
                                            </a>
                                        )}
                                        <a href={`mailto:${user.email}`} className="inline-block p-2 text-blue-600 hover:text-blue-800 ml-2" aria-label="Contactar por Email">
                                            <span className="material-symbols-outlined">mail</span>
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEdit(user)} className="p-2 rounded-full text-[#212147] hover:bg-slate-100 transition-colors" aria-label="Editar">
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button onClick={() => handleOpenDeleteConfirm(user)} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors ml-1" aria-label="Eliminar">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h2>
                    <p className="text-slate-600 mt-1">Crea, edita y visualiza los miembros del equipo y los clientes.</p>
                </div>
                <button onClick={handleCreate} className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all">
                    <span className="material-symbols-outlined mr-2">add</span>
                    Crear Usuario
                </button>
            </div>

            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('team')} className={`${activeTab === 'team' ? 'border-[#212147] text-[#212147]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Equipo Interno</button>
                    <button onClick={() => setActiveTab('clients')} className={`${activeTab === 'clients' ? 'border-[#212147] text-[#212147]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Clientes</button>
                </nav>
            </div>
            
            {error && <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">{error}</div>}

            {loading ? <p>Cargando usuarios...</p> : (
                activeTab === 'team' ? renderTable(teamMembers, false) : renderTable(clients, true)
            )}
            
            {isModalOpen && <UserFormModal userToEdit={editingUser} onClose={() => setIsModalOpen(false)} onSave={() => { setIsModalOpen(false); fetchUsers(); }} />}
            
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message={<>¿Estás seguro de que quieres eliminar a "<strong>{userToDelete?.full_name || userToDelete?.email}</strong>"? Esta acción es irreversible y eliminará al usuario del sistema de autenticación.</>}
                isLoading={isDeleting}
            />
        </div>
    );
};

// FIX: Add default export to resolve import error.
export default UserManager;