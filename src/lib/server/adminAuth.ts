import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export type AppRole = 'vet' | 'pet_owner' | 'admin'

export type SessionPayload = {
  id: string
  email: string
  role: AppRole
  exp: number
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SESSION_SECRET = process.env.ANIWOO_SESSION_SECRET || ''

export const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null

export function readSessionFromCookie(request: NextRequest): SessionPayload | null {
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

export function requireAdmin(request: NextRequest): { session: SessionPayload } | { response: NextResponse } {
  if (!supabaseAdmin || !SESSION_SECRET) {
    return {
      response: NextResponse.json({ error: 'Server configuration missing: ANIWOO_SESSION_SECRET is required' }, { status: 500 })
    }
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (session.role !== 'admin') {
    return {
      response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
  }

  return { session }
}
