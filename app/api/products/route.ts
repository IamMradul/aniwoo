import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

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

  return NextResponse.json({ data: data || [] })
}
