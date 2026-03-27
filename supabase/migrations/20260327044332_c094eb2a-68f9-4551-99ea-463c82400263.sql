
-- Fix: Recreate view with security_invoker to avoid SECURITY DEFINER warning
DROP VIEW IF EXISTS public.proveedores_publico;

CREATE OR REPLACE VIEW public.proveedores_publico
WITH (security_invoker = on) AS
SELECT
  id,
  nombre_comercial,
  logo_url,
  calificacion,
  ciudades_cobertura,
  rutas_frecuentes,
  premium_activo,
  activo
FROM public.proveedores
WHERE activo = true;

GRANT SELECT ON public.proveedores_publico TO anon;
GRANT SELECT ON public.proveedores_publico TO authenticated;

-- Add anon SELECT policy on proveedores for the view to work
CREATE POLICY "proveedores_anon_select" ON public.proveedores
  FOR SELECT TO anon USING (activo = true);
