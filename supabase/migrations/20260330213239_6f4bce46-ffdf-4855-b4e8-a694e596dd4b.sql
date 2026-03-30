
ALTER TABLE public.leads_v3g
  ADD COLUMN IF NOT EXISTS presupuesto_estimado numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tipo_carga text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requiere_asesor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requiere_maniobras boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acepta_privacidad boolean DEFAULT false;
