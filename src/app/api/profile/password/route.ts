import { NextRequest, NextResponse } from 'next/server'
import { readSessionFromCookie, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

type PasswordPatchBody = {
  password?: string
}

export async function PATCH(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as PasswordPatchBody
  const password = body?.password

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(session.id, {
    password
  })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
