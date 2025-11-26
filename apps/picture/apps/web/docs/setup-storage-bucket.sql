-- ============================================
-- Storage Bucket Setup für User Uploads
-- ============================================
-- Dieses Script muss in der Supabase SQL-Konsole ausgeführt werden

-- 1. Erstelle Storage Bucket für User Uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true, -- Public bucket, damit Bilder über public_url zugänglich sind
  10485760, -- 10MB in Bytes (10 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policy: Benutzer können nur ihre eigenen Dateien hochladen
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Storage Policy: Jeder kann Bilder lesen (public bucket)
CREATE POLICY "Public images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- 4. Storage Policy: Benutzer können nur ihre eigenen Dateien aktualisieren
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Storage Policy: Benutzer können nur ihre eigenen Dateien löschen
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Überprüfung der Bucket-Konfiguration
-- ============================================
-- Führe diese Queries aus, um die Konfiguration zu überprüfen:

-- Bucket-Details anzeigen
SELECT * FROM storage.buckets WHERE id = 'user-uploads';

-- Alle Policies für den Bucket anzeigen
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname ILIKE '%user%'
ORDER BY policyname;

-- ============================================
-- Hinweise
-- ============================================
--
-- 1. Die Datei-Struktur im Bucket ist: user-uploads/{user_id}/{timestamp}-{random}.{ext}
--    Dies stellt sicher, dass jeder User nur auf seine eigenen Dateien zugreifen kann.
--
-- 2. Der Bucket ist PUBLIC, d.h. Bilder sind über die public_url ohne Auth zugänglich.
--    Dies ist notwendig, damit Bilder in der Galerie angezeigt werden können.
--
-- 3. Die Policies stellen sicher, dass:
--    - Nur authentifizierte User hochladen können
--    - User nur in ihren eigenen Ordner ({user_id}/) hochladen können
--    - Jeder User nur seine eigenen Dateien bearbeiten/löschen kann
--    - Alle Bilder öffentlich lesbar sind
--
-- 4. File Size Limit: 10MB pro Datei
--    Allowed Types: JPG, JPEG, PNG, WebP
--
-- 5. Falls der Bucket bereits existiert, wird er nicht neu erstellt (ON CONFLICT DO NOTHING)
--
