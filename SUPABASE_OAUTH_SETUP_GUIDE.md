# Supabase Google OAuth Setup Guide

This guide will help you set up Google OAuth with Supabase to enable Google sign-in for both new and existing users.

## Prerequisites

- A Supabase project
- A Google Cloud project with OAuth 2.0 credentials
- Your app's codebase (already updated to use Supabase OAuth)

## Step 1: Get Your Supabase Project Reference

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Look at the URL - it will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
4. Copy `YOUR_PROJECT_REF` (this is your project reference)

## Step 2: Configure Google OAuth in Supabase

1. In your Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list of providers
3. Click to expand/enable Google provider
4. You'll need:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
5. **Save** the configuration

## Step 3: Get Google OAuth Credentials

### If you already have Google OAuth credentials:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID
- Click to view/edit it
- You'll see the **Client ID** and can reveal the **Client Secret**

### If you need to create new credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: Aniwoo (or your app name)
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (replace YOUR_PROJECT_REF)
     - `http://localhost:5173/auth/callback` (for local development)
     - Your production callback URL
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Step 4: Add Redirect URI to Google Cloud Console

**Important:** You must add the Supabase callback URL to your Google OAuth credentials.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, click **+ ADD URI**
5. Add: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Replace `YOUR_PROJECT_REF` with your actual Supabase project reference
6. **Save**

## Step 5: Configure Supabase Redirect URL

In your Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:5173/auth/callback` (for local development)
   - `http://localhost:3000/auth/callback` (if using different port)
   - Your production callback URL: `https://yourdomain.com/auth/callback`
3. **Save**

## Step 6: Enable Google Provider in Supabase

1. Go to **Authentication** → **Providers**
2. Find **Google**
3. Toggle it **ON** (Enable)
4. Enter:
   - **Client ID (for OAuth)**: Your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Your Google OAuth Client Secret
5. **Save**

## Step 7: Test the Setup

1. Start your development server
2. Go to the login or signup page
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you should be redirected back to your app
6. The callback page should redirect you to the appropriate dashboard

## How It Works

1. User clicks "Sign in with Google"
2. App calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User is redirected to Google's sign-in page
4. User signs in with Google
5. Google redirects to Supabase's callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Supabase processes the OAuth flow and creates/updates the user
7. Supabase redirects to your app's callback URL: `http://localhost:5173/auth/callback`
8. Your app detects the session from the URL
9. The auth state change listener picks up the session
10. User is redirected to the appropriate dashboard based on their role

## Troubleshooting

### Issue: "Redirect URI mismatch"
- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Check for typos, trailing slashes, or missing https

### Issue: "Provider not enabled"
- **Solution**: Go to Supabase Dashboard → Authentication → Providers → Google → Enable it

### Issue: "Invalid client credentials"
- **Solution**: Double-check your Client ID and Client Secret in Supabase
- Make sure you're using the correct credentials from Google Cloud Console

### Issue: User not redirected after OAuth
- **Solution**: 
  - Check that the callback route `/auth/callback` exists in your app
  - Verify the redirect URL is added in Supabase URL Configuration
  - Check browser console for errors

### Issue: Session not detected after callback
- **Solution**: 
  - Make sure `detectSessionInUrl: true` is set in your Supabase client config (it should be)
  - Check that the auth state change listener is set up correctly

## Benefits of Supabase OAuth

✅ **Works for existing users**: Users who already have accounts can sign in with Google
✅ **Automatic account linking**: Supabase handles linking Google accounts to existing users
✅ **Proper session management**: Sessions are created and managed by Supabase
✅ **No manual token handling**: No need to decode JWT tokens or handle credentials manually
✅ **Better security**: OAuth flow is handled securely by Supabase

## Next Steps

After setup:
1. Test with a new user (should create account)
2. Test with an existing user (should sign in)
3. Test role assignment (should use the role selected before OAuth)
4. Test on production domain (if applicable)

Your Google OAuth is now fully configured! 🎉
