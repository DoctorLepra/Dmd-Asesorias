-- Actualización de esquema para Módulo de Gestión de Clientes
-- Fecha: 2026-10-20

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS departamento TEXT,
  ADD COLUMN IF NOT EXISTS municipio TEXT,
  ADD COLUMN IF NOT EXISTS correo TEXT,
  ADD COLUMN IF NOT EXISTS contactos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proveedor_bolsa TEXT,
  ADD COLUMN IF NOT EXISTS doc_integrales TEXT,
  ADD COLUMN IF NOT EXISTS eventos_bolsa TEXT;

COMMENT ON COLUMN public.clientes.codigo IS 'Identificación numérica del cliente o empresa.';
COMMENT ON COLUMN public.clientes.departamento IS 'Departamento de ubicación en Colombia.';
COMMENT ON COLUMN public.clientes.municipio IS 'Municipio de ubicación en Colombia.';
COMMENT ON COLUMN public.clientes.correo IS 'Correo electrónico del contacto principal.';
COMMENT ON COLUMN public.clientes.contactos IS 'Listado de contactos [{celular, correo}].';
COMMENT ON COLUMN public.clientes.licencias IS 'Cartera de licencias [{sistema, numero_licencia, codigo_producto, vencimiento, permanente}].';
COMMENT ON COLUMN public.clientes.proveedor_bolsa IS 'Proveedor de bolsa de documentos (Cadena | Insoft).';
COMMENT ON COLUMN public.clientes.doc_integrales IS 'Cantidad de documentos integrales contratados.';
COMMENT ON COLUMN public.clientes.eventos_bolsa IS 'Cantidad de eventos contratados (deshabilitado para Insoft).';
