-- Create audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false);

-- Create policy for authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to view their own audio files
CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to update their own audio files
CREATE POLICY "Users can update their own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);