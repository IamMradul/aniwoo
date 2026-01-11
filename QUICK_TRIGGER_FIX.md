# Quick Fix: Trigger Not Creating Profiles

## The Problem
The trigger `on_auth_user_created` exists but isn't creating profiles automatically when users sign up.

## The Solution

Run this **ONE** SQL script in Supabase SQL Editor:

### File: `FIX_TRIGGER_COMPLETE.sql`

This script will:
1. ✅ Drop and recreate the trigger function with proper `SECURITY DEFINER`
2. ✅ Set `search_path` explicitly (important for Supabase)
3. ✅ Include proper error handling
4. ✅ Set correct permissions
5. ✅ Recreate the trigger
6. ✅ Verify everything is set up correctly

## Steps:

1. **Open Supabase Dashboard** → SQL Editor
2. **Open the file** `FIX_TRIGGER_COMPLETE.sql`
3. **Copy the entire contents** and paste into SQL Editor
4. **Click "Run"** (or press Ctrl+Enter)
5. **Check the results** - you should see:
   - ✅ Trigger Check: Shows trigger exists
   - ✅ Function Security Check: Shows "SECURITY DEFINER is enabled"
   - ✅ Function Definition: Shows the function code
   - ✅ Function Exists Check: Confirms function exists

6. **Test Google Sign-In**:
   - Go to `http://localhost:3000/login`
   - Select a role
   - Click "Sign in with Google"
   - Complete authentication
   - Profile should be created automatically! ✅

## What Was Wrong?

The most common issues are:
1. **Missing `SECURITY DEFINER`** - Without this, the trigger can't bypass RLS
2. **Wrong `search_path`** - Supabase needs explicit search_path
3. **Function permissions** - Function needs proper owner and grants

The new script fixes all of these.

## Verification

After running the script, check:

```sql
-- This should return TRUE (t)
SELECT prosecdef 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

If it returns `t` (true), the trigger should work!

## If Still Not Working

1. **Check Supabase Logs**:
   - Dashboard → Logs → Postgres Logs
   - Look for any errors from `handle_new_user`

2. **Check if profiles table exists**:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'profiles';
   ```

3. **Test manual insert** (just for debugging):
   ```sql
   -- This should work if RLS policies are correct
   INSERT INTO profiles (id, name, email, role) 
   VALUES ('test-id', 'Test User', 'test@test.com', 'pet_owner');
   ```

4. **Check RLS is enabled but trigger bypasses it**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'profiles';
   ```

---

**After running `FIX_TRIGGER_COMPLETE.sql`, the trigger should work!** 🎉
