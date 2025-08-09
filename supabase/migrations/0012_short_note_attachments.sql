-- Add file attachment support to short notes
-- Creates a table to link files uploaded to the csandun bucket with short notes

-- Create short_note_attachments table
CREATE TABLE IF NOT EXISTS public.short_note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_note_id uuid NOT NULL REFERENCES public.short_notes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL, -- Path in the csandun bucket
  file_size bigint,
  file_type text, -- MIME type
  created_at timestamptz DEFAULT now()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_short_note_attachments_note ON public.short_note_attachments(short_note_id);

-- Enable RLS
ALTER TABLE public.short_note_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can manage attachments for their own short notes
CREATE POLICY "Users can view attachments for own short notes" ON public.short_note_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.short_notes sn 
    WHERE sn.id = short_note_id AND sn.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert attachments for own short notes" ON public.short_note_attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.short_notes sn 
    WHERE sn.id = short_note_id AND sn.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete attachments for own short notes" ON public.short_note_attachments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.short_notes sn 
    WHERE sn.id = short_note_id AND sn.user_id = auth.uid()
  )
);

-- Grant access to authenticated users
GRANT SELECT, INSERT, DELETE ON public.short_note_attachments TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.short_note_attachments IS 'File attachments for short notes, linked to files in the csandun bucket';
