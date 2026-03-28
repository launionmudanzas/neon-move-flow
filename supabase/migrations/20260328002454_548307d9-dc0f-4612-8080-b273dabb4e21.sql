-- Remove unrestricted anonymous read on calificaciones_servicio
DROP POLICY IF EXISTS "cal_anon_select" ON public.calificaciones_servicio;

-- Revoke direct anon access to the table
REVOKE ALL ON public.calificaciones_servicio FROM anon;

-- Create a safe public view exposing only non-sensitive rating data
CREATE OR REPLACE VIEW public.calificaciones_publico AS
SELECT
  id,
  proveedor_id,
  puntualidad,
  trato,
  cuidado_carga,
  cumplimiento,
  experiencia_general,
  promedio,
  comentario,
  created_at
FROM public.calificaciones_servicio;

-- Grant anon read on the safe view only
GRANT SELECT ON public.calificaciones_publico TO anon;
GRANT SELECT ON public.calificaciones_publico TO authenticated;