-- COMPLETE FIX FOR TRIGGER NOT CREATING PROFILES
-- Run this ENTIRE script in Supabase SQL Editor
-- This will fix the trigger so it properly creates profiles

-- ============================================
-- STEP 1: Drop existing trigger and function
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- STEP 2: Create the function with proper SECURITY DEFINER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with role from metadata
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF((NEW.raw_user_meta_data->>'role')::text, ''),
      'pet_owner'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(NULLIF(EXCLUDED.role, ''), profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 3: Set function owner and permissions
-- ============================================
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_new_user() 
TO postgres, anon, authenticated, service_role;

-- ============================================
-- STEP 4: Create the trigger
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Verify everything is set up correctly
-- ============================================

-- Check trigger exists
SELECT 
  'Trigger Check' as check_type,
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function has SECURITY DEFINER
SELECT 
  'Function Security Check' as check_type,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER is enabled'
    ELSE '❌ SECURITY DEFINER is NOT enabled - THIS IS THE PROBLEM!'
  END as status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check function definition
SELECT 
  'Function Definition' as check_type,
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- STEP 6: Test the function (optional - for debugging)
-- ============================================
-- You can't directly test the trigger, but you can verify the function exists
SELECT 
  'Function Exists Check' as check_type,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- ============================================
-- DONE!
-- ============================================
-- The trigger should now work correctly.
-- Try Google sign-in again - it should create profiles automatically.
-- ============================================
