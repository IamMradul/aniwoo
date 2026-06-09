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

  // Find all unique pet owners who have booked with this vet
  const { data: bookingsData, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('pet_owner_id, pet_name')
    .eq('vet_id', session.id)

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 400 })
  }

  let bookedPatients: any[] = []
  
  if (bookingsData && bookingsData.length > 0) {
    const ownerIds = Array.from(new Set(bookingsData.map(b => b.pet_owner_id).filter(Boolean)))
    
    if (ownerIds.length > 0) {
      const { data: petsData, error: petsError } = await supabaseAdmin
        .from('pets')
        .select('*, profiles:owner_id(id, name, email)')
        .in('owner_id', ownerIds)

      if (petsError) {
        return NextResponse.json({ error: petsError.message }, { status: 400 })
      }

      const bookedPetNames = new Set(bookingsData.map(b => `${b.pet_owner_id}-${b.pet_name.toLowerCase()}`))
      
      bookedPatients = (petsData || []).filter(pet => {
        return bookedPetNames.has(`${pet.owner_id}-${pet.name.toLowerCase()}`)
      })
    }
  }



  // Fetch pets owned by the vet (manually added patients)
  const { data: vetPetsData, error: vetPetsError } = await supabaseAdmin
    .from('pets')
    .select('*, profiles:owner_id(id, name, email)')
    .eq('owner_id', session.id)

  if (vetPetsError) {
    return NextResponse.json({ error: vetPetsError.message }, { status: 400 })
  }

  const manualPatients = vetPetsData || []

  // Combine and remove duplicates by pet id
  const allPatients = [...bookedPatients, ...manualPatients]
  const uniquePatientsMap = new Map()
  for (const p of allPatients) {
    uniquePatientsMap.set(p.id, p)
  }

  return NextResponse.json({ data: Array.from(uniquePatientsMap.values()) })
}
