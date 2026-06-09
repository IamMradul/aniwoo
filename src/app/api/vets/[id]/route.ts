import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
let supabasePublic: ReturnType<typeof createClient> | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
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

const mapVetRecord = (record: Record<string, unknown>) => {
  const clinicImageUrls = normalizeImageUrls(record?.clinic_image_url)
  return {
    ...record,
    clinic_image_url: clinicImageUrls[0] ?? null,
    clinic_image_urls: clinicImageUrls
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  const publicClient = supabaseAdmin ?? supabasePublic;

  if (!publicClient) {
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
  }

  const { data, error } = await publicClient
    .from('vets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[GET /api/vets/[id]] Error fetching vet:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Vet not found' }, { status: 404 });
  }

  let profileData = null;
  if (supabaseAdmin) {
    const vetUserId = (data as { user_id: string }).user_id;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('id', vetUserId)
      .single();
    if (profile) {
      profileData = profile;
    }
  }

  const vetRecord = mapVetRecord(data as Record<string, unknown>);

  const responseData = {
    ...vetRecord,
    profiles: profileData ? { name: profileData.name, email: profileData.email } : undefined
  };

  return NextResponse.json({ data: responseData });
}
