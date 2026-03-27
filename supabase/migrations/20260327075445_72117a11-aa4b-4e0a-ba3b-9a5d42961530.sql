-- Add new columns to cotizaciones for expanded service model
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS horario_carga text,
  ADD COLUMN IF NOT EXISTS horario_entrega text,
  ADD COLUMN IF NOT EXISTS peso numeric,
  ADD COLUMN IF NOT EXISTS cotizacion_especial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visita_ocular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS presupuesto_cliente numeric,
  ADD COLUMN IF NOT EXISTS comentarios_especiales text;