# Troubleshooting Login Issues

## Common Issues and Solutions

### 1. Environment Variables Not Set

Make sure you have a `.env.local` file in the root of your project with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**How to check:**
- Open browser console (F12)
- Look for warnings about missing Supabase env vars
- Check if `NEXT_PUBLIC_` prefix is correct (required for Next.js)

### 2. Supabase Connection Issues

**Check if Supabase is accessible:**
- Open browser console
- Look for network errors when trying to log in
- Verify your Supabase URL is correct and the project is active

**Test Supabase connection:**
```javascript
// In browser console
import { supabase } from '@/lib/supabaseClient';
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, 'Error:', error);
```

### 3. User Account Doesn't Exist

**For email/password login:**
- Make sure you've created an account first using the Signup page
- Check if email confirmation is required in Supabase settings
- Verify the email and password are correct

**For Google login:**
- Make sure Google OAuth is properly configured
- Check Google Cloud Console for the correct Client ID
- Verify authorized origins include `http://localhost:3000`

### 4. Database Issues

**Check if profiles table exists:**
- Go to Supabase Dashboard > Table Editor
- Verify `profiles` table exists
- Check if `vets` table exists (if logging in as vet)

**Check RLS policies:**
- Make sure RLS policies allow users to read their own profiles
- Verify the auto-create profile trigger is set up (PROFILE-AUTO-CREATE.sql)

### 5. Browser Console Errors

**Common errors and fixes:**

- **"Failed to fetch"**: Check if Supabase URL is correct and CORS is enabled
- **"Invalid API key"**: Verify your anon key is correct
- **"Row-level security policy"**: Check RLS policies in Supabase
- **"Origin mismatch"** (Google): Add `http://localhost:3000` to authorized origins

### 6. Debug Steps

1. **Check browser console** for any error messages
2. **Check Network tab** to see if requests are being made
3. **Verify environment variables** are loaded (they should start with `NEXT_PUBLIC_`)
4. **Test Supabase connection** using the browser console snippet above
5. **Check Supabase Dashboard** for authentication logs

### 7. Quick Fixes

**If login form shows no errors but doesn't work:**
1. Clear browser cache and cookies
2. Restart Next.js dev server: `npm run dev`
3. Check browser console for JavaScript errors
4. Verify you're using the correct port (usually `http://localhost:3000`)

**If Google Sign-In doesn't work:**
1. Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
2. Check Google Cloud Console for authorized origins
3. Make sure the Google button appears (if it doesn't, check console for errors)

### 8. Still Not Working?

If none of the above works, please check:
- Browser console errors
- Network tab in browser dev tools
- Supabase Dashboard > Authentication > Logs
- Next.js terminal output for any errors

Share these details when asking for help.
