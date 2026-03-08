import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { readSessionFromCookie, supabaseAdmin } from '@/lib/server/adminAuth'

export const dynamic = 'force-dynamic'

const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_BUCKET = process.env.SUPABASE_CLINIC_IMAGES_BUCKET || 'clinic-images'

const sanitizeFilename = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const session = readSessionFromCookie(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'vet') {
    return NextResponse.json({ error: 'Only veterinarians can upload clinic images' }, { status: 403 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data payload' }, { status: 400 })
  }

  const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: 'No image files were provided' }, { status: 400 })
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `You can upload up to ${MAX_FILES} images at a time` }, { status: 400 })
  }

  const bucketName = formData.get('bucket')
  const targetBucket = typeof bucketName === 'string' && bucketName.trim() ? bucketName.trim() : DEFAULT_BUCKET

  const { data: existingBucket } = await supabaseAdmin.storage.getBucket(targetBucket)
  if (!existingBucket) {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket(targetBucket, {
      public: true,
      fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`
    })

    if (bucketError) {
      return NextResponse.json({
        error: `Unable to initialize storage bucket '${targetBucket}': ${bucketError.message}`,
        code: bucketError.name || 'bucket_init_failed'
      }, { status: 500 })
    }
  }

  const uploadedUrls: string[] = []

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `Unsupported file type: ${file.name}` }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `File too large: ${file.name}. Max size is 5MB.` }, { status: 400 })
    }

    const safeName = sanitizeFilename(file.name) || 'image'
    const objectPath = `clinics/${session.id}/${Date.now()}-${randomUUID()}-${safeName}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(objectPath, arrayBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      return NextResponse.json({
        error: `Failed to upload ${file.name}: ${uploadError.message}`,
        code: uploadError.name || 'upload_failed'
      }, { status: 400 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(targetBucket)
      .getPublicUrl(objectPath)

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json({ error: `Uploaded ${file.name} but failed to resolve a public URL` }, { status: 500 })
    }

    uploadedUrls.push(publicUrlData.publicUrl)
  }

  return NextResponse.json({ data: { urls: uploadedUrls } }, { status: 201 })
}
