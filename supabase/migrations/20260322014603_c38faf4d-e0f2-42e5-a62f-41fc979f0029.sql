-- ============================================================
-- FIX: Close privilege escalation on user_identities
--
-- The existing SELECT policy already scopes reads to own row.
-- Problem: no INSERT or UPDATE restrictions exist, so any
-- authenticated user could insert is_admin=true for themselves.
--
-- Fix:
--   • Block all INSERT on user_identities from normal users
--     (identity rows are created by the link_user_identity RPC)
--   • Block all UPDATE on user_identities from normal users
--     (identity field changes go through link_user_identity RPC)
--   • Allow admins full access for management purposes
-- ============================================================

-- Admin override: full access for users already flagged as admin
CREATE POLICY "user_identities_admin_all"
  ON public.user_identities
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM public.user_identities WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM public.user_identities WHERE user_id = auth.uid())
  );

-- Explicitly deny direct INSERT for non-admins.
-- The link_user_identity() SECURITY DEFINER RPC handles inserts safely.
-- (No INSERT policy = default deny under RLS for non-admins)

-- Explicitly deny direct UPDATE for non-admins.
-- The link_user_identity() SECURITY DEFINER RPC handles updates safely.
-- (No UPDATE policy = default deny under RLS for non-admins)
