# Fix: "Google Client ID not configured" Error

## Why This Error Shouldn't Appear

With Supabase OAuth, you **don't need** `VITE_GOOGLE_CLIENT_ID` in your frontend code anymore. The Google Client ID should be configured in **Supabase Dashboard**, not in your `.env` file.

## The Real Issue

This error is likely coming from one of these:

### 1. Old Cached Code Still Running

The error message "Google Client ID not configured" was from the **old Google Identity Services** code. If you're seeing this, your browser is still using cached JavaScript.

**Fix:**
- Restart dev server (`Ctrl+C`, then `npm run dev`)
- Hard refresh browser (`Ctrl+Shift+R`)
- Or use incognito/private window

### 2. Google OAuth Not Configured in Supabase

If Google OAuth isn't set up in Supabase Dashboard, you'll get errors when trying to use it.

**Fix:**
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** provider
3. **Enable it** (toggle ON)
4. Enter your **Google OAuth Client ID** and **Client Secret**
5. **Save**

See `SUPABASE_OAUTH_SETUP_GUIDE.md` for complete setup instructions.

### 3. Error from Supabase (Not Your Code)

If Google OAuth isn't configured in Supabase, `signInWithOAuth` will fail with an error. The error message might mention client ID.

**Fix:** Configure Google OAuth in Supabase Dashboard (see above).

## What You DON'T Need Anymore

With Supabase OAuth, you **don't need**:
- ❌ `VITE_GOOGLE_CLIENT_ID` in your `.env` file
- ❌ Google Identity Services script loading
- ❌ JWT token decoding

The Google Client ID goes in **Supabase Dashboard**, not your frontend code.

## Quick Fix Steps

1. **Restart dev server** (if you haven't already)
   ```bash
   # Stop: Ctrl+C
   # Start: npm run dev
   ```

2. **Clear browser cache** (hard refresh: `Ctrl+Shift+R`)

3. **Configure Google OAuth in Supabase:**
   - Supabase Dashboard → Authentication → Providers → Google
   - Enable it
   - Add Client ID and Secret
   - Save

4. **Test again**

## Verify Setup

To check if Google OAuth is configured in Supabase:

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Look for **Google**
4. Is it **enabled**? (Toggle should be green/ON)
5. Are **Client ID** and **Client Secret** filled in?

If not, that's why you're getting the error!

## Expected Behavior

After configuring Google OAuth in Supabase:

1. Click "Sign in with Google"
2. Should redirect to Google's sign-in page
3. After signing in, redirects back to your app
4. No "Client ID not configured" error

## Still Seeing the Error?

If you've:
- ✅ Restarted dev server
- ✅ Cleared browser cache
- ✅ Configured Google OAuth in Supabase Dashboard

And still see the error:

1. **Check browser console** (F12 → Console)
   - What's the actual error message?
   - Is it from your code or Supabase?

2. **Check Supabase Dashboard → Logs**
   - Look for authentication errors
   - See what Supabase is saying

3. **Verify the error source:**
   - If it's in a red box on the page → Old cached code
   - If it's in browser console → Check the actual error message

The error "Google Client ID not configured" should NOT appear with the new Supabase OAuth code. If it does, it's either cached code or Google OAuth isn't configured in Supabase.
