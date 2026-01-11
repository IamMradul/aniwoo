# Verify Google OAuth Setup - Checklist

## ✅ Your Google Cloud Console Configuration (CORRECT!)

**Authorized JavaScript origins:**
- `http://localhost:3000` ✓

**Authorized redirect URIs:**
- `http://localhost:3000` ✓
- `http://localhost:3000/login` ✓
- `http://localhost:3000/signup` ✓

**This configuration is PERFECT!** ✅

---

## Next Steps to Fix the Error

### Step 1: Verify Client ID Match (IMPORTANT!)

1. **In Google Cloud Console:**
   - Copy your **Client ID** (it looks like: `123456789-abc...xyz.apps.googleusercontent.com`)
   - It's shown at the top of your OAuth Client ID settings page

2. **Check your `.env.local` file:**
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
   
3. **Verify they match exactly:**
   - The Client ID in `.env.local` MUST match the one in Google Cloud Console
   - No extra spaces
   - No quotes needed
   - Copy-paste to avoid typos

### Step 2: Wait for Propagation (REQUIRED!)

- Google changes take **2-5 minutes** to propagate
- If you just saved, wait at least 3 minutes
- Set a timer if needed!

### Step 3: Restart Next.js Dev Server

After verifying the Client ID:

1. Stop your dev server (press `Ctrl+C` in terminal)
2. Restart it:
   ```bash
   npm run dev
   ```
3. This ensures environment variables are loaded correctly

### Step 4: Clear Browser Cache Completely

**Option A: Use Incognito/Private Window (EASIEST)**
- Chrome/Brave: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`
- Then go to `http://localhost:3000/login`

**Option B: Clear Cache Manually**
- Press `F12` to open DevTools
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"
- Or: `Ctrl + Shift + Delete` → Clear cached images and files

### Step 5: Verify Environment Variable is Loaded

1. Open browser console (`F12`)
2. Go to the **Console** tab
3. Type and press Enter:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
   ```
4. You should see your Client ID
5. If it shows `undefined`, the env var isn't loaded - restart the dev server

### Step 6: Check for Other Errors

Open browser console (`F12`) and look for:
- Any red error messages
- Network errors (check Network tab)
- Console errors that might give more details

---

## Still Not Working? Try This Debug Checklist

### ✅ Checklist:

- [ ] Client ID in `.env.local` matches Google Cloud Console exactly
- [ ] Waited at least 3-5 minutes after saving in Google Console
- [ ] Restarted Next.js dev server after checking Client ID
- [ ] Using Incognito/Private window OR cleared browser cache
- [ ] Environment variable is loaded (check console)
- [ ] No typos in `.env.local` (especially `NEXT_PUBLIC_` prefix)
- [ ] Using the correct OAuth Client ID (not a different project's)
- [ ] Next.js server is running on `http://localhost:3000` (not a different port)

### 🔍 Additional Debugging

**Check if the Google button appears:**
- If you don't see the Google Sign-In button, check browser console for errors
- Look for "Google Client ID not configured" message

**Check the exact error in browser console:**
- Open DevTools (`F12`)
- Go to **Console** tab
- Try clicking the Google Sign-In button
- Copy the exact error message you see

**Verify you're on the right project in Google Cloud Console:**
- Check the project name at the top of Google Cloud Console
- Make sure it's the same project where you created the OAuth Client ID
- If you have multiple projects, you might be editing the wrong one!

---

## Common Issues & Quick Fixes

### Issue: "Google Client ID not configured"
**Fix:** Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is in `.env.local` and restart dev server

### Issue: Still getting origin_mismatch after 5 minutes
**Fix:** 
1. Double-check the Client ID matches exactly
2. Make sure you're editing the correct OAuth Client ID (check project name)
3. Try removing and re-adding `http://localhost:3000` in Google Console
4. Save again and wait another 5 minutes

### Issue: Button doesn't appear
**Fix:** Check browser console for JavaScript errors

### Issue: Works in one browser but not another
**Fix:** Clear cache in that browser, or use Incognito mode

---

## Final Test

1. ✅ Wait 5 minutes after last Google Console save
2. ✅ Restart Next.js dev server
3. ✅ Open Incognito window
4. ✅ Go to `http://localhost:3000/login`
5. ✅ Select "Pet Owner" or "Veterinarian"
6. ✅ Click "Sign in with Google"
7. ✅ Should work now! 🎉

---

**If it's STILL not working after all these steps, please share:**
1. The exact error message from browser console
2. A screenshot of your Google Cloud Console OAuth Client ID settings (hide your Client ID)
3. Confirmation that the Client ID in `.env.local` matches exactly
