-- Threading enhancement for short notes
ALTER TABLE IF EXISTS public.short_notes
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.short_notes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_short_notes_parent ON public.short_notes(parent_id);
