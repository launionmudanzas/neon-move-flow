
-- ============================================================
-- FIX 1: Enable RLS on reference tables with read-only access
-- ============================================================

ALTER TABLE public.rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costos_adicionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_restringidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_counters ENABLE ROW LEVEL SECURITY;

-- rutas: authenticated users can SELECT only (needed for quoter logic)
CREATE POLICY "rutas_select_authenticated"
  ON public.rutas
  FOR SELECT
  TO authenticated
  USING (true);

-- costos_adicionales: authenticated users can SELECT only
CREATE POLICY "costos_adicionales_select_authenticated"
  ON public.costos_adicionales
  FOR SELECT
  TO authenticated
  USING (true);

-- zonas_restringidas: authenticated users can SELECT only
CREATE POLICY "zonas_restringidas_select_authenticated"
  ON public.zonas_restringidas
  FOR SELECT
  TO authenticated
  USING (true);

-- folio_counters: NO direct access — exclusively managed by SECURITY DEFINER function next_folio()
-- No policies = default deny with RLS enabled

-- ============================================================
-- FIX 2: Block providers from updating business-critical fields
-- via a BEFORE UPDATE trigger on proveedores
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_provider_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id uuid;
  is_caller_admin boolean;
BEGIN
  calling_user_id := auth.uid();

  SELECT COALESCE(ui.is_admin, false)
    INTO is_caller_admin
    FROM public.user_identities ui
    WHERE ui.user_id = calling_user_id;

  -- Admins bypass all restrictions
  IF is_caller_admin THEN
    RETURN NEW;
  END IF;

  -- For non-admins: reject changes to business-critical fields
  IF NEW.calificacion IS DISTINCT FROM OLD.calificacion THEN
    RAISE EXCEPTION 'No tienes permiso para modificar la calificacion.';
  END IF;

  IF NEW.premium_activo IS DISTINCT FROM OLD.premium_activo THEN
    RAISE EXCEPTION 'No tienes permiso para modificar el estado premium.';
  END IF;

  IF NEW.supervision_especial IS DISTINCT FROM OLD.supervision_especial THEN
    RAISE EXCEPTION 'No tienes permiso para modificar la supervision especial.';
  END IF;

  IF NEW.servicios_sin_anticipo_restantes IS DISTINCT FROM OLD.servicios_sin_anticipo_restantes THEN
    RAISE EXCEPTION 'No tienes permiso para modificar los servicios sin anticipo.';
  END IF;

  IF NEW.cuota_reingreso_pendiente IS DISTINCT FROM OLD.cuota_reingreso_pendiente THEN
    RAISE EXCEPTION 'No tienes permiso para modificar la cuota de reingreso.';
  END IF;

  IF NEW.adeudo_cliente_pendiente IS DISTINCT FROM OLD.adeudo_cliente_pendiente THEN
    RAISE EXCEPTION 'No tienes permiso para modificar el adeudo pendiente.';
  END IF;

  IF NEW.activo IS DISTINCT FROM OLD.activo THEN
    RAISE EXCEPTION 'No tienes permiso para modificar el estado activo.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_provider_privilege_escalation
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_provider_self_privilege_escalation();
