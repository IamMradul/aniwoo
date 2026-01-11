# Troubleshooting: Still Seeing "Account Already Exists" Error

If you're still seeing the error: "An account with email X already exists. Please use email/password login instead of Google Sign-In."

## This Error Should NOT Appear Anymore

After migrating to Supabase OAuth, this error message should **never appear** because:
- Supabase OAuth handles existing users automatically
- The old error message code has been removed

## If You're Still Seeing This Error

### 1. Restart Your Development Server ✅ CRITICAL

The old code might still be running. You **MUST** restart your dev server:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

**Why this matters:** The code changes won't take effect until the dev server rebuilds the app.

### 2. Clear Browser Cache

Your browser might be using cached JavaScript files:

1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or Clear Cache**: 
   - Chrome: DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"
   - Or: Settings → Privacy → Clear browsing data → Cached images and files

### 3. Use Incognito/Private Mode

To bypass cache completely:
- Open an incognito/private window
- Try Google sign-in again

### 4. Verify Google OAuth is Configured in Supabase

**Important:** You MUST set up Google OAuth in Supabase Dashboard before it will work!

See: `SUPABASE_OAUTH_SETUP_GUIDE.md` for complete instructions

Quick check:
1. Go to Supabase Dashboard → Authentication → Providers
2. Is Google provider **Enabled**? (Toggle should be ON)
3. Are Client ID and Client Secret filled in?

**If Google provider is NOT enabled in Supabase:**
- The OAuth flow will fail
- You might see different errors
- Follow the setup guide to configure it

### 5. Check Browser Console for Real Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Try Google sign-in
4. Look for error messages

**What to look for:**
- ❌ "Provider not enabled" → Set up Google OAuth in Supabase
- ❌ "Redirect URI mismatch" → Add redirect URI to Google Cloud Console
- ❌ "Invalid client credentials" → Check Client ID/Secret in Supabase
- ✅ If you see "signInWithOAuth" being called → Code is updated correctly!

### 6. Verify Code is Updated

Check if the code is using the new implementation:

1. Open `src/context/AuthContext.tsx`
2. Search for `loginWithGoogle`
3. It should use `supabase.auth.signInWithOAuth` (NOT `signUp`)

**Correct code should look like:**
```typescript
const loginWithGoogle = async (role: 'vet' | 'pet_owner') => {
  // Store the role in localStorage so we can use it after OAuth callback
  localStorage.setItem('pending_oauth_role', role);
  
  // Use Supabase's built-in OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      // ...
    },
  });
  // ...
};
```

**NOT this (old code):**
```typescript
const loginWithGoogle = async (credential: string, role: 'vet' | 'pet_owner') => {
  // Decode Google JWT token...
  const googleUser = decodeGoogleToken(credential);
  // Try to signUp...
  // ...
};
```

## Quick Fix Checklist

- [ ] Stopped and restarted dev server (`npm run dev`)
- [ ] Cleared browser cache (hard refresh: Ctrl+Shift+R)
- [ ] Tried in incognito/private window
- [ ] Verified Google OAuth is enabled in Supabase Dashboard
- [ ] Checked browser console for real errors
- [ ] Verified code uses `signInWithOAuth` (not old JWT code)

## Expected Behavior After Fix

After restarting the server and clearing cache:

1. Click "Sign in with Google"
2. **Should redirect to Google** (not show error)
3. After signing in with Google, redirects back to your app
4. User is logged in (works for both new and existing users)

## Still Having Issues?

If you've done all the above and still see the error:

1. Check the browser console for the actual error
2. Verify your Supabase project has Google OAuth enabled
3. Make sure you've added the redirect URI to Google Cloud Console
4. Check Supabase Dashboard → Logs for authentication errors

The error message you're seeing is from the OLD code. If the new code is running, you should either:
- See a redirect to Google (success)
- See a different error message (from Supabase, not our code)
