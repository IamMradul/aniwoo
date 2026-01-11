# Step-by-Step: Fix Google OAuth Origin Mismatch

## The Error You're Seeing
```
Error 400: origin_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
```

## Why This Happens
Your app is running on `http://localhost:3000` (Next.js), but Google doesn't know about this URL yet. You need to register it.

## Step-by-Step Solution

### Step 1: Open Google Cloud Console
1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account (mradulg306@gmail.com)
3. Make sure you select the **correct project** (the one where you created the OAuth Client ID)

### Step 2: Find Your OAuth Client ID
1. In the left sidebar, click **APIs & Services**
2. Click **Credentials**
3. Find your **OAuth 2.0 Client ID** in the list (it should be a Web application type)
4. Click on it to edit

### Step 3: Add Authorized JavaScript Origins
1. Scroll down to **Authorized JavaScript origins**
2. Click the **+ ADD URI** button
3. Type exactly (copy-paste to avoid typos):
   ```
   http://localhost:3000
   ```
   ⚠️ **Important:** 
   - Must start with `http://` (not `https://`)
   - No trailing slash `/` at the end
   - Exactly as shown above

4. If you also want to keep `localhost:5173` for testing, add:
   ```
   http://localhost:5173
   ```

### Step 4: Add Authorized Redirect URIs (Optional but Recommended)
1. Scroll down to **Authorized redirect URIs**
2. Click **+ ADD URI**
3. Add these one by one:
   ```
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:3000/signup
   ```

### Step 5: Save Your Changes
1. Scroll to the bottom of the page
2. Click the blue **SAVE** button
3. Wait for the "Saved" confirmation message

### Step 6: Wait 2-3 Minutes
- Google's changes take a few minutes to propagate
- Don't try immediately after saving
- Wait at least 2-3 minutes

### Step 7: Clear Browser Cache & Test
1. Open a new **Incognito/Private window** (or clear cache)
   - **Chrome/Brave**: `Ctrl + Shift + N`
   - **Firefox**: `Ctrl + Shift + P`
   - **Edge**: `Ctrl + Shift + N`

2. Go to: `http://localhost:3000/login`

3. Select "Pet Owner" or "Veterinarian"

4. Click "Sign in with Google"

5. It should work now! ✅

## Common Mistakes to Avoid

❌ **WRONG:**
- `https://localhost:3000` (localhost never uses HTTPS)
- `localhost:3000` (missing `http://`)
- `http://localhost:3000/` (extra trailing slash)
- `http://127.0.0.1:3000` (must use `localhost`, not IP)

✅ **CORRECT:**
- `http://localhost:3000` (exactly like this)

## Still Not Working?

### Check 1: Verify Client ID in .env.local
Make sure your `.env.local` file has:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

**To find your Client ID:**
- It's shown in Google Cloud Console under your OAuth Client ID
- It looks like: `123456789-abc123xyz.apps.googleusercontent.com`

### Check 2: Verify You're Using the Right Project
- In Google Cloud Console, check the project name at the top
- Make sure it matches the project where you created the OAuth Client ID
- If you're in the wrong project, click the project name and select the correct one

### Check 3: Wait Longer
- Sometimes Google takes up to 5 minutes to propagate changes
- Try again after waiting 5 minutes

### Check 4: Restart Next.js Server
After making changes, restart your dev server:
```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

## Visual Guide (What You Should See)

**In Google Cloud Console, your "Authorized JavaScript origins" should look like:**
```
http://localhost:3000
http://localhost:5173  (optional, if you use both)
```

**Your "Authorized redirect URIs" should look like:**
```
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/signup
```

## Need More Help?

If it's still not working after following all steps:
1. Take a screenshot of your Google Cloud Console OAuth settings (hide your Client ID)
2. Check browser console (F12) for any other errors
3. Share the exact error message you see

---

**After following these steps, wait 2-3 minutes, then try again in an Incognito window!**
