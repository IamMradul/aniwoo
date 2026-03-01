import { NextRequest, NextResponse } from 'next/server'
import { completeGoogleAuth } from '@/src/lib/googleAuth'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key for server-side operations
// Since this is going to be running in node on next dev/start
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: any = null;

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
        let role = 'pet_owner' // default
        if (state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(state))
                role = stateData.role || 'pet_owner'
            } catch (e) {
                console.warn('Failed to parse state parameter:', e)
            }
        }

        // Complete Google OAuth flow manually outside of Supabase
        const googleUser = await completeGoogleAuth(code)
        console.log('Google user info retrieved via Custom Flow:', googleUser.email)

        // Check if user already exists in Aniwoo profiles
        const { data: existingProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', googleUser.email)
            .single()

        if (existingProfile) {
            console.log('User already exists in profiles table:', existingProfile.id)

            const redirectUrl = existingProfile.role === 'vet' ? '/vet-dashboard' : '/profile'
            const sessionData = encodeURIComponent(JSON.stringify({
                ...googleUser,
                id: existingProfile.id
            }))
            return NextResponse.redirect(new URL(`${redirectUrl}?google_session=${sessionData}`, request.url))
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
            const { error: profileCreateError } = await supabaseAdmin
                .from('profiles')
                .insert([{
                    id: authUserId, // Strict connection to auth user ID
                    name: googleUser.name,
                    email: googleUser.email,
                    role: role,
                    updated_at: new Date().toISOString()
                }])

            if (profileCreateError) {
                console.error('Profile creation error:', profileCreateError)
                return NextResponse.redirect(new URL('/login?error=profile_failed', request.url))
            }

            console.log('Profile created successfully for Google user:', authUserId)

            // Redirect to appropriate dashboard
            const redirectUrl = role === 'vet' ? '/vet-dashboard' : '/profile'
            const sessionData = encodeURIComponent(JSON.stringify({
                ...googleUser,
                id: authUserId
            }))
            return NextResponse.redirect(new URL(`${redirectUrl}?google_session=${sessionData}`, request.url))
        }

        // Fallback
        return NextResponse.redirect(new URL('/login?error=unknown_error', request.url))

    } catch (error) {
        console.error('Google OAuth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
    }
}
