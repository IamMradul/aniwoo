# Quick Check: Your .env.local File

## What Should Be on Lines 13-15

Based on your Next.js app, lines 13-15 should contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
```

## Quick Verification Steps:

### 1. Check Format (Common Mistakes)

❌ **WRONG:**
```env
# Missing NEXT_PUBLIC_ prefix
GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com

# Using VITE_ prefix (wrong for Next.js)
VITE_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com

# Extra spaces or quotes
NEXT_PUBLIC_GOOGLE_CLIENT_ID = "123456789-abcxyz.apps.googleusercontent.com"

# Typo in variable name
NEXT_PUBLIC_GOOGLE_CLIENTID=123456789-abcxyz.apps.googleusercontent.com
```

✅ **CORRECT:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
```

### 2. Verify in Browser Console

1. **Open your app:** `http://localhost:3000`
2. **Open DevTools:** Press `F12`
3. **Go to Console tab**
4. **Type this and press Enter:**
   ```javascript
   console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
5. **Check the output:**
   - ✅ **Should show:** Your actual values
   - ❌ **Shows `undefined`:** Variable not loaded correctly

### 3. If Variables Show as `undefined`:

1. **Check variable name:** Must be exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (case-sensitive)
2. **Check file location:** `.env.local` must be in project root (same folder as `package.json`)
3. **Check for typos:** Compare character by character
4. **Restart dev server:** Stop (Ctrl+C) and run `npm run dev` again
5. **No extra spaces:** Make sure no spaces before/after `=`

### 4. Quick Test

After checking, try this:
1. Make sure your `.env.local` has the correct format
2. Restart your Next.js dev server
3. Open `http://localhost:3000/login` in browser
4. Open console (F12)
5. Type: `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`
6. If it shows your Client ID → ✅ Good!
7. If it shows `undefined` → ❌ Problem with .env.local

## Still Having Issues?

Share what you see when you:
1. Type `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` in browser console
2. Or tell me what's on lines 13-15 of your `.env.local` (you can hide the actual values, just show the format)

---

**Quick Checklist:**
- [ ] Variable name is exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] No spaces around the `=` sign
- [ ] No quotes around the value
- [ ] File is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- [ ] File is in the root directory (same folder as `package.json`)
- [ ] Dev server was restarted after editing `.env.local`
