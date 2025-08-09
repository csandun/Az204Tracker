-- Fix overall progress calculation and section completion counting
-- This addresses issues with the v_module_progress view and adds a comprehensive progress view

-- Create a better view for overall progress statistics
CREATE OR REPLACE VIEW public.v_overall_progress AS
SELECT 
  sp.user_id,
  -- Total sections across all modules
  (SELECT COUNT(*) FROM public.module_sections) AS total_sections,
  -- Completed sections across all modules
  COUNT(sp.id) FILTER (WHERE sp.status = 'done') AS completed_sections,
  -- In progress sections
  COUNT(sp.id) FILTER (WHERE sp.status = 'in_progress') AS in_progress_sections,
  -- Skipped sections
  COUNT(sp.id) FILTER (WHERE sp.status = 'skipped') AS skipped_sections,
  -- Overall progress percentage
  CASE 
    WHEN (SELECT COUNT(*) FROM public.module_sections) > 0 THEN
      ROUND((COUNT(sp.id) FILTER (WHERE sp.status = 'done')::float / (SELECT COUNT(*) FROM public.module_sections)::float) * 100, 1)
    ELSE 0
  END AS progress_percentage
FROM public.section_progress sp
GROUP BY sp.user_id;

-- Create a corrected module progress view
CREATE OR REPLACE VIEW public.v_module_progress_fixed AS
SELECT 
  COALESCE(sp.user_id, u.id) AS user_id,
  m.id AS module_id,
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
    WHERE sp2.user_id = COALESCE(sp.user_id, u.id)
    AND ms2.module_id = m.id 
    AND sp2.status = 'in_progress'
    ORDER BY sp2.updated_at DESC 
    LIMIT 1
  ) AS current_section_id,
  MAX(sp.updated_at) AS last_visit,
  COUNT(ms.id) AS total_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'done') AS completed_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'in_progress') AS in_progress_sections,
  COUNT(sp.id) FILTER (WHERE sp.status = 'skipped') AS skipped_sections
FROM public.modules m
CROSS JOIN auth.users u
JOIN public.module_sections ms ON ms.module_id = m.id
LEFT JOIN public.section_progress sp ON ms.id = sp.section_id AND sp.user_id = u.id
GROUP BY COALESCE(sp.user_id, u.id), m.id;

-- Grant access to the new views
GRANT SELECT ON public.v_overall_progress TO authenticated;
GRANT SELECT ON public.v_module_progress_fixed TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public.v_overall_progress IS 'Provides accurate overall progress statistics across all sections for each user';
COMMENT ON VIEW public.v_module_progress_fixed IS 'Corrected module progress view that properly counts all sections even without progress records';
