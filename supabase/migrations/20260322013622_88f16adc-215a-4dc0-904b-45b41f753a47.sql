-- Remove the overly permissive UPDATE policy on user_identities.
-- This policy allowed any authenticated user to change their own proveedor_id or cliente_id,
-- enabling full impersonation of other clients or providers.
-- Identity links should only be managed by admins or a SECURITY DEFINER RPC.

DROP POLICY IF EXISTS "me_user_identity_upd" ON public.user_identities;
