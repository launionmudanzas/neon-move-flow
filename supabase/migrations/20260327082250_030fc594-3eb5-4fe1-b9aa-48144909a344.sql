-- Add missing columns to proveedores
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS direccion_operativa text,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS anios_experiencia integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documentos_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modalidades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tipos_servicio text[] DEFAULT '{}';

-- Add missing columns to proveedor_unidades
ALTER TABLE public.proveedor_unidades
  ADD COLUMN IF NOT EXISTS capacidad_peso numeric,
  ADD COLUMN IF NOT EXISTS observaciones text;