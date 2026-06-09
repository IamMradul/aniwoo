import { NextRequest, NextResponse } from 'next/server'
import { readSessionFromCookie, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch saved vet IDs for this user, then join vet details from the vets table
  const { data: savedRows, error: savedError } = await supabaseAdmin
    .from('saved_vets')
    .select('id, vet_id, saved_at')
    .eq('user_id', session.id)
    .order('saved_at', { ascending: false })

  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 400 })
  }

  if (!savedRows || savedRows.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const vetIds = savedRows.map((r: { vet_id: string }) => r.vet_id)

  // Fetch vet details from the profiles table using the vet's id
  const { data: vetsData, error: vetsError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .in('id', vetIds)

  if (vetsError) {
    return NextResponse.json({ error: vetsError.message }, { status: 400 })
  }

  // Merge saved_at into each vet record and ensure backwards compatibility
  const result = (vetsData || []).map((profile: Record<string, unknown>) => {
    const savedRow = savedRows.find((r: { vet_id: string; saved_at: string }) => r.vet_id === profile.id)
    return { 
      ...profile, 
      saved_at: savedRow?.saved_at ?? null,
      user_id: profile.id,
      profiles: { name: profile.name, email: profile.email }
    }
  })

  return NextResponse.json({ data: result })
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { vet_id?: string }
  const vetId = body?.vet_id

  if (!vetId || typeof vetId !== 'string') {
    return NextResponse.json({ error: 'Missing vet_id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('saved_vets')
    .insert({ user_id: session.id, vet_id: vetId })

  if (error) {
    // Unique constraint violation — already saved, treat as success
    if (error.code === '23505') {
      return NextResponse.json({ success: true, alreadySaved: true })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vetId = request.nextUrl.searchParams.get('vet_id')

  if (!vetId) {
    return NextResponse.json({ error: 'Missing vet_id query param' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('saved_vets')
    .delete()
    .eq('user_id', session.id)
    .eq('vet_id', vetId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
