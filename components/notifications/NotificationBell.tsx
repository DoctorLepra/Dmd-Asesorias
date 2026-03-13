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
          <div className="fixed sm:absolute inset-0 sm:inset-auto sm:right-0 sm:mt-3 w-full sm:w-80 h-full sm:h-auto bg-white sm:rounded-2xl shadow-2xl border-none sm:border sm:border-slate-200 z-[1000] sm:z-[100] overflow-hidden animate-fade-in flex flex-col">
            <div className="p-6 sm:p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-800">
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-widest opacity-60">Notificaciones</h3>
                {unreadCount > 0 && <span className="text-xs sm:text-[10px] text-primary font-black mt-0.5">{unreadCount} nuevas</span>}
              </div>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs sm:text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Leídas
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-2 bg-slate-200/50 rounded-xl text-slate-500 active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto legal-scroll">
              {notifications.length === 0 ? (
                <div className="py-20 px-6 text-center flex flex-col items-center gap-4">
                  <div className="bg-slate-50 p-5 rounded-full text-slate-200 border border-slate-100 shadow-inner">
                    <span className="material-symbols-outlined text-5xl">notifications_off</span>
                  </div>
                  <p className="text-base sm:text-sm text-slate-400 font-bold italic">Bandeja de entrada vacía</p>
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
                      className={`group cursor-pointer block p-6 sm:p-4 hover:bg-slate-50 transition-all border-l-4 ${!notif.is_read ? 'bg-blue-50/30 border-blue-500' : 'border-transparent'}`}
                    >
                      <div className="flex items-start gap-4 sm:gap-3">
                        <div className={`mt-1 flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                          !notif.is_read 
                          ? (notif.type === 'task' ? 'bg-blue-600 text-white' : 'bg-primary text-white') 
                          : 'bg-slate-100 text-slate-400'
                        }`}>
                          {notif.type === 'task' ? (
                            <span className="material-symbols-outlined text-lg sm:text-sm text-white">assignment</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg sm:text-sm">info</span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className={`text-base sm:text-sm font-black truncate ${!notif.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{notif.title}</h4>
                          <p className="text-sm sm:text-xs text-slate-500 mt-1 sm:mt-0.5 line-clamp-3 leading-relaxed font-bold">{notif.message}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">
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
            
            <div className="p-5 sm:p-3 bg-slate-50 border-t border-slate-100 text-center">
               <button className="text-xs sm:text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.2em] transition-colors">Historial Completo</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
