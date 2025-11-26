# Audio-Archiv: Upload- und Verarbeitungsstatus-Tracking

## Analyse der aktuellen Situation

### Aktuelle Datenstruktur

#### AudioFile (Lokales Archiv)
```typescript
interface AudioFile {
  id: string;          // Lokale ID
  uri: string;         // Lokaler Dateipfad
  filename: string;    // z.B. "recording-1234567890.m4a"
  duration: number;    // Dauer in Sekunden
  createdAt: Date;     // Erstellungsdatum
  size?: number;       // Dateigröße in Bytes
}
```

**Status:** Keine Tracking-Informationen für Upload oder Verarbeitung vorhanden.

#### Memo (Nach Verarbeitung)
```typescript
interface Memo {
  id: string;
  title: string;
  source?: MemoSource;
  metadata?: MemoMetadata;
  transcript?: string;
  // ... weitere Felder
}

interface MemoSource {
  type?: 'audio' | 'text' | 'upload' | 'photo';
  audio_path?: string;              // z.B. "user-123/recording-1234567890.m4a"
  transcript?: string;
  duration?: number;
  additional_recordings?: AdditionalRecording[];
  // ... weitere Felder
}

interface MemoMetadata {
  processing?: ProcessingMetadata;
  transcriptionStatus?: string;
  recordingStatus?: string;
  // ... weitere Felder
}
```

### Aktueller Upload-Flow

1. **Lokale Aufnahme** → `fileStorageService.saveRecording()`
   - Speichert Audio lokal als `AudioFile`
   - Keine Verknüpfung zu Memo

2. **Upload aus Archiv** → `handleReupload()` in `RecordingsList.tsx`
   - `cloudStorageService.uploadAudioForProcessing()` → Cloud Storage
   - `triggerTranscription()` → memoro-service API
   - **Problem:** Keine Statusverfolgung nach Upload

3. **Memo-Erstellung**
   - Backend erstellt Memo nach erfolgreicher Transkription
   - **Problem:** Keine Verbindung zwischen lokalem `AudioFile` und erstelltem `Memo`

### Identifizierte Probleme

1. **Fehlende Verbindung:** Kein Link zwischen lokalem `AudioFile` und hochgeladenem/verarbeitetem `Memo`
2. **Kein Status-Tracking:** User sieht nicht, ob Upload erfolgreich war
3. **Doppelter Upload möglich:** Keine Markierung verhindert erneutes Hochladen
4. **Keine Memo-Verlinkung:** User kann nicht direkt zum fertigen Memo navigieren

---

## Lösungsvorschläge

### Option 1: Minimale Lösung (Schnell & Einfach)

**Ansatz:** Erweitere `AudioFile` um Upload-Status-Felder

#### Änderungen

```typescript
// features/storage/storage.types.ts
interface AudioFile {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  createdAt: Date;
  size?: number;

  // NEU: Upload & Verarbeitung
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  uploadedAt?: Date;
  uploadError?: string;

  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  // NEU: Verbindung zum Memo
  memoId?: string;
  cloudPath?: string;  // z.B. "user-123/recording-1234567890.m4a"
}
```

#### Implementierung

1. **Upload-Tracking in `RecordingsList.tsx`**
   ```typescript
   const handleReupload = async (recording: AudioFile) => {
     // Setze Status auf "uploading"
     await fileStorageService.updateRecordingStatus(recording.id, {
       uploadStatus: 'uploading'
     });

     try {
       // Upload...
       const uploadResult = await cloudStorageService.uploadAudioForProcessing(...);

       if (uploadResult.success) {
         await fileStorageService.updateRecordingStatus(recording.id, {
           uploadStatus: 'uploaded',
           uploadedAt: new Date(),
           cloudPath: uploadResult.filePath,
           processingStatus: 'processing'
         });

         // Trigger transcription...
         const transcriptionResult = await triggerTranscription(...);
         // Status bleibt 'processing' bis Memo erstellt wurde
       }
     } catch (error) {
       await fileStorageService.updateRecordingStatus(recording.id, {
         uploadStatus: 'failed',
         uploadError: error.message
       });
     }
   };
   ```

2. **Memo-Verbindung via Realtime**
   ```typescript
   // Wenn neues Memo erstellt wird, prüfe ob es eine lokale Aufnahme gibt
   useEffect(() => {
     const handleNewMemo = async (memo: Memo) => {
       if (memo.source?.audio_path) {
         const filename = memo.source.audio_path.split('/').pop();
         const localRecording = await fileStorageService.findRecordingByFilename(filename);

         if (localRecording) {
           await fileStorageService.updateRecordingStatus(localRecording.id, {
             memoId: memo.id,
             processingStatus: 'completed'
           });
         }
       }
     };
   }, []);
   ```

3. **UI-Updates in `AudioPlayer` oder `RecordingsList`**
   - Badge/Icon für Upload-Status
   - Button "Zum Memo" wenn `memoId` vorhanden
   - Status-Indikatoren

#### Vorteile
- ✅ Schnell implementierbar
- ✅ Keine Backend-Änderungen nötig
- ✅ Funktioniert mit bestehender Infrastruktur

#### Nachteile
- ⚠️ Status geht verloren bei App-Neuinstallation
- ⚠️ Matching über Dateiname kann fehlschlagen
- ⚠️ Keine Synchronisation über Geräte hinweg

---

### Option 2: Backend-Integration (Robust & Skalierbar)

**Ansatz:** Backend verfolgt Upload-Status und benachrichtigt Frontend

#### Änderungen

1. **Neue Datenbank-Tabelle: `audio_uploads`**
   ```sql
   CREATE TABLE audio_uploads (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     filename TEXT NOT NULL,
     cloud_path TEXT NOT NULL,
     local_id TEXT,  -- Optional: Lokale AudioFile ID

     upload_status TEXT NOT NULL DEFAULT 'pending',
     processing_status TEXT NOT NULL DEFAULT 'pending',

     memo_id UUID REFERENCES memos(id),

     uploaded_at TIMESTAMPTZ,
     processing_started_at TIMESTAMPTZ,
     completed_at TIMESTAMPTZ,

     error_message TEXT,

     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Upload-Flow mit Tracking**
   ```typescript
   const handleReupload = async (recording: AudioFile) => {
     // 1. Erstelle Upload-Record
     const uploadRecord = await supabase
       .from('audio_uploads')
       .insert({
         filename: recording.filename,
         local_id: recording.id,
         upload_status: 'pending'
       })
       .select()
       .single();

     // 2. Upload & Update Status
     const uploadResult = await cloudStorageService.uploadAudioForProcessing(...);

     await supabase
       .from('audio_uploads')
       .update({
         cloud_path: uploadResult.filePath,
         upload_status: 'uploaded',
         uploaded_at: new Date().toISOString(),
         processing_status: 'processing'
       })
       .eq('id', uploadRecord.id);

     // 3. Trigger Transcription mit Upload-ID
     await triggerTranscription({
       ...,
       uploadRecordId: uploadRecord.id
     });
   };
   ```

3. **Backend aktualisiert Status**
   - memoro-service aktualisiert `audio_uploads` während Verarbeitung
   - Setzt `memo_id` wenn Memo erstellt wurde
   - Setzt `processing_status: 'completed'`

4. **Frontend Realtime Subscription**
   ```typescript
   useEffect(() => {
     const subscription = supabase
       .channel('audio-uploads')
       .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'audio_uploads'
       }, (payload) => {
         // Update lokalen AudioFile Status
         updateLocalRecording(payload.new);
       })
       .subscribe();
   }, []);
   ```

#### Vorteile
- ✅ Robust & Zuverlässig
- ✅ Geräteübergreifende Synchronisation
- ✅ Präzises Tracking über gesamten Lifecycle
- ✅ Fehlerbehandlung & Retry-Logik möglich

#### Nachteile
- ⚠️ Backend-Änderungen erforderlich
- ⚠️ Komplexere Implementierung
- ⚠️ Zusätzliche Datenbank-Tabelle

---

### Option 3: Hybrid-Ansatz (Empfohlen)

**Kombination:** Lokales Tracking (Option 1) + optionale Backend-Verifizierung

#### Implementierung

1. **Phase 1: Lokales Tracking** (wie Option 1)
   - Erweitere `AudioFile` um Status-Felder
   - Tracking in `fileStorageService`
   - UI zeigt Status an

2. **Phase 2: Backend-Verifizierung** (später)
   - Füge `audio_uploads` Tabelle hinzu
   - Synchronisiere bei App-Start
   - Korrigiere falsche lokale Stati

3. **Matching-Strategie**
   ```typescript
   // Beim Upload: Speichere eindeutigen Identifier
   const uploadMetadata = {
     localId: recording.id,
     deviceId: await getDeviceId(),
     uploadTimestamp: Date.now()
   };

   // Backend speichert Metadata in memo.metadata.uploadInfo
   // Frontend kann später matchen
   ```

#### Vorteile
- ✅ Schnelle initiale Implementierung
- ✅ Schrittweise Verbesserung möglich
- ✅ Guter Kompromiss zwischen Aufwand und Nutzen

---

## Empfehlung & Nächste Schritte

### Empfohlener Ansatz: **Option 3 (Hybrid)**

**Begründung:**
- Schneller Mehrwert für User (Phase 1)
- Technische Schuld bleibt überschaubar
- Einfach auf robuste Lösung erweiterbar

### Implementierungs-Roadmap

#### Phase 1: Lokales Tracking (1-2 Tage)

1. **Datenmodell erweitern**
   - [ ] `AudioFile` Interface erweitern
   - [ ] Migration für bestehende Daten

2. **Storage-Service anpassen**
   - [ ] `updateRecordingStatus()` implementieren
   - [ ] `findRecordingByFilename()` implementieren
   - [ ] SQLite Queries anpassen

3. **Upload-Flow aktualisieren**
   - [ ] Status-Tracking in `handleReupload()`
   - [ ] Error-Handling verbessern
   - [ ] Doppel-Upload verhindern

4. **UI-Komponenten**
   - [ ] Status-Badge/Icon in `AudioPlayer`
   - [ ] "Zum Memo"-Button hinzufügen
   - [ ] Upload-Status-Indikator
   - [ ] Translations für Status-Texte

5. **Memo-Verbindung**
   - [ ] Realtime-Listener für neue Memos
   - [ ] Matching-Logik über Dateiname
   - [ ] Status-Update auf `completed`

#### Phase 2: Backend-Integration (optional, später)

1. **Datenbank**
   - [ ] `audio_uploads` Tabelle erstellen
   - [ ] RLS Policies definieren
   - [ ] Indexes anlegen

2. **Backend-Service**
   - [ ] Upload-Record Erstellung
   - [ ] Status-Updates während Verarbeitung
   - [ ] Memo-Verlinkung

3. **Frontend-Sync**
   - [ ] Realtime Subscription
   - [ ] Sync bei App-Start
   - [ ] Conflict-Resolution

---

## UI/UX Konzept

### Status-Anzeige im Audio-Archiv

```
┌─────────────────────────────────────────┐
│ 🎤 Aufnahme                             │
│ 25.09.2024, 14:30 Uhr • 2:34           │
│                                         │
│ ⏸ ▶ ──────●────── [Waveform]          │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ ✓ Hochgeladen & Verarbeitet     │   │ <- Status-Badge
│ │ 📝 Memo ansehen →                │   │ <- Action-Button
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Status-Varianten

1. **Nicht hochgeladen**
   - Button: "Hochladen" (Primary)
   - Badge: Keine

2. **Lädt hoch...**
   - Button: "Lädt hoch..." (Disabled, Loading)
   - Badge: "⏳ Wird hochgeladen..."

3. **Wird verarbeitet...**
   - Button: Disabled
   - Badge: "🔄 Wird verarbeitet..."

4. **Erfolgreich verarbeitet**
   - Button: "Zum Memo →" (Link zum Memo)
   - Badge: "✓ Fertig"
   - Optional: Memo-Titel anzeigen

5. **Fehler**
   - Button: "Erneut versuchen"
   - Badge: "❌ Upload fehlgeschlagen"
   - Fehlerdetails in Tooltip/Modal

---

## Technische Details

### SQLite Schema-Erweiterung

```sql
-- Migration: Add upload tracking to recordings
ALTER TABLE recordings ADD COLUMN upload_status TEXT;
ALTER TABLE recordings ADD COLUMN uploaded_at INTEGER;
ALTER TABLE recordings ADD COLUMN upload_error TEXT;
ALTER TABLE recordings ADD COLUMN processing_status TEXT;
ALTER TABLE recordings ADD COLUMN memo_id TEXT;
ALTER TABLE recordings ADD COLUMN cloud_path TEXT;

-- Index für schnelles Lookup
CREATE INDEX idx_recordings_filename ON recordings(filename);
CREATE INDEX idx_recordings_memo_id ON recordings(memo_id);
```

### Service-Methoden

```typescript
// features/storage/fileStorage.service.ts

interface RecordingStatusUpdate {
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'failed';
  uploadedAt?: Date;
  uploadError?: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  memoId?: string;
  cloudPath?: string;
}

class FileStorageService {
  async updateRecordingStatus(
    recordingId: string,
    update: RecordingStatusUpdate
  ): Promise<void> {
    // SQLite Update...
  }

  async findRecordingByFilename(filename: string): Promise<AudioFile | null> {
    // SQLite Query...
  }

  async findRecordingByMemoId(memoId: string): Promise<AudioFile | null> {
    // SQLite Query...
  }

  async getRecordingsWithStatus(
    status: 'uploaded' | 'processing' | 'completed'
  ): Promise<AudioFile[]> {
    // SQLite Query...
  }
}
```

---

## Testing-Plan

### Unit Tests
- [ ] `updateRecordingStatus()` - Status-Updates
- [ ] `findRecordingByFilename()` - Filename-Matching
- [ ] Memo-Verbindungs-Logik

### Integration Tests
- [ ] Upload → Status-Update → Memo-Verlinkung
- [ ] Fehlerbehandlung bei Upload-Fehler
- [ ] Doppel-Upload Prevention

### E2E Tests
- [ ] Aufnahme → Upload → Verarbeitung → Memo anzeigen
- [ ] Offline-Upload → Online → Status-Sync

---

## Offene Fragen

1. **Dateinamen-Kollisionen:** Was passiert wenn zwei Geräte dieselbe Dateiname verwenden?
   - **Lösung:** Device-ID in Dateinamen einbauen oder eindeutige Upload-ID verwenden

2. **Aufnahmen löschen:** Soll Memo-Verbindung erhalten bleiben wenn lokale Aufnahme gelöscht wird?
   - **Empfehlung:** Ja, nur `uploadStatus` behalten für Referenz

3. **Alte Aufnahmen:** Wie mit bestehenden Aufnahmen ohne Status umgehen?
   - **Empfehlung:** Initial alle auf `uploadStatus: null` setzen, User kann manuell hochladen

4. **Sync über Geräte:** Sollen Upload-Stati zwischen Geräten synchronisiert werden?
   - **Phase 1:** Nein (nur lokal)
   - **Phase 2:** Ja (via Backend)

---

## Zusammenfassung

### Ja, es ist machbar!

Die vorgeschlagene Lösung ermöglicht:
- ✅ **Status-Anzeige:** Upload & Verarbeitungsstatus im Archiv sichtbar
- ✅ **Memo-Verlinkung:** Direkte Navigation zum fertigen Memo
- ✅ **Fehlerbehandlung:** Klare Fehlermeldungen und Retry-Möglichkeit
- ✅ **Doppel-Upload Prevention:** Bereits hochgeladene Aufnahmen markiert
- ✅ **Progressive Enhancement:** Schnelle Basis-Implementierung, später erweiterbar

### Geschätzter Aufwand (Phase 1)
- Datenmodell & Migration: 2-3h
- Service-Implementierung: 3-4h
- Upload-Flow-Integration: 2-3h
- UI-Komponenten: 3-4h
- Testing & Bugfixes: 2-3h

**Gesamt: ~12-17 Stunden (1.5-2 Arbeitstage)**
