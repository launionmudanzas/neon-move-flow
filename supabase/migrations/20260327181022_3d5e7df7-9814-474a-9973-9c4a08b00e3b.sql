
-- 1. Drop overly permissive anon INSERT on leads_v3g
DROP POLICY IF EXISTS "leads_v3g_anon_insert" ON public.leads_v3g;

-- 2. Drop overly permissive anon INSERT on clientes
DROP POLICY IF EXISTS "clientes_anon_insert" ON public.clientes;

-- 3. Drop overly permissive anon INSERT on cotizaciones
DROP POLICY IF EXISTS "cotizaciones_anon_insert" ON public.cotizaciones;

-- 4. Drop overly permissive anon SELECT on cotizaciones
DROP POLICY IF EXISTS "cotizaciones_anon_select" ON public.cotizaciones;

-- 5. Create a secure anon INSERT policy for clientes that only allows insert via edge function (service role bypasses RLS)
-- No replacement needed: the submit-public-lead edge function uses service_role which bypasses RLS.
-- For the LeadFormSection (clientes), we also need an edge function. For now, block anon inserts.
-- Admin and authenticated users can still insert via existing policies.

-- 6. Add a restrictive anon SELECT on cotizaciones scoped to specific use cases
-- The old policy allowed unrestricted SELECT for anon. Replace with a minimal one if needed.
-- For now, remove it entirely. The public cotizador uses service role via edge functions.
