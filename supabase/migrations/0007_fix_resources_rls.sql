-- Fix RLS policies for resources table to allow authenticated users to manage resources

-- Add policies for authenticated users to manage resources
CREATE POLICY "Authenticated users can insert resources" ON public.resources
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources" ON public.resources
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resources" ON public.resources
  FOR DELETE TO authenticated USING (true);

-- Add helpful comment
COMMENT ON POLICY "Authenticated users can insert resources" ON public.resources IS 'Allow authenticated users to add new resources to modules/sections';
COMMENT ON POLICY "Authenticated users can update resources" ON public.resources IS 'Allow authenticated users to update existing resources';
COMMENT ON POLICY "Authenticated users can delete resources" ON public.resources IS 'Allow authenticated users to remove resources';
