# 🚨 WICHTIG: Fehlende Felder in PocketBase hinzufügen

Die `links` Collection hat noch nicht die neuen Felder. Diese müssen **manuell im PocketBase Admin UI** hinzugefügt werden.

## Schritt-für-Schritt Anleitung:

### 1. PocketBase Admin öffnen
Gehe zu: https://pb.ulo.ad/_/

### 2. Links Collection bearbeiten
- Navigiere zu: Collections → links
- Klicke auf "Edit collection"

### 3. Diese Felder hinzufügen:

#### a) System-Timestamps (WICHTIGSTE!)
- **created** (Type: autodate)
  - onCreate: ✅ aktiviert
  - onUpdate: ❌ deaktiviert
  
- **updated** (Type: autodate)
  - onCreate: ✅ aktiviert
  - onUpdate: ✅ aktiviert

#### b) Neue Funktionsfelder
- **use_username** (Type: bool)
  - Default value: false
  - Required: No

- **click_count** (Type: number)
  - Default value: 0
  - Only integers: ✅
  - Min: 0
  - Required: No

- **last_clicked_at** (Type: date)
  - Required: No

#### c) Marketing-Felder (optional)
- **utm_source** (Type: text)
  - Max length: 255
  - Required: No

- **utm_medium** (Type: text)
  - Max length: 255
  - Required: No

- **utm_campaign** (Type: text)
  - Max length: 255
  - Required: No

### 4. Speichern
Klicke auf "Save collection"

## Frontend-Anpassungen die bereits gemacht wurden:

✅ TypeScript Interface aktualisiert (`src/lib/pocketbase.ts`)
✅ Folder-Referenzen entfernt
✅ Server-Code angepasst

## Was noch geprüft werden muss:

Nach dem Hinzufügen der Felder in PocketBase:
1. Teste das Erstellen eines neuen Links
2. Prüfe ob created/updated gesetzt werden
3. Teste die use_username Checkbox Funktion