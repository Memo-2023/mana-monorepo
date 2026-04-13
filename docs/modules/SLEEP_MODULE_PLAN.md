# Modul-Planung: Sleep / Schlaf

> **Kontext:** Neues Health-Modul im Mana-Ökosystem. Schlaf ist der #1 Health-Multiplier — beeinflusst Training, Stimmung, Kognition. Starke Synergien mit Body (DailyCheck), Dreams, Drink (Koffein), Stretch (Abendroutine), Meditate.

---

## 1. Namensvorschläge

| Englisch | Deutsch | `appId` | Anmerkung |
|----------|---------|---------|-----------|
| **Sleep** | **Schlaf** | `sleep` | Klar, kurz, kein Konflikt |
| Slumber | Schlummer | `slumber` | Poetisch, aber etwas lang |
| Rest | Ruhe | `rest` | Doppeldeutig (REST API) |
| Nite | Nacht | `nite` | Modern, aber unklar |

**Empfehlung:** `sleep` / `Schlaf`

---

## 2. Feature-Übersicht

### 2.1 Schlaf-Logging

Kern des Moduls: tägliches Erfassen von Schlafzeiten und -qualität.

**Erfassung:**
- **Einschlafzeit** (Bedtime) — wann ins Bett gegangen
- **Aufwachzeit** (Wake time) — wann aufgestanden
- **Schlafdauer** — automatisch berechnet
- **Einschlafdauer** — wie lange zum Einschlafen gebraucht (optional)
- **Unterbrechungen** — Anzahl und Gesamtdauer nächtlicher Aufwacher
- **Schlafqualität** — 1–5 Sterne Gesamtbewertung

**Quick-Log UX:**
- Morgens: "Wie hast du geschlafen?" → Aufwachzeit (default: jetzt), Einschlafzeit (gestern), Qualität
- 3-Tap-Minimum: Einschlafzeit → Aufwachzeit → Qualität → Fertig
- Smart Defaults: letzte Woche Durchschnitt als Vorschlag

### 2.2 Schlafziel & Fortschritt

- Tägliches Schlafziel konfigurierbar (Default: 8h)
- Tagesanzeige: "7h 23min von 8h" mit Fortschrittsbalken
- Wochenziel: "Diese Woche: 52h von 56h"
- Konsistenz-Score: wie regelmäßig sind Ein-/Aufschlafzeiten?

### 2.3 Schlafhygiene-Checkliste

Abendliche Checkliste für besseren Schlaf:

| Check | Kategorie |
|-------|-----------|
| Kein Koffein nach 14:00 | Ernährung |
| Kein Alkohol 3h vor Schlaf | Ernährung |
| Bildschirme aus 1h vor Schlaf | Digital |
| Schlafzimmer kühl (16–18°C) | Umgebung |
| Schlafzimmer dunkel | Umgebung |
| Keine schwere Mahlzeit 2h vor Schlaf | Ernährung |
| Entspannungsroutine gemacht | Routine |
| Gleiche Schlafenszeit ±30min | Konsistenz |

- Nutzer kann Checks an/aus schalten und eigene hinzufügen
- Tägliche Abfrage (optional, abends via Reminder)
- Korrelation: Checklisten-Score vs. Schlafqualität über Zeit

### 2.4 Statistiken & Trends

- **Wochen-Übersicht:** Balkendiagramm Schlafdauer pro Nacht
- **Schlafenszeit-Trend:** Linie wann eingeschlafen/aufgewacht (Konsistenz sichtbar)
- **Qualitäts-Heatmap:** 30-Tage Kalender farbcodiert (rot → grün)
- **Durchschnitte:** Ø Schlafdauer, Ø Qualität, Ø Einschlafzeit letzte 7/30 Tage
- **Schlechteste/Beste Nacht:** Highlights der letzten 30 Tage
- **Schlafschuld:** Kumuliertes Defizit (Ziel − tatsächlich) über die Woche

### 2.5 Schlaf-Reminder

- **Schlafenszeit-Erinnerung:** "In 30 Min ist Schlafenszeit" (konfigurierbarer Vorlauf)
- **Wind-Down Routine:** Optional: Stretch-Abendroutine oder Meditate-Session vorschlagen
- **Morgen-Log Reminder:** "Wie hast du geschlafen?" (wenn morgens nicht geloggt)

### 2.6 Cross-Modul Synergien

| Modul | Integration |
|-------|-------------|
| **Body** | `bodyChecks.sleep` (1–5) wird durch Sleep-Qualitätswert ersetzt/gespiegelt. Korrelation: Schlafdauer vs. Trainingsleistung |
| **Dreams** | "Traum gehabt?" Button im Morgen-Log → öffnet Dreams-Modul mit verknüpfter Nacht |
| **Drink** | Koffein-Warnung: "Du hattest um 16:30 einen Kaffee — das kann den Schlaf beeinflussen" |
| **Stretch** | Abendroutine als Wind-Down vorschlagen wenn Schlafenszeit naht |
| **Meditate** | Einschlaf-Meditation vorschlagen |
| **Mood** (zukünftig) | Korrelation Stimmung ↔ Schlafqualität |
| **Habits** | "Kein Bildschirm ab 22:00" als Habit tracken, in Schlafhygiene-Score einfließen |

---

## 3. Datenmodell

### Tabellen

```typescript
// Schlaf-Eintrag (eine Nacht)
interface LocalSleepEntry extends BaseRecord {
  /** YYYY-MM-DD der Nacht (= Datum des Einschlafens) */
  date: string;
  /** ISO datetime — wann ins Bett */
  bedtime: string;
  /** ISO datetime — wann aufgewacht */
  wakeTime: string;
  /** Berechnete Schlafdauer in Minuten */
  durationMin: number;
  /** Minuten zum Einschlafen (optional) */
  sleepLatencyMin: number | null;
  /** Anzahl nächtlicher Aufwacher */
  interruptions: number;
  /** Gesamtdauer der Unterbrechungen in Minuten */
  interruptionDurationMin: number;
  /** Schlafqualität 1–5 */
  quality: number;
  /** Aufgewacht ausgeruht? 1–5 */
  restedness: number | null;
  /** Freitext-Notizen */
  notes: string;
  /** Tags (z.B. "Alptraum", "Jetlag", "Medikament") */
  tags: string[];
  /** Verknüpfung zu Dreams-Modul */
  dreamIds: string[];
}

// Schlafhygiene-Check (abendlich, optional)
interface LocalSleepHygieneLog extends BaseRecord {
  /** YYYY-MM-DD */
  date: string;
  /** IDs der erfüllten Checks */
  completedCheckIds: string[];
  /** Score 0–100 (% der aktiven Checks erfüllt) */
  score: number;
}

// Schlafhygiene-Check Definition (konfigurierbar)
interface LocalSleepHygieneCheck extends BaseRecord {
  name: string;
  description: string;
  category: HygieneCategory;
  isActive: boolean;
  isPreset: boolean;
  order: number;
}

// Schlaf-Einstellungen (Singleton)
interface LocalSleepSettings extends BaseRecord {
  /** Schlafziel in Minuten (Default: 480 = 8h) */
  goalMin: number;
  /** Ziel-Einschlafzeit HH:mm */
  targetBedtime: string;
  /** Ziel-Aufwachzeit HH:mm */
  targetWakeTime: string;
  /** Reminder: Minuten vor Schlafenszeit (0 = aus) */
  bedtimeReminderMin: number;
  /** Morgen-Log Reminder aktiv */
  morningReminderEnabled: boolean;
  /** Morgen-Log Reminder Zeit HH:mm */
  morningReminderTime: string;
}

// Enums
type HygieneCategory = 'nutrition' | 'digital' | 'environment' | 'routine' | 'consistency' | 'custom';
```

### Encryption Registry

```typescript
sleepEntries: { enabled: true, fields: ['notes'] },
sleepHygieneLogs: { enabled: false, fields: [] },
sleepHygieneChecks: { enabled: true, fields: ['name', 'description'] },
sleepSettings: { enabled: false, fields: [] },
```

### Module Config

```typescript
export const sleepModuleConfig: ModuleConfig = {
  appId: 'sleep',
  tables: [
    { name: 'sleepEntries' },
    { name: 'sleepHygieneLogs' },
    { name: 'sleepHygieneChecks' },
    { name: 'sleepSettings' },
  ],
};
```

---

## 4. UI-Konzept

### Dashboard (`/sleep`)

```
┌─────────────────────────────────────────┐
│  Letzte Nacht                           │
│  ┌─────────────────────────────────┐    │
│  │ 23:15 ━━━━━━━━━━━━━━━━ 06:42   │    │
│  │       7h 27min  ★★★★☆          │    │
│  └─────────────────────────────────┘    │
│  7h 27min / 8h Ziel  ████████░░ 93%    │
├─────────────────────────────────────────┤
│  Diese Woche            Ø 7h 12min      │
│  Mo ██████░ 6:45                        │
│  Di ███████ 7:30                        │
│  Mi ██████░ 6:50                        │
│  Do ████████ 8:10                       │
│  Fr ███████ 7:23                        │
│  Sa ░░░░░░░ —                           │
│  So ░░░░░░░ —                           │
├─────────────────────────────────────────┤
│  Schlafschuld: -48 Min diese Woche      │
├─────────────────────────────────────────┤
│  Trends (30 Tage)                       │
│  Ø Qualität: 3.8 ★  │  Ø Dauer: 7:15  │
│  Konsistenz: 82%     │  Streak: 14 Tage│
├─────────────────────────────────────────┤
│  [ Schlaf loggen ]  [ Hygiene-Check ]   │
└─────────────────────────────────────────┘
```

### Morgen-Log Flow

```
┌─────────────────────────────────────────┐
│  Guten Morgen! Wie hast du geschlafen?  │
│                                         │
│  Eingeschlafen    [ 23:15 ]  ← gestern  │
│  Aufgewacht       [ 06:42 ]  ← heute    │
│                                         │
│  ═══════════ 7h 27min ═══════════       │
│                                         │
│  Qualität                               │
│  ☆  ☆  ☆  ☆  ☆                         │
│  (tap to rate)                          │
│                                         │
│  Aufwacher in der Nacht?   [ 0 ]        │
│                                         │
│  Traum gehabt?  [ Ja → Dreams ]         │
│                                         │
│  Notizen (optional)                     │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│              [ Speichern ]              │
└─────────────────────────────────────────┘
```

### Schlafenszeit-Balken

Kompakte Visualisierung einer Nacht:

```
  23:00  00:00  01:00  02:00  03:00  04:00  05:00  06:00  07:00
    │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
    ↑ Einschlaf                            Aufwach ↑
```

Für die Wochenansicht gestapelt — zeigt auf einen Blick wie konsistent die Schlafzeiten sind.

---

## 5. Seed-Daten

### Schlafhygiene-Checks (Presets)

```typescript
const HYGIENE_PRESETS = [
  { id: 'hygiene-no-caffeine', name: 'Kein Koffein nach 14:00', category: 'nutrition', order: 0 },
  { id: 'hygiene-no-alcohol', name: 'Kein Alkohol 3h vor Schlaf', category: 'nutrition', order: 1 },
  { id: 'hygiene-no-heavy-meal', name: 'Keine schwere Mahlzeit 2h vor Schlaf', category: 'nutrition', order: 2 },
  { id: 'hygiene-screens-off', name: 'Bildschirme aus 1h vor Schlaf', category: 'digital', order: 3 },
  { id: 'hygiene-no-phone-bed', name: 'Kein Handy im Bett', category: 'digital', order: 4 },
  { id: 'hygiene-cool-room', name: 'Schlafzimmer kühl (16–18°C)', category: 'environment', order: 5 },
  { id: 'hygiene-dark-room', name: 'Schlafzimmer dunkel', category: 'environment', order: 6 },
  { id: 'hygiene-quiet', name: 'Ruhige Umgebung / Ohrstöpsel', category: 'environment', order: 7 },
  { id: 'hygiene-wind-down', name: 'Entspannungsroutine gemacht', category: 'routine', order: 8 },
  { id: 'hygiene-consistent-time', name: 'Gleiche Schlafenszeit ±30min', category: 'consistency', order: 9 },
];
```

### Default Settings

```typescript
const DEFAULT_SETTINGS = {
  goalMin: 480,           // 8h
  targetBedtime: '23:00',
  targetWakeTime: '07:00',
  bedtimeReminderMin: 30, // 30min vorher
  morningReminderEnabled: true,
  morningReminderTime: '08:00',
};
```

---

## 6. App-Registrierung

```typescript
{
  id: 'sleep',
  name: 'Sleep',
  nameDe: 'Schlaf',
  description: {
    de: 'Schlaf-Tracking',
    en: 'Sleep Tracking',
  },
  longDescription: {
    de: 'Tracke deinen Schlaf mit Zeiten, Qualität und Schlafhygiene. Wochen-Trends, Schlafschuld, Konsistenz-Score und Verknüpfung mit Träumen.',
    en: 'Track your sleep with times, quality, and sleep hygiene. Weekly trends, sleep debt, consistency score, and dream linking.',
  },
  icon: APP_ICONS.sleep,
  color: '#6366f1',       // Indigo — Nacht/Ruhe
  status: 'development',
  requiredTier: 'guest',
}
```

---

## 7. Technische Besonderheiten

### Nacht-Überlappung
- Schlaf überlappt Mitternacht: Einschlafzeit gehört zum Vortag
- `date` Feld = Datum des Einschlafens (nicht Aufwachens)
- Dauer-Berechnung muss über Mitternacht funktionieren

### Konsistenz-Score
```
score = 100 - (stddev_bedtime_minutes / 30 * 50) - (stddev_waketime_minutes / 30 * 50)
```
Capped auf 0–100. Je geringer die Abweichung der Ein-/Aufschlafzeiten, desto höher.

### Schlafschuld
```
debt_week = sum(goalMin - actualMin) for each day
```
Positiv = Defizit, Negativ = Überschuss. Resets wöchentlich (Montag).

---

## 8. Implementierungsreihenfolge

1. **Datenmodell + Store** — Types, Config, Collections, Queries, Store
2. **Morgen-Log** — Quick-Entry Formular (Kernfunktion)
3. **Dashboard** — Letzte Nacht, Wochenübersicht, Schlafziel-Fortschritt
4. **Statistiken** — Trends, Durchschnitte, Konsistenz-Score, Schlafschuld
5. **Schlafhygiene** — Check-Konfiguration, Abend-Checklist, Korrelation
6. **Reminders** — Schlafenszeit-Erinnerung, Morgen-Log Reminder
7. **Cross-Modul** — Dreams-Verlinkung, Body-Check Integration, Drink-Warnung
