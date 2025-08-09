-- AZ-204 Study Tracker — Full schema (consolidated)
-- Safe to run multiple times (idempotent). Applies schema, RLS, policies, views, and integrity triggers.

-- =========== Extensions ==========
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========== Types ==========
-- progress_status enum (no IF NOT EXISTS support for enums; use a guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
    CREATE TYPE progress_status AS ENUM ('not_started','in_progress','done','skipped');
  END IF;
END $$;

-- =========== Tables ==========
-- Curriculum (public read)
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  "order" int NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS public.module_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  "order" int NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  "type" text CHECK ("type" in ('video','doc','link','repo')) DEFAULT 'link'
);

-- User-owned
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.module_sections(id) ON DELETE CASCADE,
  title text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.note_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  caption text
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.module_sections(id) ON DELETE CASCADE,
  stars int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  UNIQUE (user_id, section_id)
);

CREATE TABLE IF NOT EXISTS public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  current_section_id uuid REFERENCES public.module_sections(id),
  status progress_status DEFAULT 'not_started',
  last_visit timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.module_sections(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  kind text CHECK (kind in ('screenshot','note-asset')) DEFAULT 'screenshot',
  created_at timestamptz DEFAULT now()
);

-- =========== Additive upgrades (so running over existing DB is safe) ==========
-- sort_order columns replacing quoted "order" (keep both)
ALTER TABLE IF EXISTS public.modules ADD COLUMN IF NOT EXISTS sort_order int;
UPDATE public.modules SET sort_order = COALESCE(sort_order, "order");
ALTER TABLE IF EXISTS public.modules ALTER COLUMN sort_order SET NOT NULL;

ALTER TABLE IF EXISTS public.module_sections ADD COLUMN IF NOT EXISTS sort_order int;
UPDATE public.module_sections SET sort_order = COALESCE(sort_order, "order");
ALTER TABLE IF EXISTS public.module_sections ALTER COLUMN sort_order SET NOT NULL;

-- Allow resources to link to sections optionally
ALTER TABLE IF EXISTS public.resources ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.module_sections(id) ON DELETE CASCADE;

-- Timestamps for ratings/progress
ALTER TABLE IF EXISTS public.ratings
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.progress
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_modules_sort_order ON public.modules(sort_order);
CREATE INDEX IF NOT EXISTS idx_module_sections_module_order ON public.module_sections(module_id, "order");
CREATE INDEX IF NOT EXISTS idx_module_sections_sort_order ON public.module_sections(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resources_module ON public.resources(module_id);
CREATE INDEX IF NOT EXISTS idx_resources_section ON public.resources(section_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_section ON public.notes(user_id, section_id);
CREATE INDEX IF NOT EXISTS idx_notes_section ON public.notes(section_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_section ON public.ratings(user_id, section_id);
CREATE INDEX IF NOT EXISTS idx_ratings_section ON public.ratings(section_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_module ON public.progress(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user_created ON public.uploads(user_id, created_at DESC);

-- =========== Triggers (updated_at + integrity) ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- notes.updated_at
DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ratings.updated_at
DROP TRIGGER IF EXISTS trg_ratings_updated_at ON public.ratings;
CREATE TRIGGER trg_ratings_updated_at BEFORE UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- progress.updated_at
DROP TRIGGER IF EXISTS trg_progress_updated_at ON public.progress;
CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON public.progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ensure progress.current_section_id belongs to progress.module_id
CREATE OR REPLACE FUNCTION public.ensure_progress_section_in_module()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sec_module uuid; BEGIN
  IF NEW.current_section_id IS NULL THEN RETURN NEW; END IF;
  SELECT ms.module_id INTO sec_module FROM public.module_sections ms WHERE ms.id = NEW.current_section_id;
  IF sec_module IS NULL THEN
    RAISE EXCEPTION 'current_section_id % does not exist', NEW.current_section_id;
  END IF;
  IF sec_module <> NEW.module_id THEN
    RAISE EXCEPTION 'current_section_id % not in module %', NEW.current_section_id, NEW.module_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_progress_section_guard ON public.progress;
CREATE TRIGGER trg_progress_section_guard
BEFORE INSERT OR UPDATE OF module_id, current_section_id ON public.progress
FOR EACH ROW EXECUTE FUNCTION public.ensure_progress_section_in_module();

-- =========== RLS & Policies ==========
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Public read on curriculum
DROP POLICY IF EXISTS "read modules" ON public.modules;
CREATE POLICY "read modules" ON public.modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "read sections" ON public.module_sections;
CREATE POLICY "read sections" ON public.module_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "read resources" ON public.resources;
CREATE POLICY "read resources" ON public.resources FOR SELECT USING (true);

-- Notes
DROP POLICY IF EXISTS "select own notes" ON public.notes;
CREATE POLICY "select own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert own notes" ON public.notes;
CREATE POLICY "insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update own notes" ON public.notes;
CREATE POLICY "update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own notes" ON public.notes;
CREATE POLICY "delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Note assets (via note ownership)
DROP POLICY IF EXISTS "select note assets via note" ON public.note_assets;
CREATE POLICY "select note assets via note" ON public.note_assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND n.user_id = auth.uid())
);
DROP POLICY IF EXISTS "insert note assets via note" ON public.note_assets;
CREATE POLICY "insert note assets via note" ON public.note_assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND n.user_id = auth.uid())
);
DROP POLICY IF EXISTS "delete note assets via note" ON public.note_assets;
CREATE POLICY "delete note assets via note" ON public.note_assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND n.user_id = auth.uid())
);

-- Ratings
DROP POLICY IF EXISTS "select own ratings" ON public.ratings;
CREATE POLICY "select own ratings" ON public.ratings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "upsert own ratings" ON public.ratings;
CREATE POLICY "upsert own ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update own ratings" ON public.ratings;
CREATE POLICY "update own ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own ratings" ON public.ratings;
CREATE POLICY "delete own ratings" ON public.ratings FOR DELETE USING (auth.uid() = user_id);

-- Progress
DROP POLICY IF EXISTS "select own progress" ON public.progress;
CREATE POLICY "select own progress" ON public.progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "upsert own progress" ON public.progress;
CREATE POLICY "upsert own progress" ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update own progress" ON public.progress;
CREATE POLICY "update own progress" ON public.progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own progress" ON public.progress;
CREATE POLICY "delete own progress" ON public.progress FOR DELETE USING (auth.uid() = user_id);

-- Uploads
DROP POLICY IF EXISTS "select own uploads" ON public.uploads;
CREATE POLICY "select own uploads" ON public.uploads FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert own uploads" ON public.uploads;
CREATE POLICY "insert own uploads" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete own uploads" ON public.uploads;
CREATE POLICY "delete own uploads" ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- Storage objects policies (may require owner; skip gracefully if not owner)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping RLS enable on storage.objects (not owner or already enabled).';
  END;

  BEGIN
    EXECUTE $sql$DROP POLICY IF EXISTS "read own objects" ON storage.objects$sql$;
    EXECUTE $sql$CREATE POLICY "read own objects" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'uploads' AND (auth.uid()::text = (storage.foldername(name))[1])
      )$sql$;

    EXECUTE $sql$DROP POLICY IF EXISTS "insert own objects" ON storage.objects$sql$;
    EXECUTE $sql$CREATE POLICY "insert own objects" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'uploads' AND (auth.uid()::text = (storage.foldername(name))[1])
      )$sql$;

    EXECUTE $sql$DROP POLICY IF EXISTS "delete own objects" ON storage.objects$sql$;
    EXECUTE $sql$CREATE POLICY "delete own objects" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'uploads' AND (auth.uid()::text = (storage.foldername(name))[1])
      )$sql$;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipping storage.objects policies (not owner).';
  END;
END $$;

-- =========== Views ==========
CREATE OR REPLACE VIEW public.v_modules_overview AS
SELECT m.id,
       m.title,
       COALESCE(m.sort_order, m."order") AS sort_order,
       m.description,
       (SELECT count(*) FROM public.module_sections s WHERE s.module_id = m.id) AS sections_count,
       (SELECT count(*) FROM public.resources r WHERE r.module_id = m.id) AS resources_count
FROM public.modules m
ORDER BY sort_order ASC, m.title ASC;

CREATE OR REPLACE VIEW public.v_sections_overview AS
SELECT s.id,
       s.module_id,
       s.title,
       COALESCE(s.sort_order, s."order") AS sort_order,
       (SELECT count(*) FROM public.resources r WHERE r.section_id = s.id) AS resources_count
FROM public.module_sections s
ORDER BY s.module_id, sort_order ASC, s.title ASC;
