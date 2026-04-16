# AI Workbench Audit — 2026-04-16

Code review of all AI Workbench features built in the April 15–16 session.
Covers: reasoning loop, debug log, scope context, per-agent kontext,
notes tools, scene-scope queries, research pre-step, cross-module inbox,
planner prompt.

## P0 — Sofort fixen

### 1. Tool-Exceptions im Reasoning Loop nicht gefangen
- **File:** `apps/mana/apps/web/src/lib/data/ai/missions/runner.ts`
- **Problem:** Wenn ein Tool-Call während `stage(ps, aiActor)` eine Exception wirft (Dexie-Error, Vault locked, Netzwerk), crasht die gesamte Iteration. Der Step wird nicht als `failed` markiert, der Loop bricht hart ab.
- **Fix:** try-catch um `stage()` im Loop. Bei throw: Step als failed recorden, weiter mit nächstem Step.
- **Status:** DONE (commit TBD)

### 2. Concurrent Missions trampen auf demselben Scope
- **File:** `apps/mana/apps/web/src/lib/data/ai/scope-context.ts`
- **Problem:** `currentScopeTagIds` ist modul-level mutable State. Wenn 2 Missions parallel unter verschiedenen Agents laufen, überschreibt die zweite `withAgentScope()` den Scope der ersten (await gibt Thread frei → interleaving).
- **Fix:** Scope als Parameter durch die Pipeline reichen statt ambient State.
- **Status:** DONE (commit TBD)

## P1 — Bald fixen

### 3. N+1 Junction-Queries bei Scene-Scope
- **Files:** `modules/{notes,todo,contacts,calendar}/queries.ts`
- **Problem:** `filterBySceneScope` macht pro Record einen Dexie-Lookup. 500 Notes = 500 Queries pro Render.
- **Fix:** Batch-Funktion `getTagIdsForMany(entityIds[])` die einmal `where(field).anyOf(ids).toArray()` macht.

### 4. Vault-Locked = "Not found"
- **File:** `modules/notes/tools.ts` `readLocalNote()`
- **Problem:** Wenn Vault gesperrt, returned `decryptRecords` null. Tool meldet "Notiz nicht gefunden" statt "Vault gesperrt".
- **Fix:** Distinction im Return-Value, spezifische Error-Message.

### 5. Debug-Log speichert entschlüsselte Inhalte im Klartext
- **File:** `data/ai/missions/debug.ts`
- **Problem:** Prompts mit Notiz-/Kontext-Inhalten landen unverschlüsselt in `_aiDebugLog`. Lokal, nicht synced — aber bei Gerätediebstahl exponiert.
- **Fix:** Auto-Purge nach 7 Tagen, optional Checksummen-Modus.

### 6. 90s Timeout zu knapp für 5 LLM-Calls
- **File:** `runner.ts` `ITERATION_TIMEOUT_MS`
- **Problem:** 5 Planner-Calls bei langsamem Modell = 75+ Sekunden nur LLM-Zeit.
- **Fix:** 180s oder konfigurierbar pro Mission.

## P2 — Technische Schulden

### 7. Prompt sagt "bis 10 Steps" aber Loop capped bei 5
- **Files:** `prompt.ts` L43 vs `runner.ts` L58
- **Fix:** Prompt + Constant synchron halten.

### 8. Server-Prompt-Drift
- **File:** `packages/shared-ai/src/planner/prompt.ts`
- **Problem:** mana-ai Server prepended eigenen `<agent_context>` Block. Kein Drift-Guard.
- **Fix:** Version-Constant + Hash-Test.

### 9. useAgents() auf jedem SceneHeader-Render
- **File:** `SceneHeader.svelte`
- **Fix:** `useAgent(id)` statt `useAgents()`, oder global cachen.

### 10. Zwei parallele Scope-Systeme
- **Files:** `scope-context.ts` + `scene-scope.svelte.ts`
- **Fix:** Gemeinsame ScopeFilter-Funktion.

### 11. Research-Dedup fehlt
- **File:** `runner.ts` `runWebResearch()`
- **Fix:** Zeitbasierte Dedup (<5min) oder feste ID.

### 12. Kontext-Injection-Policy unklar
- **File:** `runner.ts`
- **Problem:** Kommentar sagt "no auto-inject", Code macht Fallback auf globalen Singleton.
- **Fix:** Entscheiden + dokumentieren.
