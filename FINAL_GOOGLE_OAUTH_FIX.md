# Final Fix: "Google Client ID not configured" Error

## The Problem

You're seeing "Google Client ID not configured" error when trying to use Google authentication.

## Root Cause

There are **TWO** GoogleSignIn components in your project:
1. `src/components/auth/GoogleSignIn.tsx` - ✅ Updated to use Supabase OAuth
2. `components/auth/GoogleSignIn.tsx` - ❌ Still using old Google Identity Services code

The error is coming from the **old component** in `components/auth/GoogleSignIn.tsx` which still checks for `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## What I Fixed

### 1. Updated `components/auth/GoogleSignIn.tsx`
- ✅ Removed Google Identity Services code
- ✅ Now uses Supabase OAuth (`loginWithGoogle(role)`)
- ✅ No longer needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 2. Updated `components/providers/AuthProvider.tsx`
- ✅ Changed `loginWithGoogle` signature: `(credential, role)` → `(role)`
- ✅ Now uses `supabase.auth.signInWithOAuth()`
- ✅ Removed `decodeGoogleToken` import
- ✅ Updated auth state handler to use pending OAuth role

## Next Steps

### 1. Restart Your Dev Server (CRITICAL)

```bash
# Stop: Ctrl+C
# Start: npm run dev
```

**This is essential** - the code changes won't take effect until the server rebuilds!

### 2. Clear Browser Cache

- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or use incognito/private window

### 3. Configure Google OAuth in Supabase Dashboard

**This is required** - Google OAuth must be set up in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and **Enable it**
3. Enter:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
4. **Save**

See `SUPABASE_OAUTH_SETUP_GUIDE.md` for complete instructions.

### 4. Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Replace `YOUR_PROJECT_REF` with your Supabase project reference)

### 5. Add Callback URL in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
   (Or your production URL)

## Expected Behavior After Fix

1. Click "Sign in with Google"
2. **Should redirect to Google** (not show "Client ID not configured" error)
3. After signing in with Google, redirects back to your app
4. Works for both **new AND existing users** ✅

## Verification

After completing the steps above:

- ✅ No "Google Client ID not configured" error
- ✅ Redirects to Google OAuth page
- ✅ Works for existing users
- ✅ Works for new users

## Important Notes

- You **don't need** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in your `.env` file anymore
- The Google Client ID goes in **Supabase Dashboard**, not your frontend code
- Both GoogleSignIn components are now updated to use Supabase OAuth

## If Still Not Working

1. **Restart dev server** (if you haven't already)
2. **Clear browser cache** (hard refresh)
3. **Verify Google OAuth is enabled** in Supabase Dashboard
4. **Check browser console** for actual errors
5. **Check Supabase Dashboard → Logs** for authentication errors

The code is now updated correctly. You just need to:
1. Restart the dev server
2. Configure Google OAuth in Supabase Dashboard
3. Test it!
