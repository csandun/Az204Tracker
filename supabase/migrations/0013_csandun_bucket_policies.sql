-- Storage bucket policies for csandun bucket
-- These policies allow users to manage files in their own folders within the csandun bucket

-- Ensure the csandun bucket exists (bucket should already be created via Supabase dashboard)
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id)
VALUES ('csandun', 'csandun', NULL, NOW(), NOW(), false, false, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "csandun_select_own_files" ON storage.objects;
DROP POLICY IF EXISTS "csandun_insert_own_files" ON storage.objects;
DROP POLICY IF EXISTS "csandun_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "csandun_delete_own_files" ON storage.objects;

-- Policy for SELECT (viewing files) - users can view files in their own folder within csandun bucket
CREATE POLICY "csandun_select_own_files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'csandun' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for INSERT (uploading files) - users can upload files to their own folder within csandun bucket
CREATE POLICY "csandun_insert_own_files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'csandun' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for UPDATE (modifying files) - users can update files in their own folder within csandun bucket
CREATE POLICY "csandun_update_own_files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'csandun' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for DELETE (removing files) - users can delete files in their own folder within csandun bucket
CREATE POLICY "csandun_delete_own_files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'csandun' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
