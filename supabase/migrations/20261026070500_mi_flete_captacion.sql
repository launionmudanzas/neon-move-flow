-- mi flete.mx: datos comerciales estructurados, sin duplicar leads existentes.
ALTER TABLE public.leads_v3g
  ADD COLUMN IF NOT EXISTS tipo_solicitante text,
  ADD COLUMN IF NOT EXISTS fuente_consulta text NOT NULL DEFAULT 'sitio_web';

ALTER TABLE public.leads_v3g
  DROP CONSTRAINT IF EXISTS leads_v3g_tipo_solicitante_check;

ALTER TABLE public.leads_v3g
  ADD CONSTRAINT leads_v3g_tipo_solicitante_check
  CHECK (tipo_solicitante IS NULL OR tipo_solicitante IN
    ('particular', 'empresa_directa', 'encargado_autorizado'));

CREATE INDEX IF NOT EXISTS leads_v3g_fuente_consulta_idx
  ON public.leads_v3g (fuente_consulta, created_at DESC);

COMMENT ON COLUMN public.leads_v3g.tipo_solicitante
  IS 'Tipo de cliente directo declarado; null en registros historicos no clasificados.';
COMMENT ON COLUMN public.leads_v3g.fuente_consulta
  IS 'Fuente declarada por el frontend, no verificada como atribucion publicitaria.';
