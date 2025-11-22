# Märchenzauber - ToDos & Dokumentation

## <¨ Bildmodell-Auswahl Feature (10.09.2025)

###  Was wurde implementiert

#### Backend-Änderungen

1. **Datenbank-Schema**
   - Neue Tabelle `user_settings` mit Spalte `image_model` erstellt
   - RLS-Policies für sichere User-spezifische Einstellungen implementiert
   - Migration-Script: `apps/backend/migrations/001_create_user_settings_table.sql`

2. **Model-Konfiguration** (`apps/backend/src/core/models/image-models.ts`)
   - Drei Bildgenerierungsmodelle definiert:
     - **FLUX Schnell**: Schnelle Generierung (1-2 Sek, 1 Credit)
     - **FLUX Pro 1.1**: Premium-Qualität (10-15 Sek, 3 Credits)  
     - **Stable Diffusion XL**: Standard-Qualität (5-10 Sek, 2 Credits)
   - Vollständige Replicate Model-IDs mit Versionen integriert

3. **Settings Service** (`apps/backend/src/core/services/settings.service.ts`)
   - `getUserImageModel(userId)`: Abrufen des User-spezifischen Modells
   - `setUserImageModel(userId, modelId)`: Setzen eines neuen Modells
   - `getAvailableImageModels()`: Liste aller verfügbaren Modelle
   - `getImageModelInfo(modelId)`: Detailinformationen zu einem Modell
   - Caching der User-Einstellungen für Performance

4. **Image Service Updates** (`apps/backend/src/core/services/image-supabase.service.ts`)
   - `generateImageWithReplicate()` nutzt jetzt User-spezifisches Modell
   - User-ID wird durch alle Bildgenerierungsfunktionen durchgereicht
   - Fallback auf Standard-Modell (SDXL) wenn keine User-Einstellung vorhanden

5. **Character Controller Updates** (`apps/backend/src/character/character.controller.ts`)
   - Alle `generateImage()` Aufrufe erweitert um User-ID Parameter
   - Drei Varianten aktualisiert: createCharacter, createCharacterFromImage, createCharacterSpecial

6. **Story Service Updates** (`apps/backend/src/story/services/story-creation.service.ts`)
   - `generateIllustrationForPage()` nutzt User-ID für Modellauswahl
   - Konsistente Modellnutzung für alle Illustrationen einer Story

7. **API Endpoints** (`apps/backend/src/settings/settings.controller.ts`)
   - `GET /settings/image-models`: Verfügbare Modelle mit Metadaten
   - `GET /settings/user/image-model`: Aktuelles User-Modell abrufen
   - `PUT /settings/user/image-model`: User-Modell ändern
   - DTO für Modell-Updates: `apps/backend/src/settings/dto/image-model.dto.ts`

#### Frontend-Änderungen

1. **Neue Settings-Seite** (`apps/mobile/app/(tabs)/(settings)/image-model.tsx`)
   - Übersichtliche Card-basierte Modellauswahl
   - Visual Feedback für ausgewähltes Modell
   - Badges für Geschwindigkeit und Credit-Kosten
   - Informative Beschreibungen für jedes Modell
   - Loading- und Saving-States
   - Error Handling mit User-Feedback

2. **Settings Integration** (`apps/mobile/app/settings.tsx`)
   - Neuer Button "Bildgenerierung" in den Haupteinstellungen
   - Navigation zur Modellauswahl-Seite

3. **UI Features**
   - Responsive Design für verschiedene Bildschirmgrößen
   - Farbcodierte Badges (Schnell/Premium/Standard)
   - Checkmark-Icon für ausgewähltes Modell
   - Info-Box mit Erklärung zur Modellauswahl

### =' Was muss noch gemacht werden

#### Sofort erforderlich (vor Go-Live)

1. **Datenbank-Migration ausführen**   KRITISCH
   ```bash
   # In Supabase Dashboard oder via psql:
   psql "postgresql://postgres.[project-id]:[password]@db.dyywxrmonxoiojsjmymc.supabase.co:5432/postgres"
   \i apps/backend/migrations/001_create_user_settings_table.sql
   ```

2. **Backend neu starten**
   ```bash
   cd apps/backend
   npm run dev  # oder npm run start:prod für Produktion
   ```

3. **Testing**
   - [ ] Modellauswahl in der App testen
   - [ ] Story-Generierung mit verschiedenen Modellen testen
   - [ ] Character-Erstellung mit verschiedenen Modellen testen
   - [ ] Persistenz der Einstellungen prüfen

#### Nächste Schritte (Nice-to-have)

1. **Performance & Monitoring**
   - [ ] Logging für Modell-Performance (Generierungszeiten)
   - [ ] Erfolgs-/Fehlerquoten pro Modell tracken
   - [ ] Analytics für Modell-Präferenzen der User

2. **User Experience**
   - [ ] Modell-Empfehlungen basierend auf Use-Case
   - [ ] Vorschau-Bilder für jedes Modell
   - [ ] A/B Testing für optimale Default-Einstellung

3. **Admin Features**
   - [ ] Admin-Dashboard für Modell-Statistiken
   - [ ] Modelle dynamisch aktivieren/deaktivieren
   - [ ] Credit-Preise anpassen per Admin-Interface

4. **Erweiterte Features**
   - [ ] Verschiedene Modelle für Characters vs. Stories
   - [ ] User-Feedback zur Bildqualität erfassen
   - [ ] Automatisches Fallback bei Modell-Ausfall
   - [ ] Batch-Generierung mit mehreren Modellen (für Vergleich)

### =Ê Technische Details

#### Modell-Spezifikationen

| Modell | Replicate ID | Geschwindigkeit | Credits | Use-Case |
|--------|-------------|-----------------|---------|----------|
| FLUX Schnell | `black-forest-labs/flux-schnell:5599ed30...` | 1-2s | 1 | Tests, Prototypen |
| FLUX Pro 1.1 | `black-forest-labs/flux-1.1-pro:8f06b9d3...` | 10-15s | 3 | Finale Stories |
| SDXL | `stability-ai/sdxl:39ed52f2...` | 5-10s | 2 | Standard |

#### Datenbank-Schema

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    image_model TEXT DEFAULT 'sdxl' CHECK (image_model IN ('flux-schnell', 'flux-pro', 'sdxl')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### = Bekannte Issues & Fixes

1. **Import-Pfad-Fehler (GELÖST)**
   - Problem: `Colors` Import-Pfad war falsch
   - Lösung: Pfad von `../../../src/constants/Colors` zu `../../../constants/Colors` korrigiert

2. **TypeScript Strict Mode**
   - Linter hat `!` zu required properties hinzugefügt
   - DTOs nutzen jetzt strict mode compliance

### =Ý Testing Checklist

- [ ] **Backend API Tests**
  ```bash
  # Modelle abrufen
  curl http://localhost:3002/settings/image-models -H "Authorization: Bearer TOKEN"
  
  # User-Modell ändern
  curl -X PUT http://localhost:3002/settings/user/image-model \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model": "flux-schnell"}'
  ```

- [ ] **Frontend Tests**
  - Settings öffnen ’ Bildgenerierung
  - Modell auswählen und speichern
  - App neu starten und prüfen ob Auswahl persistiert
  - Neue Story/Character erstellen

- [ ] **Datenbank Tests**
  ```sql
  -- User-Settings prüfen
  SELECT * FROM user_settings;
  
  -- Modell-Verteilung
  SELECT image_model, COUNT(*) FROM user_settings GROUP BY image_model;
  ```

### =Ú Dokumentation

- Vollständige Implementation-Dokumentation: `/IMAGE_MODEL_SELECTION_README.md`
- API-Dokumentation in den jeweiligen Controller-Dateien
- Frontend-Komponenten sind self-documenting mit TypeScript-Interfaces

### =€ Deployment Checklist

1. [ ] Datenbank-Migration ausführen
2. [ ] Environment-Variable `MAERCHENZAUBER_REPLICATE_API_KEY` prüfen
3. [ ] Backend deployen
4. [ ] Mobile App builden und deployen
5. [ ] Feature-Flag aktivieren (falls vorhanden)
6. [ ] Monitoring aktivieren
7. [ ] User-Kommunikation über neues Feature

---

## =Å Weitere TODOs (nicht related zu Bildmodell-Feature)

### High Priority
- [ ] Story-Logbook vollständig implementieren
- [ ] Character-Konsistenz in Stories verbessern
- [ ] 10 Bilder pro Story generieren (aktuell nur 3)

### Medium Priority
- [ ] Mana Core Credit-System Integration vervollständigen
- [ ] Mehrsprachigkeit (DE/EN) konsistent umsetzen
- [ ] Performance-Optimierungen für große Story-Collections

### Low Priority
- [ ] Onboarding-Flow überarbeiten
- [ ] Push-Notifications implementieren
- [ ] Social-Sharing Features

---

*Letzte Aktualisierung: 10.09.2025 - Till Schneider*