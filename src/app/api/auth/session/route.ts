import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SESSION_SECRET = process.env.ANIWOO_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabaseAdmin: any = null

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

type BootstrapBody = {
  id?: string
  email?: string
  role?: 'vet' | 'pet_owner' | 'admin'
}

function createSessionCookieValue(payload: { id: string; email: string; role: 'vet' | 'pet_owner' | 'admin' }) {
  const sessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  }

  const encoded = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url')
  const signature = createHmac('sha256', SESSION_SECRET).update(encoded).digest('hex')
  return `${encoded}.${signature}`
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({})) as BootstrapBody
  const userId = body?.id
  const email = body?.email

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing identity payload' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message || 'Profile lookup failed' }, { status: 401 })
  }

  let resolvedProfile = profile

  if (!resolvedProfile) {
    const fallbackRole = body.role === 'vet' || body.role === 'admin' ? body.role : 'pet_owner'
    const fallbackName = email.split('@')[0] || 'Aniwoo user'

    const { data: createdProfile, error: createProfileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        name: fallbackName,
        role: fallbackRole,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id, email, role')
      .maybeSingle()

    if (createProfileError || !createdProfile) {
      return NextResponse.json({ error: createProfileError?.message || 'Profile not found' }, { status: 401 })
    }

    resolvedProfile = createdProfile
  }

  if ((resolvedProfile.email || '').toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Profile identity mismatch' }, { status: 401 })
  }

  const role = resolvedProfile.role === 'vet' || resolvedProfile.role === 'pet_owner' || resolvedProfile.role === 'admin'
    ? resolvedProfile.role
    : (body.role === 'vet' || body.role === 'admin' ? body.role : 'pet_owner')

  const response = NextResponse.json({ success: true })
  response.cookies.set('aniwoo_auth', createSessionCookieValue({ id: userId, email, role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('aniwoo_auth', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
  return response
}
