
-- SECURITY FIX 3: Remove the hardcoded admin@test.com test account from the live database.
-- The migration files that created it are in source control but the live account
-- is the actual security risk — deleting it here closes the vulnerability.

DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin@test.com';

  IF v_uid IS NOT NULL THEN
    -- Remove identity links
    DELETE FROM auth.identities WHERE user_id = v_uid;
    -- Remove our app identity row
    DELETE FROM public.user_identities WHERE user_id = v_uid;
    -- Remove the auth user itself
    DELETE FROM auth.users WHERE id = v_uid;
    RAISE NOTICE 'admin@test.com (%) deleted', v_uid;
  ELSE
    RAISE NOTICE 'admin@test.com not found — already removed';
  END IF;
END;
$$;
