
-- Create test admin user (no ON CONFLICT on email — use DO block with existence check)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only insert if not already present
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com') THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      aud, role, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('Admin1234!', gen_salt('bf')),
      now(), now(), now(),
      'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{}'
    );
  ELSE
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@test.com';
  END IF;

  -- Upsert user_identities with is_admin = true
  INSERT INTO public.user_identities (user_id, is_admin, cliente_id, proveedor_id)
  VALUES (v_user_id, true, NULL, NULL)
  ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

  RAISE NOTICE 'Admin user ready with id: %', v_user_id;
END;
$$;
