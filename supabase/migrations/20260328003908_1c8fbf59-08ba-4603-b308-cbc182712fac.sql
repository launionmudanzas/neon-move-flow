-- Remove anonymous access to publicaciones_carga (marketplace is provider-to-provider only)
DROP POLICY IF EXISTS "pub_anon_select_active" ON public.publicaciones_carga;

-- Revoke direct anon access
REVOKE ALL ON public.publicaciones_carga FROM anon;

-- Add policy so authenticated providers can browse other active listings (excluding sensitive data via view)
CREATE POLICY "pub_authenticated_browse_active"
ON public.publicaciones_carga
FOR SELECT
TO authenticated
USING (estatus IN ('activa', 'publicada'));