# Plan: Workbench Templates — Starter-Kits über Module hinweg

**Status:** Draft, 2026-04-16. Phase T1 (Shape-Generalisierung) + Pilot "Calmness" startet jetzt; T2-T5 folgen iterativ.
**Scope:** Erweitere das existierende Agent-Templates-System ([`multi-agent-workbench.md`](./multi-agent-workbench.md) Phase 5) so dass Templates nicht nur Agents bündeln, sondern komplette Workbench-Starter-Kits: Scene + Agent (optional) + Missionen (optional) + **Seed-Daten in beliebigen Modulen** (optional).
**Motivation:** Templates wie "Fitness", "Calmness", "Deep Work" haben immensen Onboarding-Wert, brauchen aber _keinen AI-Agent_ — nur Scene + vor-gefüllte Records (Habits, Goals, Meditate-Presets, …). Der heutige `AgentTemplate`-Shape zwingt einen Agent ins Bundle. Das wollen wir auseinanderziehen.
**Verwandte Docs:** [`multi-agent-workbench.md`](./multi-agent-workbench.md), [`../architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md), Ideas-Backlog [`../future/AI_AGENTS_IDEAS.md`](../future/AI_AGENTS_IDEAS.md).

---

## Entscheidungen (baked in)

| Frage | Entscheidung | Begründung |
|---|---|---|
| **Template-Typ-Name** | `WorkbenchTemplate` (umbenennen von `AgentTemplate`) mit optionalen Feldern für Agent, Scene, Seeds, Missions | Ehrlicher Name. `AgentTemplate` wäre ein Sub-Use-Case. Migrations-Path via Alias. |
| **Agent ist jetzt optional** | `agent?: AgentConfig` statt required | Wellness-Templates ohne AI sollen machbar sein |
| **Kategorisierung** | `category: 'ai' \| 'wellness' \| 'work' \| 'lifeEvent' \| 'delight'` | Gallery kann nach Kategorie gruppieren; Discoverability verbessert sich |
| **Seed-Daten pro Modul** | Template hat `seeds: { [moduleName]: SeedItem[] }` — pro Modul ein kleines Array pre-gefüllter Records | Flexibel, modul-lokal typisiert, keine Cross-Contamination |
| **Seed-Handler-Registry** | Jedes Modul das seedable sein will exportiert eine `seed.ts` mit `{ moduleName, seedFn(items) }`. Template-Applicator hat eine Registry `SEED_HANDLERS` die sie aggregiert. | Mirror des `input-resolvers`-Musters. Module bleiben autonom; Templates sind durable-lokal typed. |
| **Seed-Idempotenz** | Jedes Seed-Item hat optional `stableId`. Wenn der Applicator den Seed mit stableId schon findet, skipped er ihn und wirft eine Warning. Seeds ohne stableId werden immer neu erstellt. | Beides hat Use-Cases. Stable-IDs für "kanonische" Seeds (z.B. "Fitness 10-min Meditation"), UUIDs für "bei jedem Apply neu". |
| **Partial-Apply** | Wie Agent-Templates heute — Fehler pro Seed-Slot in `result.warnings`, aber Gesamt-Apply blockiert nicht | Konsistent mit dem existierenden Applicator. |
| **Versionierung** | Template-Config hat `version: '1'` Feld. Zukünftiges "Update verfügbar" ist Phase T5; jetzt reicht die Versionierung als _Metadaten_ damit wir später die Logik dranhängen können. | Billige Vorkehrung. |
| **Backward-Compat für `AgentTemplate`** | Type-Alias `export type AgentTemplate = WorkbenchTemplate`. Existierende Templates (`research/context/today`) bleiben unverändert. | Null Regression. |
| **Gallery-Kategorien** | Ab T1 nur flach gerendert. Ab T3 Gruppierung/Filter. | Incremental. |

---

## Daten-Modell

### Neuer Template-Typ

```ts
// packages/shared-ai/src/agents/templates/types.ts (erweitert)

export type WorkbenchTemplateCategory = 'ai' | 'wellness' | 'work' | 'lifeEvent' | 'delight';

export interface WorkbenchTemplateSeedItem {
	/** Wenn gesetzt: Applicator sucht einen existierenden Record mit
	 *  demselben `stableId` und überspringt bei Treffer. Wenn unset:
	 *  Applicator erzeugt bei jedem Apply einen neuen Record. */
	readonly stableId?: string;
	/** Modul-spezifische Payload. Der SeedHandler des Moduls kennt die
	 *  Struktur. Type-Sicherheit über Generic-Parameter in den einzelnen
	 *  Template-Konstanten. */
	readonly data: unknown;
}

export interface WorkbenchTemplate {
	readonly id: string;
	readonly version: string;                  // '1' zunächst
	readonly label: string;
	readonly tagline: string;
	readonly description: string;
	readonly category: WorkbenchTemplateCategory;
	readonly color: string;
	/** Icon-Emoji für die Gallery-Karte (wenn kein Agent dabei ist). */
	readonly icon: string;

	// Alle folgenden Felder optional — ein Template kann Agent-only,
	// Scene-only, Seeds-only oder jede Kombination sein.
	readonly agent?: WorkbenchTemplateAgentPart;
	readonly scene?: WorkbenchTemplateScenePart;
	readonly missions?: readonly WorkbenchTemplateMissionPart[];
	/** Modul-Name → Seed-Items für dieses Modul. Template-Applicator
	 *  schaut die Seed-Handler-Registry durch; unbekannte Module
	 *  werden als Warning gemeldet, kein hartes Fail. */
	readonly seeds?: Readonly<Record<string, readonly WorkbenchTemplateSeedItem[]>>;
}

/** Backward compat: die existierenden research/context/today Templates
 *  typieren sich weiterhin als AgentTemplate = WorkbenchTemplate. */
export type AgentTemplate = WorkbenchTemplate;
```

### Seed-Handler-Registry

```ts
// apps/mana/apps/web/src/lib/data/ai/agents/seed-registry.ts

export interface SeedHandler {
	/** Modul-Name, korrespondiert mit dem Key in Template.seeds. */
	readonly moduleName: string;
	/** Wird aufgerufen mit allen Items für dieses Modul.
	 *  Soll Idempotenz-Handling (stableId-Check) selbst erledigen.
	 *  Gibt pro Item zurück ob es neu angelegt oder geskipped wurde. */
	readonly apply: (items: readonly WorkbenchTemplateSeedItem[]) => Promise<SeedOutcome[]>;
}

export interface SeedOutcome {
	readonly stableId?: string;
	readonly outcome: 'created' | 'skipped-exists' | 'failed';
	readonly error?: string;
}

export function registerSeedHandler(handler: SeedHandler): void { ... }
export function getSeedHandler(moduleName: string): SeedHandler | undefined { ... }
```

Jedes seedable Modul exportiert einen Handler, z.B.:

```ts
// apps/mana/apps/web/src/lib/modules/meditate/seed.ts
import { registerSeedHandler } from '$lib/data/ai/agents/seed-registry';
import { meditateStore } from './stores/meditate.svelte';

registerSeedHandler({
  moduleName: 'meditate',
  async apply(items) { ... },
});
```

---

## Phasen

### Phase T1 — Shape-Generalisierung + Calmness-Pilot (dieser Durchlauf)

- [ ] `WorkbenchTemplate` Typ in shared-ai; `AgentTemplate` als Alias
- [ ] Existierende 3 Templates (`research/context/today`) bekommen `icon` + `version: '1'` + explizite `category: 'ai'`
- [ ] `seeds`-Feld im Typ deklariert (unused bei den 3 bestehenden)
- [ ] Webapp: `seed-registry.ts` mit `registerSeedHandler` / `getSeedHandler`
- [ ] `apply-template.ts` erweitert um Seeds-Schritt (iteriert `template.seeds`, ruft passenden Handler, aggregiert Warnings)
- [ ] **Pilot-Template "Calmness"** — `category: 'wellness'`, keine Agent, Scene `meditate · mood · journal · sleep`, 2 Meditate-Preset-Seeds (z.B. "4-7-8 Atmung" + "Body-Scan 10min")
- [ ] Meditate-Modul exportiert `seed.ts` mit `seedHandler` der `createPreset` ruft
- [ ] Gallery zeigt neuen Template ohne Kategorie-Filter (flach); Detail-Panel rendert "Seeds" Sektion wenn `template.seeds` gesetzt

**Ziel:** Calmness-Template funktioniert Ende-zu-Ende. User klickt "Calmness" in der Gallery → Scene wird angelegt → Meditate hat 2 neue Presets → kein Agent, keine Mission. Der _Weg_ ist etabliert; weitere Templates sind dann nur Konfiguration.

### Phase T2 — Seed-Handler für Kern-Module (~3-4 Tage)

Module die den größten UX-Gewinn aus Seeding haben:
- [ ] `habits` — Habit-Seeds ("Täglich trainieren", "8h Schlaf")
- [ ] `goals` — Goal-Seeds (Weekly / Monthly Ziele)
- [ ] `todo` — Task-Seeds (Einmal-Tasks für Onboarding)
- [ ] `food` — Nutrition-Target-Seeds (Kalorien, Wasser)
- [ ] `meditate` — schon in T1
- [ ] `drink` — Drink-Preset-Seeds
- [ ] `places` — POI-Seeds (z.B. "Lieblings-Café hinzufügen")

Jedes Seed-Handler-Modul:
- exportiert `seed.ts` mit `registerSeedHandler`
- ist idempotent über stable-id (wo sinnvoll)
- loggt die Outcome-Liste für die Template-Applicator-Warnings

### Phase T3 — 6 non-AI Templates + Kategorie-Filter (~3-5 Tage)

- [ ] 🏋️ **Fitness** — Scene + habits + goals + stretch-Routinen
- [ ] 🧘 **Calmness** — Scene + meditate-Presets (von T1 übernehmen)
- [ ] 💻 **Deep Work** — Scene + habits + times-Projekte + leere Todo
- [ ] ✈️ **Travel** — Scene + places-Kategorien + calendar-Block-Template
- [ ] 🎓 **Lernen** — Scene + skilltree-Presets + cards-Decks
- [ ] 🌙 **Schlaf-Routine** — Scene + sleep-hygiene-checkliste + meditate-Presets

Gallery-Enhancements:
- [ ] Kategorie-Tabs oben ("Alle · 🤖 AI · 🧘 Wellness · 💼 Arbeit · 🎉 Lebensereignis")
- [ ] Beliebt-Sektion (Usage-Stats später; jetzt manuell kuratiert)
- [ ] Template-Karten zeigen ihre Komponenten als Chips ("🧘 Presets · Scene · 2 Habits")

### Phase T4 — Update-Erkennung + bessere Delete-Story (~2 Tage)

- [ ] Template-Version wird am Scene gespeichert ("diese Scene basiert auf Calmness v1")
- [ ] Wenn Template v2 veröffentlicht wird: In-UI Hinweis "Update verfügbar — fügt 1 Seed hinzu" mit Apply-Button
- [ ] Scene-Delete fragt "Auch Seeds + Agent entfernen?" (default: nein — Seeds können anderweitig nützlich sein)

### Phase T5 — User-Created Templates (~1 Woche)

- [ ] Export-Scene-als-Template (inkl. User-Daten-Snapshots wenn User opt-in) → JSON
- [ ] Import-Flow in der Gallery ("Template-Datei laden")
- [ ] Community-Templates via "Template Teilen"-Link (kopiert JSON in Clipboard für jetzt; Future: Template-Share-Endpoint)

---

## Design-Details für Phase T1

### Wie "Calmness" konkret aussieht

```ts
// packages/shared-ai/src/agents/templates/calmness.ts

export const calmnessTemplate: WorkbenchTemplate = {
  id: 'calmness',
  version: '1',
  label: 'Calmness',
  tagline: 'Atem, Stille, ruhige Momente',
  description: `Ein Workbench-Setup für Stille-Momente. Legt dir eine Szene mit
den Modulen Meditate, Mood, Journal und Sleep an und seed-ed zwei Einstiegs-
Meditationen — mehr brauchst du nicht um anzufangen.

Kein AI-Agent. Du meditierst, nicht dein Computer.`,
  category: 'wellness',
  color: '#8B5CF6',
  icon: '🧘',
  scene: {
    name: 'Calmness',
    description: 'Ruhe, Atem, Stille',
    openApps: [
      { appId: 'meditate', widthPx: 540 },
      { appId: 'mood', widthPx: 340 },
      { appId: 'journal', widthPx: 440 },
      { appId: 'sleep', widthPx: 340 },
    ],
  },
  seeds: {
    meditate: [
      {
        stableId: 'template-calmness:preset:4-7-8',
        data: {
          name: '4-7-8 Atmung',
          description: 'Beruhigende Atemtechnik. Einatmen 4s, halten 7s, ausatmen 8s.',
          category: 'breathing',
          breathPattern: { inhale: 4, hold: 7, exhale: 8, rest: 0 },
          defaultDurationSec: 300,
        },
      },
      {
        stableId: 'template-calmness:preset:bodyscan-10',
        data: {
          name: 'Body-Scan 10min',
          description: 'Sanfte Aufmerksamkeits-Wanderung durch den Körper.',
          category: 'bodyscan',
          bodyScanSteps: [
            'Spüre deine Füße', 'Spüre deine Beine', 'Spüre dein Becken',
            'Spüre deinen Bauch', 'Spüre deine Brust', 'Spüre deine Arme',
            'Spüre deinen Nacken', 'Spüre deinen Kopf', 'Spüre deinen ganzen Körper',
          ],
          defaultDurationSec: 600,
        },
      },
    ],
  },
};
```

### Seed-Handler für Meditate (konkret)

```ts
// apps/mana/apps/web/src/lib/modules/meditate/seed.ts
import { meditateStore } from './stores/meditate.svelte';
import { db } from '$lib/data/database';
import { registerSeedHandler } from '$lib/data/ai/agents/seed-registry';
import type { LocalMeditatePreset } from './types';

interface MeditatePresetSeed {
  name: string;
  description?: string;
  category: 'silence' | 'breathing' | 'bodyscan';
  breathPattern?: { inhale: number; hold: number; exhale: number; rest: number };
  bodyScanSteps?: string[];
  defaultDurationSec?: number;
}

registerSeedHandler({
  moduleName: 'meditate',
  async apply(items) {
    const outcomes = [];
    for (const item of items) {
      const seed = item.data as MeditatePresetSeed;
      // Stable-id idempotency: search Dexie for an existing preset
      // with `templateStableId = item.stableId`. Preset schema doesn't
      // have that column today; we stash it in `description` for T1.
      // T2 adds a proper column.
      if (item.stableId) {
        const existing = await db
          .table<LocalMeditatePreset>('meditatePresets')
          .filter((p) => !p.deletedAt && p.description?.includes(`\`${item.stableId}\``))
          .first();
        if (existing) {
          outcomes.push({ stableId: item.stableId, outcome: 'skipped-exists' });
          continue;
        }
      }
      try {
        await meditateStore.createPreset({
          ...seed,
          description: seed.description
            ? `${seed.description}\n\n\`${item.stableId ?? ''}\``
            : `\`${item.stableId ?? ''}\``,
        });
        outcomes.push({ stableId: item.stableId, outcome: 'created' });
      } catch (err) {
        outcomes.push({
          stableId: item.stableId,
          outcome: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return outcomes;
  },
});
```

Note: der "stableId im description einbetten"-Trick ist Pragmatik für T1. T2 führt eine proper `templateStableId` Spalte ein wenn wir mehr Module seeden.

---

## Dateien (neu / modifiziert in T1)

**Neu:**
- `packages/shared-ai/src/agents/templates/calmness.ts`
- `apps/mana/apps/web/src/lib/data/ai/agents/seed-registry.ts`
- `apps/mana/apps/web/src/lib/modules/meditate/seed.ts`

**Modifiziert:**
- `packages/shared-ai/src/agents/templates/types.ts` — generalisierter Shape
- `packages/shared-ai/src/agents/templates/index.ts` — Calmness exportieren
- `packages/shared-ai/src/agents/templates/research.ts`, `context.ts`, `today.ts` — `category: 'ai'`, `icon`, `version: '1'` nachreichen
- `apps/mana/apps/web/src/lib/data/ai/agents/apply-template.ts` — Seeds-Schritt
- `apps/mana/apps/web/src/routes/(app)/agents/templates/+page.svelte` — Detail-Panel zeigt "Seeds" Sektion
- `apps/mana/apps/web/src/lib/data/ai/missions/setup.ts` — lädt `meditate/seed` beim startMissionTick damit der Handler registriert ist

---

## Risiken + Mitigation

| Risiko | Mitigation |
|---|---|
| Seed-Handler-Registrierung zur Laufzeit nicht garantiert (z.B. Lazy-Loading bricht Registry) | T1: Handler werden in `startMissionTick` explizit eingebunden (`import '$lib/modules/meditate/seed'`). T2: Module-Registry aufbohren. |
| Seed schreibt in encrypted-Tabelle ohne User-Master-Key | Seed-Handler ruft die Modul-Stores (die `encryptRecord` schon nutzen) — Crypto-Pfad unverändert. Funktioniert nur bei unlocked vault (wie alle Writes). |
| Stable-ID-Hack via description ist hässlich | T1 akzeptiert das als pragmatisch. T2 führt echte Spalte + Dexie-Migration ein. |
| Template-Versionierung ohne Update-Logik | Version wird gespeichert, aber keine Update-UI in T1. Vorbereitung für T4. |

---

## Nicht-Ziele T1

- **Keine Kategorie-UI** (T3)
- **Keine Update-Detection** (T4)
- **Keine User-Created Templates** (T5)
- **Keine echte Dexie-Spalte für stableId** (T2) — T1 nutzt description-Trick
- **Kein "Template anwenden v2" Upgrade-Pfad** (T4)

---

## Offene Fragen

1. **Seed-Schemas typisieren?** Heute sind Seeds `data: unknown`. Jeder Handler casted intern. Alternative: jedes Modul exportiert seinen Seed-Typ, Template referenziert ihn. Tight-coupling vs. Flexibilität. → T2 Entscheidung.
2. **Scene-Apps validieren?** Wenn ein Template eine `appId: 'foo'` referenziert die es nicht gibt, erscheint ein broken Tab. T2: Warnings auswerfen statt silently leere Tab. → T2.
3. **Delete-Cascade?** Wenn User die Calmness-Scene löscht, sollen die 2 Presets weg sein? Meine Tendenz: nein — Presets sind "Vorschläge", User bewertet selbst ob sie die behalten will. Scene ist Layout, Seed ist Inhalt.
