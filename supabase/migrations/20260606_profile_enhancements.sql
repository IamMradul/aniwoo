-- Aniwoo Profile Enhancements Migration
-- Run this in the Supabase SQL Editor.

-- ─── Location fields for pet owners ───────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- ─── Pet details (JSONB array, each element: { id, name, species, breed, age, weight, gender, photo_url }) ─
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pets JSONB DEFAULT '[]'::jsonb;

-- ─── Profile completion tracking ───────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- ─── Vet / clinic details ──────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_pincode VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_longitude DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specializations TEXT[];

-- ─── Saved vets table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_vets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vet_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vet_id)
);

ALTER TABLE saved_vets ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists before recreating
DROP POLICY IF EXISTS "Users can manage their own saved vets" ON saved_vets;

CREATE POLICY "Users can manage their own saved vets" ON saved_vets
  FOR ALL USING (auth.uid() = user_id);
