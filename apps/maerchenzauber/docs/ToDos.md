# M�rchenzauber - ToDos & Dokumentation

## <� Bildmodell-Auswahl Feature (10.09.2025)

###  Was wurde implementiert

#### Backend-�nderungen

1. **Datenbank-Schema**
   - Neue Tabelle `user_settings` mit Spalte `image_model` erstellt
   - RLS-Policies f�r sichere User-spezifische Einstellungen implementiert
   - Migration-Script: `apps/backend/migrations/001_create_user_settings_table.sql`

2. **Model-Konfiguration** (`apps/backend/src/core/models/image-models.ts`)
   - Drei Bildgenerierungsmodelle definiert:
     - **FLUX Schnell**: Schnelle Generierung (1-2 Sek, 1 Credit)
     - **FLUX Pro 1.1**: Premium-Qualit�t (10-15 Sek, 3 Credits)
     - **Stable Diffusion XL**: Standard-Qualit�t (5-10 Sek, 2 Credits)
   - Vollst�ndige Replicate Model-IDs mit Versionen integriert

3. **Settings Service** (`apps/backend/src/core/services/settings.service.ts`)
   - `getUserImageModel(userId)`: Abrufen des User-spezifischen Modells
   - `setUserImageModel(userId, modelId)`: Setzen eines neuen Modells
   - `getAvailableImageModels()`: Liste aller verf�gbaren Modelle
   - `getImageModelInfo(modelId)`: Detailinformationen zu einem Modell
   - Caching der User-Einstellungen f�r Performance

4. **Image Service Updates** (`apps/backend/src/core/services/image-supabase.service.ts`)
   - `generateImageWithReplicate()` nutzt jetzt User-spezifisches Modell
   - User-ID wird durch alle Bildgenerierungsfunktionen durchgereicht
   - Fallback auf Standard-Modell (SDXL) wenn keine User-Einstellung vorhanden

5. **Character Controller Updates** (`apps/backend/src/character/character.controller.ts`)
   - Alle `generateImage()` Aufrufe erweitert um User-ID Parameter
   - Drei Varianten aktualisiert: createCharacter, createCharacterFromImage, createCharacterSpecial

6. **Story Service Updates** (`apps/backend/src/story/services/story-creation.service.ts`)
   - `generateIllustrationForPage()` nutzt User-ID f�r Modellauswahl
   - Konsistente Modellnutzung f�r alle Illustrationen einer Story

7. **API Endpoints** (`apps/backend/src/settings/settings.controller.ts`)
   - `GET /settings/image-models`: Verf�gbare Modelle mit Metadaten
   - `GET /settings/user/image-model`: Aktuelles User-Modell abrufen
   - `PUT /settings/user/image-model`: User-Modell �ndern
   - DTO f�r Modell-Updates: `apps/backend/src/settings/dto/image-model.dto.ts`

#### Frontend-�nderungen

1. **Neue Settings-Seite** (`apps/mobile/app/(tabs)/(settings)/image-model.tsx`)
   - �bersichtliche Card-basierte Modellauswahl
   - Visual Feedback f�r ausgew�hltes Modell
   - Badges f�r Geschwindigkeit und Credit-Kosten
   - Informative Beschreibungen f�r jedes Modell
   - Loading- und Saving-States
   - Error Handling mit User-Feedback

2. **Settings Integration** (`apps/mobile/app/settings.tsx`)
   - Neuer Button "Bildgenerierung" in den Haupteinstellungen
   - Navigation zur Modellauswahl-Seite

3. **UI Features**
   - Responsive Design f�r verschiedene Bildschirmgr��en
   - Farbcodierte Badges (Schnell/Premium/Standard)
   - Checkmark-Icon f�r ausgew�hltes Modell
   - Info-Box mit Erkl�rung zur Modellauswahl

### =' Was muss noch gemacht werden

#### Sofort erforderlich (vor Go-Live)

1. **Datenbank-Migration ausf�hren** � KRITISCH

   ```bash
   # In Supabase Dashboard oder via psql:
   psql "postgresql://postgres.[project-id]:[password]@db.dyywxrmonxoiojsjmymc.supabase.co:5432/postgres"
   \i apps/backend/migrations/001_create_user_settings_table.sql
   ```

2. **Backend neu starten**

   ```bash
   cd apps/backend
   npm run dev  # oder npm run start:prod f�r Produktion
   ```

3. **Testing**
   - [ ] Modellauswahl in der App testen
   - [ ] Story-Generierung mit verschiedenen Modellen testen
   - [ ] Character-Erstellung mit verschiedenen Modellen testen
   - [ ] Persistenz der Einstellungen pr�fen

#### N�chste Schritte (Nice-to-have)

1. **Performance & Monitoring**
   - [ ] Logging f�r Modell-Performance (Generierungszeiten)
   - [ ] Erfolgs-/Fehlerquoten pro Modell tracken
   - [ ] Analytics f�r Modell-Pr�ferenzen der User

2. **User Experience**
   - [ ] Modell-Empfehlungen basierend auf Use-Case
   - [ ] Vorschau-Bilder f�r jedes Modell
   - [ ] A/B Testing f�r optimale Default-Einstellung

3. **Admin Features**
   - [ ] Admin-Dashboard f�r Modell-Statistiken
   - [ ] Modelle dynamisch aktivieren/deaktivieren
   - [ ] Credit-Preise anpassen per Admin-Interface

4. **Erweiterte Features**
   - [ ] Verschiedene Modelle f�r Characters vs. Stories
   - [ ] User-Feedback zur Bildqualit�t erfassen
   - [ ] Automatisches Fallback bei Modell-Ausfall
   - [ ] Batch-Generierung mit mehreren Modellen (f�r Vergleich)

### =� Technische Details

#### Modell-Spezifikationen

| Modell       | Replicate ID                                 | Geschwindigkeit | Credits | Use-Case          |
| ------------ | -------------------------------------------- | --------------- | ------- | ----------------- |
| FLUX Schnell | `black-forest-labs/flux-schnell:5599ed30...` | 1-2s            | 1       | Tests, Prototypen |
| FLUX Pro 1.1 | `black-forest-labs/flux-1.1-pro:8f06b9d3...` | 10-15s          | 3       | Finale Stories    |
| SDXL         | `stability-ai/sdxl:39ed52f2...`              | 5-10s           | 2       | Standard          |

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

1. **Import-Pfad-Fehler (GEL�ST)**
   - Problem: `Colors` Import-Pfad war falsch
   - L�sung: Pfad von `../../../src/constants/Colors` zu `../../../constants/Colors` korrigiert

2. **TypeScript Strict Mode**
   - Linter hat `!` zu required properties hinzugef�gt
   - DTOs nutzen jetzt strict mode compliance

### =� Testing Checklist

- [ ] **Backend API Tests**

  ```bash
  # Modelle abrufen
  curl http://localhost:3002/settings/image-models -H "Authorization: Bearer TOKEN"

  # User-Modell �ndern
  curl -X PUT http://localhost:3002/settings/user/image-model \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model": "flux-schnell"}'
  ```

- [ ] **Frontend Tests**
  - Settings �ffnen � Bildgenerierung
  - Modell ausw�hlen und speichern
  - App neu starten und pr�fen ob Auswahl persistiert
  - Neue Story/Character erstellen

- [ ] **Datenbank Tests**

  ```sql
  -- User-Settings pr�fen
  SELECT * FROM user_settings;

  -- Modell-Verteilung
  SELECT image_model, COUNT(*) FROM user_settings GROUP BY image_model;
  ```

### =� Dokumentation

- Vollst�ndige Implementation-Dokumentation: `/IMAGE_MODEL_SELECTION_README.md`
- API-Dokumentation in den jeweiligen Controller-Dateien
- Frontend-Komponenten sind self-documenting mit TypeScript-Interfaces

### =� Deployment Checklist

1. [ ] Datenbank-Migration ausf�hren
2. [ ] Environment-Variable `MAERCHENZAUBER_REPLICATE_API_KEY` pr�fen
3. [ ] Backend deployen
4. [ ] Mobile App builden und deployen
5. [ ] Feature-Flag aktivieren (falls vorhanden)
6. [ ] Monitoring aktivieren
7. [ ] User-Kommunikation �ber neues Feature

---

## =� Weitere TODOs (nicht related zu Bildmodell-Feature)

### High Priority

- [ ] Story-Logbook vollst�ndig implementieren
- [ ] Character-Konsistenz in Stories verbessern
- [ ] 10 Bilder pro Story generieren (aktuell nur 3)

### Medium Priority

- [ ] Mana Core Credit-System Integration vervollst�ndigen
- [ ] Mehrsprachigkeit (DE/EN) konsistent umsetzen
- [ ] Performance-Optimierungen f�r gro�e Story-Collections

### Low Priority

- [ ] Onboarding-Flow �berarbeiten
- [ ] Push-Notifications implementieren
- [ ] Social-Sharing Features

---

_Letzte Aktualisierung: 10.09.2025 - Till Schneider_
