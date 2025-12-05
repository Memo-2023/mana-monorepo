# Phase 1: Custom Fields System - Implementierungsplan

## Überblick

**Zeitrahmen:** 8 Wochen (2 Monate)
**Ziel:** Implementierung eines voll funktionsfähigen Custom Fields Systems als Fundament für alle weiteren Mechaniken
**Priorität:** Höchste Priorität - alle weiteren Phasen bauen hierauf auf

## Woche 1-2: Datenmodell & Backend-Grundlagen

### Datenbankschema erweitern

#### 1.1 Neue Spalten in `content_nodes`
```sql
ALTER TABLE content_nodes 
ADD COLUMN custom_schema JSONB DEFAULT NULL,
ADD COLUMN custom_data JSONB DEFAULT NULL,
ADD COLUMN schema_version INTEGER DEFAULT 1;
```

#### 1.2 Schema-Struktur definieren
```typescript
interface CustomFieldSchema {
  version: number;
  fields: CustomFieldDefinition[];
  categories?: FieldCategory[];
  validation_rules?: ValidationRule[];
}

interface CustomFieldDefinition {
  id: string;
  key: string; // Eindeutiger Schlüssel z.B. "strength"
  label: string; // Anzeigename z.B. "Stärke"
  type: FieldType;
  category?: string;
  description?: string;
  required?: boolean;
  config: FieldConfig;
  display?: DisplayConfig;
  permissions?: FieldPermissions;
}

type FieldType = 
  | 'text'      // Einfacher Text
  | 'number'    // Ganzzahl oder Dezimal
  | 'range'     // Slider zwischen Min/Max
  | 'select'    // Dropdown-Auswahl
  | 'multiselect' // Mehrfachauswahl
  | 'boolean'   // Ja/Nein
  | 'date'      // Datum
  | 'formula'   // Berechnetes Feld
  | 'reference' // Verweis auf anderen Node
  | 'list'      // Array von Werten
  | 'json';     // Strukturierte Daten
```

#### 1.3 Migration erstellen
- Migration-Script für bestehende Daten
- Backup-Strategie vor Schema-Änderungen
- Rollback-Plan bei Problemen

### API-Endpoints

#### 1.4 Schema-Management
```
GET    /api/nodes/:slug/schema          - Schema abrufen
PUT    /api/nodes/:slug/schema          - Schema aktualisieren
POST   /api/nodes/:slug/schema/fields   - Feld hinzufügen
DELETE /api/nodes/:slug/schema/fields/:fieldId - Feld entfernen
```

#### 1.5 Daten-Management
```
GET    /api/nodes/:slug/custom-data     - Custom Data abrufen
PUT    /api/nodes/:slug/custom-data     - Custom Data aktualisieren
PATCH  /api/nodes/:slug/custom-data     - Teilupdate
POST   /api/nodes/:slug/validate        - Daten validieren
```

#### 1.6 Bulk-Operationen
```
POST   /api/world/:worldSlug/apply-schema  - Schema auf mehrere Nodes anwenden
GET    /api/world/:worldSlug/schemas       - Alle Schemas einer Welt
POST   /api/schemas/import                 - Schema importieren
GET    /api/schemas/export/:nodeSlug       - Schema exportieren
```

### Validierung & Sicherheit

#### 1.7 Validierungsregeln
- Typ-Validierung (number, text, etc.)
- Range-Validierung (min/max für numbers)
- Pattern-Validierung (regex für text)
- Required-Field-Validierung
- Cross-Field-Validierung (Feld A > Feld B)
- Custom Validators (JavaScript-Funktionen)

#### 1.8 Sicherheitsmaßnahmen
- Input-Sanitization
- SQL-Injection-Schutz bei JSONB-Queries
- Schema-Size-Limits (max. Anzahl Felder)
- Rate-Limiting für Schema-Änderungen
- Permissions-Check (nur Owner kann Schema ändern)

## Woche 3-4: Frontend-Komponenten

### Field-Editor Komponenten

#### 2.1 FieldDefinitionEditor.svelte
Komponente zum Erstellen/Bearbeiten von Feld-Definitionen:
- Feld-Typ-Auswahl
- Konfiguration je nach Typ
- Validierungsregeln festlegen
- Anzeigeoptionen
- Drag&Drop für Reihenfolge

#### 2.2 SchemaManager.svelte
Hauptkomponente für Schema-Verwaltung:
- Liste aller Custom Fields
- Kategorien verwalten
- Import/Export-Funktionen
- Schema-Versionierung
- Batch-Operationen

#### 2.3 Field-Renderer Komponenten
Für jeden Feldtyp eine eigene Render-Komponente:
- `TextField.svelte` - Ein/mehrzeiliger Text
- `NumberField.svelte` - Zahlen mit Min/Max
- `RangeField.svelte` - Slider-Komponente
- `SelectField.svelte` - Dropdown/Radio
- `FormulaField.svelte` - Read-only berechnete Werte
- `ReferenceField.svelte` - Node-Auswahl
- `ListField.svelte` - Dynamische Listen
- `BooleanField.svelte` - Checkbox/Toggle

#### 2.4 CustomDataForm.svelte
Dynamisches Formular basierend auf Schema:
- Automatisches Rendering aller Fields
- Validierung in Echtzeit
- Kategorisierte Darstellung
- Responsive Layout
- Save/Cancel-Funktionen
- Dirty-State-Tracking

### UI/UX-Überlegungen

#### 2.5 Field-Builder Interface
- Intuitive Drag&Drop-Oberfläche
- Live-Vorschau der Felder
- Undo/Redo-Funktionalität
- Keyboard-Shortcuts
- Kontextuelle Hilfe

#### 2.6 Responsive Design
- Mobile-optimierte Field-Editoren
- Touch-freundliche Controls
- Collapsible Kategorien
- Progressive Disclosure

## Woche 5: Formeln & Berechnungen

### Formula Engine

#### 3.1 Parser implementieren
- Math.js oder eigene Implementierung
- Unterstützte Operationen: +, -, *, /, ^, sqrt, etc.
- Funktionen: min, max, round, floor, ceil
- Conditionals: if/then/else
- String-Operationen: concat, length

#### 3.2 Feld-Referenzen
- Syntax: `@fieldname` oder `{fieldname}`
- Nested References: `@character.strength`
- Array-Zugriffe: `@inventory[0].weight`
- Aggregationen: `sum(@inventory[].value)`

#### 3.3 Abhängigkeits-Graph
- Automatische Erkennung von Abhängigkeiten
- Zirkuläre Abhängigkeiten verhindern
- Optimale Berechnungsreihenfolge
- Cache-Invalidierung bei Änderungen

#### 3.4 Performance-Optimierung
- Lazy Evaluation
- Memoization von Ergebnissen
- Batch-Berechnungen
- Web Worker für komplexe Formeln

### Beispiel-Formeln

#### 3.5 Vordefinierte Formeln
```javascript
// Kampfkraft
"(@strength + @dexterity) / 2 + @weaponBonus"

// Tragkraft
"@strength * 10 + (@size == 'large' ? 50 : 0)"

// Bewegungsreichweite
"@baseSpeed * (1 - @encumbrance / 100)"

// Magieresistenz
"@willpower + @level * 2 + (@race == 'elf' ? 10 : 0)"

// Handelspreis
"@basePrice * (1 - @reputation / 1000) * @quantity"
```

## Woche 6: Integration & Testing

### Integration in bestehende Komponenten

#### 4.1 NodeForm.svelte erweitern
- Tab für "Custom Fields"
- Nahtlose Integration mit Standard-Feldern
- Gemeinsame Speicherung
- Konsistente Validierung

#### 4.2 NodeDetail.svelte erweitern
- Anzeige von Custom Fields
- Gruppiert nach Kategorien
- Inline-Editing wo sinnvoll
- Export-Optionen

#### 4.3 NodeList.svelte erweitern
- Custom Fields als Spalten wählbar
- Sortierung nach Custom Fields
- Filterung nach Custom Fields
- Bulk-Edit für Custom Fields

### Testing-Strategie

#### 4.4 Unit Tests
- Schema-Validierung
- Formel-Parser
- Field-Validatoren
- API-Endpoints
- Komponenten-Tests

#### 4.5 Integration Tests
- Schema-CRUD-Operationen
- Daten-Speicherung
- Formel-Berechnungen
- Import/Export
- Permissions

#### 4.6 E2E Tests
- Kompletter Field-Creation-Flow
- Schema-Anwendung auf Nodes
- Formel-Updates
- Bulk-Operationen
- Error-Handling

#### 4.7 Performance Tests
- Load-Tests mit vielen Fields
- Komplexe Formel-Berechnungen
- Große Schemas
- Concurrent Updates

## Woche 7: Templates & Presets

### Template-System

#### 5.1 Template-Struktur
```typescript
interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: 'official' | 'community' | 'personal';
  tags: string[];
  applicable_to: NodeKind[];
  fields: CustomFieldDefinition[];
  example_data?: any;
  author?: string;
  version: string;
  dependencies?: string[]; // Andere Templates
}
```

#### 5.2 Offizielle Templates erstellen
- **Basic Stats**: Stärke, Intelligenz, Geschick, etc.
- **Resource Tracking**: HP, MP, Stamina, etc.
- **Inventory Basic**: Gewicht, Wert, Menge
- **Social Stats**: Reputation, Einfluss, Beziehungen
- **Combat Ready**: Angriff, Verteidigung, Initiative
- **Magic Simple**: Magiepunkte, Zauberslots
- **Skill Trees**: Basis-Skill-System

#### 5.3 Template-Bibliothek
- Template-Browser mit Suche
- Preview-Funktion
- Ein-Klick-Installation
- Merge-Funktion für mehrere Templates
- Update-Mechanismus

### Import/Export

#### 5.4 Export-Formate
- JSON (vollständig)
- CSV (nur Daten)
- Markdown (human-readable)
- YAML (für Entwickler)

#### 5.5 Import-Features
- Validierung vor Import
- Konflikt-Resolution
- Mapping-Tool für unterschiedliche Schemas
- Batch-Import

## Woche 8: Polish & Dokumentation

### User Experience

#### 6.1 Onboarding
- Interaktives Tutorial
- Tooltips und Hints
- Beispiel-Workflows
- Video-Tutorials (optional)

#### 6.2 Fehlerbehandlung
- Klare Fehlermeldungen
- Recovery-Optionen
- Auto-Save
- Konflikt-Resolution UI

#### 6.3 Performance-Optimierung
- Code-Splitting
- Lazy Loading
- Virtual Scrolling für große Listen
- Debouncing für Formeln

### Dokumentation

#### 6.4 Technische Dokumentation
- API-Dokumentation
- Schema-Spezifikation
- Formel-Syntax-Guide
- Migration-Guide

#### 6.5 Nutzer-Dokumentation
- Getting Started Guide
- Field-Type-Übersicht
- Formel-Beispiele
- Best Practices
- FAQ

#### 6.6 Entwickler-Dokumentation
- Template-Entwicklung
- Custom Validators
- Plugin-System (Vorbereitung)
- Contribution Guidelines

### Launch-Vorbereitung

#### 6.7 Beta-Testing
- Ausgewählte Nutzer einladen
- Feedback-System einrichten
- Bug-Tracking
- Performance-Monitoring

#### 6.8 Marketing-Material
- Feature-Ankündigung
- Demo-Videos
- Blog-Post
- Newsletter

## Meilensteine & Erfolgskriterien

### Woche 2: Backend Complete
✓ Datenbank-Schema erweitert
✓ Alle API-Endpoints funktionsfähig
✓ Basis-Validierung implementiert

### Woche 4: Frontend Functional
✓ Schema-Editor funktioniert
✓ Custom Fields werden gerendert
✓ Daten können gespeichert werden

### Woche 5: Formulas Working
✓ Formel-Parser implementiert
✓ Abhängigkeiten werden aufgelöst
✓ Performance akzeptabel

### Woche 6: Fully Integrated
✓ Integration in alle relevanten Komponenten
✓ Tests grün
✓ Keine Regression bei bestehenden Features

### Woche 7: Templates Ready
✓ Mindestens 5 offizielle Templates
✓ Import/Export funktioniert
✓ Template-Browser implementiert

### Woche 8: Production Ready
✓ Dokumentation vollständig
✓ Performance-Ziele erreicht
✓ Beta-Feedback eingearbeitet
✓ Launch-bereit

## Risiken & Mitigation

### Technische Risiken

**Komplexität unterschätzt**
- Mitigation: Iterative Entwicklung, MVP first
- Fallback: Features in Phase 2 verschieben

**Performance-Probleme**
- Mitigation: Frühe Performance-Tests
- Fallback: Limits für Anzahl Fields

**Formel-Engine zu komplex**
- Mitigation: Externe Library nutzen
- Fallback: Einfache Formeln only

### Organisatorische Risiken

**Zeitplan zu ambitioniert**
- Mitigation: Wöchentliche Reviews
- Fallback: Scope reduzieren

**User-Akzeptanz unklar**
- Mitigation: Frühe User-Tests
- Fallback: A/B Testing

## Ressourcen & Team

### Benötigte Skills
- **Backend**: Node.js, PostgreSQL, JSONB
- **Frontend**: Svelte 5, TypeScript
- **UX/UI**: Field-Editor Design
- **Testing**: Jest, Playwright

### Geschätzter Aufwand
- **Entwicklung**: 1-2 Vollzeit-Entwickler
- **Design**: 0.5 Designer
- **Testing**: 0.5 QA
- **Gesamt**: ~240-320 Personenstunden

## Next Steps nach Phase 1

### Sofort möglich
- Rule Templates (Phase 2)
- Erweiterte Formeln
- Visual Field Builder

### Vorbereitet für
- Dynamic Traits (Phase 3)
- State Machines (Phase 3)
- Relationship Matrix (Phase 3)

### Feedback-Loop
- User-Feedback sammeln
- Analytics auswerten
- Prioritäten für Phase 2 anpassen

## Appendix: Technische Details

### A. JSONB Query-Beispiele

```sql
-- Alle Nodes mit Custom Field "strength" > 15
SELECT * FROM content_nodes 
WHERE (custom_data->>'strength')::int > 15;

-- Nodes mit bestimmtem Schema-Version
SELECT * FROM content_nodes 
WHERE custom_schema->>'version' = '2';

-- Aggregate über Custom Fields
SELECT AVG((custom_data->>'level')::int) as avg_level 
FROM content_nodes 
WHERE kind = 'character';
```

### B. Security Considerations

```typescript
// Sanitization Beispiel
function sanitizeCustomData(data: any): any {
  // Remove any executable code
  // Validate data types
  // Check size limits
  // Escape special characters
  return sanitizedData;
}

// Permission Check
function canModifySchema(userId: string, nodeId: string): boolean {
  // Check ownership
  // Check world permissions
  // Check collaboration rights
  return hasPermission;
}
```

### C. Migration Strategy

```sql
-- Backup vor Migration
CREATE TABLE content_nodes_backup AS 
SELECT * FROM content_nodes;

-- Rollback wenn nötig
ALTER TABLE content_nodes 
DROP COLUMN IF EXISTS custom_schema,
DROP COLUMN IF EXISTS custom_data;
```

---

*Dieser Plan ist als lebendiges Dokument zu verstehen und sollte basierend auf Fortschritt und Feedback angepasst werden. Wöchentliche Reviews sind essentiell für den Erfolg.*