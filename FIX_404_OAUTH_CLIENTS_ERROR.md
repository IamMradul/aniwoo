# Fix: 404 Error on /auth/v1/admin/oauth/clients

## The Error

You're seeing this error in Supabase logs:
```
GET | 404 | /auth/v1/admin/oauth/clients?page=1&per_page=100
apikey: sb_temp_dm... <invalid: invalid>
```

## What This Means

This error occurs when:
1. **Supabase Dashboard** is trying to list OAuth clients
2. The API key being used is **invalid or expired**
3. Or you don't have permission to access admin OAuth endpoints

## This is NOT Your Code's Fault

This error is coming from **Supabase Dashboard itself**, not your application code. It happens when:
- You're viewing the Authentication → Providers page in Supabase Dashboard
- Supabase is trying to fetch the list of OAuth providers
- The API key it's using is invalid

## Solutions

### Solution 1: Refresh Supabase Dashboard

1. **Log out** of Supabase Dashboard
2. **Log back in**
3. Go to **Authentication** → **Providers** again
4. The error should be gone

### Solution 2: Check Your Supabase Project Status

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Check if your project is **active** (not paused)
3. If paused, **resume** it

### Solution 3: Verify API Keys

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Check that your **anon/public key** is valid
3. Your frontend should use the **anon key**, not the service role key

### Solution 4: Ignore This Error (If OAuth Still Works)

**Important:** This error might not actually prevent Google OAuth from working!

If:
- ✅ You can see the Google provider in Supabase Dashboard
- ✅ You can enable/configure it
- ✅ Your app can call `signInWithOAuth`

Then this error is just a **dashboard display issue** and you can ignore it.

## Check If OAuth Actually Works

1. **Configure Google OAuth in Supabase:**
   - Go to **Authentication** → **Providers** → **Google**
   - Enable it
   - Add Client ID and Secret
   - Save

2. **Test in your app:**
   - Click "Sign in with Google"
   - Should redirect to Google (not show error)
   - After signing in, should redirect back

If OAuth works, the 404 error is just a dashboard issue and can be ignored.

## Why This Happens

This error typically occurs when:
- Supabase Dashboard is using a temporary/invalid API key
- There's a temporary issue with Supabase's admin API
- Your browser session in Supabase Dashboard has expired

## What to Do

1. **Try refreshing the Supabase Dashboard page** (F5)
2. **Log out and log back in** to Supabase Dashboard
3. **Configure Google OAuth** (if you haven't already)
4. **Test OAuth in your app** - if it works, ignore the 404 error

## If OAuth Doesn't Work

If Google OAuth still doesn't work after configuring it:

1. **Check browser console** (F12) for errors
2. **Check Supabase Dashboard → Logs** for authentication errors
3. **Verify Google OAuth is enabled** in Supabase Dashboard
4. **Verify redirect URI** is added to Google Cloud Console

The 404 error on `/auth/v1/admin/oauth/clients` is a **dashboard issue**, not an application issue. If your OAuth is configured correctly and works, you can safely ignore this error.
