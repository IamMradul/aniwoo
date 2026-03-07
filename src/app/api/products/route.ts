import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

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

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select('id, name, description, price, category, image_url, in_stock, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  const normalized = (data || []).map((record: any) => {
    const imageUrls = normalizeImageUrls(record?.image_url)

    return {
      ...record,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls
    }
  })

  return NextResponse.json({ data: normalized })
}
