
-- folio_counters is only ever touched by the next_folio() SECURITY DEFINER function.
-- Direct user access (SELECT/INSERT/UPDATE/DELETE) should be restricted to admins only.

CREATE POLICY "folio_counters_admin_all"
  ON public.folio_counters
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
