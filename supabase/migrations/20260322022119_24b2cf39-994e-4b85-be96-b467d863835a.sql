
-- Fix infinite recursion in user_identities RLS policy.
-- The old policy self-references user_identities to check is_admin, causing recursion.
-- Replace with the is_admin() SECURITY DEFINER function which bypasses RLS.

DROP POLICY IF EXISTS "user_identities_admin_all" ON public.user_identities;

CREATE POLICY "user_identities_admin_all"
  ON public.user_identities
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
