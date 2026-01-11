-- Test if trigger works by checking if it would fire
-- This helps diagnose if the issue is with trigger or with user creation

-- Check the most recent auth users
-- Note: You can't directly query auth.users, but we can check profiles
-- If profiles exist, the trigger worked. If not, trigger didn't fire.

-- Check profiles created in last hour (adjust time as needed)
SELECT 
  id,
  name,
  email,
  role,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_ago
FROM profiles
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check function for any syntax issues
SELECT 
  proname,
  CASE 
    WHEN prosrc LIKE '%INSERT INTO public.profiles%' THEN '✅ Contains INSERT statement'
    ELSE '❌ Missing INSERT statement'
  END as has_insert,
  CASE 
    WHEN prosrc LIKE '%role%' THEN '✅ Contains role field'
    ELSE '❌ Missing role field'
  END as has_role
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Verify the function can actually insert (check permissions)
SELECT 
  has_table_privilege('postgres', 'public.profiles', 'INSERT') as can_insert,
  has_table_privilege('postgres', 'public.profiles', 'UPDATE') as can_update;
