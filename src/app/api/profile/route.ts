import { NextRequest, NextResponse } from 'next/server'
import { readSessionFromCookie, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

type PetEntry = {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  gender?: string
  photo_url?: string
}

type ProfilePatchBody = {
  name?: string
  // Location (pet owners)
  address?: string
  city?: string
  state?: string
  pincode?: string
  latitude?: number
  longitude?: number
  // Pets JSONB
  pets?: PetEntry[]
  // Profile completion
  profile_completed?: boolean
  // Vet / clinic fields
  clinic_name?: string
  clinic_address?: string
  clinic_city?: string
  clinic_state?: string
  clinic_pincode?: string
  clinic_latitude?: number
  clinic_longitude?: number
  years_of_experience?: number
  specializations?: string[]
}

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, name, email, role, updated_at, address, city, state, pincode, latitude, longitude, pets, profile_completed, clinic_name, clinic_address, clinic_city, clinic_state, clinic_pincode, clinic_latitude, clinic_longitude, years_of_experience, specializations'
    )
    .eq('id', session.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as ProfilePatchBody

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  // Basic fields
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    updates.name = name
  }

  // Location fields (pet owners)
  if (typeof body.address === 'string') updates.address = body.address.trim() || null
  if (typeof body.city === 'string') updates.city = body.city.trim() || null
  if (typeof body.state === 'string') updates.state = body.state.trim() || null
  if (typeof body.pincode === 'string') updates.pincode = body.pincode.trim() || null
  if (typeof body.latitude === 'number') updates.latitude = body.latitude
  if (typeof body.longitude === 'number') updates.longitude = body.longitude

  // Pets JSONB
  if (Array.isArray(body.pets)) updates.pets = body.pets

  // Profile completion flag
  if (typeof body.profile_completed === 'boolean') updates.profile_completed = body.profile_completed

  // Clinic fields (vets)
  if (typeof body.clinic_name === 'string') updates.clinic_name = body.clinic_name.trim() || null
  if (typeof body.clinic_address === 'string') updates.clinic_address = body.clinic_address.trim() || null
  if (typeof body.clinic_city === 'string') updates.clinic_city = body.clinic_city.trim() || null
  if (typeof body.clinic_state === 'string') updates.clinic_state = body.clinic_state.trim() || null
  if (typeof body.clinic_pincode === 'string') updates.clinic_pincode = body.clinic_pincode.trim() || null
  if (typeof body.clinic_latitude === 'number') updates.clinic_latitude = body.clinic_latitude
  if (typeof body.clinic_longitude === 'number') updates.clinic_longitude = body.clinic_longitude
  if (typeof body.years_of_experience === 'number') updates.years_of_experience = body.years_of_experience
  if (Array.isArray(body.specializations)) updates.specializations = body.specializations

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', session.id)
    .select('id, name, email, role, updated_at, address, city, state, pincode, pets, profile_completed, clinic_name, clinic_city, clinic_state, clinic_pincode, years_of_experience, specializations')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data })
}
