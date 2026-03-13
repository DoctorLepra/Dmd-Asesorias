-- ESQUEMA SQL PARA TAREAS Y NOTIFICACIONES
-- Proyecto: DMD Asesorías

-- 1. Tabla de Tareas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pendiente', -- 'Pendiente', 'Completada', 'Cancelada'
    assigned_to_name TEXT,
    assigned_to_id UUID REFERENCES auth.users(id),
    entity_id TEXT, -- Opcional: Para filtrar por evento/proyecto
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Notificaciones
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

-- 3. Habilitar Realtime para las tablas
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 4. Añadir a la publicación de Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 5. RLS (Row Level Security) - Ajustes básicos
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Tareas: Acceso total para usuarios autenticados (Ajustar según necesidad)
CREATE POLICY "Permitir todo a usuarios autenticados en tasks" ON public.tasks
    FOR ALL TO authenticated USING (true);

-- Políticas de Notificaciones: Solo el dueño puede verlas
CREATE POLICY "Usuarios pueden ver sus propias notificaciones" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden marcar como leídas sus notificaciones" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cualquier usuario autenticado puede crear notificaciones" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Políticas para Profiles (Asegurar que se puedan listar responsables)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Usuarios autenticados pueden ver perfiles'
    ) THEN
        CREATE POLICY "Usuarios autenticados pueden ver perfiles" ON public.profiles
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
