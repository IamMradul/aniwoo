-- ============================================
-- COMPREHENSIVE AUTH DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose auth issues
-- ============================================

-- ============================================
-- CHECK 1: Verify trigger exists and is active
-- ============================================
SELECT 
  'CHECK 1: Trigger Status' as check_name,
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing,
  action_statement,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ Trigger exists'
    ELSE '❌ Trigger MISSING - This is a problem!'
  END as status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- CHECK 2: Verify function exists with SECURITY DEFINER
-- ============================================
SELECT 
  'CHECK 2: Function Security' as check_name,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER is enabled'
    ELSE '❌ SECURITY DEFINER is NOT enabled - CRITICAL ISSUE!'
  END as status,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- CHECK 3: Check function permissions
-- ============================================
SELECT 
  'CHECK 3: Function Permissions' as check_name,
  p.proname as function_name,
  r.rolname as granted_to,
  CASE 
    WHEN r.rolname IS NOT NULL THEN '✅ Permission granted'
    ELSE '⚠️ Check permissions'
  END as status
FROM pg_proc p
LEFT JOIN pg_proc_acl pacl ON p.oid = pacl.oid
LEFT JOIN pg_roles r ON pacl.acl LIKE '%' || r.rolname || '%'
WHERE p.proname = 'handle_new_user';

-- ============================================
-- CHECK 4: Verify profiles table structure
-- ============================================
SELECT 
  'CHECK 4: Profiles Table' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- CHECK 5: Check RLS policies on profiles
-- ============================================
SELECT 
  'CHECK 5: RLS Policies' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- CHECK 6: Test if trigger function can be called (dry run)
-- ============================================
-- This won't actually create a profile, but checks if function syntax is valid
SELECT 
  'CHECK 6: Function Syntax' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
    ) THEN '✅ Function exists - syntax should be valid'
    ELSE '❌ Function does not exist'
  END as status;

-- ============================================
-- CHECK 7: Recent auth users (last 24 hours) - check if profiles were created
-- ============================================
SELECT 
  'CHECK 7: Recent Auth Users vs Profiles' as check_name,
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profile exists'
    ELSE '❌ Profile MISSING - Trigger may have failed'
  END as profile_status,
  p.created_at as profile_created_at,
  p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================
-- CHECK 8: Check for any error logs in Postgres (if accessible)
-- ============================================
-- Note: This may not work depending on your Supabase plan
-- Check Supabase Dashboard → Logs → Postgres Logs manually for errors

-- ============================================
-- SUMMARY REPORT
-- ============================================
SELECT 
  'SUMMARY' as report_section,
  'Run this script and check the results above.' as instructions,
  'If trigger is missing or SECURITY DEFINER is disabled, run FIX_TRIGGER_COMPLETE.sql' as fix_instructions,
  'Also disable email confirmation in Supabase Dashboard → Authentication → Settings' as email_confirmation_note;
