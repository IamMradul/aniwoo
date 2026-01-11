# Complete Authentication Fix Guide

This guide will help you fix the issues with profile creation and Google authentication.

## Issues You're Experiencing

1. ❌ Profiles are not created automatically after signup
2. ❌ Google authentication is not creating profiles
3. ❌ Error: "Profile was not created automatically after multiple attempts"

## Root Causes

1. **Email Confirmation is Enabled**: When email confirmation is required, the trigger fires but the user doesn't have an active session yet
2. **Trigger Not Set Up Correctly**: The trigger function may be missing SECURITY DEFINER or other permissions
3. **Timing Issues**: The trigger may fire before the user's email is confirmed

## Solution Steps

### Step 1: Disable Email Confirmation (CRITICAL)

**This is the most important step!**

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Settings** (or **Settings** → **Auth**)
4. Find the section: **Email Auth** or **Email Confirmation**
5. **DISABLE** "Enable email confirmations" or "Confirm email"
   - Look for a toggle/checkbox that says something like:
     - "Enable email confirmations"
     - "Confirm email"
     - "Require email verification"
   - **Turn it OFF**
6. **Save** the changes

**Why this matters:**
- When email confirmation is enabled, users must click a confirmation link before they can use the app
- The trigger fires when the user is created, but the user isn't "active" until they confirm
- This causes timing issues where the profile might not be accessible immediately
- For development and Google auth (where emails are already verified), you don't need this

### Step 2: Run the Trigger Fix Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `FIX_TRIGGER_COMPLETE.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Verify the results show:
   - ✅ Trigger exists
   - ✅ SECURITY DEFINER is enabled
   - ✅ Function exists

**What this script does:**
- Drops and recreates the trigger with proper permissions
- Ensures SECURITY DEFINER is enabled (allows bypassing RLS)
- Sets up proper error handling
- Grants necessary permissions

### Step 3: Run Diagnostic Script (Optional but Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `DIAGNOSE_AUTH_ISSUES.sql`
3. Paste and run it
4. Check all the results:
   - Trigger should exist ✅
   - Function should have SECURITY DEFINER ✅
   - Recent users should have profiles ✅

### Step 4: Test the Fix

1. **Test Regular Signup:**
   - Go to your signup page
   - Create a new account with email/password
   - Check if profile is created immediately
   - Verify in Supabase Dashboard → **Table Editor** → **profiles** table

2. **Test Google Authentication:**
   - Go to login/signup page
   - Click "Sign in with Google"
   - Complete Google authentication
   - Check if profile is created
   - Verify in the profiles table

3. **Check Logs (if still having issues):**
   - Go to **Supabase Dashboard** → **Logs** → **Postgres Logs**
   - Look for any errors related to `handle_new_user` or `profiles`
   - Common errors:
     - Permission denied → Check SECURITY DEFINER
     - Column doesn't exist → Check profiles table structure
     - Constraint violation → Check table schema

### Step 5: Re-enable Email Confirmation (Later - After Development)

Once everything is working in development:

1. You can re-enable email confirmation for production
2. But make sure to:
   - Test thoroughly
   - Consider using email confirmation only for email/password signups
   - Google auth emails are already verified, so they shouldn't need confirmation

## Common Issues and Solutions

### Issue: "Profile was not created"

**Solution:**
1. ✅ Disable email confirmation (Step 1)
2. ✅ Re-run FIX_TRIGGER_COMPLETE.sql (Step 2)
3. ✅ Check Postgres logs for errors
4. ✅ Verify trigger exists: Run `DIAGNOSE_AUTH_ISSUES.sql`

### Issue: "Permission denied" errors

**Solution:**
- The trigger function MUST have `SECURITY DEFINER`
- Run `FIX_TRIGGER_COMPLETE.sql` to fix this

### Issue: "User already exists" with Google auth

**Solution:**
- This happens when a user tries to sign up with Google but their email already exists
- Your current code handles this, but users need to use email/password login instead
- Consider implementing account linking in the future

### Issue: Profile exists but role is null

**Solution:**
- The trigger creates profiles with role `pet_owner` by default
- The auth context code updates the role after authentication
- This should work automatically, but if not, check the `loginWithGoogle` function

## Verification Checklist

After completing all steps, verify:

- [ ] Email confirmation is DISABLED in Supabase Dashboard
- [ ] Trigger exists (check with diagnostic script)
- [ ] Function has SECURITY DEFINER enabled
- [ ] Can create new account with email/password → profile created
- [ ] Can sign in with Google → profile created
- [ ] Profile appears in `profiles` table immediately
- [ ] No errors in Postgres logs

## Need More Help?

1. Check Supabase Dashboard → **Logs** → **Postgres Logs** for detailed errors
2. Run `DIAGNOSE_AUTH_ISSUES.sql` to see what's wrong
3. Verify your `profiles` table structure matches what the trigger expects
4. Make sure RLS policies allow profile creation (the trigger bypasses RLS with SECURITY DEFINER)

## Technical Details

### How the Trigger Works

1. User signs up → Supabase creates entry in `auth.users`
2. Trigger `on_auth_user_created` fires AFTER INSERT
3. Trigger function `handle_new_user()` runs with SECURITY DEFINER (bypasses RLS)
4. Function inserts row into `public.profiles` table
5. Profile is immediately available

### Why SECURITY DEFINER is Critical

- Row Level Security (RLS) prevents users from inserting into `profiles` before they have a profile
- SECURITY DEFINER runs the function as the function owner (postgres), bypassing RLS
- This allows the trigger to create profiles even though the user doesn't have permission yet

### Email Confirmation Impact

- With confirmation ENABLED: User created → Trigger fires → Profile created → User confirms email → Session active
- With confirmation DISABLED: User created → Trigger fires → Profile created → Session active immediately

For Google auth, emails are already verified, so confirmation is unnecessary.
