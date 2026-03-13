-- Módulo de Gestión de Clientes
-- Proyecto: DMD Asesorías

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    pais TEXT,
    ciudad TEXT,
    celular TEXT,
    licencias JSONB DEFAULT '[]'::jsonb, -- Array de licencias: [{codigo: 'L1', nombre: 'P1'}]
    vencimiento_licencia DATE, -- Nullable para manejar 'Permanente'
    codigo_comercial_licencia TEXT,
    vencimiento_poliza DATE,
    vencimiento_documentos DATE,
    codigo_comercial_docs TEXT,
    vencimiento_eventos DATE,
    codigo_comercial_eventos TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Realtime
ALTER TABLE public.clientes REPLICA IDENTITY FULL;

-- 3. Añadir a la publicación de Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
  END IF;
END $$;

-- 4. RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política de acceso total para usuarios autenticados (Admin y Editor)
CREATE POLICY "Acceso total para usuarios autenticados en clientes" ON public.clientes
    FOR ALL TO authenticated USING (true);

-- Comentarios amigables para el esquema
COMMENT ON TABLE public.clientes IS 'Tabla principal de gestión de clientes y licenciamiento de DMD Asesorías.';
COMMENT ON COLUMN public.clientes.licencias IS 'Almacena un array de objetos con las licencias activas del cliente.';
