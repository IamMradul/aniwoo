-- IMPORTANT: Run this SQL in your Supabase SQL Editor
-- This ensures vets can be viewed by anyone and vets can manage their own data

-- 1. Make sure RLS is enabled on vets table
ALTER TABLE vets ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view vets" ON vets;
DROP POLICY IF EXISTS "Vets can insert their own profile" ON vets;
DROP POLICY IF EXISTS "Vets can update their own profile" ON vets;
DROP POLICY IF EXISTS "Vets can delete their own profile" ON vets;

-- 3. Create policies for vets table
-- Policy: Anyone can read vet listings (public access)
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Vets can delete their own profile
CREATE POLICY "Vets can delete their own profile" ON vets
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verify the policies are working
-- You can test by running:
-- SELECT * FROM vets; -- Should work for anyone
-- INSERT INTO vets (...) VALUES (...); -- Should only work if user_id matches auth.uid()
