-- Fix: re-scope me_user_identity policy from 'public' to 'authenticated'
DROP POLICY IF EXISTS "me_user_identity" ON public.user_identities;

CREATE POLICY "me_user_identity"
  ON public.user_identities
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);