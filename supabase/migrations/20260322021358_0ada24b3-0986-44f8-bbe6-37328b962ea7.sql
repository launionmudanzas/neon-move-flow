
-- Add the missing auth.identities record for the admin test user
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  id,
  email,
  'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT DO NOTHING;
