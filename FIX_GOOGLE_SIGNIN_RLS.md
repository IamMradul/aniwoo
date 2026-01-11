# Fix: Google Sign-In RLS Policy Error

## Problem
Getting error: `Failed to create profile: new row violates row-level security policy for table "profiles"`

This happens because:
1. The trigger might not be running or not including the role
2. The code tries to manually insert when trigger fails, but RLS blocks it
3. The role is not being passed in metadata to the trigger

## Solution

### Step 1: Update the Database Trigger (CRITICAL!)

The trigger must include the `role` field. Run this in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::text,
      'pet_owner'::text
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**OR** use the file `UPDATE-TRIGGER-WITH-ROLE.sql` I created.

### Step 2: Verify Trigger Exists

Run this query in Supabase SQL Editor to verify:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

You should see a row with `trigger_name = 'on_auth_user_created'`.

### Step 3: Verify RLS Policies

Run this query to check RLS policies:

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

You should see at least these policies:
- "Users can view own profile" (SELECT)
- "Users can insert own profile" (INSERT) 
- "Users can update own profile" (UPDATE)
- "Authenticated users can view profiles" (SELECT)

### Step 4: What I Fixed in the Code

1. **Added `role` to metadata** when creating user via Google sign-in
2. **Increased wait time** from 1 second to 2 seconds for trigger to complete
3. **Better error handling** - if trigger doesn't run, gives clear error message
4. **Removed manual insert attempt** - relies entirely on trigger (which bypasses RLS with SECURITY DEFINER)
5. **Better retry logic** - checks multiple times before giving up

### Step 5: Test Google Sign-In

1. **Go to login page**: `http://localhost:3000/login`
2. **Select a role** (Vet or Pet Owner)
3. **Click "Sign in with Google"**
4. **Complete Google authentication**
5. **Should work now!** ✅

## If Still Not Working

### Check 1: Verify Trigger is Running

In Supabase Dashboard → Logs → Postgres Logs, look for:
- Trigger execution messages
- Any errors from `handle_new_user` function

### Check 2: Check if Profile is Created Despite Error

Go to Supabase Dashboard → Table Editor → profiles
- Check if a profile was created (maybe without role)
- If profile exists but error still shows, it's a timing/update issue

### Check 3: Run Complete Setup SQL

If unsure, run the entire `COMPLETE-SETUP.sql` file again, then run `UPDATE-TRIGGER-WITH-ROLE.sql`.

### Check 4: Browser Console

Open browser console (F12) and check for:
- Any additional error messages
- Messages like "Profile not created by trigger"
- Network errors to Supabase

## Key Points

1. **The trigger uses SECURITY DEFINER** - this bypasses RLS policies
2. **Manual inserts are blocked by RLS** - that's why we rely on the trigger
3. **Role must be in metadata** - so the trigger can extract it
4. **Wait time is important** - trigger runs asynchronously

## Success Indicators

After fixes, you should see:
- ✅ No RLS error message
- ✅ Profile appears in Supabase `profiles` table
- ✅ Profile has correct name, email, and role
- ✅ User is logged in and redirected correctly
