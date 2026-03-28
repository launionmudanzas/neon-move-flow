-- 1. Drop the overly-permissive anon policy on rutas
DROP POLICY IF EXISTS "rutas_select_anon" ON public.rutas;

-- 2. Revoke direct anon access to rutas
REVOKE ALL ON public.rutas FROM anon;

-- 3. Create a safe public view without costo_m3
CREATE OR REPLACE VIEW public.rutas_publico AS
SELECT id, origen, destino, activa, es_directa, notas
FROM public.rutas;

ALTER VIEW public.rutas_publico SET (security_invoker = on);

-- 4. Grant anon read on the safe view only
GRANT SELECT ON public.rutas_publico TO anon;
GRANT SELECT ON public.rutas_publico TO authenticated;