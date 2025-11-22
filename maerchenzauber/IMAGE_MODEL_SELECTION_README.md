# Bildmodell-Auswahl Feature

## Übersicht
Dieses Feature ermöglicht es Nutzern, zwischen verschiedenen Bildgenerierungsmodellen zu wählen:
- **FLUX Schnell**: Schnelle Generierung (1-2 Sekunden)
- **FLUX Pro 1.1**: Höchste Qualität (10-15 Sekunden)  
- **Stable Diffusion XL**: Bewährte, stabile Qualität (5-10 Sekunden)

## Implementierte Änderungen

### Backend

#### 1. Datenbank-Migration
- **Datei**: `apps/backend/migrations/001_create_user_settings_table.sql`
- Neue Tabelle `user_settings` mit Spalte `image_model`
- RLS-Policies für User-spezifische Settings

#### 2. Model-Konfiguration
- **Datei**: `apps/backend/src/core/models/image-models.ts`
- Definition der verfügbaren Modelle mit Metadaten
- Export von `IMAGE_MODELS` Konstante

#### 3. Settings Service
- **Datei**: `apps/backend/src/core/services/settings.service.ts`
- Neue Methoden:
  - `getUserImageModel(userId)`: Abrufen des User-Modells
  - `setUserImageModel(userId, modelId)`: Setzen des User-Modells
  - `getAvailableImageModels()`: Liste aller Modelle
  - `getImageModelInfo(modelId)`: Details eines Modells

#### 4. Image Service
- **Datei**: `apps/backend/src/core/services/image-supabase.service.ts`
- `generateImageWithReplicate()` nutzt jetzt User-spezifisches Modell
- User-ID wird durch alle Generierungsfunktionen durchgereicht

#### 5. API Endpoints
- **Datei**: `apps/backend/src/settings/settings.controller.ts`
- `GET /settings/image-models`: Verfügbare Modelle
- `GET /settings/user/image-model`: Aktuelles User-Modell
- `PUT /settings/user/image-model`: Modell ändern

### Frontend

#### 1. Settings UI
- **Datei**: `apps/mobile/app/(tabs)/(settings)/image-model.tsx`
- Neue Seite für Modellauswahl mit Card-Layout
- Visual Feedback für ausgewähltes Modell
- Credits und Zeitangaben

#### 2. Navigation
- **Datei**: `apps/mobile/app/settings.tsx`
- Neuer Button "Bildgenerierung" in Settings

## Deployment-Schritte

### 1. Datenbank-Migration ausführen
```bash
# Verbindung zur Supabase-Datenbank herstellen
psql "postgresql://postgres.[project-id]:[password]@db.[project-id].supabase.co:5432/postgres"

# Migration ausführen
\i apps/backend/migrations/001_create_user_settings_table.sql
```

### 2. Backend deployen
```bash
cd apps/backend
npm run build
npm run start:prod
```

### 3. Mobile App aktualisieren
```bash
cd apps/mobile
npm run build
# Für iOS
eas build --platform ios
# Für Android  
eas build --platform android
```

## Testing

### Backend Tests

#### 1. API Endpoints testen
```bash
# Verfügbare Modelle abrufen
curl http://localhost:3002/settings/image-models \
  -H "Authorization: Bearer YOUR_TOKEN"

# User-Modell abrufen
curl http://localhost:3002/settings/user/image-model \
  -H "Authorization: Bearer YOUR_TOKEN"

# Modell ändern
curl -X PUT http://localhost:3002/settings/user/image-model \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "flux-schnell"}'
```

#### 2. Bildgenerierung testen
```bash
# Story mit neuem Modell erstellen
curl -X POST http://localhost:3002/story \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "CHARACTER_ID",
    "storyDescription": "Test story mit neuem Modell"
  }'
```

### Frontend Tests

1. App starten: `npm run dev`
2. Zu Settings navigieren
3. "Bildgenerierung" Button klicken
4. Verschiedene Modelle auswählen
5. Prüfen ob Auswahl gespeichert wird
6. Neue Story/Character erstellen und prüfen ob richtiges Modell verwendet wird

## Konfiguration

### Replicate API Keys für neue Modelle

Die Model-IDs in `image-models.ts` müssen mit den tatsächlichen Replicate-Modellen übereinstimmen:

```typescript
'flux-schnell': {
  replicateId: 'black-forest-labs/flux-schnell', // Aktualisieren mit korrekter ID
},
'flux-pro': {
  replicateId: 'black-forest-labs/flux-1.1-pro', // Aktualisieren mit korrekter ID
}
```

### Umgebungsvariablen
Sicherstellen, dass `MAERCHENZAUBER_REPLICATE_API_KEY` gesetzt ist.

## Monitoring

### Logs prüfen
```bash
# Backend Logs für Model-Auswahl
grep "Using Replicate model:" backend.log

# Prüfen welche Modelle verwendet werden
grep "getUserImageModel" backend.log
```

### Datenbank-Queries
```sql
-- Anzahl User pro Modell
SELECT image_model, COUNT(*) 
FROM user_settings 
GROUP BY image_model;

-- User mit speziellem Modell
SELECT user_id, image_model, updated_at 
FROM user_settings 
WHERE image_model != 'sdxl'
ORDER BY updated_at DESC;
```

## Troubleshooting

### Problem: Modell wird nicht gespeichert
- Prüfen ob `user_settings` Tabelle existiert
- RLS-Policies überprüfen
- JWT Token validieren

### Problem: Falsches Modell wird verwendet
- Settings Service Cache prüfen
- User-ID in Logs verifizieren
- Default-Fallback prüfen

### Problem: Replicate Fehler
- API Key prüfen
- Model-IDs validieren
- Rate Limits checken

## Nächste Schritte

1. **Model-Performance Tracking**: Zeiten und Erfolgsraten messen
2. **User Feedback**: Qualitätsbewertung pro Modell
3. **Credit-Anpassung**: Unterschiedliche Preise pro Modell
4. **A/B Testing**: Automatische Modell-Empfehlungen
5. **Admin Dashboard**: Modell-Nutzungsstatistiken