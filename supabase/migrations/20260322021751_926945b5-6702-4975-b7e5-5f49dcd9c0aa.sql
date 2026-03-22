
-- Fix missing required string fields on the test admin user that cause login to fail
UPDATE auth.users
SET
  confirmation_token  = COALESCE(confirmation_token, ''),
  recovery_token      = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change        = COALESCE(email_change, ''),
  phone               = COALESCE(phone, '')
WHERE email = 'admin@test.com';
