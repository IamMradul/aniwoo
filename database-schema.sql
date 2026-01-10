-- Database Schema for Aniwoo Vet Dashboard Feature
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Update profiles table to include role column (if it doesn't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('vet', 'pet_owner'));

-- 2. Create vets table for storing veterinarian details
CREATE TABLE IF NOT EXISTS vets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  qualifications TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Enable Row Level Security (RLS) on vets table
ALTER TABLE vets ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for vets table
-- Policy: Anyone can read vet listings
CREATE POLICY "Anyone can view vets" ON vets
  FOR SELECT
  USING (true);

-- Policy: Vets can insert their own profile
CREATE POLICY "Vets can insert their own profile" ON vets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Vets can update their own profile
CREATE POLICY "Vets can update their own profile" ON vets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Vets can delete their own profile
CREATE POLICY "Vets can delete their own profile" ON vets
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update updated_at on vets table
CREATE TRIGGER update_vets_updated_at
  BEFORE UPDATE ON vets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vets_city ON vets(city);
CREATE INDEX IF NOT EXISTS idx_vets_specialization ON vets(specialization);
CREATE INDEX IF NOT EXISTS idx_vets_user_id ON vets(user_id);
