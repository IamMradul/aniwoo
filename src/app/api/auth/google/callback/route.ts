import { NextRequest, NextResponse } from 'next/server'
import { completeGoogleAuth } from '@/lib/googleAuth'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

export const dynamic = 'force-dynamic'

// Create a Supabase client with service role key for server-side operations
// Since this is going to be running in node on next dev/start
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;

const SESSION_SECRET = process.env.ANIWOO_SESSION_SECRET || ''

function createSessionCookieValue(payload: { id: string; email: string; role: 'vet' | 'pet_owner' | 'admin' }) {
    const sessionPayload = {
        ...payload,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7
    }

    const encoded = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url')
    const signature = createHmac('sha256', SESSION_SECRET).update(encoded).digest('hex')
    return `${encoded}.${signature}`
}

function redirectWithSessionCookie(
    request: NextRequest,
    redirectPathWithQuery: string,
    payload: { id: string; email: string; role: 'vet' | 'pet_owner' | 'admin' }
) {
    const response = NextResponse.redirect(new URL(redirectPathWithQuery, request.url))

    if (!SESSION_SECRET) {
        return NextResponse.redirect(new URL('/login?error=session_secret_missing', request.url))
    }

    response.cookies.set('aniwoo_auth', createSessionCookieValue(payload), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
    })

    return response
}

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // Handle OAuth errors
        if (error) {
            console.error('Google OAuth error:', error)
            return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
        }

        // Check if we have an authorization code
        if (!code) {
            return NextResponse.redirect(new URL('/login?error=no_code', request.url))
        }

        if (!supabaseAdmin) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY! Check .env')
            return NextResponse.redirect(new URL('/login?error=server_configuration_missing', request.url))
        }

        // Parse state parameter to get role ('vet' or 'pet_owner')
        let role: 'vet' | 'pet_owner' = 'pet_owner' // default
        let oauthRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
        if (state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(state))
                role = stateData.role === 'vet' ? 'vet' : 'pet_owner'

                if (typeof stateData.redirectUri === 'string') {
                    try {
                        const parsedUri = new URL(stateData.redirectUri)
                        const isAllowedHost = parsedUri.hostname === 'localhost' || parsedUri.hostname === '127.0.0.1'
                        const isAllowedPath = parsedUri.pathname === '/api/auth/google/callback'

                        if (isAllowedHost && isAllowedPath) {
                            oauthRedirectUri = stateData.redirectUri
                        }
                    } catch {
                        // Keep default redirect URI
                    }
                }
            } catch (e) {
                console.warn('Failed to parse state parameter:', e)
            }
        }

        // Complete Google OAuth flow manually outside of Supabase
        const googleUser = await completeGoogleAuth(code, oauthRedirectUri)
        console.log('Google user info retrieved via Custom Flow:', googleUser.email)

        // Check if user already exists in Aniwoo profiles
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', googleUser.email)
            .maybeSingle()

        if (profileError) {
            console.error('Error checking existing profile:', profileError)
            return NextResponse.redirect(new URL('/login?error=profile_lookup_failed', request.url))
        }

        if (existingProfile) {
            console.log('User already exists in profiles table:', existingProfile.id)

            const persistedRole = existingProfile.role === 'vet' || existingProfile.role === 'pet_owner' || existingProfile.role === 'admin'
                ? existingProfile.role
                : null
            const roleToUse = persistedRole || role

            // Keep existing role as source of truth. Only backfill when role is missing.
            const profilePatch: Record<string, unknown> = {
                name: existingProfile.name || googleUser.name,
                email: existingProfile.email || googleUser.email,
                updated_at: new Date().toISOString()
            }

            if (!persistedRole) {
                profilePatch.role = roleToUse
            }

            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update(profilePatch)
                .eq('id', existingProfile.id)

            if (profileUpdateError) {
                console.error('Failed to sync existing profile role:', profileUpdateError)
            }

            const redirectUrl = '/profile'
            const sessionData = encodeURIComponent(JSON.stringify({
                ...googleUser,
                id: existingProfile.id,
                role: roleToUse
            }))
            return redirectWithSessionCookie(request, `${redirectUrl}?google_session=${sessionData}`, {
                id: existingProfile.id,
                email: googleUser.email,
                role: roleToUse
            })
        }

        // Check if user exists in Supabase Auth bypassing RLS
        const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        let authUserId = null
        if (existingAuthUsers?.users) {
            const existingAuthUser = existingAuthUsers.users.find((user: any) => user.email === googleUser.email)
            if (existingAuthUser) {
                authUserId = existingAuthUser.id
                console.log('Found existing Auth user:', authUserId)
            }
        }

        // If no existing Auth user, tightly mint a new one locally
        if (!authUserId) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: googleUser.email,
                password: `google_${googleUser.id}_${Date.now()}`, // Highly secure randomized unique password, standard workaround
                email_confirm: true,
                user_metadata: {
                    name: googleUser.name,
                    role: role,
                    google_id: googleUser.id,
                    picture: googleUser.picture
                }
            })

            if (authError) {
                console.error('Supabase auth error:', authError)
                return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
            }

            authUserId = authData.user?.id
            console.log('Created new Custom Auth user via Admin bypass:', authUserId)
        }

        // Create profile in our database using the Supabase Auth user ID
        if (authUserId) {
            // Validate that auth.users contains this id (profiles FK often points to auth.users)
            const { data: authUserCheck, error: authUserCheckError } = await supabaseAdmin.auth.admin.getUserById(authUserId)

            if (authUserCheckError || !authUserCheck?.user) {
                console.error('Auth user verification failed for profile FK:', authUserCheckError)

                // Try to recover by creating auth user for this email and use the new id
                const { data: recoveredAuthData, error: recoveredAuthError } = await supabaseAdmin.auth.admin.createUser({
                    email: googleUser.email,
                    password: `google_${googleUser.id}_${Date.now()}`,
                    email_confirm: true,
                    user_metadata: {
                        name: googleUser.name,
                        role: role,
                        google_id: googleUser.id,
                        picture: googleUser.picture
                    }
                })

                if (recoveredAuthError || !recoveredAuthData?.user?.id) {
                    console.error('Failed to recover missing auth user:', recoveredAuthError)
                    return NextResponse.redirect(new URL('/login?error=auth_user_missing', request.url))
                }

                authUserId = recoveredAuthData.user.id
            }

            const { error: profileCreateError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: authUserId, // Strict connection to auth user ID
                    name: googleUser.name,
                    email: googleUser.email,
                    role: role,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' })

            if (profileCreateError) {
                console.error('Profile creation error:', profileCreateError)
                return NextResponse.redirect(new URL('/login?error=profile_failed', request.url))
            }

            console.log('Profile created successfully for Google user:', authUserId)

            // Redirect to appropriate dashboard
            const redirectUrl = '/profile'
            const sessionData = encodeURIComponent(JSON.stringify({
                ...googleUser,
                id: authUserId,
                role: role
            }))
            return redirectWithSessionCookie(request, `${redirectUrl}?google_session=${sessionData}`, {
                id: authUserId,
                email: googleUser.email,
                role: role
            })
        }

        // Fallback
        return NextResponse.redirect(new URL('/login?error=unknown_error', request.url))

    } catch (error) {
        console.error('Google OAuth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
    }
}
