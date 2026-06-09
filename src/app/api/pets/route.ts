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

  let body: any = {}
  let file: File | null = null

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null)
    if (formData) {
      body.name = formData.get('name')
      body.species = formData.get('species')
      body.breed = formData.get('breed')
      body.age_years = formData.get('age_years')
      body.health_notes = formData.get('health_notes')
      file = formData.get('report') as File | null
    }
  } else {
    body = await request.json().catch(() => ({}))
  }

  if (!body.name || !body.species) {
    return NextResponse.json({ error: 'Missing required pet fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('pets').insert({
    owner_id: session.id,
    name: body.name,
    species: body.species,
    breed: body.breed || null,
    age_years: body.age_years || null,
    health_notes: body.health_notes || null
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  if (file && data) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${data.id}-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('pet-reports')
      .upload(fileName, file, { contentType: file.type })

    if (!uploadError) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('pet-reports')
        .getPublicUrl(fileName)

      await supabaseAdmin.from('health_scans').insert({
        pet_id: data.id,
        owner_id: session.id,
        scan_type: 'Vet Report',
        result_summary: 'Uploaded during patient registration',
        report_url: publicUrlData.publicUrl
      })
    }
  }

  return NextResponse.json({ data })
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('pets')
    .select('*')
    .eq('owner_id', session.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  
  if (!body.id) {
    return NextResponse.json({ error: 'Missing pet ID' }, { status: 400 })
  }

  const updateData: any = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.species !== undefined) updateData.species = body.species
  if (body.breed !== undefined) updateData.breed = body.breed || null
  if (body.age_years !== undefined) updateData.age_years = body.age_years || null
  if (body.health_notes !== undefined) updateData.health_notes = body.health_notes || null

  const { data, error } = await supabaseAdmin
    .from('pets')
    .update(updateData)
    .eq('id', body.id)
    .eq('owner_id', session.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing pet ID' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('pets')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.id)

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
