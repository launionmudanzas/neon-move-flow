-- 1. Drop the overly-permissive anon policy on proveedores
DROP POLICY IF EXISTS "proveedores_anon_select" ON public.proveedores;

-- 2. Revoke direct anon access to the proveedores table
REVOKE ALL ON public.proveedores FROM anon;

-- 3. Ensure the existing view proveedores_publico is accessible to anon
GRANT SELECT ON public.proveedores_publico TO anon;