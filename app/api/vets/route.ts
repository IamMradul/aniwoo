import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

type SessionPayload = {
  id: string
  email: string
  role: 'vet' | 'pet_owner'
  exp: number
}

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

function readSessionFromCookie(request: NextRequest): SessionPayload | null {
  const cookieValue = request.cookies.get('aniwoo_auth')?.value
  if (!cookieValue || !SESSION_SECRET) {
    return null
  }

  const [encoded, providedSig] = cookieValue.split('.')
  if (!encoded || !providedSig) {
    return null
  }

  const expectedSig = createHmac('sha256', SESSION_SECRET).update(encoded).digest('hex')

  try {
    const providedBuffer = Buffer.from(providedSig, 'hex')
    const expectedBuffer = Buffer.from(expectedSig, 'hex')

    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null
    }
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    if (!payload?.id || !payload?.email || !payload?.role || !payload?.exp) {
      return null
    }

    if (Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId || userId !== session.id) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('vets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: data || null })
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'vet') {
    return NextResponse.json({ error: 'Only veterinarians can update clinic details' }, { status: 403 })
  }

  const body = await request.json()
  const userId = body?.user_id as string | undefined

  if (!userId || userId !== session.id) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 403 })
  }

  const payload = {
    user_id: userId,
    clinic_name: body?.clinic_name,
    specialization: body?.specialization,
    location: body?.location,
    city: body?.city,
    state: body?.state,
    phone: body?.phone,
    experience_years: body?.experience_years,
    qualifications: body?.qualifications,
    bio: body?.bio ?? null,
    clinic_image_url: body?.clinic_image_url ?? null,
    consultation_fee: body?.consultation_fee,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabaseAdmin.from('vets').upsert(payload, {
    onConflict: 'user_id'
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
