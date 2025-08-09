-- Create corrected module progress view
-- This view properly calculates module status based on section progress

CREATE OR REPLACE VIEW public.v_module_progress_corrected AS
SELECT 
  u.id AS user_id,
  m.id AS module_id,
  -- Module status logic: done if all sections done, in_progress if any section done/in_progress, otherwise not_started
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM public.module_sections ms 
      WHERE ms.module_id = m.id
    ) = 0 THEN 'not_started'::progress_status
    WHEN (
      SELECT COUNT(*) 
      FROM public.module_sections ms 
      LEFT JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
      WHERE ms.module_id = m.id AND (sp.status IS NULL OR sp.status = 'not_started')
    ) = 0 THEN 'done'::progress_status
    WHEN (
      SELECT COUNT(*) 
      FROM public.module_sections ms 
      JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
      WHERE ms.module_id = m.id AND sp.status IN ('done', 'in_progress')
    ) > 0 THEN 'in_progress'::progress_status
    ELSE 'not_started'::progress_status
  END AS status,
  -- Current section (most recently updated in_progress section, or null)
  (
    SELECT sp.section_id
    FROM public.module_sections ms
    JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
    WHERE ms.module_id = m.id AND sp.status = 'in_progress'
    ORDER BY sp.updated_at DESC
    LIMIT 1
  ) AS current_section_id,
  -- Last visit timestamp
  (
    SELECT MAX(sp.updated_at)
    FROM public.module_sections ms
    JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
    WHERE ms.module_id = m.id
  ) AS last_visit,
  -- Total sections in module
  (
    SELECT COUNT(*) 
    FROM public.module_sections ms 
    WHERE ms.module_id = m.id
  ) AS total_sections,
  -- Completed sections
  (
    SELECT COUNT(*) 
    FROM public.module_sections ms 
    JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
    WHERE ms.module_id = m.id AND sp.status = 'done'
  ) AS completed_sections,
  -- In progress sections
  (
    SELECT COUNT(*) 
    FROM public.module_sections ms 
    JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
    WHERE ms.module_id = m.id AND sp.status = 'in_progress'
  ) AS in_progress_sections,
  -- Skipped sections
  (
    SELECT COUNT(*) 
    FROM public.module_sections ms 
    JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
    WHERE ms.module_id = m.id AND sp.status = 'skipped'
  ) AS skipped_sections
FROM auth.users u
CROSS JOIN public.modules m;

-- Grant access to the view
GRANT SELECT ON public.v_module_progress_corrected TO authenticated;

-- Add helpful comment
COMMENT ON VIEW public.v_module_progress_corrected IS 'Corrected module progress view that properly calculates module status based on section progress';
