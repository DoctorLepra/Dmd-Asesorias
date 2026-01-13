import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import ConfirmModal from '../common/ConfirmModal.tsx';

interface RatedConversation {
    id: string;
    created_at: string;
    rating: number;
    feedback: string | null;
    full_name: string | null;
    email: string;
}

interface RatingsViewerProps {
    isDevMode?: boolean;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
            <span
                key={star}
                className={`material-symbols-outlined text-xl ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                style={{ fontVariationSettings: `'FILL' 1` }}
            >
                star
            </span>
        ))}
    </div>
);

const RatingsViewer: React.FC<RatingsViewerProps> = ({ isDevMode }) => {
    const [ratings, setRatings] = useState<RatedConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [conversationToDelete, setConversationToDelete] = useState<RatedConversation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRatings = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        if (isDevMode) {
            setRatings([
                {
                    id: 'dev-rating-1',
                    created_at: new Date().toISOString(),
                    rating: 5,
                    feedback: 'Excelente servicio simulado.',
                    full_name: 'Usuario Prueba',
                    email: 'test@dmd.com'
                },
                {
                    id: 'dev-rating-2',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    rating: 4,
                    feedback: 'Buena respuesta.',
                    full_name: 'Cliente Mock',
                    email: 'cliente@mock.com'
                }
            ]);
            setLoading(false);
            return;
        }

        try {
            const { data, error: rpcError } = await supabase.rpc('get_rated_conversations');
            if (rpcError) {
                if (rpcError.message.includes('function get_rated_conversations() does not exist') || rpcError.message.includes('structure of query does not match function result type')) {
                    // FIX: Replaced the embedded SQL with a user-friendly error message as requested.
                    // The administrator will be provided the necessary SQL in the chat response.
                    setError("Configuración requerida: La función 'get_rated_conversations' o 'count_rated_conversations' falta en la base de datos o está desactualizada. Por favor, pida al administrador que ejecute el script SQL proporcionado.");
                    setRatings([]);
                    return;
                }
                throw rpcError;
            }
            setRatings(data as RatedConversation[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [isDevMode]);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    const handleOpenDeleteConfirm = (convo: RatedConversation) => {
        setConversationToDelete(convo);
    };
    
    const handleCloseDeleteConfirm = () => {
        setConversationToDelete(null);
    };
    
    const handleConfirmDelete = async () => {
        if (!conversationToDelete) return;
        setIsDeleting(true);
        
        if (isDevMode) {
             setRatings(prevRatings => prevRatings.filter(r => r.id !== conversationToDelete.id));
             setIsDeleting(false);
             handleCloseDeleteConfirm();
             return;
        }
    
        const { error: deleteError } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', conversationToDelete.id);
    
        setIsDeleting(false);
    
        if (deleteError) {
            alert(`Error al eliminar la conversación: ${deleteError.message}`);
            console.error("Delete error:", deleteError);
        } else {
            setRatings(prevRatings => prevRatings.filter(r => r.id !== conversationToDelete.id));
        }
        
        handleCloseDeleteConfirm();
    };

    if (loading) {
        return <div className="text-center p-8">Cargando calificaciones...</div>;
    }

    if (error) {
        // This will now catch the configuration error as well
        const isConfigError = error.includes('Configuración requerida');
        return (
            <div className={`${isConfigError ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded-lg`} role="alert">
                <strong className="font-bold">{isConfigError ? 'Error de Configuración' : 'Error'}: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }
    
    if (ratings.length === 0) {
        return <div className="text-center p-8 text-slate-500">No hay calificaciones para mostrar.</div>;
    }

    return (
        <div className="space-y-4">
            {ratings.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 group">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="font-bold text-slate-800">{item.full_name || 'Usuario Anónimo'}</p>
                            <p className="text-xs text-slate-500">{item.email}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <StarRating rating={item.rating} />
                            <button
                                onClick={() => handleOpenDeleteConfirm(item)}
                                className="p-2 text-slate-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Eliminar conversación"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                    {item.feedback && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md">"{item.feedback}"</p>
                        </div>
                    )}
                </div>
            ))}
            <ConfirmModal
                isOpen={!!conversationToDelete}
                onClose={handleCloseDeleteConfirm}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message={
                    <>
                        ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
                        {conversationToDelete && (
                            <p className="mt-2 text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                Usuario: {conversationToDelete.full_name || conversationToDelete.email}
                            </p>
                        )}
                    </>
                }
                isLoading={isDeleting}
            />
        </div>
    );
};

export default RatingsViewer;