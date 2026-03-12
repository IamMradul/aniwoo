import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

export const dynamic = 'force-dynamic'

type SessionPayload = {
  id: string
  email: string
  role: 'vet' | 'pet_owner' | 'admin'
  exp: number
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SESSION_SECRET = process.env.ANIWOO_SESSION_SECRET || ''

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

export async function POST(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing: ANIWOO_SESSION_SECRET is required' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  const vetId = body?.vet_id as string | undefined
  const petName = body?.pet_name as string | undefined
  const appointmentDate = body?.appointment_date as string | undefined
  const reason = body?.reason as string | undefined

  if (!vetId || !petName || !appointmentDate) {
    return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('bookings').insert({
    vet_id: vetId,
    pet_owner_id: session.id,
    pet_name: petName,
    appointment_date: appointmentDate,
    reason: reason || null,
    status: 'pending'
  })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing: ANIWOO_SESSION_SECRET is required' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = request.nextUrl.searchParams.get('role')

  if (role === 'vet') {
    if (session.role !== 'vet') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        pet_name,
        appointment_date,
        reason,
        status,
        pet_owner_id
      `)
      .eq('vet_id', session.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    const ownerIds = Array.from(new Set((data || []).map((booking: any) => booking.pet_owner_id).filter(Boolean)))

    let ownerProfiles: Array<{ id: string; name: string; email: string }> = []
    if (ownerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', ownerIds)

      if (!profilesError) {
        ownerProfiles = profilesData || []
      }
    }

    const withProfiles = (data || []).map((booking: any) => ({
      ...booking,
      owner_profile: ownerProfiles.find((profile) => profile.id === booking.pet_owner_id) || null
    }))

    return NextResponse.json({ data: withProfiles })
  }

  // Default mode: pet owner bookings
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      pet_name,
      appointment_date,
      reason,
      status,
      vet_id
    `)
    .eq('pet_owner_id', session.id)
    .order('appointment_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  const vetIds = Array.from(new Set((data || []).map((booking: any) => booking.vet_id).filter(Boolean)))

  let vetProfiles: Array<{ id: string; name: string }> = []
  if (vetIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .in('id', vetIds)

    if (!profilesError) {
      vetProfiles = profilesData || []
    }
  }

  const withProfiles = (data || []).map((booking: any) => ({
    ...booking,
    vet_profile: vetProfiles.find((profile) => profile.id === booking.vet_id) || null
  }))

  return NextResponse.json({ data: withProfiles })
}

export async function PATCH(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'vet') {
    return NextResponse.json({ error: 'Only veterinarians can update booking status' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const bookingId = body?.id as string | undefined
  const status = body?.status as string | undefined

  if (!bookingId || !status) {
    return NextResponse.json({ error: 'Missing booking update fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .eq('vet_id', session.id)

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
