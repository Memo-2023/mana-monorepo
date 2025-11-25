# Storage Bucket Setup für User Uploads

## Schritt 1: SQL Statement ausführen

### Option A: Erste Installation (Policies existieren noch nicht)
1. Öffne die **Supabase Dashboard**: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Navigiere zu **SQL Editor**
4. Kopiere den Inhalt von `setup-storage-bucket.sql`
5. Führe das SQL-Script aus

### Option B: Update (Policies existieren bereits)
1. Öffne die **Supabase Dashboard**: https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Navigiere zu **SQL Editor**
4. Kopiere den Inhalt von `update-storage-policies.sql`
5. Führe das SQL-Script aus

**Falls Fehler "policy already exists"**: Verwende `update-storage-policies.sql` statt `setup-storage-bucket.sql`

## Schritt 2: Überprüfung

### Bucket überprüfen
Navigiere zu **Storage** im Supabase Dashboard:
- Du solltest einen Bucket namens `user-uploads` sehen
- Public: ✓ Enabled
- File Size Limit: 10 MB
- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

### Policies überprüfen
Navigiere zu **Storage > Policies**:
- Du solltest 4 Policies für `user-uploads` sehen:
  - ✓ Users can upload their own images (INSERT)
  - ✓ Public images are publicly accessible (SELECT)
  - ✓ Users can update their own images (UPDATE)
  - ✓ Users can delete their own images (DELETE)

## Schritt 3: Testen

### Test 1: Upload über die Web-App
1. Öffne die Web-App: http://localhost:5173/app/upload
2. Wähle ein Bild aus oder nutze Drag & Drop
3. Klicke auf "Upload"
4. Das Bild sollte erfolgreich hochgeladen werden
5. Überprüfe in **Storage > user-uploads** im Supabase Dashboard

### Test 2: Zugriff auf öffentliche URL
1. Nachdem Upload erfolgreich war, kopiere die `public_url` aus der Konsole
2. Öffne die URL in einem neuen Browser-Tab
3. Das Bild sollte sichtbar sein (ohne Authentifizierung)

### Test 3: Galerie-Integration
1. Navigiere zur Galerie: http://localhost:5173/app/gallery
2. Die hochgeladenen Bilder sollten in der Galerie erscheinen
3. Klicke auf ein Bild, um die Detail-Ansicht zu öffnen

## Datei-Struktur im Bucket

```
user-uploads/
  ├── {user_id_1}/
  │   ├── 1234567890-abc123.jpg
  │   ├── 1234567891-def456.png
  │   └── 1234567892-ghi789.webp
  └── {user_id_2}/
      ├── 1234567893-jkl012.jpg
      └── 1234567894-mno345.png
```

## Sicherheit

### ✅ Was ist geschützt:
- User können nur in ihren eigenen Ordner hochladen
- User können nur ihre eigenen Dateien bearbeiten/löschen
- Upload nur für authentifizierte User
- Datei-Größe ist auf 10MB begrenzt
- Nur erlaubte Bild-Formate (JPG, PNG, WebP)

### ⚠️ Was ist öffentlich:
- Alle hochgeladenen Bilder sind über ihre public_url zugänglich
- Jeder mit der URL kann das Bild sehen (auch ohne Account)
- Dies ist gewollt für die Galerie-Anzeige

### 🔒 Optionale Verbesserungen für später:
- Private Bilder: Separate Bucket für private Uploads
- Signed URLs: Temporäre URLs für sensible Inhalte
- CDN: CloudFlare oder AWS CloudFront vor Supabase Storage

## Troubleshooting

### Fehler: "Bucket bereits vorhanden"
- Kein Problem! Das Script verwendet `ON CONFLICT DO NOTHING`
- Die Policies werden trotzdem erstellt

### Fehler: "Permission denied"
1. Überprüfe ob du als authentifizierter User eingeloggt bist
2. Überprüfe die Policies im Supabase Dashboard
3. Führe das SQL-Script erneut aus

### Fehler: "File too large"
- Stelle sicher, dass die Datei kleiner als 10MB ist
- Die Validierung erfolgt sowohl im Frontend als auch im Backend

### Bilder werden nicht in der Galerie angezeigt
1. Überprüfe ob der Bucket `public` ist
2. Überprüfe ob die `public_url` korrekt generiert wird
3. Öffne die Browser-Konsole für Fehler-Logs

## Alternative: UI-basiertes Setup

Falls du das SQL-Script nicht ausführen möchtest, kannst du den Bucket auch manuell im UI erstellen:

1. **Storage > Create Bucket**
   - Name: `user-uploads`
   - Public: ✓ Enable
   - File Size Limit: 10485760 (10MB)
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

2. **Storage > Policies > New Policy**
   - Erstelle die 4 Policies manuell mit den gleichen Bedingungen wie im SQL-Script
