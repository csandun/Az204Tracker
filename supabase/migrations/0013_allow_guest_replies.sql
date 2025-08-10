-- Allow guest users to add replies
-- This modifies the short_notes table to support guest users and updates policies

-- Add a guest_name column for non-authenticated users
ALTER TABLE public.short_notes 
ADD COLUMN guest_name text;

-- Modify the user_id column to allow null for guest users
ALTER TABLE public.short_notes 
ALTER COLUMN user_id DROP NOT NULL;

-- Update the insert policy to allow guest replies (but not top-level posts)
DROP POLICY IF EXISTS "insert own short_notes" ON public.short_notes;

CREATE POLICY "insert own short_notes or guest replies" ON public.short_notes 
  FOR INSERT 
  WITH CHECK (
    -- Authenticated users can insert any note (own user_id)
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR 
    -- Guests can only insert replies (parent_id must not be null)
    (auth.uid() IS NULL AND user_id IS NULL AND parent_id IS NOT NULL AND guest_name IS NOT NULL AND length(trim(guest_name)) > 0)
  );

-- Update the update policy to prevent guests from editing
DROP POLICY IF EXISTS "update own short_notes" ON public.short_notes;

CREATE POLICY "update own short_notes only" ON public.short_notes 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Update the delete policy to prevent guests from deleting
DROP POLICY IF EXISTS "delete own short_notes" ON public.short_notes;

CREATE POLICY "delete own short_notes only" ON public.short_notes 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
