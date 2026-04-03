# App-Spezifisches Mini-Onboarding

> **Status:** ✅ Implementiert (Februar 2026)

Dieses Dokument beschreibt das App-spezifische Mini-Onboarding-System, das beim ersten Start einer App angezeigt wird.

## Übersicht

Das Mini-Onboarding ergänzt das globale ManaCore-Onboarding mit app-spezifischen Einstellungen. Es wird pro App und pro Gerät gespeichert.

```
┌─────────────────────────────────────────────────────────────┐
│ Globales Onboarding (ManaCore)                              │
│ → Profil, Interessen, Datenschutz (einmalig pro User)       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ App Mini-Onboarding (pro App, pro Gerät)                    │
│ → App-spezifische Einstellungen beim ersten Start           │
└─────────────────────────────────────────────────────────────┘
```

---

## Shared Package

**Package:** `@manacore/shared-ui`

```
packages/shared-ui/src/onboarding/
├── types.ts                          # TypeScript Interfaces
├── create-app-onboarding.svelte.ts   # Factory für App-Onboarding Store
└── MiniOnboardingModal.svelte        # Wiederverwendbarer Modal
```

---

## Step-Typen

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| `select` | Auswahl aus mehreren Optionen | Wochenbeginn: Montag/Sonntag |
| `toggle` | Ein/Aus-Schalter | Benachrichtigungen aktivieren? |
| `info` | Informationsseite mit Bullets | Tipps & Shortcuts |

### Select Step

```typescript
{
  id: 'weekStart',
  type: 'select',
  question: 'Wann beginnt deine Woche?',
  description: 'Optional description',
  emoji: '📅',
  gradient: { from: 'blue-500', to: 'blue-700' },
  options: [
    { id: 'monday', label: 'Montag', description: 'Europäischer Standard', emoji: '1️⃣' },
    { id: 'sunday', label: 'Sonntag', description: 'Amerikanischer Standard', emoji: '7️⃣' },
  ],
  defaultValue: 'monday',
}
```

### Toggle Step

```typescript
{
  id: 'notifications',
  type: 'toggle',
  question: 'Benachrichtigungen aktivieren?',
  emoji: '🔔',
  defaultValue: true,
  enabledLabel: 'Aktiviert',
  disabledLabel: 'Deaktiviert',
}
```

### Info Step

```typescript
{
  id: 'welcome',
  type: 'info',
  question: 'Willkommen!',
  description: 'Hier sind einige Tipps:',
  emoji: '🎉',
  bullets: [
    'Tipp 1',
    'Tipp 2',
    'Tipp 3',
  ],
}
```

---

## Speicherort

Mini-Onboarding-Daten werden in `deviceSettings` gespeichert:

```typescript
// deviceSettings[deviceId].apps[appId]
{
  onboarding_completed: true,
  onboarding_preferences: {
    weekStart: 'monday',
    defaultView: 'week',
    timezone: 'auto'
  },
  // Preferences auch auf Top-Level für einfachen Zugriff
  weekStart: 'monday',
  defaultView: 'week',
  timezone: 'auto'
}
```

---

## Integration in Apps

### 1. Dependency hinzufügen

```json
{
  "dependencies": {
    "@manacore/shared-ui": "workspace:*"
  }
}
```

### 2. Store erstellen

**Datei:** `src/lib/stores/app-onboarding.svelte.ts`

```typescript
import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-ui';
import { userSettings } from './user-settings.svelte';

const steps: AppOnboardingStep[] = [
  {
    id: 'weekStart',
    type: 'select',
    question: 'Wann beginnt deine Woche?',
    emoji: '📅',
    options: [
      { id: 'monday', label: 'Montag', emoji: '1️⃣' },
      { id: 'sunday', label: 'Sonntag', emoji: '7️⃣' },
    ],
    defaultValue: 'monday',
  },
  // ... weitere Steps
];

export const appOnboarding = createAppOnboardingStore({
  appId: 'my-app',
  steps,
  userSettings,
  onComplete: async (preferences) => {
    console.log('Onboarding completed:', preferences);
  },
  onSkip: async () => {
    console.log('Onboarding skipped');
  },
});
```

### 3. Modal in Layout einbinden

**Datei:** `src/routes/(app)/+layout.svelte`

```svelte
<script>
  import { appOnboarding } from '$lib/stores/app-onboarding.svelte';
  import { MiniOnboardingModal } from '@manacore/shared-ui';
</script>

<!-- Am Ende des Layouts -->
{#if appOnboarding.shouldShow}
  <MiniOnboardingModal
    store={appOnboarding}
    appName="Meine App"
    appEmoji="🚀"
  />
{/if}
```

---

## Store API

```typescript
interface AppOnboardingStore {
  // Reactive Properties
  readonly shouldShow: boolean;           // Zeige Modal?
  readonly currentStep: number;           // Aktueller Step (0-basiert)
  readonly totalSteps: number;            // Anzahl Steps
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly progress: number;              // 0-100%
  readonly currentStepConfig: AppOnboardingStep | undefined;
  readonly preferences: Record<string, unknown>;
  readonly saving: boolean;
  readonly appId: string;
  readonly steps: AppOnboardingStep[];

  // Methods
  next(): void;                           // Nächster Step
  prev(): void;                           // Vorheriger Step
  goToStep(index: number): void;          // Zu Step springen
  setPreference(key: string, value: unknown): void;
  complete(): Promise<void>;              // Abschließen & speichern
  skip(): Promise<void>;                  // Überspringen
  reset(): Promise<void>;                 // Zurücksetzen (Debug)
  checkCompleted(): boolean;              // Prüfen ob abgeschlossen
}
```

---

## Implementierte Apps

### Calendar (✅ Implementiert)

**Fragen:**
1. **Wochenbeginn:** Montag / Sonntag
2. **Standard-Ansicht:** Tag / Woche / Monat
3. **Zeitzone:** Auto / Berlin / London / New York
4. **Willkommen:** Tipps für den Start

**Dateien:**
- `apps/calendar/apps/web/src/lib/stores/app-onboarding.svelte.ts`
- Integration in `apps/calendar/apps/web/src/routes/(app)/+layout.svelte`

---

## Geplante Apps

### Todo

**Fragen:**
1. **Erstes Projekt:** Name für das erste Projekt
2. **Quick-Add:** Syntax-Tutorial (optional)
3. **Benachrichtigungen:** Push aktivieren?

### Chat

**Fragen:**
1. **KI-Persönlichkeit:** Formell / Locker / Neutral
2. **Antwortlänge:** Kurz / Mittel / Ausführlich
3. **Emojis:** Mit / Ohne

### Contacts

**Fragen:**
1. **Import:** Kontakte importieren?
2. **Sortierung:** Vorname / Nachname zuerst
3. **Geburtstags-Erinnerungen:** Aktivieren?

---

## Datenfluss

```
┌─────────────────────────────────────────────────────────────┐
│ App startet                                                 │
│ └→ userSettings.load()                                      │
│    └→ Prüfe: getDeviceAppSettings().onboarding_completed    │
│       └→ false && userSettings.loaded?                      │
│          └→ shouldShow = true → Zeige Modal                 │
│             └→ User durchläuft Steps                        │
│                └→ complete() oder skip()                    │
│                   └→ updateDeviceAppSettings({              │
│                        onboarding_completed: true,          │
│                        ...preferences                       │
│                      })                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Vorteile

1. **Geräte-spezifisch:** Jedes Gerät kann seine eigenen Einstellungen haben
2. **App-spezifisch:** Nur relevante Fragen pro App
3. **Schnell:** 2-4 Fragen statt volles Onboarding
4. **Wiederverwendbar:** Shared Package für alle Apps
5. **Flexibel:** Apps können eigene Steps definieren
6. **Svelte 5 Runes:** Vollständig reaktiv mit `$state` und `$derived`

---

## Debugging

### Onboarding zurücksetzen

```typescript
// In Browser Console
import { calendarOnboarding } from '$lib/stores/app-onboarding.svelte';
await calendarOnboarding.reset();
location.reload();
```

### DevTools

Im Browser LocalStorage unter `manacore_device_settings` → `apps.calendar` prüfen:
- `onboarding_completed`: Boolean
- `onboarding_skipped`: Boolean (wenn übersprungen)
- Weitere Preferences auf Top-Level
