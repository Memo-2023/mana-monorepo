# Mana Companion Brain — Architecture & Implementation Plan

> Vollstaendiger Umbau-Plan fuer ein zentrales Intelligenz-System ueber alle Module.
> Start mit 5 Pilot-Modulen: **Todo, Calendar, Drink, Nutriphi, Places**.
> Stand: April 2026

---

## 1. Vision

Mana hat 40+ Module, die isoliert arbeiten. Der Companion Brain verbindet sie zu einem System, das den Nutzer proaktiv begleitet — erinnert, motiviert, Muster erkennt und Zusammenhaenge zwischen Modulen herstellt. Alles lokal, privacy-first.

**Drei Saeulen:**
1. **Pulse** — Regelbasierte Nudges & Tageszusammenfassungen (kein LLM)
2. **Rituale** — Gefuehrte Routinen die Daten in Module schreiben (AI-generiert)
3. **Companion Chat** — LLM mit Tool-Zugriff auf alle Module

**Fundament:**
- Domain Event Bus (semantische Events statt CRUD-Logs)
- Projection Engine (live-reaktive Aggregation ueber alle Module)
- Goal System (moduluebergreifende Ziele mit Fortschritt)
- Semantic Memory (extrahiertes Nutzerwissen, persistent)
- Tool Layer (standardisierter LLM-Zugriff auf Module)
- Feedback Loop (Nudge-Outcomes fuer Lernfaehigkeit)

---

## 2. Architektur-Uebersicht

```
+---------------------------------------------------+
|                  MODULE LAYER                      |
|  Todo - Calendar - Drink - Nutriphi - Places       |
|  Jedes Modul emittiert Domain Events via Stores    |
+------------------------+--------------------------+
                         | emit()
                         v
+---------------------------------------------------+
|                  EVENT BUS                         |
|  Typed, synchron, in-process                       |
|  TaskCompleted - DrinkLogged - EventCreated ...    |
+--+--------+--------+--------+--------+-----------+
   |        |        |        |        |
   v        v        v        v        v
+------+ +------+ +------+ +------+ +------+
|Event | |State | |Proj. | |Rule  | |Trig- |
|Store | |Write | |Engine| |Engine| |gers  |
|      | |Dexie | |      | |      | |      |
+------+ +------+ +--+---+ +--+---+ +------+
                      |        |
           +----------+--------+----------+
           v          v        v          v
+---------------------------------------------------+
|              INTELLIGENCE LAYER                    |
|                                                    |
| +------------+ +----------+ +-------+ +--------+  |
| |Projections | | Memory   | | Goals | |Feedback|  |
| |DaySnapshot | | Patterns | | Meter | | Loop   |  |
| |Streaks     | | Prefs    | | Track | | Nudge  |  |
| |Correlations| | Context  | | Link  | | Outcome|  |
| +-----+------+ +----+-----+ +---+---+ +---+----+  |
|       |              |           |         |       |
|       +--------------+-----------+---------+       |
|                      v                             |
|           Context Document Generator               |
|           (~500 Token Nutzer-Snapshot)              |
+------------------------+--------------------------+
                         |
                         v
+---------------------------------------------------+
|              INTERACTION LAYER                     |
|                                                    |
| +----------+ +----------+ +---------+ +---------+  |
| |  Pulse   | | Rituale  | |Companion| |Insights |  |
| |  Engine  | | (AI-gen) | |  Chat   | | Cards   |  |
| | regelb.  | |          | |LLM+Tool | |         |  |
| +----------+ +----------+ +---------+ +---------+  |
|                                                    |
|  Feedback: Nudge -> Outcome -> Memory Update       |
+---------------------------------------------------+
```

---

## 3. Domain Event System

### 3.1 Warum Domain Events statt CRUD-Logs

Aktuell loggt `_activity` nur `{ op: 'update', collection: 'tasks', recordId }`. Daraus laesst sich nicht ableiten, **was** passiert ist. Wurde der Task erledigt? Umbenannt? Verschoben? Das erzwingt Archaeologie — Felder vergleichen, Semantik raten.

Domain Events tragen Bedeutung: `TaskCompleted { taskId, title, project }` ist sofort verstaendlich fuer Projections, Rules, LLM und Mensch.

### 3.2 Event Bus Interface

**Neues File: `apps/mana/apps/web/src/lib/data/events/event-bus.ts`**

```typescript
// ── Core Types ──────────────────────────────────────

export interface DomainEvent<T extends string = string, P = unknown> {
  type: T;
  payload: P;
  meta: EventMeta;
}

export interface EventMeta {
  id: string;            // crypto.randomUUID()
  timestamp: string;     // ISO
  appId: string;         // source module
  collection: string;    // source table
  recordId: string;      // affected record
  userId: string;        // from getEffectiveUserId()
  causedBy?: string;     // parent event id (for trigger chains)
}

// ── Bus Interface ───────────────────────────────────

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void;

export interface EventBus {
  emit(event: DomainEvent): void;
  on<T extends string>(type: T, handler: EventHandler): () => void;
  onAny(handler: EventHandler): () => void;
  off(type: string, handler: EventHandler): void;
}
```

**Implementierung:** Einfacher synchroner Dispatcher mit async Subscribers.
- `emit()` ist synchron (blockiert Dexie-Hook nicht)
- Handlers laufen in `queueMicrotask()` — nach dem Hook, aber vor dem naechsten Frame
- Guard gegen Endlos-Loops: `_emitting` Set verhindert re-entrant emits vom selben Event-Typ

```typescript
export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<EventHandler>>();
  const anyHandlers = new Set<EventHandler>();

  return {
    emit(event: DomainEvent) {
      queueMicrotask(() => {
        const typeHandlers = handlers.get(event.type);
        if (typeHandlers) {
          for (const h of typeHandlers) h(event);
        }
        for (const h of anyHandlers) h(event);
      });
    },

    on(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(handler);
      return () => handlers.get(type)?.delete(handler);
    },

    onAny(handler) {
      anyHandlers.add(handler);
      return () => anyHandlers.delete(handler);
    },

    off(type, handler) {
      handlers.get(type)?.delete(handler);
    },
  };
}

// Singleton
export const eventBus = createEventBus();
```

### 3.3 Event Store

Ersetzt die `_activity`-Tabelle als primaere Quelle fuer "was ist passiert".

**Neue Dexie-Tabelle `_events`:**
```
_events: '++seq, meta.id, meta.type, meta.appId, meta.timestamp,
          [meta.appId+meta.timestamp], [meta.type+meta.timestamp]'
```

Felder:
- `seq` — Auto-increment (Reihenfolge-Garantie)
- `type` — Domain Event Type (z.B. 'TaskCompleted')
- `payload` — Serialisiertes Event-Payload (verschluesselt fuer sensitive Felder)
- `meta` — EventMeta Objekt

**Retention:** 90 Tage (wie `_activity`), max 50.000 Events. Pruning via bestehender Quota-Recovery.

**Subscriber:** `eventBus.onAny()` schreibt jedes Event in `_events`.

### 3.4 Domain Events pro Modul (5 Pilot-Module)

#### Todo Events

| Event | Payload | Abgeleitet aus |
|-------|---------|----------------|
| `TaskCreated` | `{ taskId, title, dueDate?, priority?, projectId?, labelIds? }` | `tasksStore.createTask()` |
| `TaskCompleted` | `{ taskId, title, projectId?, wasOverdue: boolean }` | `tasksStore.completeTask()` |
| `TaskUncompleted` | `{ taskId, title }` | `tasksStore.uncompleteTask()` |
| `TaskUpdated` | `{ taskId, fields: string[] }` | `tasksStore.updateTask()` |
| `TaskDeleted` | `{ taskId, title }` | `tasksStore.deleteTask()` |
| `TaskRescheduled` | `{ taskId, title, oldDate?, newDate }` | `updateTask` wenn `dueDate` aendert |
| `SubtasksUpdated` | `{ taskId, total, completed }` | `tasksStore.updateSubtasks()` |
| `ReminderSet` | `{ taskId, minutesBefore, type }` | `remindersStore.createReminder()` |

#### Calendar Events

| Event | Payload | Abgeleitet aus |
|-------|---------|----------------|
| `CalendarEventCreated` | `{ eventId, title, startTime, endTime, isAllDay, isRecurring, calendarId }` | `eventsStore.createEvent()` |
| `CalendarEventUpdated` | `{ eventId, fields: string[] }` | `eventsStore.updateEvent()` |
| `CalendarEventDeleted` | `{ eventId, title, wasRecurring }` | `eventsStore.deleteEvent()` |
| `CalendarEventMoved` | `{ eventId, title, oldStart, newStart }` | `updateEvent` wenn `startTime` aendert |

#### Drink Events

| Event | Payload | Abgeleitet aus |
|-------|---------|----------------|
| `DrinkLogged` | `{ entryId, drinkType, quantityMl, name, date, time, fromPreset: boolean }` | `drinkStore.logDrink()`, `logFromPreset()` |
| `DrinkEntryDeleted` | `{ entryId, drinkType, quantityMl }` | `drinkStore.deleteEntry()` |
| `DrinkEntryUndone` | `{ entryId }` | `drinkStore.undoLastEntry()` |
| `DrinkGoalReached` | `{ date, goalMl, actualMl, drinkType: 'water' }` | Projection erkennt Zielerreichung |

#### Nutriphi Events

| Event | Payload | Abgeleitet aus |
|-------|---------|----------------|
| `MealLogged` | `{ mealId, mealType, inputType, description, calories?, protein?, date }` | `mealMutations.create()` |
| `MealFromPhotoLogged` | `{ mealId, mealType, photoMediaId, confidence, foods? }` | `mealMutations.createFromPhoto()` |
| `MealDeleted` | `{ mealId, mealType }` | `mealMutations.delete()` |
| `NutritionGoalSet` | `{ dailyCalories, dailyProtein?, dailyCarbs?, dailyFat? }` | `goalMutations.create/update()` |
| `DailyCalorieGoalReached` | `{ date, goal, actual }` | Projection erkennt Zielerreichung |

#### Places Events

| Event | Payload | Abgeleitet aus |
|-------|---------|----------------|
| `PlaceCreated` | `{ placeId, name, category?, lat, lng }` | `placesStore.createPlace()` |
| `PlaceVisited` | `{ placeId, name, visitCount }` | `placesStore.recordVisit()` |
| `LocationLogged` | `{ logId, lat, lng, placeId?, accuracy }` | `trackingStore.logNow()` |
| `TrackingStarted` | `{}` | `trackingStore.startTracking()` |
| `TrackingStopped` | `{ durationMs, logCount }` | `trackingStore.stopTracking()` |

### 3.5 Event-Emission aus Module Stores

Jeder Store bekommt `emit()`-Calls in seinen Mutations. Kein Umbau der Dexie-Hooks noetig — Events werden **im Store** emittiert, nicht im Hook.

**Warum im Store statt im Hook?** Der Hook sieht nur CRUD. Der Store kennt die Semantik. `completeTask()` weiss, dass es ein Completion ist — der Hook sieht nur `update({ completedAt })`.

**Beispiel: Todo Store nach Umbau:**

```typescript
// stores/tasks.svelte.ts
import { eventBus } from '$lib/data/events/event-bus';

export const tasksStore = {
  async completeTask(id: string) {
    const task = await taskTable.get(id);
    if (!task) return;
    const now = new Date().toISOString();
    const wasOverdue = task.dueDate && task.dueDate < now.slice(0, 10);
    
    await taskTable.update(id, { completedAt: now, updatedAt: now });
    
    eventBus.emit({
      type: 'TaskCompleted',
      payload: {
        taskId: id,
        title: task.title,       // plaintext snapshot (pre-encryption)
        projectId: task.projectId,
        wasOverdue,
      },
      meta: {
        id: crypto.randomUUID(),
        timestamp: now,
        appId: 'todo',
        collection: 'tasks',
        recordId: id,
        userId: getEffectiveUserId(),
      },
    });
  },
  // ... andere Mutations analog
};
```

**Konvention:** Jede Store-Mutation die einen Seiteneffekt hat, emittiert ein Event. Reine UI-State-Aenderungen (z.B. `calendarViewStore.setDate()`) emittieren nicht.

### 3.6 Event Helper fuer Module

Um Boilerplate zu reduzieren, ein `createEventEmitter` Helper:

**Neues File: `apps/mana/apps/web/src/lib/data/events/emit.ts`**

```typescript
import { eventBus } from './event-bus';
import { getEffectiveUserId } from '../current-user';

export function emitDomainEvent<P>(
  type: string,
  appId: string,
  collection: string,
  recordId: string,
  payload: P,
  causedBy?: string
): void {
  eventBus.emit({
    type,
    payload,
    meta: {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      appId,
      collection,
      recordId,
      userId: getEffectiveUserId(),
      causedBy,
    },
  });
}
```

Aufruf im Store wird dann einzeilig:

```typescript
emitDomainEvent('TaskCompleted', 'todo', 'tasks', id, {
  taskId: id, title: task.title, projectId: task.projectId, wasOverdue,
});
```

---

## 4. Projection Engine

### 4.1 Prinzip

Projections sind **live-reaktive Aggregationen** ueber Modul-Daten. Sie hoeren Domain Events und aktualisieren sich inkrementell. Consumers (Pulse, Companion, Dashboard) lesen Projections — nie Rohdaten.

**Neuer Ordner: `apps/mana/apps/web/src/lib/data/projections/`**

### 4.2 DaySnapshot

Beantwortet: "Was ist heute los?"

```typescript
// projections/day-snapshot.ts

export interface DaySnapshot {
  date: string;                       // YYYY-MM-DD
  
  // Todo
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    dueToday: TaskSummary[];
  };
  
  // Calendar
  events: {
    upcoming: EventSummary[];         // naechste 5 Events
    total: number;
    nextEvent?: EventSummary;
  };
  
  // Drink
  drinks: {
    water: { ml: number; goal: number; percent: number };
    coffee: { ml: number; count: number };
    other: { ml: number; count: number };
    total: { ml: number; count: number };
  };
  
  // Nutriphi
  nutrition: {
    meals: number;
    calories: { actual: number; goal: number; percent: number };
    protein?: { actual: number; goal: number };
  };
  
  // Places
  places: {
    visited: number;
    currentLocation?: { lat: number; lng: number; placeName?: string };
    tracking: boolean;
  };
}
```

**Implementierung:** Dexie liveQueries die auf `$derived` gemapped werden. Event-Listener fuer inkrementelle Updates (z.B. `DrinkLogged` addiert direkt statt neu zu querien).

### 4.3 Streaks

Beantwortet: "Was laeuft gut, was droht zu brechen?"

```typescript
// projections/streaks.ts

export interface StreakInfo {
  moduleId: string;
  label: string;                      // "Wasser-Ziel", "Journal", "Sport"
  currentStreak: number;              // Tage in Folge
  longestStreak: number;
  lastActiveDate: string;             // YYYY-MM-DD
  status: 'active' | 'at_risk' | 'broken';
  // active: heute oder gestern aktiv
  // at_risk: gestern nicht aktiv, vorgestern schon
  // broken: >1 Tag Pause
}
```

Berechnet aus: TimeBlocks + Modul-spezifische Logik (Drink: Tagesziel erreicht, Todo: mindestens 1 Task erledigt, etc.)

### 4.4 Correlations

Beantwortet: "Was haengt zusammen?"

```typescript
// projections/correlations.ts

export interface Correlation {
  id: string;
  factorA: { module: string; metric: string; label: string };
  factorB: { module: string; metric: string; label: string };
  coefficient: number;               // Pearson r, -1 bis +1
  pValue: number;                    // Statistische Signifikanz
  sampleSize: number;                // Anzahl Tage
  direction: 'positive' | 'negative';
  sentence: string;                  // "An Tagen mit Sport trinkst du 30% mehr Wasser"
  computedAt: string;
}
```

**Berechnung:** 1x taeglich, ueber TimeBlocks + Tagesaggregate der letzten 30-90 Tage. Pearson-Korrelation zwischen Paaren. Nur Korrelationen mit |r| > 0.3 und p < 0.05 werden gespeichert.

**Metriken pro Modul:**
- Todo: tasks_completed_count, overdue_count
- Calendar: events_count, meeting_hours
- Drink: water_ml, coffee_count, goal_reached (boolean)
- Nutriphi: calories, protein, meals_count
- Places: places_visited, distance_km

### 4.5 ContactHealth (spaeter, nicht in Pilot)

Wird mit dem Contacts-Modul relevant. Trackt Kontakthaeufigkeit vs. erwartete Frequenz.

---

## 5. Goal System

### 5.1 Datenmodell

**Neue Dexie-Tabelle: `goals`**
```
goals: 'id, moduleId, status, [moduleId+status]'
```

```typescript
export interface LocalGoal {
  id: string;
  title: string;                      // "4x Sport pro Woche"
  description?: string;
  
  // Metrik-Definition
  metric: GoalMetric;
  target: GoalTarget;
  
  // Verknuepfung
  moduleId: string;                   // primaeres Modul
  linkedModules: string[];            // weitere beteiligte Module
  
  // Status
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  
  // Tracking
  currentValue: number;               // live berechnet
  currentPeriodStart: string;         // Beginn der aktuellen Periode
  history: GoalPeriodResult[];        // vergangene Perioden
  
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface GoalMetric {
  source: 'event_count' | 'event_sum' | 'streak_days' | 'custom';
  eventType?: string;                 // Domain Event Type (z.B. 'DrinkLogged')
  filterField?: string;               // z.B. 'drinkType'
  filterValue?: string;               // z.B. 'water'
  sumField?: string;                  // z.B. 'quantityMl' (fuer event_sum)
}

export interface GoalTarget {
  value: number;                      // Zielwert
  period: 'day' | 'week' | 'month';
  comparison: 'gte' | 'lte' | 'eq';  // >= (Sport), <= (Kaffee), = (exakt)
}

export interface GoalPeriodResult {
  periodStart: string;
  periodEnd: string;
  value: number;
  reached: boolean;
}
```

### 5.2 Goal-Tracking via Events

Der Goal-Tracker subscribed auf den Event Bus und aktualisiert `currentValue` inkrementell:

```typescript
// Beispiel: Ziel "8 Glaeser Wasser/Tag"
// metric: { source: 'event_count', eventType: 'DrinkLogged', filterField: 'drinkType', filterValue: 'water' }
// target: { value: 8, period: 'day', comparison: 'gte' }

eventBus.on('DrinkLogged', (event) => {
  if (event.payload.drinkType === 'water') {
    goal.currentValue += 1;
    if (goal.currentValue >= goal.target.value) {
      emitDomainEvent('GoalReached', 'companion', 'goals', goal.id, {
        goalId: goal.id, title: goal.title, value: goal.currentValue,
      });
    }
  }
});
```

### 5.3 Vordefinierte Ziel-Templates

Fuer den Start 10-15 Templates die der Nutzer mit einem Tap aktiviert:

- 8 Glaeser Wasser/Tag (Drink, event_count, DrinkLogged, water)
- 2000 kcal/Tag (Nutriphi, event_sum, MealLogged, calories)
- 5 Tasks/Tag erledigen (Todo, event_count, TaskCompleted)
- Alle Mahlzeiten tracken (Nutriphi, event_count, MealLogged, 3/day)
- Jeden Tag einen neuen Ort besuchen (Places, event_count, PlaceVisited, 1/day)

---

## 6. Semantic Memory

### 6.1 Datenmodell

**Neue Dexie-Tabelle: `_memory`**
```
_memory: 'id, category, confidence, lastConfirmed, [category+confidence]'
```

```typescript
export interface MemoryFact {
  id: string;
  category: 'pattern' | 'preference' | 'relationship' | 'context';
  
  content: string;                    // Menschenlesbarer Fakt
  // "Trainiert typischerweise Mo/Mi/Fr abends"
  // "Trinkt morgens immer zuerst Kaffee, dann Wasser"
  // "Meetings haeufig Di/Do vormittags"
  
  confidence: number;                 // 0.0 - 1.0
  confirmations: number;             // wie oft bestaetigt
  contradictions: number;             // wie oft widersprochen
  
  sourceEvents: string[];             // Event-IDs die diesen Fakt stuetzen
  sourceModules: string[];            // beteiligte Module
  
  firstSeen: string;                  // wann erstmals erkannt
  lastConfirmed: string;              // letzte Bestaetigung
  expiresAt?: string;                 // fuer temporaere Kontexte
  
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

### 6.2 Extraktion

**Zwei Wege:**

1. **Regelbasiert (kein LLM):** Pattern-Detektoren ueber Event-Stream:
   - Wiederholungs-Detektor: "3x in 2 Wochen am Montag trainiert → Pattern: trainiert montags"
   - Zeitfenster-Detektor: "Tasks werden zu 80% zwischen 09-12 Uhr erledigt → Preference: Morgen-Produktivitaet"
   - Sequenz-Detektor: "Kaffee wird immer vor dem ersten Event geloggt → Pattern: Kaffee vor Meetings"

2. **LLM-basiert (Tier 1 browser):** Woechentlich zusammengefasste Events an lokales Gemma-Modell:
   - "Hier sind die Events der letzten Woche. Welche Muster und Praeferenzen erkennst du?"
   - Ergebnis als JSON parsen → MemoryFact[] schreiben

### 6.3 Confidence-Lifecycle

```
Neuer Fakt erkannt          → confidence: 0.3
Nochmal bestaetigt          → confidence: 0.5
3+ Bestaetigungen           → confidence: 0.7
10+ Bestaetigungen          → confidence: 0.9
Widerspruch erkannt         → confidence -= 0.15
Laenger als 30 Tage nicht   → confidence -= 0.05/Woche
  bestaetigt
confidence < 0.1            → Fakt wird geloescht
```

---

## 7. Context Document Generator

### 7.1 Zweck

Komprimiert den gesamten Nutzerzustand in ein ~500 Token Dokument, das als System-Prompt an das LLM geht. Aktualisiert sich bei jedem Companion-Aufruf.

### 7.2 Template

```typescript
// projections/context-document.ts

export function generateContextDocument(
  day: DaySnapshot,
  streaks: StreakInfo[],
  goals: LocalGoal[],
  memory: MemoryFact[],
  correlations: Correlation[]
): string {
  return `## Nutzer-Kontext (${day.date})

### Heute
- ${day.tasks.dueToday.length} Tasks faellig (${day.tasks.completed} erledigt, ${day.tasks.overdue} ueberfaellig)
- ${day.events.total} Termine${day.events.nextEvent ? ` — naechster: ${day.events.nextEvent.title} um ${day.events.nextEvent.startTime}` : ''}
- Wasser: ${day.drinks.water.ml}ml von ${day.drinks.water.goal}ml (${day.drinks.water.percent}%)
- Ernaehrung: ${day.nutrition.calories.actual} von ${day.nutrition.calories.goal} kcal, ${day.nutrition.meals} Mahlzeiten
${day.places.tracking ? `- Standort-Tracking aktiv` : ''}

### Ziele
${goals.filter(g => g.status === 'active').map(g =>
  `- "${g.title}" — ${g.currentValue}/${g.target.value} (${g.target.period})`
).join('\n')}

### Streaks
${streaks.filter(s => s.status !== 'broken').map(s =>
  `- ${s.label}: ${s.currentStreak} Tage${s.status === 'at_risk' ? ' (GEFAEHRDET)' : ''}`
).join('\n')}
${streaks.filter(s => s.status === 'broken').map(s =>
  `- ${s.label}: UNTERBROCHEN seit ${daysSince(s.lastActiveDate)} Tagen`
).join('\n')}

### Bekannte Muster
${memory.filter(m => m.confidence > 0.5).map(m => `- ${m.content}`).join('\n')}

### Korrelationen
${correlations.slice(0, 3).map(c => `- ${c.sentence}`).join('\n')}
`;
}
```

---

## 8. Tool Layer (LLM Write-Access)

### 8.1 ModuleTool Interface

**Neues File: `apps/mana/apps/web/src/lib/data/tools/types.ts`**

```typescript
export interface ModuleTool {
  name: string;                       // 'create_task', 'log_drink'
  module: string;                     // 'todo', 'drink'
  description: string;                // Fuer LLM Function-Schema
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  enum?: string[];                    // z.B. ['water', 'coffee', 'tea']
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  message?: string;                   // Menschenlesbare Bestaetigung
}
```

### 8.2 Tool-Definitionen (5 Pilot-Module)

**Jedes Modul bekommt eine `tools.ts`:**

```typescript
// modules/todo/tools.ts
export const todoTools: ModuleTool[] = [
  {
    name: 'create_task',
    module: 'todo',
    description: 'Erstellt einen neuen Task',
    parameters: [
      { name: 'title', type: 'string', description: 'Titel des Tasks', required: true },
      { name: 'dueDate', type: 'string', description: 'Faelligkeitsdatum (YYYY-MM-DD)', required: false },
      { name: 'priority', type: 'number', description: 'Prioritaet 0-3', required: false },
    ],
    execute: async (params) => {
      const task = await tasksStore.createTask({
        title: params.title as string,
        dueDate: params.dueDate as string | undefined,
        priority: params.priority as number | undefined,
      });
      return { success: true, data: task, message: `Task "${task.title}" erstellt` };
    },
  },
  {
    name: 'complete_task',
    module: 'todo',
    description: 'Markiert einen Task als erledigt',
    parameters: [
      { name: 'taskId', type: 'string', description: 'ID des Tasks', required: true },
    ],
    execute: async (params) => {
      await tasksStore.completeTask(params.taskId as string);
      return { success: true, message: 'Task erledigt' };
    },
  },
];

// modules/drink/tools.ts
export const drinkTools: ModuleTool[] = [
  {
    name: 'log_drink',
    module: 'drink',
    description: 'Loggt ein Getraenk',
    parameters: [
      { name: 'drinkType', type: 'string', description: 'Art', required: true, enum: ['water', 'coffee', 'tea', 'juice', 'alcohol', 'other'] },
      { name: 'quantityMl', type: 'number', description: 'Menge in ml', required: true },
      { name: 'name', type: 'string', description: 'Name des Getraenks', required: false },
    ],
    execute: async (params) => {
      const entry = await drinkStore.logDrink({
        name: (params.name as string) ?? (params.drinkType as string),
        drinkType: params.drinkType as DrinkType,
        quantityMl: params.quantityMl as number,
      });
      return { success: true, data: entry, message: `${params.quantityMl}ml ${params.drinkType} geloggt` };
    },
  },
];

// modules/calendar/tools.ts — create_event
// modules/nutriphi/tools.ts — log_meal
// modules/places/tools.ts — record_visit, create_place
```

### 8.3 Tool Registry

**Neues File: `apps/mana/apps/web/src/lib/data/tools/registry.ts`**

```typescript
import { todoTools } from '$lib/modules/todo/tools';
import { calendarTools } from '$lib/modules/calendar/tools';
import { drinkTools } from '$lib/modules/drink/tools';
import { nutriphiTools } from '$lib/modules/nutriphi/tools';
import { placesTools } from '$lib/modules/places/tools';

const ALL_TOOLS: ModuleTool[] = [
  ...todoTools,
  ...calendarTools,
  ...drinkTools,
  ...nutriphiTools,
  ...placesTools,
];

export function getTools(): ModuleTool[] {
  return ALL_TOOLS;
}

export function getTool(name: string): ModuleTool | undefined {
  return ALL_TOOLS.find((t) => t.name === name);
}

export function getToolsForLlm(): LlmFunctionSchema[] {
  return ALL_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        t.parameters.map((p) => [p.name, {
          type: p.type,
          description: p.description,
          ...(p.enum ? { enum: p.enum } : {}),
        }])
      ),
      required: t.parameters.filter((p) => p.required).map((p) => p.name),
    },
  }));
}
```

### 8.4 Integration mit LLM Orchestrator

Der bestehende `LlmOrchestrator` in `@mana/shared-llm` bekommt eine neue Methode:

```typescript
// In shared-llm/src/orchestrator.ts

async runWithTools<TOut>(
  task: LlmTask,
  input: { messages: ChatMessage[]; tools: LlmFunctionSchema[] },
): Promise<LlmTaskResult<TOut>>
```

Das LLM gibt `tool_use` Responses zurueck, die der Orchestrator ueber `getTool(name).execute(params)` ausfuehrt. Das Ergebnis wird als `tool_result` Message zurueckgefuettert.

---

## 9. Rule Engine (Pulse)

### 9.1 Prinzip

Die Rule Engine liest Projections und erzeugt Nudges. Kein LLM — rein deterministisch. Laeuft auf zwei Wegen:

1. **Event-getriggert:** Reagiert auf Domain Events (z.B. `TaskCompleted` → Streak-Check)
2. **Zeitgesteuert:** Periodische Checks (Morgen-Summary, Abend-Reflexion, stuendlich)

### 9.2 Rule Interface

**Neues File: `apps/mana/apps/web/src/lib/companion/rules/types.ts`**

```typescript
export interface PulseRule {
  id: string;
  name: string;
  description: string;
  
  // Trigger
  trigger:
    | { kind: 'event'; eventType: string }
    | { kind: 'schedule'; cron: string }     // z.B. '0 8 * * *' (08:00 taeglich)
    | { kind: 'interval'; minutes: number }; // z.B. 60 (stuendlich)
  
  // Check — gibt null zurueck wenn kein Nudge noetig
  check: (ctx: RuleContext) => Promise<Nudge | null>;
}

export interface RuleContext {
  day: DaySnapshot;
  streaks: StreakInfo[];
  goals: LocalGoal[];
  memory: MemoryFact[];
  now: Date;
}

export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;               // "Jetzt loggen"
  actionRoute?: string;               // '/drink'
  actionTool?: string;                // 'log_drink' — Companion kann direkt ausfuehren
  expiresAt?: string;                 // wann der Nudge irrelevant wird
}

type NudgeType =
  | 'streak_warning'
  | 'goal_progress'
  | 'goal_reached'
  | 'morning_summary'
  | 'evening_reflection'
  | 'overdue_tasks'
  | 'water_reminder'
  | 'meal_reminder'
  | 'correlation_insight';
```

### 9.3 Vordefinierte Rules (Pilot)

```typescript
// rules/water-reminder.ts
export const waterReminderRule: PulseRule = {
  id: 'water-reminder',
  name: 'Wasser-Erinnerung',
  trigger: { kind: 'interval', minutes: 90 },
  async check(ctx) {
    const { water } = ctx.day.drinks;
    if (water.percent >= 100) return null;  // Ziel erreicht
    const hourOfDay = ctx.now.getHours();
    if (hourOfDay < 8 || hourOfDay > 21) return null;  // Nachtruhe
    
    const remaining = water.goal - water.ml;
    const hoursLeft = 21 - hourOfDay;
    const mlPerHour = Math.ceil(remaining / hoursLeft);
    
    return {
      id: `water-${ctx.day.date}-${hourOfDay}`,
      type: 'water_reminder',
      title: 'Wasser trinken',
      body: `Noch ${remaining}ml bis zum Ziel. ~${mlPerHour}ml pro Stunde.`,
      priority: water.percent < 50 ? 'medium' : 'low',
      actionLabel: 'Glas loggen',
      actionTool: 'log_drink',
    };
  },
};

// rules/streak-warning.ts
export const streakWarningRule: PulseRule = {
  id: 'streak-warning',
  name: 'Streak-Warnung',
  trigger: { kind: 'schedule', cron: '0 18 * * *' },  // 18:00 taeglich
  async check(ctx) {
    const atRisk = ctx.streaks.filter(s => s.status === 'at_risk');
    if (atRisk.length === 0) return null;
    
    const best = atRisk.reduce((a, b) => a.currentStreak > b.currentStreak ? a : b);
    return {
      id: `streak-${ctx.day.date}`,
      type: 'streak_warning',
      title: `${best.label}-Streak in Gefahr!`,
      body: `${best.currentStreak} Tage — nicht heute brechen.`,
      priority: best.currentStreak > 7 ? 'high' : 'medium',
    };
  },
};

// rules/morning-summary.ts
// rules/evening-reflection.ts
// rules/overdue-tasks.ts
// rules/meal-reminder.ts
// rules/goal-reached.ts
```

### 9.4 Rule Engine Runner

Integriert sich in den bestehenden Reminder-Scheduler als zusaetzliche Source:

```typescript
// companion/rules/engine.ts

export function createRuleEngine(rules: PulseRule[]): ReminderSource {
  return {
    id: 'companion-pulse',
    async checkDue(): Promise<DueReminder[]> {
      const ctx = await buildRuleContext();
      const nudges: Nudge[] = [];
      
      for (const rule of rules) {
        if (shouldTrigger(rule)) {
          const nudge = await rule.check(ctx);
          if (nudge && !isDismissed(nudge.id)) {
            nudges.push(nudge);
          }
        }
      }
      
      return nudges.map(toReminder);
    },
    async markSent(id) { /* track in localStorage */ },
  };
}
```

---

## 10. Feedback Loop

### 10.1 Datenmodell

**Neue Dexie-Tabelle: `_nudgeOutcomes`**
```
_nudgeOutcomes: '++id, nudgeId, nudgeType, outcome, timestamp, [nudgeType+outcome]'
```

```typescript
export interface NudgeOutcome {
  id?: number;
  nudgeId: string;
  nudgeType: NudgeType;
  outcome: 'acted' | 'dismissed' | 'snoozed' | 'expired' | 'auto_resolved';
  latencyMs?: number;                 // Zeit bis Reaktion
  timestamp: string;
}
```

### 10.2 Lerneffekt

Aggregation ueber `_nudgeOutcomes` beeinflusst die Rule Engine:

```typescript
// Beispiel: Wasser-Reminder wird um 10:00 immer dismissed
// → confidence fuer "Nutzer mag morgens keine Wasser-Reminder" steigt
// → Rule Engine verschiebt auf 11:00

// Beispiel: Streak-Warning um 18:00 fuehrt zu 80% zu Aktion
// → confidence fuer "18:00 ist guter Zeitpunkt" steigt
// → bleibt bei 18:00
```

Memory-Facts werden aus Outcome-Patterns extrahiert und fliessen in den Context Document Generator.

---

## 11. Companion Chat (Interaction Layer)

### 11.1 Modul-Struktur

**Neues Modul: `apps/mana/apps/web/src/lib/modules/companion/`**

```
companion/
  module.config.ts          — Registriert companion-Tabellen
  collections.ts            — conversations, messages, rituals, goals
  stores/
    chat.svelte.ts          — Chat-Mutations (send, receive, tool-call)
    rituals.svelte.ts       — Ritual-CRUD + Step-Execution
    goals.svelte.ts         — Goal-CRUD + Progress-Tracking
  queries.ts                — Live-Queries fuer Chat, Rituals, Goals
  tools.ts                  — Companion-eigene Tools (read_context, get_insights)
  components/
    CompanionChat.svelte    — Chat-Interface mit Tool-Execution
    CompanionFeed.svelte    — Timeline von Nudges + Insights + Chat
    RitualRunner.svelte     — Step-by-Step Ritual-UI
    GoalCard.svelte         — Ziel-Fortschritts-Anzeige
```

### 11.2 Chat-Flow

```
User: "Wie laeuft mein Tag?"
    |
    v
CompanionChat → LLM Orchestrator
    |
    |  System Prompt = Context Document (~500 Tokens)
    |  + Tool Schemas (getToolsForLlm())
    |  + User Message
    |
    v
LLM (Gemma lokal ODER Gemini Cloud)
    |
    |  Response: "Du hast heute 3/7 Tasks erledigt und erst 400ml
    |  Wasser getrunken. Dein Kalender ist ab 15:00 frei — guter
    |  Zeitpunkt fuer die ueberfaelligen Tasks. Soll ich dich
    |  in 2 Stunden ans Wasser erinnern?"
    |
    |  tool_use: create_reminder(...)
    |
    v
Tool Execution → drinkStore / remindersStore
    |
    v
CompanionChat zeigt Antwort + Aktions-Bestaetigung
```

### 11.3 Ritual-Generierung

```
User: "Erstell mir eine Morgenroutine"
    |
    v
LLM + Context Document + Tool Schemas
    |
    |  LLM sieht: Nutzer hat Drink, Todo, Nutriphi, Calendar aktiv
    |  Memory: "Trinkt morgens zuerst Kaffee"
    |  Goals: "8 Glaeser Wasser/Tag"
    |
    v
Generiertes Ritual:
  1. Glas Wasser loggen (tool: log_drink, water, 250ml)
  2. Stimmung checken (free_text → journal)
  3. Tages-Tasks priorisieren (zeigt DaySnapshot.tasks.dueToday)
  4. Kalender-Ueberblick (zeigt DaySnapshot.events.upcoming)
  5. Fruehstueck loggen (tool: log_meal)
```

---

## 12. Neue Dateien & Ordnerstruktur

```
apps/mana/apps/web/src/lib/
  data/
    events/
      event-bus.ts              — EventBus Singleton
      event-store.ts            — Persistenz in _events Tabelle
      emit.ts                   — Helper fuer Module
      types.ts                  — DomainEvent, EventMeta Interfaces
      catalog.ts                — Alle Event-Type Definitionen (union type)
    projections/
      day-snapshot.ts           — DaySnapshot Aggregation
      streaks.ts                — Streak-Berechnung
      correlations.ts           — Statistische Korrelationen
      context-document.ts       — LLM-Prompt-Generator
    tools/
      types.ts                  — ModuleTool Interface
      registry.ts               — Tool-Sammlung + LLM-Schema-Generator
      executor.ts               — Tool-Ausfuehrung mit Validierung
  companion/
    rules/
      types.ts                  — PulseRule, Nudge, RuleContext
      engine.ts                 — Rule Runner (als ReminderSource)
      water-reminder.ts
      streak-warning.ts
      morning-summary.ts
      evening-reflection.ts
      overdue-tasks.ts
      meal-reminder.ts
      goal-check.ts
    feedback/
      types.ts                  — NudgeOutcome
      tracker.ts                — Outcome-Recording
      analyzer.ts               — Pattern-Extraktion aus Outcomes
  modules/
    companion/
      module.config.ts
      collections.ts
      stores/
        chat.svelte.ts
        rituals.svelte.ts
        goals.svelte.ts
      queries.ts
      tools.ts
      components/
        CompanionChat.svelte
        CompanionFeed.svelte
        RitualRunner.svelte
        GoalCard.svelte
    todo/
      tools.ts                  — NEU: Tool-Definitionen
      stores/tasks.svelte.ts    — ANPASSEN: emit() Calls
    calendar/
      tools.ts                  — NEU
      stores/events.svelte.ts   — ANPASSEN
    drink/
      tools.ts                  — NEU
      stores/drink.svelte.ts    — ANPASSEN
    nutriphi/
      tools.ts                  — NEU
      mutations.ts              — ANPASSEN
    places/
      tools.ts                  — NEU
      stores/places.svelte.ts   — ANPASSEN
      stores/tracking.svelte.ts — ANPASSEN
```

---

## 13. Neue Dexie-Tabellen

```typescript
// In database.ts, naechste Version:

// Event Store (ersetzt _activity langfristig)
_events: '++seq, type, [meta.appId+meta.timestamp], [meta.type+meta.timestamp], meta.recordId',

// Goals
goals: 'id, moduleId, status, [moduleId+status]',
goalHistory: '++id, goalId, periodStart',

// Semantic Memory
_memory: 'id, category, confidence, lastConfirmed, [category+confidence]',

// Feedback Loop
_nudgeOutcomes: '++id, nudgeId, nudgeType, outcome, timestamp, [nudgeType+outcome]',

// Companion Chat
companionConversations: 'id, createdAt',
companionMessages: 'id, conversationId, role, createdAt, [conversationId+createdAt]',

// Rituals
rituals: 'id, status, createdAt',
ritualSteps: 'id, ritualId, order, [ritualId+order]',
ritualLogs: '++id, ritualId, date, [ritualId+date]',
```

---

## 14. Implementierungs-Reihenfolge

### Phase 1: Event-Fundament (Woche 1-2)

1. `data/events/` — EventBus, EventStore, emit Helper, Type Catalog
2. Domain Events fuer 5 Pilot-Module definieren (catalog.ts)
3. Stores der 5 Module umbauen: `emit()` Calls einfuegen
4. Event Store Subscriber: `eventBus.onAny()` → `_events` Tabelle
5. Tests: Events werden korrekt emittiert und persistiert

**Ergebnis:** Semantischer Event-Stream fliesst, Dexie-Writes + Events parallel.

### Phase 2: Projections (Woche 2-3)

1. DaySnapshot Projection (live Dexie-Queries + Event-Listener)
2. Streaks Projection (basierend auf Events + TimeBlocks)
3. Context Document Generator (Template-basiert)
4. Dashboard-Widget: "Mein Tag" Karte mit DaySnapshot-Daten

**Ergebnis:** Zentraler Ueberblick ueber alle 5 Module, live-reaktiv.

### Phase 3: Goals + Pulse (Woche 3-4)

1. Goal Datenmodell + Store + Queries
2. Goal-Tracking via Event-Subscription
3. Goal-Templates (5 vordefinierte)
4. Rule Engine mit 5 initialen Rules
5. Integration in Reminder-Scheduler
6. Nudge-UI: Toast / Bottom-Sheet

**Ergebnis:** Nutzer setzt Ziele, bekommt proaktive Nudges.

### Phase 4: Tool Layer (Woche 4-5)

1. ModuleTool Interface + Registry
2. tools.ts fuer 5 Pilot-Module
3. Tool Executor mit Validierung
4. LLM Function Schema Generator
5. Integration in LLM Orchestrator (`runWithTools`)

**Ergebnis:** LLM kann Module lesen und beschreiben.

### Phase 5: Companion Chat (Woche 5-6)

1. Companion Modul (collections, stores, queries)
2. CompanionChat Svelte-Komponente
3. Chat-Flow: Context Document + Tools + LLM
4. CompanionFeed: Timeline von Nudges + Chat

**Ergebnis:** Nutzer kann mit dem System sprechen und Aktionen ausfuehren.

### Phase 6: Rituale (Woche 6-7)

1. Ritual Datenmodell (steps, logs)
2. RitualRunner Komponente
3. AI-Ritual-Generierung via Companion Chat
4. Vordefinierte Ritual-Templates (Morgen, Abend, Wasser)

**Ergebnis:** Gefuehrte Routinen die in Module schreiben.

### Phase 7: Memory + Correlations (Woche 7-8)

1. Semantic Memory Tabelle + Store
2. Regelbasierte Pattern-Extraktion
3. Correlation Engine ueber TimeBlocks
4. Memory + Correlations in Context Document
5. Feedback Loop (NudgeOutcome Tracking)
6. LLM-basierte Memory-Extraktion (optional, Tier 1)

**Ergebnis:** System lernt ueber Zeit, Insights werden praeziser.

### Phase 8: Rollout auf weitere Module (Woche 8+)

Pro Modul:
1. Domain Events definieren (catalog.ts erweitern)
2. Store Mutations mit emit() versehen
3. tools.ts schreiben
4. Projections erweitern (DaySnapshot Felder)
5. Goal-Templates hinzufuegen
6. Pulse Rules hinzufuegen

Geschaetzter Aufwand pro Modul: 1-2 Tage.

---

## 15. Abhaengigkeiten & Reihenfolge-Graph

```
Phase 1 (Events) ──────┬──> Phase 2 (Projections)
                        |         |
                        |         v
                        ├──> Phase 3 (Goals + Pulse)
                        |         |
                        v         v
                   Phase 4 (Tools) ──> Phase 5 (Companion Chat)
                                              |
                                              v
                                       Phase 6 (Rituale)
                                              |
                                              v
                                       Phase 7 (Memory)
                                              |
                                              v
                                       Phase 8 (Rollout)
```

Phase 1 ist Voraussetzung fuer alles. Phase 2-4 koennen teilweise parallel laufen.

---

## 16. Privacy-Garantien

| Daten | Verarbeitung | Speicherung |
|-------|-------------|-------------|
| Domain Events | Lokal (Browser) | IndexedDB, encrypted |
| Projections | Lokal (Browser) | In-Memory, nicht persistiert |
| Goals | Lokal + Sync | IndexedDB → mana-sync (encrypted) |
| Memory Facts | Lokal (Browser) | IndexedDB, encrypted |
| Context Document | Lokal (Browser) | In-Memory, nie persistiert |
| LLM Inference | Tier 1: Browser (Gemma) | Kein Server-Kontakt |
| | Tier 2: mana-llm (Ollama) | Context geht an eigenen Server |
| | Tier 3: Cloud (Gemini) | Nur mit explizitem Consent |
| Nudge Outcomes | Lokal (Browser) | IndexedDB, nicht synced |
| Tool Execution | Lokal (Browser) | Writes gehen in Module-Tabellen |

**Invariante:** Sensitive Daten (Journal, Dreams, Finance, Nutriphi) werden **nie** an Tier 2/3 gesendet — erzwungen durch `contentClass: 'sensitive'` im LLM Orchestrator.

---

## 17. Migration: _activity → _events

Die `_activity`-Tabelle bleibt vorerst bestehen (Sync-Debugging). Langfristig:

1. Phase 1-2: `_events` wird parallel zu `_activity` befuellt
2. Phase 7: Alle Consumers (Activity-Page, Debug-Tools) auf `_events` umstellen
3. Danach: `_activity`-Befuellung aus Hooks entfernen, Tabelle als deprecated markieren
4. Naechste Major-Version: Tabelle loeschen

---

## 18. Testing-Strategie

### Unit Tests
- Event Bus: emit/subscribe/unsubscribe, ordering, no re-entrant loops
- Projections: DaySnapshot korrekt aus Mock-Daten, Streak-Berechnung
- Rules: Nudge-Generierung unter verschiedenen Bedingungen
- Tools: Parameter-Validierung, Execute-Flow
- Correlations: Pearson-Berechnung, Signifikanz-Filter

### Integration Tests
- Store emit() → EventBus → EventStore → Projection Update
- Rule Engine → Nudge → UI → Outcome → Memory Update
- Companion Chat → LLM Mock → Tool Call → Store Mutation → Event

### E2E Tests
- Morgenroutine-Ritual durchspielen: 5 Steps → Daten in 3 Modulen
- Wasser-Ziel erreichen: 8x log_drink → GoalReached Event → Nudge
- Companion-Frage: "Wie war meine Woche?" → Context Document → Antwort
