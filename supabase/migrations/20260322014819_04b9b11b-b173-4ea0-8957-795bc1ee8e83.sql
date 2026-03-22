-- ============================================================
-- init_user_identity()
-- Creates a base user_identities row for the current user if
-- one does not already exist. Called automatically on first login.
-- No client/provider link is set — that's done via link_user_identity().
-- ============================================================

CREATE OR REPLACE FUNCTION public.init_user_identity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Insert only if no row exists yet — safe upsert
  INSERT INTO public.user_identities (user_id, is_admin, cliente_id, proveedor_id)
  VALUES (v_user_id, false, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Error interno del servidor');
END;
$$;

-- Only authenticated users may call this
REVOKE ALL ON FUNCTION public.init_user_identity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.init_user_identity() TO authenticated;
