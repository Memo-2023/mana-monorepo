# Modul-Planung: Dehnen / Stretch

> **Ursprünglicher Prompt:** "Wir wollen ein neues Modul bauen 'dehnen' — wo es darum geht, dass der Nutzer durch verschiedene Dehnroutinen geführt wird, um flexibel zu bleiben. Feature-Ideen: Bestandsaufnahme am Anfang (gewisse Dinge vom Nutzer überprüfen: kannst du deine Zehen erreichen, tut dir ein Körperteil weh etc.), Reminder zu gewissen Uhrzeiten um zu dehnen (kurze Mini-Sessions)."

---

## 1. Namensvorschläge

### Favoriten

| Englisch | Deutsch | `appId` | Anmerkung |
|----------|---------|---------|-----------|
| **Stretch** | **Dehnen** | `stretch` | Klar, direkt, passt zum Mana-Stil (kurze Namen) |
| **Flex** | **Flex** | `flex` | Modern, universell verständlich, aber CSS-Kollision im Kopf |
| **Limber** | **Geschmeidig** | `limber` | Englisch schön, deutsch etwas lang |

### Weitere Optionen

| Englisch | Deutsch | Anmerkung |
|----------|---------|-----------|
| Mobility | Mobilität | Breiter, deckt auch Faszienrollen etc. ab |
| Supple | Gelenkig | Etwas ungewöhnlich |
| Unwind | Entfalten | Doppeldeutung: entspannen + entfalten |
| Flow | Fluss | Schon sehr besetzt (Yoga-Flow etc.), und wir haben "flow" im Mana-Kontext |
| Loosen | Lockern | Einfach, aber wenig sexy |

**Empfehlung:** `stretch` / `Dehnen` — kürzester Name, sofort verständlich, kein Namespace-Konflikt.

---

## 2. Feature-Übersicht

### 2.1 Bestandsaufnahme (Mobility Assessment)

Der Nutzer durchläuft bei erstem Start (und danach periodisch) eine geführte Selbstbewertung seiner Beweglichkeit.

**Tests (je Körperregion):**

| Test | Was wird geprüft | Bewertung |
|------|------------------|-----------|
| Zehenberührung (stehend) | Hintere Kette, unterer Rücken | Abstand Finger–Boden (cm) oder Ja/Nein |
| Tiefe Hocke (Squat) | Hüfte, Sprunggelenk | Fersen am Boden? Rücken gerade? |
| Schulterreichweite hinten | Schulter-Innenrotation | Hände hinter dem Rücken — berühren sie sich? |
| Nacken-Rotation | HWS-Beweglichkeit | Kann das Kinn die Schulter erreichen? |
| Hüftbeuger (Thomas-Test) | Hüftflexoren | Oberschenkel bleibt auf der Liege? |
| Schmerzabfrage | Akute Einschränkungen | "Tut dir gerade etwas weh?" → Körperregion markieren |

**Ergebnis:**
- Flexibilitäts-Score pro Körperregion (1–5 Sterne oder Ampel rot/gelb/grün)
- Automatische Routine-Empfehlung basierend auf Schwachstellen
- Historischer Verlauf: Assessment alle 2–4 Wochen wiederholen → Fortschritt sichtbar

**UX-Flow:**
1. Willkommens-Screen: "Lass uns herausfinden, wo du stehst"
2. Pro Test: Illustration/Animation + kurze Anleitung → Selbstbewertung (Slider oder Auswahl)
3. Schmerzabfrage mit Körper-Silhouette (tap on body region)
4. Ergebnis-Dashboard mit Empfehlung

### 2.2 Geführte Dehnroutinen (Guided Routines)

Kern des Moduls: Timer-geführte Dehnsequenzen.

**Routine-Typen:**
- **Morgenroutine** (5–10 Min) — sanftes Aufwachen, Durchblutung
- **Schreibtisch-Pause** (3–5 Min) — Nacken, Schultern, Handgelenke, Hüftbeuger
- **Post-Workout** (10–15 Min) — passend zu Muskelgruppen (Integration mit Body-Modul)
- **Abendroutine** (10 Min) — Entspannung, unterer Rücken, Hüften
- **Fokus-Routinen** — einzelne Körperregion (Nacken, unterer Rücken, Hüften, Schultern, Beine)
- **Custom-Routinen** — Nutzer stellt eigene Abfolge zusammen

**Session-Player:**
- Übung → Dauer (z.B. 30s) → Seitenwechsel-Hinweis → nächste Übung
- Visuell: Illustration oder kurze Beschreibung der Position
- Audio: optionaler Countdown-Ton, Sprachansage ("Seitenwechsel")
- Pause/Skip-Buttons
- Fortschrittsbalken (aktuelle Übung / Gesamt)

### 2.3 Stretch Reminders

Konfigurierbare Erinnerungen für Mini-Sessions.

**Optionen:**
- Feste Uhrzeiten (z.B. 9:00, 13:00, 17:00)
- Intervall-basiert (alle X Stunden)
- Tagesbasiert (Mo–Fr, jeden Tag, custom)
- Reminder enthält: vorgeschlagene Mini-Routine (2–3 Min), One-Tap-Start

**Integration:**
- Nutzt `mana-notify` Service für Push-Benachrichtigungen
- Reminder-Konfiguration in `timeBlocks`-Tabelle (wie Habits)
- Deeplink in der Notification → öffnet direkt den Session-Player

### 2.4 Weitere Feature-Vorschläge

#### A. Übungsbibliothek (Exercise Library)
- Katalog aller Dehnübungen mit:
  - Name (DE + EN)
  - Zielmuskulatur / Körperregion
  - Schwierigkeitsgrad (Anfänger / Mittel / Fortgeschritten)
  - Illustration oder Beschreibung
  - Varianten (z.B. mit Band, an der Wand)
  - Dauer-Empfehlung
- Seed-Daten: 30–50 Standardübungen vorinstalliert
- Nutzer kann eigene Übungen hinzufügen

#### B. Streak & Statistiken
- Tagesstreak: wie viele Tage am Stück gedehnt
- Wochenübersicht: Minuten pro Tag (Balkendiagramm)
- Monatsübersicht: Kalender-Heatmap (wie GitHub Contributions)
- Körperregion-Balance: "Du dehnst oft Beine, aber selten Schultern"
- Assessment-Fortschritt über Zeit

#### C. Schmerz-Tagebuch (Pain Journal)
- Schnelles Logging: Wo tut es weh? Wie stark (1–10)?
- Korrelation mit Dehnroutinen: "Nach regelmäßigem Nacken-Dehnen: Schmerzlevel gesunken"
- Anbindung an Assessment: Schmerzregionen beeinflussen Routine-Empfehlung

#### D. Body-Modul Integration
- Nach einem Workout im Body-Modul: "Passende Dehnroutine starten?"
- Muskelgruppen-Mapping: Brust-Training → Brust-Dehnungen vorschlagen
- Gemeinsame Übungsbibliothek (Referenzen, nicht Duplikate)

#### E. Aufwärm-Modus (Warm-Up)
- Dynamische Dehnungen vor dem Sport (im Gegensatz zu statischen Dehnungen)
- Sportart-spezifisch: Laufen, Klettern, Krafttraining, Radfahren
- Kürzere Timer (10–15s pro Übung statt 30s)

#### F. Atemübungen (Breathing)
- Integration von Atemtechniken in Routinen
- Box Breathing, 4-7-8, Wim Hof
- Eigenständig oder als Teil einer Dehnroutine (Anfang/Ende)

#### G. Fortgeschrittene Ziele
- "In 30 Tagen zum Spagat" — strukturierter Plan
- Wöchentliche Progression (längere Haltezeiten, tiefere Positionen)
- Milestone-Tracking mit Fotos (optional)

---

## 3. Vorschlag-Varianten (Scope)

### Variante A: Minimal Viable Module (MVP)

**Zeitrahmen:** ~1 Woche

| Feature | Details |
|---------|---------|
| Übungsbibliothek | 30 Seed-Übungen, custom Übungen erstellen |
| 5 vordefinierte Routinen | Morgen, Schreibtisch, Abend, Oberkörper, Unterkörper |
| Session-Player | Timer, Seitenwechsel, Skip, Pause |
| Session-Log | Welche Routine, wann, Dauer → Streak-Tracking |
| Einfache Statistiken | Streak-Counter, Sessions diese Woche |

**Kein:** Assessment, Reminder, Schmerz-Tagebuch, Body-Integration

### Variante B: Empfohlener Umfang

**Zeitrahmen:** ~2 Wochen

Alles aus A, plus:

| Feature | Details |
|---------|---------|
| Bestandsaufnahme | 6 Tests, Flexibilitäts-Score, Routine-Empfehlung |
| Stretch Reminders | Feste Uhrzeiten, Tage-Auswahl, Quick-Start aus Notification |
| Custom Routinen | Übungen per Drag & Drop zusammenstellen |
| Streak + Heatmap | Kalender-Ansicht, Minuten pro Tag |
| Körperregion-Balance | "Du vernachlässigst X" |

### Variante C: Vollausbau

Alles aus B, plus:

| Feature | Details |
|---------|---------|
| Schmerz-Tagebuch | Logging + Korrelation mit Routinen |
| Body-Integration | Post-Workout Routine-Vorschläge |
| Aufwärm-Modus | Dynamische Dehnungen, Sportart-spezifisch |
| Atemübungen | Box Breathing, 4-7-8 als Routine-Bestandteil |
| Fortgeschrittene Ziele | 30-Tage-Pläne mit Progression |
| Fotos | Vorher/Nachher-Vergleich für Flexibilität |

---

## 4. Datenmodell (Variante B)

### Tabellen

```typescript
// Dehnübung (Bibliothek)
interface LocalStretchExercise extends BaseRecord {
  name: string;              // encrypted
  description: string;       // encrypted
  bodyRegion: BodyRegion;    // plaintext (enum, index)
  difficulty: Difficulty;    // plaintext (enum)
  defaultDurationSec: number;
  bilateral: boolean;        // links/rechts separat?
  tags: string[];
  isCustom: boolean;         // Seed vs. user-created
  imageUrl: string | null;
  order: number;
}

// Routine (Vorlage)
interface LocalStretchRoutine extends BaseRecord {
  name: string;              // encrypted
  description: string;       // encrypted
  routineType: RoutineType;  // plaintext (enum, index)
  targetBodyRegions: BodyRegion[];
  exercises: RoutineExercise[]; // encrypted (ordered list with durations)
  estimatedDurationMin: number;
  isCustom: boolean;
  isPinned: boolean;
  order: number;
}

// Einzelne Übung in einer Routine
interface RoutineExercise {
  exerciseId: string;
  durationSec: number;
  restAfterSec: number;
  notes: string;
}

// Abgeschlossene Session (Log)
interface LocalStretchSession extends BaseRecord {
  routineId: string | null;  // null = freie Session
  routineName: string;       // encrypted (Snapshot, falls Routine gelöscht)
  startedAt: string;
  endedAt: string | null;
  totalDurationSec: number;
  completedExercises: number;
  totalExercises: number;
  skippedExerciseIds: string[];
  mood: number | null;       // 1-5 nach Session
  notes: string;             // encrypted
}

// Bestandsaufnahme
interface LocalStretchAssessment extends BaseRecord {
  assessedAt: string;
  tests: AssessmentTest[];   // encrypted
  overallScore: number;      // plaintext (1-100, für Trend)
  painRegions: PainRegion[]; // encrypted
  notes: string;             // encrypted
}

interface AssessmentTest {
  testId: string;            // z.B. 'toe-touch', 'deep-squat'
  bodyRegion: BodyRegion;
  score: number;             // 1-5
  notes: string;
}

interface PainRegion {
  region: BodyRegion;
  intensity: number;         // 1-10
  description: string;
}

// Reminder-Konfiguration
interface LocalStretchReminder extends BaseRecord {
  name: string;              // encrypted
  routineId: string | null;  // welche Routine vorschlagen
  time: string;              // HH:mm
  days: number[];            // 0-6 (So-Sa)
  isActive: boolean;
  lastTriggeredAt: string | null;
}

// Enums
type BodyRegion = 'neck' | 'shoulders' | 'upper_back' | 'lower_back' 
  | 'chest' | 'arms' | 'wrists' | 'hips' | 'quads' | 'hamstrings' 
  | 'calves' | 'ankles' | 'full_body';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type RoutineType = 'morning' | 'desk_break' | 'post_workout' | 'evening' 
  | 'focus_region' | 'warm_up' | 'custom';
```

### Encryption Registry

```typescript
// In crypto/registry.ts
stretchExercises: { enabled: true, fields: ['name', 'description'] },
stretchRoutines: { enabled: true, fields: ['name', 'description', 'exercises'] },
stretchSessions: { enabled: true, fields: ['routineName', 'notes'] },
stretchAssessments: { enabled: true, fields: ['tests', 'painRegions', 'notes'] },
stretchReminders: { enabled: true, fields: ['name'] },
```

### Module Config

```typescript
export const stretchModuleConfig: ModuleConfig = {
  appId: 'stretch',
  tables: [
    { name: 'stretchExercises' },
    { name: 'stretchRoutines' },
    { name: 'stretchSessions' },
    { name: 'stretchAssessments' },
    { name: 'stretchReminders' },
  ],
};
```

---

## 5. UI-Konzept

### Navigation / Seiten

```
/stretch                    → Dashboard (heute, Streak, Quick-Start)
/stretch/routines           → Alle Routinen (vordefiniert + custom)
/stretch/routines/[id]      → Routine-Detail (Übungsliste, Start-Button)
/stretch/routines/[id]/play → Session-Player (Fullscreen-Timer)
/stretch/exercises          → Übungsbibliothek
/stretch/exercises/[id]     → Übungs-Detail
/stretch/assessment         → Bestandsaufnahme starten/Historie
/stretch/history            → Session-Historie + Statistiken
/stretch/settings           → Reminder-Konfiguration
```

### Dashboard (`/stretch`)

```
┌─────────────────────────────────────────┐
│  🔥 12 Tage Streak                     │
│  Diese Woche: 45 Min (5/7 Tage)        │
├─────────────────────────────────────────┤
│  Schnellstart                           │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Morgen│ │Schreib│ │Abend │           │
│  │ 5min │ │tisch │ │10min │           │
│  │  ▶   │ │ 3min │ │  ▶   │           │
│  └──────┘ │  ▶   │ └──────┘           │
│           └──────┘                      │
├─────────────────────────────────────────┤
│  Empfohlen für dich                     │
│  "Dein letztes Assessment zeigt:        │
│   Hüften & unterer Rücken verbessern"   │
│  → Hüft-Routine starten (8 Min)        │
├─────────────────────────────────────────┤
│  Letzte Sessions                        │
│  Heute 09:15 — Morgenroutine (5 Min) ✓ │
│  Gestern 17:00 — Schreibtisch (3 Min) ✓│
│  Gestern 07:30 — Morgenroutine (5 Min) ✓│
└─────────────────────────────────────────┘
```

### Session-Player (`/stretch/routines/[id]/play`)

```
┌─────────────────────────────────────────┐
│                                    ✕    │
│         Katze-Kuh (Cat-Cow)             │
│                                         │
│        ┌───────────────────┐            │
│        │                   │            │
│        │   [Illustration]  │            │
│        │                   │            │
│        └───────────────────┘            │
│                                         │
│     Auf allen Vieren. Beim Einatmen     │
│     Rücken durchhängen lassen,          │
│     beim Ausatmen Rücken runden.        │
│                                         │
│              00:24                       │
│         ████████░░░░ 30s                │
│                                         │
│     ◀ Zurück    ⏸ Pause    Weiter ▶    │
│                                         │
│         Übung 3 von 8                   │
│     ░░░░████░░░░░░░░░░░░               │
└─────────────────────────────────────────┘
```

### Assessment-Flow

```
┌─────────────────────────────────────────┐
│  Bestandsaufnahme         Schritt 1/7   │
│  ━━━░░░░░░░░░░░░░                       │
│                                         │
│  Zehenberührung                         │
│                                         │
│  Stehe aufrecht, Beine gestreckt.       │
│  Beuge dich langsam nach vorne.         │
│  Wie weit kommst du?                    │
│                                         │
│  ┌───────────────────┐                  │
│  │   [Illustration]  │                  │
│  └───────────────────┘                  │
│                                         │
│  ○ Hände flach auf dem Boden            │
│  ○ Fingerspitzen berühren Boden         │
│  ○ Fingerspitzen erreichen Zehen        │
│  ○ Hände erreichen Schienbein           │
│  ○ Hände erreichen nur Knie             │
│                                         │
│              [ Weiter → ]               │
└─────────────────────────────────────────┘
```

---

## 6. Seed-Daten (Beispiel-Übungen)

Vordefinierte Übungen (Auszug der 30 für MVP):

| Name | Region | Dauer | Bilateral | Schwierigkeit |
|------|--------|-------|-----------|---------------|
| Nacken seitlich neigen | neck | 30s | ja | beginner |
| Nacken-Rotation | neck | 20s | ja | beginner |
| Schulter-Dehnung quer | shoulders | 30s | ja | beginner |
| Trizeps-Dehnung oben | arms | 30s | ja | beginner |
| Brustöffner an der Wand | chest | 30s | ja | beginner |
| Katze-Kuh (Cat-Cow) | upper_back | 30s | nein | beginner |
| Kindshaltung (Child's Pose) | lower_back | 45s | nein | beginner |
| Kobra (Cobra) | lower_back | 30s | nein | beginner |
| Hüftbeuger-Stretch (Ausfallschritt) | hips | 30s | ja | beginner |
| Tauben-Haltung (Pigeon Pose) | hips | 45s | ja | intermediate |
| Schmetterling (Butterfly) | hips | 30s | nein | beginner |
| Stehende Vorbeuge | hamstrings | 30s | nein | beginner |
| Quadrizeps-Dehnung stehend | quads | 30s | ja | beginner |
| Wadenstretch an der Wand | calves | 30s | ja | beginner |
| Handgelenk-Kreise | wrists | 20s | nein | beginner |

Vordefinierte Routinen:

| Routine | Typ | Übungen | Dauer |
|---------|-----|---------|-------|
| Guten Morgen | morning | 6 Übungen | ~5 Min |
| Schreibtisch-Pause | desk_break | 5 Übungen | ~3 Min |
| Feierabend-Flow | evening | 8 Übungen | ~10 Min |
| Oberkörper-Löser | focus_region | 6 Übungen | ~7 Min |
| Unterkörper-Öffner | focus_region | 6 Übungen | ~8 Min |

---

## 7. App-Registrierung

```typescript
// In packages/shared-branding/src/mana-apps.ts
{
  id: 'stretch',
  name: 'Stretch',
  nameDe: 'Dehnen',
  description: 'Guided Stretching — Stay flexible with mobility assessments, guided routines, streak tracking, and stretch reminders throughout your day',
  descriptionDe: 'Geführtes Dehnen — Bleib flexibel mit Beweglichkeits-Checks, geführten Routinen, Streak-Tracking und Dehn-Erinnerungen über den Tag',
  icon: APP_ICONS.stretch,  // Neues Icon nötig
  color: '#10b981',         // Emerald/Grün — Gesundheit, Natur
  status: 'development',
  requiredTier: 'guest',
  category: 'health',
}
```

---

## 8. Technische Besonderheiten

### Session-Player Timer
- Braucht einen robusten Timer der auch bei Tab-Wechsel weiterläuft
- `requestAnimationFrame` + `Performance.now()` statt `setInterval`
- Optional: Wake Lock API (`navigator.wakeLock`) damit der Bildschirm nicht ausgeht
- Audio: Web Audio API für Countdown-Töne (kein `<audio>` Element nötig)

### Reminder-System
- Reminder-Config in IndexedDB (synced)
- Tatsächliche Notification über `mana-notify` Service oder Service Worker Push
- Fallback: In-App Banner wenn die App offen ist
- Integration mit Habits-Modul `timeBlocks` für Kalender-Sichtbarkeit

### Offline-First
- Alle Routinen und Übungen lokal in IndexedDB → funktioniert komplett offline
- Session-Player braucht keine Netzwerkverbindung
- Sync passiert im Hintergrund wenn wieder online

### Body-Modul Integration (Variante C)
- Shared `BodyRegion` Enum in `@mana/shared-types`
- Cross-Modul Link via `manaLinks` Tabelle: Workout → suggested Stretch Routine
- Keine direkte Modul-Abhängigkeit, nur über Links/Events

---

## 9. Priorisierte Implementierungsreihenfolge

1. **Übungsbibliothek** — Types, Collections, Seed-Daten, CRUD
2. **Routinen-Verwaltung** — Vordefinierte + Custom Routinen
3. **Session-Player** — Timer-Engine, UI, Session-Logging
4. **Dashboard** — Streak, Quick-Start, letzte Sessions
5. **Statistiken** — Kalender-Heatmap, Minuten-Tracking
6. **Assessment** — Wizard-Flow, Scoring, Empfehlungen
7. **Reminders** — Konfiguration, timeBlocks-Integration, Notifications
8. **Body-Integration** — Cross-Modul Vorschläge (optional)
