-- Allow public read access to short notes while maintaining write restrictions
-- This allows non-logged users to view all notes but only logged users can modify their own notes

-- Drop the existing select policy that restricts to own notes only
DROP POLICY IF EXISTS "select own short_notes" ON public.short_notes;

-- Create a new policy that allows anyone to read all short notes
CREATE POLICY "public can read all short_notes" ON public.short_notes 
  FOR SELECT 
  USING (true);

-- Keep the existing write policies that restrict to own notes
-- (insert, update, delete policies remain unchanged - they still require auth.uid() = user_id)
