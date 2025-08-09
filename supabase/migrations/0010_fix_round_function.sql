-- Fix ROUND function error in progress calculation
-- PostgreSQL requires explicit type casting for ROUND function

-- Create a corrected overall progress view with proper type casting
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
  -- Overall progress percentage with proper type casting
  CASE 
    WHEN (SELECT COUNT(*) FROM public.module_sections) > 0 THEN
      CAST(
        ROUND(
          CAST(
            (SELECT COUNT(*) FROM public.section_progress sp WHERE sp.user_id = u.id AND sp.status = 'done') AS numeric
          ) / 
          CAST(
            (SELECT COUNT(*) FROM public.module_sections) AS numeric
          ) * 100, 1
        ) AS integer
      )
    ELSE 0
  END AS progress_percentage
FROM auth.users u;

-- Grant access to the corrected view
GRANT SELECT ON public.v_overall_progress_corrected TO authenticated;

-- Add helpful comment
COMMENT ON VIEW public.v_overall_progress_corrected IS 'Corrected overall progress view with proper type casting for PostgreSQL ROUND function';
