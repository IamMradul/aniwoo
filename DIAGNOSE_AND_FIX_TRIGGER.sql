-- COMPREHENSIVE DIAGNOSTIC AND FIX FOR TRIGGER
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check if trigger exists
-- ============================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- STEP 2: Check function definition and permissions
-- ============================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as function_settings,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- STEP 3: DROP AND RECREATE TRIGGER FUNCTION WITH FULL ROLE SUPPORT
-- ============================================

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with role from metadata
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1),
      'User'
    ),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::text,
      'pet_owner'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the trigger
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 4: RECREATE THE TRIGGER
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: VERIFY THE SETUP
-- ============================================

-- Check trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function has SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Should show: is_security_definer = true (t)

-- ============================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant execute permission on the function (should already exist, but just in case)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Ensure the function owner has permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================
-- STEP 7: CHECK EXISTING PROFILES (for debugging)
-- ============================================

SELECT 
  id,
  name,
  email,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- DONE! 
-- ============================================
-- The trigger should now work correctly.
-- Try Google sign-in again.
-- ============================================
