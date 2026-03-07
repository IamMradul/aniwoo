import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

type ProductPayload = {
  id?: string
  name?: string
  description?: string
  price?: number
  category?: string
  image_url?: string
  in_stock?: boolean
  is_active?: boolean
}

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('response' in authResult) {
    return authResult.response
  }

  const { data, error } = await supabaseAdmin!
    .from('shop_products')
    .select('id, name, description, price, category, image_url, in_stock, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('response' in authResult) {
    return authResult.response
  }

  const body = await request.json().catch(() => ({})) as ProductPayload

  if (!body.name || typeof body.price !== 'number' || Number.isNaN(body.price) || body.price < 0) {
    return NextResponse.json({ error: 'Invalid payload: name and non-negative price are required' }, { status: 400 })
  }

  const payload = {
    name: body.name.trim(),
    description: body.description?.trim() || null,
    price: body.price,
    category: body.category?.trim() || null,
    image_url: body.image_url?.trim() || null,
    in_stock: body.in_stock ?? true,
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin!
    .from('shop_products')
    .insert(payload)
    .select('id, name, description, price, category, image_url, in_stock, is_active, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('response' in authResult) {
    return authResult.response
  }

  const body = await request.json().catch(() => ({})) as ProductPayload

  if (!body.id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }

  if (typeof body.name === 'string') updates.name = body.name.trim()
  if (typeof body.description === 'string') updates.description = body.description.trim() || null
  if (typeof body.category === 'string') updates.category = body.category.trim() || null
  if (typeof body.image_url === 'string') updates.image_url = body.image_url.trim() || null
  if (typeof body.in_stock === 'boolean') updates.in_stock = body.in_stock
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.price === 'number' && !Number.isNaN(body.price) && body.price >= 0) updates.price = body.price

  const { data, error } = await supabaseAdmin!
    .from('shop_products')
    .update(updates)
    .eq('id', body.id)
    .select('id, name, description, price, category, image_url, in_stock, is_active, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('response' in authResult) {
    return authResult.response
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin!
    .from('shop_products')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
