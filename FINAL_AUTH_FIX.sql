-- ============================================
-- FINAL COMPLETE AUTHENTICATION FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- This will ensure the trigger works correctly for all auth methods
-- ============================================

-- ============================================
-- STEP 1: Drop existing trigger and function
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- STEP 2: Create the function with proper SECURITY DEFINER
-- This is CRITICAL - allows the function to bypass RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with role from metadata
  -- Handles both email/password and Google auth
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
    role = COALESCE(
      NULLIF(EXCLUDED.role, ''),
      profiles.role
    ),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    -- Check Postgres logs for these warnings
    RAISE WARNING 'Error in handle_new_user trigger for user % (email: %): %', 
      NEW.id, 
      NEW.email, 
      SQLERRM;
    -- Still return NEW to allow user creation to succeed
    RETURN NEW;
END;
$$;

-- ============================================
-- STEP 3: Set function owner and permissions
-- ============================================
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permission to all necessary roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() 
TO postgres, anon, authenticated, service_role;

-- ============================================
-- STEP 4: Create the trigger
-- This fires AFTER a new user is inserted into auth.users
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Verification Queries
-- Run these to verify everything is set up correctly
-- ============================================

-- Check trigger exists and is active
SELECT 
  '✅ Trigger Status' as status,
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function has SECURITY DEFINER (CRITICAL!)
SELECT 
  '✅ Function Security' as status,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER is enabled - GOOD!'
    ELSE '❌ SECURITY DEFINER is NOT enabled - THIS IS THE PROBLEM!'
  END as security_status
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- IMPORTANT NEXT STEPS
-- ============================================
-- 1. Go to Supabase Dashboard → Authentication → Settings
-- 2. DISABLE "Enable email confirmations" for development
-- 3. This is critical for the trigger to work immediately
-- 4. Test creating a new account or signing in with Google
-- 5. Check the profiles table to verify profile was created

-- ============================================
-- DONE!
-- ============================================
-- The trigger should now work correctly.
-- Remember to DISABLE email confirmation in the dashboard!
-- ============================================
