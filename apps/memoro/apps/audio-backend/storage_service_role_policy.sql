-- Storage policy to allow service role to download audio files for processing
-- This is needed for the audio microservice to access user-uploaded files

-- Allow service role to SELECT (download) files from user-uploads bucket
CREATE POLICY "Service role can download files for processing"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'user-uploads');