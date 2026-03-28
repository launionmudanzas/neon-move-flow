-- The public views MUST be security_definer to work for anon users
-- (anon has no direct access to base tables, which is correct)
-- Revert security_invoker on all 3 public views

ALTER VIEW public.proveedores_publico SET (security_invoker = off);
ALTER VIEW public.calificaciones_publico SET (security_invoker = off);
ALTER VIEW public.rutas_publico SET (security_invoker = off);

-- Verify: proveedores table already has correct policies:
--   proveedor_owner_read  (SELECT, authenticated, own record only)
--   proveedor_owner_update (UPDATE, authenticated, own record only)
--   proveedores_admin_all (ALL, authenticated, is_admin() only)
-- No general authenticated SELECT exists = clients cannot read provider data.
-- This is the desired behavior.