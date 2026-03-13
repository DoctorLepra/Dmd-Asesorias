'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  related_id?: string;
}

// --- FUNCIONES DE UTILIDAD (Exportadas para uso global) ---

/**
 * Crea una notificación para un usuario específico.
 */
export async function createNotification(params: NotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: params.user_id,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        related_id: params.related_id,
        is_read: false
      }]);
    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Notifica a todos los usuarios con un rol específico.
 * Requiere una tabla 'profiles' con campos 'id' y 'role'.
 */
export async function notifyByRole(role: string, params: Omit<NotificationParams, 'user_id'>) {
  try {
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (fetchError) throw fetchError;

    if (users && users.length > 0) {
      const notifications = users.map(user => ({
        user_id: user.id,
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        related_id: params.related_id,
        is_read: false
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error(`Error notifying role ${role}:`, error);
  }
}

// --- COMPONENTE DE INTERFAZ (UI) ---

interface NotificationBellProps {
  onNotificationClick?: (notif: Notification) => void;
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchNotifications(user.id);
        const unsubscribe = subscribeToNotifications(user.id);
        
        // Pedir permiso para notificaciones nativas de forma más robusta
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    console.log('Notification permission:', permission);
                });
            }
        }

        return unsubscribe;
      }
    };
    
    let cleanup: (() => void) | undefined;
    initialize().then(unsub => { cleanup = unsub; });
    
    return () => { if (cleanup) cleanup(); };
  }, []);

  const fetchNotifications = async (id: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const subscribeToNotifications = (id: string) => {
    const channel = supabase
      .channel(`user-notifications-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', table: 'notifications', schema: 'public', filter: `user_id=eq.${id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 10));
          setUnreadCount(count => count + 1);
          
          // Notificación nativa del sistema
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotif.title, { body: newNotif.message });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative inline-block text-left font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 aspect-square flex-shrink-0 flex items-center justify-center text-white transition-all bg-blue-500 hover:bg-blue-600 rounded-full active:scale-95 shadow-md shadow-blue-500/20 border border-blue-400/20"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-800">
              <div className="flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Notificaciones</h3>
                {unreadCount > 0 && <span className="text-[10px] text-primary font-bold mt-0.5">{unreadCount} nuevas</span>}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto legal-scroll">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                  <div className="bg-slate-50 p-3 rounded-full text-slate-200">
                    <span className="material-symbols-outlined text-4xl">inbox</span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Bandeja de entrada vacía</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (onNotificationClick) onNotificationClick(notif);
                        setIsOpen(false);
                      }}
                      className={`group cursor-pointer block p-4 hover:bg-slate-50 transition-all border-l-4 ${!notif.is_read ? 'bg-primary/5 border-primary' : 'border-transparent'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          !notif.is_read 
                          ? (notif.type === 'task' ? 'bg-blue-600 text-white' : 'bg-primary text-white') 
                          : 'bg-slate-100 text-slate-400'
                        }`}>
                          {notif.type === 'task' ? (
                            <span className="material-symbols-outlined text-sm">assignment</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">info</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className={`text-sm font-bold truncate ${!notif.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{notif.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
               <button className="text-[10px] font-bold text-primary hover:text-primary-hover uppercase tracking-widest transition-colors">Ver todo el historial</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
