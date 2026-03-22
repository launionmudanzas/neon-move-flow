-- ============================================================
-- FIX 1: Rewrite is_admin() to use user_identities as single
--         source of truth (fixes JWT-vs-table inconsistency)
--         and add SET search_path = public for safety.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_identities WHERE user_id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- FIX 2: Add SET search_path = public to all remaining custom
--         trigger/utility functions that were missing it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_folio()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today  text    := to_char(now() AT TIME ZONE 'America/Mexico_City', 'YYYYMMDD');
  newseq integer;
BEGIN
  INSERT INTO public.folio_counters(yyyymmdd, seq)
  VALUES (today, 1)
  ON CONFLICT (yyyymmdd) DO UPDATE
    SET seq = public.folio_counters.seq + 1
  RETURNING public.folio_counters.seq INTO newseq;

  RETURN format('LUM-%s-%04s', today, newseq::text);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_volumen_minimo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.volumen_total IS NOT NULL THEN
    NEW.volumen_cobrable := GREATEST(COALESCE(NEW.volumen_cobrable, NEW.volumen_total), 5);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_fecha_llegada_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.fecha_salida IS NOT NULL AND NEW.fecha_llegada IS NULL THEN
    NEW.fecha_llegada := (NEW.fecha_salida + INTERVAL '1 day')::date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_folio_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    NEW.folio := public.next_folio();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.init_expediente_from_orden()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.expedientes_servicio (cotizacion_id, orden_servicio_id, cliente_id, estatus)
  SELECT c.id, NEW.id, c.cliente_id, 'inicializado'
  FROM   public.cotizaciones c
  WHERE  c.id = NEW.cotizacion_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_publicacion_expira_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.expira_at IS NULL THEN
    NEW.expira_at := now() + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 3: Enable RLS on proveedor_unidades and add owner-scoped
--         policies matching the pattern used by other tables.
-- ============================================================

ALTER TABLE public.proveedor_unidades ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "unidades_admin_all"
  ON public.proveedor_unidades
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Owners can SELECT their own vehicles
CREATE POLICY "unidades_owner_select"
  ON public.proveedor_unidades
  FOR SELECT
  TO authenticated
  USING (
    proveedor_id = (
      SELECT proveedor_id FROM public.user_identities
      WHERE user_id = auth.uid()
    )
  );

-- Owners can INSERT new vehicles for themselves
CREATE POLICY "unidades_owner_insert"
  ON public.proveedor_unidades
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proveedor_id = (
      SELECT proveedor_id FROM public.user_identities
      WHERE user_id = auth.uid()
    )
  );

-- Owners can UPDATE their own vehicles
CREATE POLICY "unidades_owner_update"
  ON public.proveedor_unidades
  FOR UPDATE
  TO authenticated
  USING (
    proveedor_id = (
      SELECT proveedor_id FROM public.user_identities
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    proveedor_id = (
      SELECT proveedor_id FROM public.user_identities
      WHERE user_id = auth.uid()
    )
  );

-- Owners can DELETE their own vehicles
CREATE POLICY "unidades_owner_delete"
  ON public.proveedor_unidades
  FOR DELETE
  TO authenticated
  USING (
    proveedor_id = (
      SELECT proveedor_id FROM public.user_identities
      WHERE user_id = auth.uid()
    )
  );
