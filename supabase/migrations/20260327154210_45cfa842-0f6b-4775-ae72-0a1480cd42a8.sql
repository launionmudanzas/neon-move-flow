
-- Add enhanced opportunity fields to publicaciones_carga
ALTER TABLE public.publicaciones_carga
  ADD COLUMN IF NOT EXISTS modalidad_disponible text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tipo_unidad text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS peso_disponible numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fecha_llegada_estimada date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS observaciones text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tipo_oportunidad text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vistas_cotizaciones integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intereses_count integer NOT NULL DEFAULT 0;

-- Add anon SELECT policy for active publications (needed for opportunity detection in cotizador)
CREATE POLICY "pub_anon_select_active"
  ON public.publicaciones_carga
  FOR SELECT
  TO anon
  USING (estatus IN ('activa', 'publicada'));
