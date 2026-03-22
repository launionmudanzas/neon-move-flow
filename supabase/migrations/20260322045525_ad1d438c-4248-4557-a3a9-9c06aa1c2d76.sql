
-- =====================================================
-- FIX 1: Protect financial fields on cotizaciones
-- Prevent non-admins from modifying price/commission fields
-- =====================================================
CREATE OR REPLACE FUNCTION public.protect_cotizacion_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.precio_total        IS DISTINCT FROM OLD.precio_total        OR
     NEW.precio_base         IS DISTINCT FROM OLD.precio_base         OR
     NEW.margen_negocio      IS DISTINCT FROM OLD.margen_negocio      OR
     NEW.comision_app        IS DISTINCT FROM OLD.comision_app        OR
     NEW.seguro_costo        IS DISTINCT FROM OLD.seguro_costo        OR
     NEW.seguro_monto        IS DISTINCT FROM OLD.seguro_monto        OR
     NEW.seguro_porcentaje   IS DISTINCT FROM OLD.seguro_porcentaje   OR
     NEW.costo_recoleccion   IS DISTINCT FROM OLD.costo_recoleccion   OR
     NEW.costo_entrega       IS DISTINCT FROM OLD.costo_entrega       OR
     NEW.costo_adicionales   IS DISTINCT FROM OLD.costo_adicionales   OR
     NEW.porcentaje_urgencia IS DISTINCT FROM OLD.porcentaje_urgencia OR
     NEW.estatus             IS DISTINCT FROM OLD.estatus
  THEN
    RAISE EXCEPTION 'No tienes permiso para modificar campos financieros o el estatus de la cotización.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_cotizacion_financials
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cotizacion_financials();

-- =====================================================
-- FIX 2: Block direct INSERT/UPDATE on user_identities
-- Only SECURITY DEFINER RPCs (init_user_identity,
-- link_user_identity) and admins should write to this table.
-- =====================================================

CREATE POLICY "user_identities_no_direct_insert"
  ON public.user_identities
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "user_identities_no_direct_update"
  ON public.user_identities
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
