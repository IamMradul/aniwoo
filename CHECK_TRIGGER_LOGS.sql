-- Check if trigger is actually firing and if there are any errors
-- Run this in Supabase SQL Editor

-- Check recent profiles to see if any were created
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

-- Check for any profiles without roles (might indicate trigger ran but without role)
SELECT 
  COUNT(*) as profiles_without_role
FROM profiles
WHERE role IS NULL;

-- Check the actual function to see if there are any issues
SELECT 
  proname,
  prosrc as function_source_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check if there are any constraints or issues with the profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
