-- ============================================================
-- SECURITY DEFINER RPC: link_user_identity
-- Safe alternative to the removed me_user_identity_upd policy.
-- Allows an authenticated user to link their account to an
-- existing cliente or proveedor record, with server-side
-- validation to prevent impersonation and privilege escalation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_user_identity(
  p_cliente_id   uuid DEFAULT NULL,
  p_proveedor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_has_existing boolean;
BEGIN
  -- 1. Require an authenticated caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 2. Exactly one entity must be supplied
  IF p_cliente_id IS NULL AND p_proveedor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debes proporcionar cliente_id o proveedor_id');
  END IF;

  IF p_cliente_id IS NOT NULL AND p_proveedor_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo puedes vincular a un tipo de entidad a la vez');
  END IF;

  -- 3. Validate and protect the cliente path
  IF p_cliente_id IS NOT NULL THEN
    -- Entity must exist
    IF NOT EXISTS (SELECT 1 FROM public.clientes WHERE id = p_cliente_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cliente no encontrado');
    END IF;

    -- Prevent claiming a record already owned by a different user
    IF EXISTS (
      SELECT 1 FROM public.user_identities
      WHERE cliente_id = p_cliente_id
        AND user_id <> v_user_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este cliente ya está vinculado a otra cuenta');
    END IF;
  END IF;

  -- 4. Validate and protect the proveedor path
  IF p_proveedor_id IS NOT NULL THEN
    -- Entity must exist
    IF NOT EXISTS (SELECT 1 FROM public.proveedores WHERE id = p_proveedor_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Proveedor no encontrado');
    END IF;

    -- Prevent claiming a record already owned by a different user
    IF EXISTS (
      SELECT 1 FROM public.user_identities
      WHERE proveedor_id = p_proveedor_id
        AND user_id <> v_user_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este proveedor ya está vinculado a otra cuenta');
    END IF;
  END IF;

  -- 5. Upsert identity — NEVER touch is_admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_identities WHERE user_id = v_user_id
  ) INTO v_has_existing;

  IF NOT v_has_existing THEN
    INSERT INTO public.user_identities (user_id, cliente_id, proveedor_id, is_admin)
    VALUES (v_user_id, p_cliente_id, p_proveedor_id, false);
  ELSIF p_cliente_id IS NOT NULL THEN
    UPDATE public.user_identities
    SET cliente_id = p_cliente_id
    WHERE user_id = v_user_id;
  ELSE
    UPDATE public.user_identities
    SET proveedor_id = p_proveedor_id
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Identidad vinculada correctamente');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Error interno del servidor');
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.link_user_identity(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_user_identity(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.link_user_identity IS
  'Safe SECURITY DEFINER RPC to link an authenticated user to a cliente or proveedor record.
   Validates entity existence, prevents cross-user claiming, and never modifies is_admin.
   Replaces the removed me_user_identity_upd RLS policy.';
