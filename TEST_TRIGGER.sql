-- Test the Trigger Function
-- This will help debug if the trigger is working correctly

-- Check what metadata is being stored when user signs up
-- (This is just for reference - you can't actually query auth.users directly)
-- But we can check profiles table to see what was created

-- View recent profiles to see what was created
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any profiles without roles
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM profiles
WHERE role IS NULL
ORDER BY created_at DESC;

-- If you see profiles without roles, you can update them manually:
-- UPDATE profiles SET role = 'pet_owner' WHERE role IS NULL;
