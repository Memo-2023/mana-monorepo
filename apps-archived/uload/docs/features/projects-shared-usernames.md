# Projects & Shared Usernames Feature

**Implementiert am:** 16. Januar 2025  
**Version:** 1.0.0  
**Status:** ✅ Vollständig implementiert

## Übersicht

Das Projects-System ermöglicht es Teams und Organisationen, gemeinsame Link-Sammlungen unter einem einheitlichen Username zu verwalten. Mehrere Nutzer können Links unter demselben Projekt-Username erstellen und verwalten, wodurch eine konsistente Markenpräsenz gewährleistet wird.

## Use Case

**Beispiel: Firma Memoro**

- Erstellt Projekt mit Username `@memoro`
- Mehrere Teammitglieder können Links erstellen
- Alle Links sind unter `ulo.ad/u/memoro/...` erreichbar
- Zentrale Verwaltung und einheitliches Branding

## Technische Implementierung

### Datenbank-Schema

#### 1. **projects Collection**

```javascript
{
  id: string (auto),
  name: string,           // z.B. "Memoro GmbH"
  username: string,       // z.B. "memoro" (unique)
  description: string?,   // Projektbeschreibung
  logo: file?,           // Projekt-Logo
  owner_id: relation,    // Verweis auf users
  settings: json,        // Projekt-Einstellungen
  is_active: boolean,    // Projekt aktiv/inaktiv
  created: date,
  updated: date
}
```

**Berechtigungen:**

- `listRule/viewRule`: Authentifizierte User (Owner oder Mitglieder)
- `createRule`: Jeder authentifizierte User
- `updateRule`: Nur Owner
- `deleteRule`: Nur Owner

#### 2. **project_members Collection**

```javascript
{
  id: string (auto),
  project_id: relation,     // Verweis auf projects
  user_id: relation,        // Verweis auf users
  role: select,             // "admin" | "editor" | "viewer"
  can_create_links: boolean,
  can_edit_links: boolean,
  can_delete_links: boolean,
  joined_at: date,
  created: date,
  updated: date
}
```

**Rollen-Berechtigungen:**

- **Admin**: Volle Verwaltung (Links + Mitglieder)
- **Editor**: Links erstellen und bearbeiten
- **Viewer**: Nur Ansicht

#### 3. **links Collection (erweitert)**

```javascript
{
  // Bestehende Felder...
  project_id: relation?,    // NEU: Verweis auf projects
  created_by: relation?,    // NEU: Wer hat den Link erstellt
  user_id: relation?        // Jetzt optional (entweder user_id ODER project_id)
}
```

**Regel-Updates:**

- Links können entweder einem User ODER einem Projekt gehören
- `created_by` trackt immer den Ersteller (wichtig bei Projekt-Links)

### API-Endpunkte & Routes

#### Projekt-Verwaltung

- `GET /projects` - Liste aller Projekte des Users
- `GET /projects/[id]` - Projekt-Details mit Mitgliedern und Links
- `POST /projects` - Neues Projekt erstellen
- `GET /projects/[id]/settings` - Projekt-Einstellungen (geplant)

#### Link-Routing

- `/u/[username]/[code]` - Funktioniert für User UND Projekt-Usernames
  - Prüft zuerst `users.username`
  - Falls nicht gefunden, prüft `projects.username`
  - Leitet zur Original-URL weiter

#### Actions

- `create` - Projekt erstellen mit Username-Validierung
- `addMember` - Mitglied per E-Mail hinzufügen
- `removeMember` - Mitglied entfernen
- `updateMember` - Rolle/Berechtigungen ändern

## UI-Komponenten

### 1. Projects Übersicht (`/projects`)

- Grid-Ansicht aller Projekte
- Unterscheidung: "Your Projects" vs "Member Projects"
- Quick-Create Form mit Username-Validierung
- Visual: Karten mit Name, @username, Beschreibung

### 2. Projekt-Detail (`/projects/[id]`)

- **Header**: Name, Username, URL-Copy-Button
- **Stats**: Links-Anzahl, Mitglieder, Total Clicks
- **Members Panel**:
  - Owner mit Badge
  - Mitglieder-Liste mit Rollen
  - Add/Remove Funktionen für Owner
- **Links Panel**:
  - Alle Projekt-Links
  - Creator-Attribution
  - Click-Statistiken

### 3. Link-Erstellung (erweitert)

- Projekt-Auswahl beim Erstellen
- URL-Parameter: `?project=PROJECT_ID`
- Automatische URL-Generierung mit Projekt-Username

## Sicherheit & Berechtigungen

### Zugriffskontrolle

```sql
-- Projekt-Links anzeigen
@request.auth.id = created_by
|| project_id.owner_id = @request.auth.id
|| @collection.project_members.user_id ?= @request.auth.id

-- Links bearbeiten
created_by = @request.auth.id
|| (project_id && @collection.project_members.user_id = @request.auth.id
    && @collection.project_members.can_edit_links = true)
```

### Username-Validierung

- Nutzt bestehende `validateUsername()` Funktion
- Prüft Eindeutigkeit über beide Collections (users + projects)
- Reservierte Usernames werden blockiert

## Migration & Backward Compatibility

### Bestehende Links

- Alle bestehenden Links bleiben unverändert (user_id gesetzt, project_id = null)
- Keine Breaking Changes für existierende URLs

### Neue Links

- Entweder `user_id` ODER `project_id` gesetzt
- `created_by` wird immer gesetzt für Audit-Trail

## Performance-Überlegungen

### Optimierungen

1. **Username-Lookup**: Sequentiell (users → projects) für minimale Latenz
2. **Caching**: Project-Metadaten können gecacht werden (nicht implementiert)
3. **Indexes**: Username-Felder sollten indiziert sein (PocketBase Default)

### Skalierung

- Unbegrenzte Projekte pro User
- Unbegrenzte Mitglieder pro Projekt
- Links-Limit nur durch Account-Plan begrenzt

## Zukünftige Erweiterungen

### Phase 2 (geplant)

- [ ] Projekt-Settings Page
- [ ] Logo-Upload und Anzeige
- [ ] Projekt-spezifische Themes
- [ ] Öffentliche Projekt-Profile
- [ ] Projekt-Analytics Dashboard

### Phase 3 (Ideen)

- [ ] Projekt-Templates
- [ ] Bulk-Import für Links
- [ ] API-Keys pro Projekt
- [ ] Webhook-Integration
- [ ] Audit-Log für alle Projekt-Aktionen

## Testing-Anleitung

### Manuelles Testing

1. **Projekt erstellen**

   ```
   - Gehe zu /projects
   - "New Project" → Name: "Test Firma", Username: "testfirma"
   - Prüfe: Projekt erscheint in "Your Projects"
   ```

2. **Mitglieder verwalten**

   ```
   - Projekt öffnen
   - "Add Member" → E-Mail eingeben, Rolle wählen
   - Prüfe: Mitglied erscheint in Liste
   - Als Mitglied einloggen → Projekt in "Member Projects"
   ```

3. **Links erstellen**
   ```
   - In Projekt: "New Link" klicken
   - URL eingeben, speichern
   - Prüfe: Link unter /u/testfirma/[code] erreichbar
   ```

### Automatisierte Tests (TODO)

```javascript
// Beispiel-Test
describe('Projects', () => {
	it('should create project with unique username', async () => {
		// Test implementation
	});

	it('should prevent duplicate project usernames', async () => {
		// Test implementation
	});

	it('should route project links correctly', async () => {
		// Test implementation
	});
});
```

## Bekannte Limitierungen

1. **Username-Konflikte**: User und Projekt können nicht denselben Username haben
2. **Keine Username-Änderung**: Einmal gesetzt, kann der Username nicht geändert werden
3. **Keine Projekt-Übertragung**: Owner kann nicht gewechselt werden (nur via DB)
4. **Keine Massen-Operationen**: Links müssen einzeln verschoben werden

## Support & Dokumentation

### Für Entwickler

- Code: `/src/routes/(app)/projects/`
- Collections: `projects`, `project_members`
- Utils: Erweiterte `username.ts` Validierung

### Für Nutzer

- Feature-Announcement: [TODO]
- Help-Center Artikel: [TODO]
- Video-Tutorial: [TODO]

## Changelog

### v1.0.0 (16.01.2025)

- ✅ Initial Release
- ✅ Projects & project_members Collections
- ✅ UI für Projekt-Verwaltung
- ✅ Link-Zuordnung zu Projekten
- ✅ URL-Routing für Projekt-Usernames
- ✅ Rollenbasierte Berechtigungen

---

**Entwickelt von:** Claude mit Tillschneider  
**Review-Status:** In Produktion  
**Letztes Update:** 16.01.2025
