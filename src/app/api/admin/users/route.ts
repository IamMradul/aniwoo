import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('response' in authResult) {
    return authResult.response
  }

  const { data, error } = await supabaseAdmin!
    .from('profiles')
    .select('id, name, email, role, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data: data || [] })
}
