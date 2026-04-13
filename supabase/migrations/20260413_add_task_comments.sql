-- Nueva migración para añadir comentarios de finalización a las Tareas
-- Entorno: Cliente/Gestión
-- Propósito: Garantizar un tracking manual del resultado real de la finalización de la actividad.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completion_comment TEXT;
