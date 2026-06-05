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

const normalizeImageUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => entry.trim())
          .filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return [trimmed]
}

const encodeImageUrls = (imageUrls: string[]): string | null => {
  if (imageUrls.length === 0) return null
  if (imageUrls.length === 1) return imageUrls[0]
  return JSON.stringify(imageUrls)
}

const mapVetRecord = (record: Record<string, unknown>) => {
  const clinicImageUrls = normalizeImageUrls(record?.clinic_image_url)
  return {
    ...record,
    clinic_image_url: clinicImageUrls[0] ?? null,
    clinic_image_urls: clinicImageUrls
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SESSION_SECRET = process.env.ANIWOO_SESSION_SECRET || ''

let supabaseAdmin: ReturnType<typeof createClient> | null = null
let supabasePublic: ReturnType<typeof createClient> | null = null

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
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
  const getAllVets = request.nextUrl.searchParams.get('getAll')
  const pincodeParam = request.nextUrl.searchParams.get('pincode')
  const cityParam = request.nextUrl.searchParams.get('city')
  const searchParam = request.nextUrl.searchParams.get('search')

  if (getAllVets === 'true') {
    const publicClient = supabaseAdmin ?? supabasePublic

    if (!publicClient) {
      return NextResponse.json({ error: 'Supabase public configuration missing' }, { status: 500 })
    }

    // Build filtered query at the database level
    let query = publicClient.from('vets').select('*').order('created_at', { ascending: false })

    if (pincodeParam) {
      query = query.eq('pincode', pincodeParam)
    } else if (cityParam) {
      query = query.ilike('city', `%${cityParam}%`)
    } else if (searchParam) {
      query = query.or(
        `city.ilike.%${searchParam}%,location.ilike.%${searchParam}%,clinic_name.ilike.%${searchParam}%,specialization.ilike.%${searchParam}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('[GET /api/vets] Error fetching all vets:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    if (data && data.length > 0) {
      let profilesData: Array<{ id: string; name: string | null; email: string | null }> | null = null

      if (supabaseAdmin) {
        const userIds = data.map((vet: Record<string, string>) => vet.user_id)
        const { data: fetchedProfiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds)

        if (profilesError) {
          console.error('[GET /api/vets] Error fetching profiles:', profilesError)
        } else {
          profilesData = fetchedProfiles
        }
      }

      const vetsWithProfiles = data.map((vet: Record<string, unknown>) => {
        const profile = profilesData?.find((p) => p.id === vet.user_id)
        return {
          ...mapVetRecord(vet),
          profiles: profile ? { name: profile.name, email: profile.email } : undefined
        }
      })

      return NextResponse.json({ data: vetsWithProfiles })
    }

    return NextResponse.json({ data: [] })
  }

  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing: ANIWOO_SESSION_SECRET is required' }, { status: 500 })
  }

  // Authenticated endpoint — get specific vet profile by userId
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

  return NextResponse.json({ data: data ? mapVetRecord(data as Record<string, unknown>) : null })
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing: ANIWOO_SESSION_SECRET is required' }, { status: 500 })
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

  const parsedClinicImageUrls = normalizeImageUrls(body?.clinic_image_urls)
  if (parsedClinicImageUrls.length === 0 && typeof body?.clinic_image_url === 'string') {
    parsedClinicImageUrls.push(...normalizeImageUrls(body.clinic_image_url))
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
    clinic_image_url: encodeImageUrls(parsedClinicImageUrls),
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
