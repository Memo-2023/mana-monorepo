# Task Metadata Reference

Dieses Dokument beschreibt alle verfügbaren Metadaten, die einer Aufgabe (Task) zugewiesen werden können.

## Haupt-Eigenschaften

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `title` | `string` | Ja | Titel der Aufgabe |
| `description` | `string \| null` | Nein | Detaillierte Beschreibung |
| `projectId` | `string \| null` | Nein | ID des zugehörigen Projekts |
| `parentTaskId` | `string \| null` | Nein | ID der übergeordneten Aufgabe (für verschachtelte Tasks) |

## Zeitplanung

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `dueDate` | `Date \| string \| null` | Fälligkeitsdatum |
| `dueTime` | `string \| null` | Fälligkeitszeit im Format `HH:mm` |
| `startDate` | `Date \| string \| null` | Startdatum der Aufgabe |

### Beispiel
```typescript
{
  dueDate: "2024-12-15T00:00:00.000Z",
  dueTime: "14:30",
  startDate: "2024-12-10T00:00:00.000Z"
}
```

## Priorität & Status

### Priorität (`priority`)

| Wert | Beschreibung | Farbe |
|------|--------------|-------|
| `low` | Niedrige Priorität | Grün (#22c55e) |
| `medium` | Mittlere Priorität | Gelb (#eab308) |
| `high` | Hohe Priorität | Orange (#f97316) |
| `urgent` | Dringend | Rot (#ef4444) |

### Status (`status`)

| Wert | Beschreibung |
|------|--------------|
| `pending` | Ausstehend |
| `in_progress` | In Bearbeitung |
| `completed` | Abgeschlossen |
| `cancelled` | Abgebrochen |

### Completion

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `isCompleted` | `boolean` | Erledigt-Flag |
| `completedAt` | `Date \| string \| null` | Zeitpunkt der Erledigung |

## Wiederholung (Recurrence)

Wiederkehrende Aufgaben werden mit dem RFC 5545 RRULE-Standard definiert.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `recurrenceRule` | `string \| null` | RFC 5545 RRULE String |
| `recurrenceEndDate` | `Date \| string \| null` | Enddatum der Wiederholung |
| `lastOccurrence` | `Date \| string \| null` | Datum der letzten Ausführung |

### RRULE Beispiele

| Muster | RRULE |
|--------|-------|
| Täglich | `FREQ=DAILY` |
| Wöchentlich | `FREQ=WEEKLY` |
| Jeden Montag und Mittwoch | `FREQ=WEEKLY;BYDAY=MO,WE` |
| Monatlich am 15. | `FREQ=MONTHLY;BYMONTHDAY=15` |
| Jährlich | `FREQ=YEARLY` |
| Alle 2 Wochen | `FREQ=WEEKLY;INTERVAL=2` |

## Kanban-Board

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `columnId` | `string \| null` | ID der Kanban-Spalte |
| `columnOrder` | `number` | Position innerhalb der Spalte |

## Subtasks (Unteraufgaben)

Subtasks sind Checklisten-Einträge innerhalb einer Aufgabe.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `subtasks` | `Subtask[] \| null` | Array von Unteraufgaben |

### Subtask-Struktur

```typescript
interface Subtask {
  id: string;           // Eindeutige ID
  title: string;        // Titel der Unteraufgabe
  isCompleted: boolean; // Erledigt-Status
  completedAt?: string; // Erledigungszeitpunkt
  order: number;        // Reihenfolge
}
```

### Beispiel
```typescript
{
  subtasks: [
    { id: "1", title: "Design erstellen", isCompleted: true, order: 0 },
    { id: "2", title: "Code implementieren", isCompleted: false, order: 1 },
    { id: "3", title: "Tests schreiben", isCompleted: false, order: 2 }
  ]
}
```

## Labels (Tags)

Labels ermöglichen die Kategorisierung von Aufgaben.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `labels` | `Label[]` | Array von zugewiesenen Labels |

### Label-Struktur

```typescript
interface Label {
  id: string;    // Eindeutige ID
  name: string;  // Label-Name
  color: string; // Hex-Farbcode (z.B. "#8b5cf6")
}
```

## Zusätzliche Metadaten

Das `metadata`-Objekt enthält erweiterte Informationen.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `metadata.notes` | `string` | Zusätzliche Notizen |
| `metadata.attachments` | `string[]` | URLs zu Dateianhängen |
| `metadata.linkedCalendarEventId` | `string \| null` | ID eines verknüpften Kalender-Events |
| `metadata.storyPoints` | `number \| null` | Storypoints (Fibonacci: 1, 2, 3, 5, 8, 13, 21) |
| `metadata.effectiveDuration` | `EffectiveDuration \| null` | Effektive Dauer der Aufgabe |
| `metadata.funRating` | `number \| null` | Spaß-Faktor (Skala 1-10) |

### EffectiveDuration-Struktur

```typescript
interface EffectiveDuration {
  value: number;        // Numerischer Wert
  unit: DurationUnit;   // 'minutes' | 'hours' | 'days'
}

type DurationUnit = 'minutes' | 'hours' | 'days';
```

### Storypoints

Storypoints verwenden die Fibonacci-Sequenz zur Aufwandsschätzung:

| Wert | Typischer Aufwand |
|------|-------------------|
| 1 | Sehr klein, wenige Minuten |
| 2 | Klein, unter einer Stunde |
| 3 | Mittel, ein paar Stunden |
| 5 | Größer, halber Tag |
| 8 | Groß, ganzer Tag |
| 13 | Sehr groß, mehrere Tage |
| 21 | Epic, aufteilen empfohlen |

### Spaß-Faktor

Der Spaß-Faktor ist eine Skala von 1-10:

| Bereich | Bedeutung | Farbe |
|---------|-----------|-------|
| 1-3 | Unangenehm | Rot (#ef4444) |
| 4-6 | Neutral | Gelb (#eab308) |
| 7-10 | Macht Spaß | Grün (#22c55e) |

### Beispiel
```typescript
{
  metadata: {
    notes: "Wichtige Hinweise zur Aufgabe...",
    attachments: [
      "https://storage.example.com/file1.pdf",
      "https://storage.example.com/image.png"
    ],
    linkedCalendarEventId: "cal-event-123",
    storyPoints: 5,
    effectiveDuration: {
      value: 2,
      unit: "hours"
    },
    funRating: 7
  }
}
```

## Sortierung

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `order` | `number` | Sortierreihenfolge innerhalb der Liste |

## Timestamps

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `createdAt` | `Date \| string` | Erstellungszeitpunkt |
| `updatedAt` | `Date \| string` | Letzte Aktualisierung |

---

## Vollständiges Beispiel

```typescript
const task: Task = {
  id: "task-uuid-123",
  userId: "user-uuid-456",

  // Haupt-Eigenschaften
  title: "Website-Redesign abschließen",
  description: "Alle Seiten auf das neue Design umstellen",
  projectId: "project-uuid-789",
  parentTaskId: null,

  // Zeitplanung
  dueDate: "2024-12-20T00:00:00.000Z",
  dueTime: "17:00",
  startDate: "2024-12-15T00:00:00.000Z",

  // Priorität & Status
  priority: "high",
  status: "in_progress",
  isCompleted: false,
  completedAt: null,

  // Sortierung
  order: 0,

  // Kanban
  columnId: "col-in-progress",
  columnOrder: 2,

  // Wiederholung
  recurrenceRule: null,
  recurrenceEndDate: null,
  lastOccurrence: null,

  // Subtasks
  subtasks: [
    { id: "sub-1", title: "Homepage", isCompleted: true, order: 0 },
    { id: "sub-2", title: "About-Seite", isCompleted: false, order: 1 }
  ],

  // Labels
  labels: [
    { id: "label-1", name: "Design", color: "#8b5cf6" },
    { id: "label-2", name: "Wichtig", color: "#ef4444" }
  ],

  // Metadaten
  metadata: {
    notes: "Design-Specs sind im Anhang",
    attachments: ["https://storage.example.com/design-specs.pdf"],
    linkedCalendarEventId: "cal-123",
    storyPoints: 8,
    effectiveDuration: { value: 4, unit: "hours" },
    funRating: 6
  },

  // Timestamps
  createdAt: "2024-12-01T10:00:00.000Z",
  updatedAt: "2024-12-10T14:30:00.000Z"
};
```

## UI-Implementierung

### Im QuickAdd implementiert
- `title` - Eingabefeld
- `dueDate` - Datum-Picker (Heute, Morgen, In 3 Tagen, Nächste Woche)
- `priority` - Priorität-Picker (Niedrig, Mittel, Hoch, Dringend)
- `projectId` - Projekt-Picker

### Im TaskEditModal implementiert
- Alle QuickAdd-Felder
- `description` - Textarea
- `dueTime` - Zeit-Picker
- `startDate` - Datum-Picker
- `status` - Select (Ausstehend, In Bearbeitung, Abgeschlossen, Abgebrochen)
- `labels` - Multi-Select Dropdown
- `subtasks` - Drag-and-Drop Liste
- `recurrenceRule` - Select (Täglich, Wöchentlich, etc.)
- `metadata.notes` - Textarea
- `metadata.storyPoints` - Fibonacci-Buttons (1, 2, 3, 5, 8, 13, 21)
- `metadata.effectiveDuration` - Quick-Select Chips + benutzerdefinierte Eingabe
- `metadata.funRating` - 10-Punkte-Skala mit Farbverlauf

### Noch nicht im QuickAdd
- Labels
- Erinnerungen/Reminders
- Wiederholung (Recurrence)
- Subtasks
- Beschreibung
- Startdatum
- Uhrzeit
- Storypoints
- Effektive Dauer
- Spaß-Faktor
