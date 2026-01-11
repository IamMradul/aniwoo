# Environment Variables Checklist

## Required Environment Variables for `.env.local`

Your `.env.local` file should contain these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Important Rules:

### ✅ CORRECT Format:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com
```

### ❌ WRONG Format:
```env
# Don't use quotes (usually not needed):
NEXT_PUBLIC_GOOGLE_CLIENT_ID="123456789-abcxyz.apps.googleusercontent.com"

# Don't use spaces around the = sign:
NEXT_PUBLIC_GOOGLE_CLIENT_ID = 123456789-abcxyz.apps.googleusercontent.com

# Don't forget NEXT_PUBLIC_ prefix:
GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com  # WRONG!

# Don't use VITE_ prefix (that's for Vite, not Next.js):
VITE_GOOGLE_CLIENT_ID=123456789-abcxyz.apps.googleusercontent.com  # WRONG!
```

## Common Issues:

### Issue 1: Missing `NEXT_PUBLIC_` Prefix
- ❌ `GOOGLE_CLIENT_ID=...` (won't work in Next.js)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` (required for client-side access)

### Issue 2: Wrong Variable Name
- ❌ `VITE_GOOGLE_CLIENT_ID=...` (for Vite/React, not Next.js)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` (for Next.js)

### Issue 3: Extra Spaces or Quotes
- ❌ `NEXT_PUBLIC_GOOGLE_CLIENT_ID = "..."` (extra spaces/quotes)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...` (no spaces, no quotes needed)

### Issue 4: Typo in Variable Name
- ❌ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (should be CLIENT_ID, not CLIENTID)
- Make sure it's exactly: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## How to Verify Your Setup:

### Step 1: Check if Variables are Loaded
1. Open browser console (F12)
2. Go to Console tab
3. Type:
   ```javascript
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
   ```
4. Press Enter
5. You should see your actual values (not `undefined`)

### Step 2: Verify Format in `.env.local`
Make sure lines 13-15 look like this (with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjEyMzQ1Njc4LCJleHAiOjE5Mjc5MjE2Nzh9.xxxxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

## If Variables Show as `undefined`:

1. **Check the variable name:** Must start with `NEXT_PUBLIC_`
2. **Check for typos:** Compare character by character
3. **Restart dev server:** Stop (Ctrl+C) and run `npm run dev` again
4. **Check file location:** `.env.local` must be in the root of your project (same folder as `package.json`)
5. **No trailing spaces:** Make sure there are no spaces after the value

## Quick Fix Command:

If you're not sure about the format, here's a template you can copy:

```env
# Copy this template and replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

**Important:** 
- No spaces around `=`
- No quotes around values (unless the value itself contains spaces, which shouldn't be the case here)
- One variable per line
- Make sure there are no duplicate entries
