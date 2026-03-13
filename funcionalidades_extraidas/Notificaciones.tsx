'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

/*
-- ESQUEMA SQL SUGERIDO PARA SUPABASE (Ejecutar en el editor SQL)
-- 
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'alert', 'task', etc.
    related_id TEXT, 
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Realtime para esta tabla
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
*/

// --- CONFIGURACIÓN DEL CLIENTE (Ajustar según tu proyecto) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
        const unsubscribe = subscribeToNotifications(user.id);
        
        // Pedir permiso para notificaciones nativas
        if (Notification.permission === 'default') {
          Notification.requestPermission();
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
          if (Notification.permission === 'granted') {
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

  return (
    <div className="relative inline-block text-left font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-500 hover:text-indigo-600 transition-all bg-gray-50 hover:bg-indigo-50 rounded-2xl active:scale-95 border border-transparent hover:border-indigo-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-red-500 rounded-full border-2 border-white shadow-sm animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Notificaciones</h3>
            {unreadCount > 0 && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center gap-3">
                <div className="bg-gray-50 p-3 rounded-full text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 5-8-5" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 font-medium">Bandeja de entrada vacía</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (onNotificationClick) onNotificationClick(notif);
                      setIsOpen(false);
                    }}
                    className={`group cursor-pointer block p-4 hover:bg-indigo-50 transition-all border-l-4 ${!notif.is_read ? 'bg-indigo-50/20 border-indigo-600' : 'border-transparent'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${!notif.is_read ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {notif.type === 'task' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className={`text-sm font-bold truncate ${!notif.is_read ? 'text-gray-900' : 'text-gray-500'}`}>{notif.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
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
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
             <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest">Ver todo el historial</button>
          </div>
        </div>
      )}
    </div>
  );
}
