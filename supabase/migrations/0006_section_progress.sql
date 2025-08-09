-- Add section-level progress tracking
-- This replaces module-level progress with more granular section-level tracking

-- Create section_progress table for tracking individual section completion
CREATE TABLE IF NOT EXISTS public.section_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.module_sections(id) ON DELETE CASCADE,
  status progress_status DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, section_id)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_section_progress_user ON public.section_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_section_progress_section ON public.section_progress(section_id);
CREATE INDEX IF NOT EXISTS idx_section_progress_user_section ON public.section_progress(user_id, section_id);

-- Add RLS policy for section_progress
ALTER TABLE public.section_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own section progress
CREATE POLICY "Users can manage own section progress" ON public.section_progress
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE TRIGGER trg_section_progress_updated_at
  BEFORE UPDATE ON public.section_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create a view to aggregate section progress into module progress
CREATE OR REPLACE VIEW public.v_module_progress AS
SELECT 
  sp.user_id,
  ms.module_id,
  -- Calculate module status based on section progress
  CASE 
    WHEN COUNT(sp.id) = 0 THEN 'not_started'::progress_status
    WHEN COUNT(sp.id) FILTER (WHERE sp.status = 'done') = COUNT(ms.id) THEN 'done'::progress_status
    WHEN COUNT(sp.id) FILTER (WHERE sp.status IN ('in_progress', 'done')) > 0 THEN 'in_progress'::progress_status
    ELSE 'not_started'::progress_status
  END AS status,
  -- Find the most recently updated section as current section
  (
    SELECT sp2.section_id 
    FROM public.section_progress sp2 
    JOIN public.module_sections ms2 ON sp2.section_id = ms2.id 
    WHERE sp2.user_id = sp.user_id 
    AND ms2.module_id = ms.module_id 
    AND sp2.status = 'in_progress'
    ORDER BY sp2.updated_at DESC 
    LIMIT 1
  ) AS current_section_id,
  MAX(sp.updated_at) AS last_visit,
  COUNT(ms.id) AS total_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'done') AS completed_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'in_progress') AS in_progress_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'skipped') AS skipped_sections
FROM public.module_sections ms
LEFT JOIN public.section_progress sp ON ms.id = sp.section_id
WHERE sp.user_id IS NOT NULL  -- Only include rows for users who have progress
GROUP BY sp.user_id, ms.module_id;

-- Grant access to the view
GRANT SELECT ON public.v_module_progress TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.section_progress IS 'Tracks individual section completion status for each user';
COMMENT ON VIEW public.v_module_progress IS 'Aggregates section progress into module-level progress statistics';
