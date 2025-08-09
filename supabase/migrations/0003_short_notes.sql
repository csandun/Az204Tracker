-- Short notes per section (user-owned checklist)
-- Idempotent-friendly: guards around objects; safe on re-run

-- Table
CREATE TABLE IF NOT EXISTS public.short_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.module_sections(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  sort_order int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Backfill sort_order if null
UPDATE public.short_notes SET sort_order = COALESCE(sort_order, EXTRACT(EPOCH FROM created_at)::int)
WHERE sort_order IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_short_notes_user_section ON public.short_notes(user_id, section_id);
CREATE INDEX IF NOT EXISTS idx_short_notes_order ON public.short_notes(section_id, sort_order);

-- Trigger for updated_at (depends on public.set_updated_at())
DROP TRIGGER IF EXISTS trg_short_notes_updated_at ON public.short_notes;
CREATE TRIGGER trg_short_notes_updated_at BEFORE UPDATE ON public.short_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.short_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select own short_notes" ON public.short_notes;
CREATE POLICY "select own short_notes" ON public.short_notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert own short_notes" ON public.short_notes;
CREATE POLICY "insert own short_notes" ON public.short_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update own short_notes" ON public.short_notes;
CREATE POLICY "update own short_notes" ON public.short_notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete own short_notes" ON public.short_notes;
CREATE POLICY "delete own short_notes" ON public.short_notes FOR DELETE USING (auth.uid() = user_id);
