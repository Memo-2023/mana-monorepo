# Feature-Voting-System Dokumentation

## Übersicht

Das Feature-Voting-System ermöglicht es Nutzern, Feature-Wünsche einzureichen und für Community-Vorschläge abzustimmen. Admins können diese Vorschläge moderieren und deren Status verwalten.

## Architektur

### Datenbank-Schema

#### 1. `feature_requests` Collection

Speichert alle Feature-Anfragen mit folgenden Feldern:

| Feld         | Typ      | Beschreibung               | Pflichtfeld |
| ------------ | -------- | -------------------------- | ----------- |
| `id`         | text     | Eindeutige ID (15 Zeichen) | ✅          |
| `message`    | text     | Die Feature-Beschreibung   | ✅          |
| `name`       | text     | Name des Einreichers       | ❌          |
| `email`      | email    | E-Mail des Einreichers     | ❌          |
| `status`     | select   | Status der Anfrage         | ❌          |
| `published`  | bool     | Ob öffentlich sichtbar     | ❌          |
| `vote_count` | number   | Anzahl der Votes           | ❌          |
| `priority`   | select   | Priorität                  | ❌          |
| `category`   | select   | Kategorie                  | ❌          |
| `created`    | autodate | Erstellungsdatum           | Auto        |
| `updated`    | autodate | Letztes Update             | Auto        |

**Status-Optionen:**

- `new` - Neue Anfrage
- `reviewed` - In Prüfung
- `planned` - Geplant
- `in_progress` - In Entwicklung
- `completed` - Fertiggestellt
- `rejected` - Abgelehnt

**Prioritäts-Optionen:**

- `low` - Niedrig
- `medium` - Mittel
- `high` - Hoch
- `critical` - Kritisch

**Kategorie-Optionen:**

- `ui` - User Interface
- `performance` - Performance
- `integration` - Integration
- `security` - Sicherheit
- `features` - Features
- `other` - Sonstiges

**Zugriffsregeln:**

- **List/View:** Öffentlich (für published=true)
- **Create:** Öffentlich (für Feedback-Formular)
- **Update/Delete:** Nur Admins

#### 2. `feature_votes` Collection

Verwaltet die Abstimmungen der Nutzer:

| Feld              | Typ      | Beschreibung                 | Pflichtfeld |
| ----------------- | -------- | ---------------------------- | ----------- |
| `id`              | text     | Eindeutige ID                | ✅          |
| `user`            | relation | Verweis auf users Collection | ✅          |
| `feature_request` | relation | Verweis auf feature_requests | ✅          |
| `created`         | autodate | Zeitpunkt der Abstimmung     | Auto        |

**Zugriffsregeln:**

- **List/View:** Nur für eingeloggte Nutzer
- **Create:** Nur für eingeloggte Nutzer (user muss auth.id sein)
- **Update:** Nicht erlaubt
- **Delete:** Nur eigene Votes

## Frontend-Komponenten

### 1. Feedback-Formular

**Ort:** Am Ende der Features-Seite

**Funktionen:**

- Einfaches Textfeld für Feedback
- Optionale Kontaktdaten (Name & E-Mail)
- Validierung und Erfolgs-Feedback
- Automatisches Leeren nach Absenden

**Code-Snippet:**

```svelte
<form method="POST" action="?/requestFeature">
	<textarea name="message" required />
	<details>
		<summary>Optional: Kontaktdaten</summary>
		<input type="text" name="name" />
		<input type="email" name="email" />
	</details>
	<button type="submit">Feedback absenden</button>
</form>
```

### 2. Community Roadmap

**Ort:** Nach dem Hero-Bereich der Features-Seite

**Komponenten:**

- **Filter-Buttons:** Status-Filter (Alle/Neu/Geplant/In Entwicklung)
- **Sortierung:** Nach Votes oder Datum
- **Feature-Karten:** Zeigen Vorschläge mit Vote-Button
- **Vote-Button:** Interaktiv für eingeloggte Nutzer

**Features:**

- Optimistische Updates beim Voten
- Echtzeit-Vote-Zähler
- Status-Badges mit Farben
- Kategorie-Icons
- Prioritäts-Anzeige

### 3. Vote-Mechanismus

**Ablauf:**

1. Nutzer klickt auf Vote-Button
2. Form wird per POST an `?/vote` Action gesendet
3. Server prüft Authentifizierung
4. Vote wird erstellt/gelöscht
5. vote_count wird aktualisiert
6. UI wird optimistisch aktualisiert

## Server-Actions

### 1. `requestFeature` Action

**Zweck:** Speichert neue Feature-Anfragen

**Ablauf:**

```typescript
1. Formular-Daten validieren
2. Feature-Request in PocketBase speichern
3. Status auf 'new' setzen
4. Erfolgs-Feedback zurückgeben
```

### 2. `vote` Action

**Zweck:** Verwaltet Nutzer-Abstimmungen

**Ablauf:**

```typescript
1. Authentifizierung prüfen
2. Bei 'add':
   - Prüfen ob Vote existiert
   - Vote erstellen
   - vote_count erhöhen
3. Bei 'remove':
   - Vote finden
   - Vote löschen
   - vote_count verringern
```

## Admin-Workflow

### 1. Moderation neuer Anfragen

1. Admin öffnet PocketBase Admin-Panel
2. Navigiert zu `feature_requests` Collection
3. Filtert nach `published = false`
4. Prüft neue Anfragen
5. Setzt bei Freigabe:
   - `published = true`
   - `status` (z.B. "reviewed")
   - `category` (optional)
   - `priority` (optional)

### 2. Status-Verwaltung

Typischer Workflow:

```
new → reviewed → planned → in_progress → completed
                    ↓
                rejected
```

### 3. Vote-Count Management

- `vote_count` wird automatisch aktualisiert
- Denormalisiert für Performance
- Kann bei Bedarf manuell korrigiert werden

## Sicherheit

### Zugriffskontrollen

- **Öffentlich:** Ansicht der Roadmap, Feedback einreichen
- **Eingeloggte Nutzer:** Abstimmen, eigene Votes verwalten
- **Admins:** Moderation, Status-Verwaltung, alle Felder bearbeiten

### Validierung

- Server-seitige Validierung aller Eingaben
- CSRF-Schutz durch SvelteKit
- SQL-Injection-Schutz durch PocketBase
- Rate-Limiting durch PocketBase

## Performance-Optimierungen

1. **Denormalisierte vote_count:** Vermeidet COUNT-Queries
2. **Optimistische Updates:** Sofortiges UI-Feedback
3. **Pagination:** Max. 50 Feature-Requests laden
4. **Indexierung:** Auf user und feature_request in votes

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **E-Mail-Benachrichtigungen:**
   - Bei Status-Änderungen
   - Bei Implementierung

2. **Kommentare:**
   - Diskussion zu Feature-Requests
   - Admin-Antworten

3. **Anhänge:**
   - Screenshots
   - Mockups

4. **Export:**
   - CSV-Export für Admins
   - Roadmap als PDF

5. **API-Endpoints:**
   - Öffentliche API für Roadmap
   - Webhook für Status-Updates

## Wartung

### Regelmäßige Aufgaben

1. **Wöchentlich:**
   - Neue Anfragen moderieren
   - Status aktualisieren

2. **Monatlich:**
   - Implementierte Features auf "completed" setzen
   - Alte/irrelevante Anfragen archivieren

3. **Quartalsweise:**
   - Prioritäten überprüfen
   - Roadmap-Planung aktualisieren

### Backup

Feature-Requests sind Teil des regulären PocketBase-Backups.
Wichtig: Beide Collections (`feature_requests` und `feature_votes`) sichern.

## Troubleshooting

### Problem: Votes werden nicht gezählt

**Lösung:**

1. Prüfe ob user eingeloggt ist
2. Prüfe feature_votes Collection Rules
3. Manuell vote_count korrigieren

### Problem: Feature-Requests nicht sichtbar

**Lösung:**

1. Prüfe `published = true`
2. Prüfe Collection Rules
3. Cache leeren

### Problem: Doppelte Votes

**Lösung:**

1. Unique Index auf user+feature_request erstellen
2. Duplikate in DB entfernen
3. vote_count neu berechnen

## Code-Referenzen

- **Frontend:** `/src/routes/features/+page.svelte`
- **Server:** `/src/routes/features/+page.server.ts`
- **Types:** Automatisch generiert in `./$types`
- **PocketBase:** Collections `feature_requests` und `feature_votes`

## Deployment-Checklist

- [ ] PocketBase Collections erstellt
- [ ] Zugriffsregeln konfiguriert
- [ ] Admin-User angelegt
- [ ] Erste Test-Features eingereicht
- [ ] Vote-Funktionalität getestet
- [ ] Moderation getestet
- [ ] Mobile Ansicht geprüft
- [ ] Performance getestet

---

_Letzte Aktualisierung: 14. August 2025_
_Version: 1.0.0_
