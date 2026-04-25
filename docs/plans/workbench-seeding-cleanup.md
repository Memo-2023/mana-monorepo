# Workbench-Seeding — Cleanup & Architektur-Hardening

## Status (2026-04-25)

Rückwirkende Aufräumarbeit für `workbenchScenes`. Adressiert einen Race-Condition-Bug, der seit dem Space-Migration-Sweep (2026-04-22) bei jedem Login zusätzliche "Home"-Scenes anlegt — und nimmt die Gelegenheit, die ganze Bug-Klasse strukturell zu eliminieren.

## Symptom

User-Reports: "viele Home-Scenes mit den immer gleichen Apps offen". Im IndexedDB der Personal-Space-Workbench kumulieren sich `name='Home'`-Scenes über die Sessions hinweg.

## Bug-Analyse — Warum es passiert

Drei Ursachen-Schichten greifen ineinander:

### 1. Footgun im Creating-Hook (`database.ts:1330`)
Wenn ein neuer Record auf einer space-scoped Tabelle ohne `spaceId` geschrieben wird, stempelt der Hook automatisch `spaceId = '_personal:<userId>'` (Sentinel). Ursprünglich als Migrations-Brücke für v28 gedacht, verschluckt das heute jeden Code-Pfad, der vergisst die `spaceId` explizit zu setzen.

### 2. Drei verteilte Seeding-Pfade (`workbench-scenes.svelte.ts`)
- Z. 293-296: `count === 0` → `ensureSeedScene()` in `initialize()`
- Z. 305-326: `onActiveSpaceChanged` Replay-on-Register feuert sofort → check `r.spaceId === space.id` → `ensureSeedScene()`
- Z. 305-326 erneut: Bei jedem späteren Space-Wechsel

`ensureSeedScene()` setzt **kein** `spaceId` → der Hook stempelt Sentinel → der Dedup-Filter sucht aber nach echter Space-UUID → schlägt immer fehl → seedet immer wieder.

### 3. Idempotenz auf zufälligen UUIDs
Jeder Seed bekommt `crypto.randomUUID()`. Das macht "ist schon da?"-Checks von Inhalts-Vergleichen abhängig statt von Primary-Key-Constraints. Jeder Race produziert eine neue Row, weil die DB nichts zu blocken hat.

### Race-Mechanik
`+layout.svelte:611` startet `loadActiveSpace().then(reconcileSentinels)` parallel zu `+page.svelte:69` `workbenchScenesStore.initialize()`. `reconcileSentinels` rewrited Sentinel-Rows pro Boot **einmal** zur echten Personal-Space-UUID. Mid-Session-Seeds (nach Reconcile geschrieben) bleiben bei Sentinel und werden erst beim NÄCHSTEN Boot reconciled. Resultat: jede Session fügt Duplikate hinzu.

Brand/Family/Team-Spaces verstärken den Effekt: jeder Wechsel dorthin findet keine Scene unter der Brand-UUID → seedet — landet aber per Sentinel-Stamping unter Personal-Space. Personal-Workbench füllt sich bei jedem Wechsel in einen anderen Space.

## Best-Practice-Lösung in vier Schichten

Statt nur den Symptom-Patch (`spaceId` durchreichen) werden die unterliegenden Footguns alle adressiert, sodass die ganze Bug-Klasse strukturell unmöglich wird.

### Schicht D-soft — Bestehende Duplikate aufräumen

**Ziel:** alle bereits angesammelten Home-Duplikate auf eine Survivor-Row pro Space reduzieren, ohne user-customisierte Scenes anzutasten.

- Neue Datei `data/scope/dedup-workbench-scenes.ts` exportiert `dedupHomeScenes(): Promise<number>`.
- Logik:
  1. Alle nicht-tombstoned Rows lesen, gruppieren nach `(spaceId, name)`.
  2. Nur Gruppen mit `name === 'Home'` UND `length > 1` UND keiner Row mit `description` / `wallpaper` / `viewingAsAgentId` / `scopeTagIds` (User-Customisierungen).
  3. Survivor-Pick: meiste `openApps`, dann jüngstes `updatedAt`.
  4. Merge: alle `openApps` der Verlierer (per `appId` deduped) in den Survivor übernehmen — nichts geht verloren.
  5. Verlierer soft-deleten (`deletedAt = now`) damit mana-sync den Cleanup an andere Geräte propagiert.
- Aufruf-Stellen (idempotent — doppelter Lauf ist no-op):
  - **Dexie v48 upgrade** in `database.ts`. Läuft genau einmal pro Device beim Schema-Bump.
  - **`+layout.svelte` `handleAuthReady`** direkt nach `reconcileSentinels()`. Fängt den Edge-Case wo Sentinel-Rows nach dem Reconcile in die UUID-Gruppe wandern und dort neue Duplikate bilden.
- Tests: `data/scope/dedup-workbench-scenes.test.ts` deckt: identische Duplikate → 1 Survivor; openApps-Merge dedupt nach `appId`; verschiedene Spaces bleiben getrennt; user-customisierte Scenes (custom `description`, `wallpaper`, `viewingAsAgentId`) bleiben unangetastet; non-`Home`-Namen bleiben unangetastet.

### Schicht B + C — Zentrale Per-Space-Seeder-Registry mit deterministischen IDs

**Ziel:** alle Race-Pfade durch *einen* idempotenten Seeding-Eintrittspunkt ersetzen.

- Neues Modul `data/scope/per-space-seeds.ts`:
  ```ts
  type Seeder = (spaceId: string) => Promise<void>;
  const seeders = new Map<string, Seeder>();
  export function registerSpaceSeed(name: string, fn: Seeder): void;
  export async function runSpaceSeeds(spaceId: string): Promise<void>;
  ```
- Aufrufer-Hook: `setActiveSpace()` in `active-space.svelte.ts` ruft nach `notifyHandlers(space)` ein einziges `void runSpaceSeeds(space.id)`.
- Workbench-Modul registriert sich per Side-Effect-Import (bestehendes Muster wie bei `seed-registry.ts`):
  ```ts
  registerSpaceSeed('workbench-home', async (spaceId) => {
      const id = `seed-home-${spaceId}`;
      await db.workbenchScenes.put({ id, spaceId, name: 'Home', openApps: DEFAULT_HOME_APPS, ... });
  });
  ```
- Deterministische ID `seed-home-${spaceId}` macht den Seed nativ idempotent: zweite Ausführung überschreibt Bit-für-Bit identisch, kein Duplikat möglich. Race-Conditions strukturell ausgeschlossen.
- Aus `workbench-scenes.svelte.ts` entfernen:
  - Z. 293-296 `count === 0` Block in `initialize()`.
  - Z. 305-326 `onActiveSpaceChanged`-Handler (nur den Seed-Block, der LS-Read bleibt).
  - `ensureSeedScene()` Funktion (nicht mehr nötig).

### Schicht A — Hook wirft statt Sentinel zu stempeln

**Ziel:** vergessene `spaceId`-Sets als hard-fail statt silent-corruption.

- `database.ts:1330` umstellen: wenn `spaceId` undefined/null AND Tabelle nicht in `USER_LEVEL_TABLES`:
  ```ts
  throw new Error(
      `[scope] write to space-scoped table '${tableName}' without spaceId. ` +
      `Set spaceId explicitly or move the table to USER_LEVEL_TABLES.`
  );
  ```
- `reconcileSentinels` darf bleiben (rewriten historischer Sentinel-Daten weiter, falls vorhanden) — neue Writes sehen den Sentinel-Pfad nie mehr.
- Erwartet: deckt 2-3 stille Bugs in anderen Modulen auf, die seit der v28-Migration unbemerkt durchgelaufen sind. Genau deshalb ist die Schicht wertvoll.
- Risk-Mitigation: vor Schicht A einen Audit-Lauf (`grep` + Code-Review) der bestehenden `.add(`-Stellen über alle Module — wer setzt `spaceId` nicht? Diese Stellen vorab fixen.

### Schicht D-hard — Cleanup als Schema-Invariante festschreiben

**Ziel:** den deterministischen Seed-ID-Vertrag im Code als fest erwarteten Zustand verankern.

- 1-2 Tage nach Schicht B+C+A. Soak-Zeit, damit alle Devices via Sync den dedup'ten State sehen.
- Dexie v49 (oder höher) Migration: alle `workbenchScenes` mit `name === 'Home'` und ohne ID-Prefix `seed-home-` umbenennen auf `seed-home-${spaceId}`. Falls Konflikt mit existierendem deterministischen Survivor: alte Row löschen.
- Code-Annahme: queries dürfen ab hier `db.workbenchScenes.get(\`seed-home-\${spaceId}\`)` direkt benutzen, ohne By-Name-Filter-Fallback.

## Reihenfolge

1. ✅ **Schicht D-soft** — `d62ae8f1e` (Dexie v48 + +layout post-reconcile dedup)
2. ✅ **Schicht B + C** — `c73f93ff1` (per-space-seeds Registry, deterministic Home id, store-stripped) + `568d79dc1` (transitional legacy-Home check + wiring integration test)
3. ⏳ **Schicht A** — gestaffelt:
   - ✅ **Etappe 1** — `43bef2b24`: Helper `getEffectiveSpaceId()` + 16 explizite Migrations in 10 Modulen (picture/events/companion/calc/quotes/skilltree/moodlit/plants/questions + data/ai). Hook stempelt weiter Sentinel als Fallback.
   - 🔜 **Etappe 2** (post-soak ≥1 Tag): Hook auf `throw` flippen. Vorher kurzer grep-Pass um sicherzugehen dass kein neuer ungesetzter `.add()` in der Zwischenzeit gelandet ist.
4. 🔜 **Schicht D-hard** — Survivor → deterministische ID umbenennen, Code-Annahme festschreiben. Nach Schicht A Etappe 2.

## Erfolgskriterien

- Nach D-soft: User sieht in jedem Space genau eine `Home`-Scene mit allen openApps gemerged. Andere Custom-Scenes unverändert. Sync propagiert Cleanup an alle Devices.
- Nach B+C: Login → keine neuen Duplikate, egal welche Race-Reihenfolge. Space-Wechsel zu fremdem Space erstellt Home-Scene **dort**, nicht im Personal-Space.
- Nach A: jeder unbeabsichtigte `add()` ohne `spaceId` schlägt mit klarer Error-Message fehl.
- Nach D-hard: deterministische Seed-IDs sind der einzige Weg "Home" in DB zu finden.

## Risiken & Mitigations

- **D-soft soft-deletes durch sync gepullt** → andere Devices sehen plötzlich weniger Scenes. **Erwünscht** — dedup ist genau der Zweck. Sync handelt soft-deletes via `deletedAt` korrekt.
- **D-soft falsch-positiv: User hat zwei legitime "Home"-Scenes manuell angelegt** → die Heuristik ("kein description/wallpaper/agent/scope") schließt customisierte Rows aus. Reine Default-Duplikate werden gemerged. Edge-Case: User hat zwei identische Scenes "Home" beide mit Default-Apps absichtlich angelegt — sehr unwahrscheinlich, und Konsequenz (Merge auf eine Row mit Union der Apps) ist benign.
- **B+C: Schicht-A Wirkung vorgezogen** — wenn B+C zuerst kommt, fixed der Workbench-Path den Bug; aber andere Module könnten weiterhin still falsch stempeln. Akzeptabel, weil B+C den User-sichtbaren Bug schließt.
- **A: Bestehende Tests, die ohne `spaceId` schreiben** → Audit-Schritt vor A. `vitest run` deckt's auf.

## Out-of-Scope

- Server-truthed Scene-Creation (mana-sync seedet auf Space-Create direkt in PG). Bricht local-first für nur einen Use-Case — nicht der richtige Tradeoff fürs Daten-Modell.
- Vereinheitlichung mit Workbench-Templates-Apply-Pattern (bereits ähnliche Seed-Handler-Registry in `apply-template.ts`). Spannend, aber nicht Teil dieses Plans.
