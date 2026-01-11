# Google Authentication Setup Guide

## Overview
This application uses **Google Identity Services** for client-side Google authentication. This is Google's modern authentication method that doesn't require a client secret for frontend-only implementations.

## What You Need

### ✅ Required: Client ID Only
- **Client ID**: Your Google OAuth 2.0 Client ID
- **No Client Secret Needed**: For client-side authentication, you only need the Client ID

### ❌ Not Needed: Client Secret
- Client secrets are only required for **server-side OAuth flows**
- Since we're using Google Identity Services on the frontend, no secret is needed

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application** as the application type
6. Configure:
   - **Name**: Aniwoo Web App (or your preferred name)
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (for development)
     - Your production domain

7. Click **Create**
8. Copy the **Client ID** (it looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

### 2. Add Client ID to Environment Variables

Create or update your `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

**Important**: 
- Never commit `.env` file to git (it should be in `.gitignore`)
- The `VITE_` prefix is required for Vite to expose the variable to the frontend

### 3. Restart Development Server

After adding the environment variable, restart your Vite dev server:

```bash
npm run dev
```

## How It Works

1. **User clicks "Sign in with Google"**
2. **Google Identity Services** handles the authentication
3. **Google returns a JWT token** (credential)
4. **We decode the token** to get user information (email, name, etc.)
5. **Create/update Supabase user** with the Google account information
6. **User is logged in** to your application

## Security Notes

### Current Implementation (Client-Side Only)
- ✅ Secure for frontend authentication
- ✅ No client secret exposed
- ⚠️ Token verification happens client-side
- ⚠️ For production, consider adding server-side token verification

### Recommended for Production
For enhanced security in production, you should:

1. **Verify Google token on your backend**:
   - Send the Google JWT token to your backend
   - Verify it using Google's token verification API
   - Then create/update the Supabase user

2. **Use Supabase Edge Functions** (recommended):
   - Create a Supabase Edge Function to handle Google auth
   - Verify token server-side
   - Create Supabase session
   - Return session to frontend

## Troubleshooting

### "Google Client ID not configured" error
- Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Restart your dev server after adding the variable
- Check that the variable name starts with `VITE_`

### "Failed to load Google Sign-In"
- Check browser console for errors
- Verify your domain is in "Authorized JavaScript origins"
- Make sure the Google Identity Services script loads correctly

### "Invalid origin" error
- Add your current domain to "Authorized JavaScript origins" in Google Console
- Include both `http://` and `https://` versions if needed
- For localhost, use `http://localhost:5173` (or your port)

## Testing

1. Make sure you've added the Client ID to `.env`
2. Restart the dev server
3. Go to Login or Signup page
4. Select a role (Vet or Pet Owner)
5. Click "Sign in with Google" button
6. Complete Google authentication
7. You should be redirected to dashboard/profile

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
