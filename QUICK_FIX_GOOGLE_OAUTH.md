# Quick Fix: Google OAuth Origin Mismatch Error

## Problem
You're seeing: `Error 400: origin_mismatch`

This happens because Google OAuth requires you to register the exact URL where your app runs.

## Solution (5 minutes)

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your project (or create one if needed)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client ID
1. Click on your OAuth 2.0 Client ID (the one you're using for this app)
2. Scroll down to **Authorized JavaScript origins**
3. Click **+ ADD URI**
4. Add exactly these URLs (one at a time):
   ```
   http://localhost:3000
   http://localhost:5173
   ```
   
   **Note:** Include both ports - 3000 for Next.js and 5173 if you still use Vite for testing

### Step 3: Add Redirect URIs (if needed)
1. Scroll to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Add:
   ```
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:3000/signup
   ```

### Step 4: Save Changes
1. Click **SAVE** at the bottom
2. Wait 2-3 minutes for changes to propagate (Google says it can take up to 5 minutes)

### Step 5: Test Again
1. Clear your browser cache (or use Incognito/Private mode)
2. Try Google Sign-In again
3. If it still doesn't work, wait another minute and try again

## Common Mistakes to Avoid

❌ **Don't add:**
- `https://localhost:3000` (wrong protocol - localhost doesn't use HTTPS)
- `localhost:3000` (missing `http://`)
- Trailing slashes: `http://localhost:3000/` (should be without trailing slash)

✅ **Do add:**
- `http://localhost:3000` (correct format)

## Still Not Working?

1. **Double-check the Client ID:**
   - Make sure you're using the correct Client ID in your `.env.local`
   - It should be: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here`
   - No quotes needed in `.env.local`

2. **Verify the Client ID is correct:**
   - In Google Cloud Console, copy the Client ID
   - Compare it with what's in your `.env.local` file
   - Make sure there are no extra spaces or characters

3. **Check if you're using the right type:**
   - You need **OAuth 2.0 Client ID** (Web application type)
   - Not "Desktop app" or "iOS/Android" type

4. **Wait longer:**
   - Sometimes Google takes up to 5 minutes to propagate changes
   - Try again after waiting

5. **Use Incognito/Private mode:**
   - Sometimes browser cache causes issues
   - Try in a new incognito window

## For Production (Later)

When you deploy to production (e.g., `https://yourdomain.com`), you'll need to add:
- **Authorized JavaScript origins:** `https://yourdomain.com`
- **Authorized redirect URIs:** `https://yourdomain.com`, `https://yourdomain.com/login`, etc.

---

**After making these changes, wait 2-3 minutes, then try again!**
