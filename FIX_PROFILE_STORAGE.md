# Fix: Data Not Storing in Supabase

## Problem
Normal login works, but user data is not being stored in the `profiles` table in Supabase.

## Solution Steps

### Step 1: Update the Database Trigger (IMPORTANT!)

The trigger needs to extract the `role` from user metadata. Run this SQL in your Supabase SQL Editor:

```sql
-- Update the function to handle role
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

**OR** use the file `UPDATE-TRIGGER-WITH-ROLE.sql` which I've created.

### Step 2: Verify RLS Policies

Make sure you've run `COMPLETE-SETUP.sql` to set up RLS policies. The policies should allow:
- Users to insert their own profiles
- Users to update their own profiles
- Users to view their own profiles

### Step 3: Test Registration

1. **Clear browser data** or use Incognito mode
2. **Go to signup page**: `http://localhost:3000/signup`
3. **Create a new account** with email/password
4. **Select a role** (Vet or Pet Owner)
5. **Submit the form**

### Step 4: Verify Data in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Table Editor** → **profiles**
3. You should see:
   - A new row with your user's `id` (UUID)
   - Your `name`
   - Your `email`
   - Your `role` (vet or pet_owner)
   - `created_at` timestamp

### Step 5: If Data Still Not Appearing

**Check Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Look for messages like "Error creating profile" or "Error updating profile"

**Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Postgres Logs**
3. Look for any errors related to profile creation

**Common Issues:**

1. **Trigger not running:**
   - Verify trigger exists: Run the verification query in `COMPLETE-SETUP.sql`
   - Make sure trigger is enabled

2. **RLS blocking insert:**
   - Check if RLS policies are correct
   - Verify you're authenticated when creating profile

3. **Metadata not passed:**
   - The code now passes `role` in `options.data`
   - Check if it's being sent correctly

## What Was Fixed

1. **Registration function** now:
   - Waits for the database trigger to run (1.5 seconds)
   - Checks if profile was created
   - Updates profile with role if it exists
   - Creates profile manually if trigger didn't run
   - Better error handling and logging

2. **Trigger** now:
   - Includes `role` from user metadata
   - Defaults to 'pet_owner' if role not provided
   - Updates existing profiles on conflict

## Testing Checklist

After applying fixes:

- [ ] Updated the trigger function in Supabase SQL Editor
- [ ] Verified trigger exists (run verification query)
- [ ] Tested creating a new account
- [ ] Checked Supabase Table Editor - profile appears
- [ ] Verified profile has correct name, email, and role
- [ ] Tested logging in with the new account
- [ ] Verified user data persists after login

## Still Not Working?

If data still isn't storing:

1. **Share the error from browser console** (F12 → Console)
2. **Share any errors from Supabase logs**
3. **Verify the trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
4. **Check if RLS is blocking:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles';
   ```
