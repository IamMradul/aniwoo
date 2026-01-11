# Fix Google OAuth Origin Mismatch Error

## Problem
After migrating to Next.js, the app runs on `http://localhost:3000` instead of `http://localhost:5173`. Google OAuth requires the JavaScript origin to be registered in Google Cloud Console.

## Solution

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://localhost:5173` (keep this if you still use Vite for testing)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000`
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`
7. Click **Save**

### Step 2: Wait for Changes to Propagate
- Google's changes can take a few minutes to propagate
- Try again after 2-3 minutes

### Step 3: Clear Browser Cache
- Clear your browser cache and cookies for localhost
- Or use an incognito/private window

### Step 4: Test
- Try signing in with Google again
- The error should be resolved

## For Production

When deploying to production, make sure to add your production domain:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**: `https://yourdomain.com`, `https://yourdomain.com/login`, etc.

## Note
The `themeColor` warning has been fixed by moving it to the `viewport` export in `app/layout.tsx`.
