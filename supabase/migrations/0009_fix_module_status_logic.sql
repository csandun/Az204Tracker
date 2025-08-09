-- Fix module status calculation logic
-- The current logic incorrectly calculates module status when sections are completed

-- Create a corrected module progress view with better status logic
CREATE OR REPLACE VIEW public.v_module_progress_corrected AS
SELECT 
  u.id AS user_id,
  m.id AS module_id,
  -- Calculate module status based on section progress with corrected logic
  CASE 
    -- If all sections in the module are done, module is done
    WHEN (
      SELECT COUNT(*) 
      FROM public.module_sections ms_check 
      WHERE ms_check.module_id = m.id
    ) > 0 AND (
      SELECT COUNT(*) 
      FROM public.section_progress sp_check 
      JOIN public.module_sections ms_check ON sp_check.section_id = ms_check.id
      WHERE sp_check.user_id = u.id 
      AND ms_check.module_id = m.id 
      AND sp_check.status = 'done'
    ) = (
      SELECT COUNT(*) 
      FROM public.module_sections ms_check 
      WHERE ms_check.module_id = m.id
    ) THEN 'done'::progress_status
    
    -- If any section is in progress or done, module is in progress
    WHEN EXISTS (
      SELECT 1 
      FROM public.section_progress sp_check 
      JOIN public.module_sections ms_check ON sp_check.section_id = ms_check.id
      WHERE sp_check.user_id = u.id 
      AND ms_check.module_id = m.id 
      AND sp_check.status IN ('in_progress', 'done')
    ) THEN 'in_progress'::progress_status
    
    -- Otherwise not started
    ELSE 'not_started'::progress_status
  END AS status,
  
  -- Find the most recently updated section as current section
  (
    SELECT sp2.section_id 
    FROM public.section_progress sp2 
    JOIN public.module_sections ms2 ON sp2.section_id = ms2.id 
    WHERE sp2.user_id = u.id 
    AND ms2.module_id = m.id 
    AND sp2.status = 'in_progress'
    ORDER BY sp2.updated_at DESC 
    LIMIT 1
  ) AS current_section_id,
  
  -- Last visit time
  (
    SELECT MAX(sp3.updated_at)
    FROM public.section_progress sp3
    JOIN public.module_sections ms3 ON sp3.section_id = ms3.id
    WHERE sp3.user_id = u.id AND ms3.module_id = m.id
  ) AS last_visit,
  
  -- Total sections in this module
  (
    SELECT COUNT(*) 
    FROM public.module_sections ms_total 
    WHERE ms_total.module_id = m.id
  ) AS total_sections,
  
  -- Completed sections in this module
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp_done 
    JOIN public.module_sections ms_done ON sp_done.section_id = ms_done.id
    WHERE sp_done.user_id = u.id 
    AND ms_done.module_id = m.id 
    AND sp_done.status = 'done'
  ) AS completed_sections,
  
  -- In progress sections
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp_prog 
    JOIN public.module_sections ms_prog ON sp_prog.section_id = ms_prog.id
    WHERE sp_prog.user_id = u.id 
    AND ms_prog.module_id = m.id 
    AND sp_prog.status = 'in_progress'
  ) AS in_progress_sections,
  
  -- Skipped sections
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp_skip 
    JOIN public.module_sections ms_skip ON sp_skip.section_id = ms_skip.id
    WHERE sp_skip.user_id = u.id 
    AND ms_skip.module_id = m.id 
    AND sp_skip.status = 'skipped'
  ) AS skipped_sections

FROM public.modules m
CROSS JOIN auth.users u;

-- Also create a corrected overall progress view
CREATE OR REPLACE VIEW public.v_overall_progress_corrected AS
SELECT 
  u.id AS user_id,
  -- Total sections across all modules
  (SELECT COUNT(*) FROM public.module_sections) AS total_sections,
  -- Completed sections across all modules
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp 
    WHERE sp.user_id = u.id AND sp.status = 'done'
  ) AS completed_sections,
  -- In progress sections
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp 
    WHERE sp.user_id = u.id AND sp.status = 'in_progress'
  ) AS in_progress_sections,
  -- Skipped sections
  (
    SELECT COUNT(*) 
    FROM public.section_progress sp 
    WHERE sp.user_id = u.id AND sp.status = 'skipped'
  ) AS skipped_sections,
  -- Overall progress percentage
  CASE 
    WHEN (SELECT COUNT(*) FROM public.module_sections) > 0 THEN
      ROUND((
        (SELECT COUNT(*) FROM public.section_progress sp WHERE sp.user_id = u.id AND sp.status = 'done')::float / 
        (SELECT COUNT(*) FROM public.module_sections)::float
      ) * 100, 1)
    ELSE 0
  END AS progress_percentage
FROM auth.users u;

-- Grant access to the new views
GRANT SELECT ON public.v_module_progress_corrected TO authenticated;
GRANT SELECT ON public.v_overall_progress_corrected TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public.v_module_progress_corrected IS 'Corrected module progress view with proper status calculation logic';
COMMENT ON VIEW public.v_overall_progress_corrected IS 'Corrected overall progress view with accurate section counting';
