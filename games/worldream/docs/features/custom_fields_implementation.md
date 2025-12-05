# Custom Fields Implementation

## Überblick

Das Custom Fields System wurde als erste Phase der flexiblen Mechaniken-Erweiterung für Worldream implementiert. Es ermöglicht Nutzern, eigene strukturierte Datenfelder zu beliebigen Content Nodes (Charaktere, Objekte, Orte, Geschichten) hinzuzufügen.

## Architektur

### Datenbankstruktur

Die Implementierung nutzt PostgreSQL's JSONB-Felder für maximale Flexibilität:

```sql
-- In content_nodes Tabelle
custom_schema JSONB        -- Feld-Definitionen
custom_data JSONB          -- Tatsächliche Werte
schema_version INTEGER     -- Versionierung für Migrationen

-- Separate Tabelle für Templates
custom_field_templates     -- Wiederverwendbare Feld-Konfigurationen
```

**Designentscheidung**: JSONB wurde gewählt, da es:
- Flexible Schema-Evolution ohne Migrationen ermöglicht
- Effiziente Queries und Indexierung unterstützt
- Type-Safety auf Anwendungsebene erlaubt
- Einfaches Backup und Export ermöglicht

### Type System

Das TypeScript Type System (`/src/lib/types/customFields.ts`) definiert 11 Feldtypen:

1. **text** - Ein- oder mehrzeiliger Text mit optionaler Längen-Validierung
2. **number** - Numerische Werte mit Min/Max und Einheiten
3. **range** - Slider für Werte in einem bestimmten Bereich
4. **select** - Dropdown mit vordefinierten Optionen
5. **multiselect** - Mehrfachauswahl aus Optionen
6. **boolean** - Ja/Nein Checkbox
7. **date** - Datumseingabe
8. **formula** - Berechnete Felder basierend auf anderen Feldern
9. **reference** - Verweise auf andere Nodes (@slug)
10. **list** - Dynamische Listen von Elementen
11. **json** - Strukturierte JSON-Daten für komplexe Konfigurationen

### Komponenten-Architektur

```
CustomFieldsManager.svelte (Haupt-Container)
├── Tab: Daten
│   └── CustomDataForm.svelte (Formular-Rendering)
├── Tab: Schema
│   └── FieldDefinitionEditor.svelte (Feld-Editor)
└── Tab: Templates
    └── Template-Auswahl und -Anwendung

CustomFieldsDisplay.svelte (Read-Only Anzeige)
└── Kategorisierte Feld-Darstellung mit speziellen Visualisierungen
```

## Implementierungsdetails

### 1. Schema-Definition

Jedes Feld wird durch eine `CustomFieldDefinition` beschrieben:

```typescript
interface CustomFieldDefinition {
  id: string;              // Eindeutige ID
  key: string;             // Technischer Schlüssel (z.B. "health_points")
  label: string;           // Anzeigename (z.B. "Lebenspunkte")
  type: FieldType;         // Feldtyp
  description?: string;    // Hilfetext
  category?: string;       // Gruppierung (z.B. "Kampfwerte")
  required?: boolean;      // Pflichtfeld
  config: FieldConfig;     // Typ-spezifische Konfiguration
}
```

### 2. Dynamisches Form-Rendering

`CustomDataForm.svelte` generiert zur Laufzeit Formulare basierend auf dem Schema:

```typescript
// Für jedes Feld im Schema
for (const field of schema.fields) {
  // Rendere passendes Input-Element basierend auf field.type
  switch(field.type) {
    case 'text': renderTextField(field, value);
    case 'number': renderNumberField(field, value);
    // ... weitere Typen
  }
}
```

**Besonderheiten**:
- Echtzeit-Validierung basierend auf Feld-Konfiguration
- Abhängigkeits-Tracking für Formula-Felder
- Kategorisierte Darstellung für bessere UX

### 3. Template-System

Templates lösen das "Cold Start" Problem:

```typescript
interface CustomFieldTemplate {
  id: string;
  name: string;
  description: string;
  applicable_to: string[];  // ['character', 'object', etc.]
  fields: CustomFieldDefinition[];
  tags: string[];
  is_public: boolean;
  usage_count: number;
}
```

**Mitgelieferte Templates**:
- **Basic Stats**: Grundlegende Attribute (Stärke, Geschicklichkeit, etc.)
- **Inventory**: Item-Verwaltung mit Gewicht und Anzahl
- **Relationships**: Beziehungs-Tracking mit Vertrauen und Notizen

### 4. API-Endpoints

```
PUT /api/nodes/[slug]/schema
  - Speichert/Aktualisiert Schema
  - Validiert Feld-Definitionen
  - Erhöht Schema-Version

PUT /api/nodes/[slug]/custom-data
  - Speichert Feld-Daten
  - Validiert gegen Schema
  - Berechnet Formula-Felder

GET /api/templates
  - Listet verfügbare Templates
  - Filtert nach applicable_to
```

### 5. Sicherheit

- **Row-Level Security (RLS)**: Nur Besitzer können Schema/Daten ändern
- **Validierungsfunktionen**: PostgreSQL-seitige Schema-Validierung
- **Permission Checks**: API prüft Besitz vor Änderungen

## Verwendung

### Als Nutzer

1. **Felder hinzufügen**:
   - Navigiere zu einem Node (z.B. Charakter)
   - Klicke auf "Bearbeiten"
   - Wechsle zum Tab "Benutzerdefinierte Felder"
   - Tab "Felder verwalten" → "Neues Feld"

2. **Template anwenden**:
   - Tab "Vorlagen"
   - Wähle passendes Template
   - Klicke "Anwenden"

3. **Daten eingeben**:
   - Tab "Daten"
   - Fülle Felder aus
   - Speichern

### Als Entwickler

```typescript
// Schema abrufen
const response = await fetch(`/api/nodes/${slug}/schema`);
const { schema } = await response.json();

// Daten speichern
await fetch(`/api/nodes/${slug}/custom-data`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    data: {
      health_points: 100,
      strength: 15
    }
  })
});
```

## Technische Entscheidungen

### Warum JSONB statt separate Tabellen?

**Vorteile**:
- Keine Schema-Migrationen bei neuen Feldtypen
- Einfacher Import/Export
- Flexible Struktur-Evolution
- Atomare Updates

**Nachteile** (und Lösungen):
- Keine SQL-Constraints → Anwendungs-Validierung
- Komplexere Queries → PostgreSQL JSON-Funktionen
- Type-Safety → TypeScript + Validierung

### Warum Svelte 5 Runes?

```svelte
<!-- Alte Syntax -->
<script>
  let value = '';
  $: validated = validateField(value);
</script>

<!-- Neue Syntax mit Runes -->
<script lang="ts">
  let value = $state('');
  let validated = $derived(validateField(value));
</script>
```

**Vorteile**:
- Bessere TypeScript-Integration
- Klarere Reaktivitäts-Semantik
- Zukunftssicher für Svelte 5+

### Warum keine Formula-Evaluation im Frontend?

**Sicherheit**: Formula-Evaluation erfolgt später serverseitig
**Performance**: Verhindert DoS durch komplexe Formeln
**Konsistenz**: Zentrale Berechnung vermeidet Inkonsistenzen

## Performance-Optimierungen

1. **Lazy Loading**: Templates werden nur bei Bedarf geladen
2. **Debounced Saves**: Auto-Save mit 500ms Verzögerung
3. **Field Grouping**: Kategorien reduzieren visuelle Komplexität
4. **Selective Rendering**: Nur sichtbare Tabs werden gerendert

## Erweiterungsmöglichkeiten

### Kurzfristig (Phase 2)
- Formula-Evaluation implementieren
- Erweiterte Validierungs-Regeln
- Bulk-Operations für mehrere Nodes
- Import/Export von Schemas

### Mittelfristig (Phase 3-4)
- Visuelle Schema-Designer
- Abhängige Felder (Conditional Logic)
- Berechnete Aggregationen
- Schema-Vererbung

### Langfristig
- KI-generierte Schemas basierend auf Beschreibungen
- Cross-Node Formeln
- Versionierte Daten-Historie
- GraphQL-API für Custom Fields

## Bekannte Einschränkungen

1. **Formula-Felder**: Noch nicht funktional (Platzhalter)
2. **Reference-Felder**: Einfache Text-Eingabe statt Node-Picker
3. **Schema-Migration**: Manuelle Daten-Anpassung bei Schema-Änderungen
4. **Performance**: Bei >100 Feldern merkbare Verzögerung
5. **Mobile UX**: Tabs nicht optimal auf kleinen Bildschirmen

## Testing

### Unit Tests (geplant)
```typescript
// Validierung
expect(validateFieldKey('health_points')).toBe(true);
expect(validateFieldKey('Health Points')).toBe(false);

// Schema-Erstellung
const schema = createEmptySchema();
expect(schema.fields).toHaveLength(0);
expect(schema.version).toBe(1);
```

### Integration Tests (geplant)
- Schema-Speicherung und -Abruf
- Daten-Validierung gegen Schema
- Template-Anwendung
- Permission-Checks

## Migration von Legacy-Daten

Falls zukünftig Daten aus anderen Systemen importiert werden:

```typescript
// Migration Helper (Beispiel)
function migrateToCustomFields(legacyData: any): CustomFieldData {
  return {
    // Map alte Felder zu neuen Keys
    health_points: legacyData.hp || 100,
    strength: legacyData.str || 10,
    // ...
  };
}
```

## Troubleshooting

### "Cannot apply unknown utility class"
**Problem**: Tailwind-Theme-Klassen nicht gefunden
**Lösung**: Verwende korrekte Theme-Präfixe (`bg-theme-bg-surface` statt `bg-theme-surface`)

### Schema wird nicht gespeichert
**Mögliche Ursachen**:
1. Fehlende Authentifizierung
2. RLS-Policy blockiert
3. Ungültiges Schema-Format

**Debug**:
```typescript
// Prüfe Response
const response = await fetch(...);
if (!response.ok) {
  const error = await response.json();
  console.error('Schema save failed:', error);
}
```

### Felder werden nicht angezeigt
**Checkliste**:
1. Schema erfolgreich geladen?
2. Daten vorhanden?
3. Kategorien korrekt zugeordnet?
4. Komponente korrekt importiert?

## Zusammenfassung

Das Custom Fields System bietet eine solide Grundlage für flexible, nutzerdefinierte Mechaniken in Worldream. Die JSONB-basierte Architektur ermöglicht schnelle Iteration und Erweiterung ohne Datenbankmigrationen. Mit 11 Feldtypen und einem Template-System können Nutzer sofort produktiv werden.

Die nächsten Schritte fokussieren sich auf:
1. Formula-Evaluation
2. Verbesserte Reference-Felder
3. Mobile Optimierung
4. Performance bei großen Schemas

Das System ist bewusst einfach gehalten, um schnelles Feedback zu ermöglichen und die Richtung basierend auf Nutzer-Bedürfnissen anzupassen.