# Planner — Native Function Calling + Direct Execution

**Status:** Plan
**Scope:** `@mana/shared-ai` Planner + `services/mana-ai` Runner + Webapp Runner + `mana-llm` Provider Layer + Companion Chat
**Voraussetzung:** System ist noch nicht live — keine Rückwärtskompatibilität nötig, keine User-Daten-Migration, keine Feature-Flags.

## Motivation

Zwei miteinander verbundene Probleme mit dem aktuellen Planner:

1. **Text-JSON-Parser ist fragil.** Der aktuelle Planner bittet das LLM, einen ` ```json `-Block zu produzieren, den wir dann mit einem Regex extrahieren und validieren. Gemini hält sich nicht zuverlässig an dieses Format (liefert Prosa davor/danach, oder bei Safety-Filter leere Responses), was in `no JSON block found`-Fehlern endet. Der Root-Cause liegt im Prompt-Engineering — nicht im SDK. Moderne Provider (Google, OpenAI, Ollama ≥ 0.3) haben natives **Function Calling / Tool Use** eingebaut, das Strukturgarantien auf Protokollebene gibt.

2. **Propose/Approve-Gate erzeugt Friktion ohne nennenswerten Nutzen.** Heute werden alle Write-Tools als Proposals gestaged — der User muss jeden einzeln genehmigen. Für eine Mission „erstelle Quiz mit 8 Fragen" sind das **9 Klicks**. Für autonome Missionen (Hintergrund-Runner `mana-ai`) ist das ein prinzipielles Problem: die Mission kann nie durchlaufen, weil kein User da ist. Die industrieweite Evolution geht klar in Richtung „Agent handelt, User reviewt + revertiert" (Cursor, Claude Code, Notion AI, v0, Bolt). Das Propose-Gate ist eine 2022er-Ängstlichkeit, die wir mitgeschleppt haben.

## Vision

```
LLM (mit nativen tool_calls)  →  Executor führt direkt aus  →  Timeline zeigt was passiert ist
                                                                  ↓
                                                          Revert-per-Iteration als Undo
```

- **Strukturgarantie kommt vom SDK**, nicht vom Prompt. Kein Parser, kein `extractJsonBlock`.
- **Alle Write-Tools default auf `auto`.** Kein Staging, kein Review-Vor-Aktion.
- **Timeline + Revert sind das Review-UI.** Undo > Approve als Kontroll-Paradigma.
- **Mission-Budget + manual Cadence** sind die Kontrolle *vor* der Ausführung.
- **Companion Chat nutzt denselben Loop** — Tool-Calls führen direkt aus, User sieht Result inline.

## Prinzipien

1. **Ein Ausführungspfad.** Kein staged middle state („vorgeschlagen, aber nicht ausgeführt").
2. **Provider ohne Tool-Support werden nicht unterstützt.** Silent Downgrade ist gefährlicher als ein klarer Error.
3. **Keine Legacy.** Alter JSON-Text-Parser-Pfad, Proposal-Infrastruktur und `_rationale` werden im selben PR gelöscht.
4. **Undo > Approve.** Soft-Delete + Per-Iteration-Revert machen Korrektur billig — billiger als der kumulierte Klick-Overhead von Approve-Gates.

## Architektur-Zielbild

```
buildPlannerSystemPrompt(mission)       — ~400 Tokens, keine Tool-Liste, keine JSON-Regel
           +
toolSchemas = catalog.map(toolToFunctionSchema)

           ↓

LLM.chat({ messages, tools, tool_choice: 'auto' })   ← bis zu 5 Runden
           
           ↓ pro tool_call (können parallel kommen):
              policy === 'auto' → executor.run() → result als tool-message zurück
              policy === 'deny' → tool-message mit error, LLM reagiert
           
           ↓ keine tool_calls mehr (finish_reason: 'stop') → Iteration fertig

Result wird in Mission.iterations[] geschrieben.
Workbench-Timeline rendert die Iteration + Revert-Button.
```

**Kein Proposal-Queue.** Kein Text-Parser. Kein Format-Beispiel im Prompt.

## Tool-Policy neu

Heute: `auto | propose | deny`
Neu: **`auto | deny`**

- **`auto`** — Executor führt das Tool direkt aus
- **`deny`** — Executor wirft eine strukturierte Error-Message; LLM sieht das und plant weiter oder stoppt

`confirm` gibt es **nicht** — wir bauen keine UI für ein Feature ohne aktuelle Anwender. Sobald wir echte External-Side-Effect-Tools bauen (E-Mail, Zahlungen, öffentliche Posts), fügen wir `confirm` als dritte Policy zu und eine zugehörige UI. Bis dahin: YAGNI.

**Agent-Policy-Override bleibt** — ein User kann `policy['update_note'] = 'deny'` setzen, wenn er bei einem bestimmten Tool paranoid ist. Das ist die Escape-Hatch für Safety-Konzerne.

## Safety-Netze

Ohne Approve-Gate brauchen wir andere Kontrollen. Die gibt's bereits, sie werden nur aufgewertet:

| Mechanismus | Wo | Zweck |
|---|---|---|
| **Revert-per-Iteration** | `data/ai/revert/*` | Ein-Klick-Rollback aller Writes einer Iteration. UI prominent im Timeline-Bucket. |
| **Mission-Budget** | `Mission.budget.maxWritesPerIteration` (schon im Model) | Hart-Limit. Default z. B. `20`. Tool-Call #21 wird vom Executor abgelehnt. |
| **Cadence = manual als Default** | Mission-Create-Form | Neue Missionen feuern nicht automatisch. User muss „Jetzt ausführen" klicken. |
| **Agent-Policy deny pro Tool** | `agent.policy` | Pro Agent lassen sich einzelne Tools sperren. |
| **Agent pausieren** | Agent-UI | Stoppt alle Missionen des Agents sofort. |

## Design-Entscheidungen (konsolidiert)

1. **Multi-Turn-Reasoning-Loop** — bleibt, max. 5 Runden. Jeder Auto-Tool-Result geht als `role: 'tool'`-Message in den nächsten Turn.
2. **Parallele Tool-Calls pro Turn** — erlaubt. LLM darf in einem Turn z. B. `create_quiz + 8× add_quiz_question` parallel ausgeben. Wir führen sequenziell aus.
3. **Provider-Strict** — Router prüft `supports_tools` pro Modell. Tool-incapable Modelle → `ProviderCapabilityError`, kein Fallback.
4. **Tool-Errors als Tool-Messages** — Executor-Fehler werden als `{success: false, message}` in die Chat-History geschrieben. LLM kann reagieren (anderes Tool probieren, stoppen).
5. **Debug-Log-Format** — `rawMessages: ChatMessage[]` ersetzt `rawResponse: string`. Zeigt den vollen Chat-Verlauf der Iteration.
6. **Kein `_rationale`** — Tool-Name + Parameter sind selbsterklärend. Timeline-Cards zeigen `create_quiz(title: "Planeten")` statt einer Pseudo-Begründung.
7. **Kein Proposal-Staging** — Tools werden direkt ausgeführt. Keine Zwischenzustände.

## Deliverables (ein atomarer PR)

### 1. `mana-llm` — Provider-Layer

**Neu:**
- `ChatCompletionRequest.tools: list[ToolSpec] | None`
- `ChatCompletionRequest.tool_choice: 'auto' | 'required' | 'none' | ToolSpec | None`
- `MessageResponse.tool_calls: list[ToolCall] | None`
- `Provider.supports_tools: bool` im Registry; Router wirft bei Mismatch

**Pro Provider:**
- `google.py`: `types.Tool(function_declarations=...)` + `types.ToolConfig`. **Zusätzlich: `finish_reason`-Auswertung** (SAFETY / RECITATION / MAX_TOKENS → strukturierte Errors, kein leerer String-Return)
- `openai_compat.py`: 1:1 OpenAI-spec durchreichen
- `ollama.py`: 1:1 OpenAI-spec ab Ollama 0.3 + Modell-Whitelist

### 2. `@mana/shared-ai` — Function-Schema-Konverter + neuer Runner

**Neu:**
- `packages/shared-ai/src/tools/function-schema.ts` — `toolToFunctionSchema(tool: ToolSchema): FunctionSpec`. Konvertiert Catalog-Eintrag zu OpenAI-spec Function-Schema (params → JSON-Schema, enum → string-enum). Kein `_rationale`-Inject.
- `packages/shared-ai/src/planner/loop.ts` — `runPlannerLoop({ llm, mission, tools, onToolCall })`. Multi-Turn-Chat-Loop. Gibt `{ rounds, toolCallsExecuted, summary }` zurück.
- `packages/shared-ai/src/planner/prompt.ts` — auf `buildSystemPrompt(mission)` reduziert. ~30 Zeilen, kein Tool-Listing, kein JSON-Beispiel.

**Gelöscht:**
- `packages/shared-ai/src/planner/parser.ts` + `parser.test.ts`
- `extractJsonBlock`, `validateStep` und verwandte Helfer
- Tool-Listing-Block im System-Prompt
- `AiPlanOutput` / `PlannedStep`-Types (ersetzt durch `ExecutedStep`-Äquivalent mit Result)

### 3. Webapp-Runner — `apps/mana/apps/web/src/lib/data/ai/missions/`

**Neu:**
- `runner.ts` ruft `runPlannerLoop` aus `@mana/shared-ai` mit webapp-spezifischem `onToolCall`-Callback, der via `executor.run()` läuft
- `debug.ts` schreibt `rawMessages: ChatMessage[]` statt `rawResponse: string`
- `components/ai/AiDebugBlock.svelte` rendert Messages als Chat-Verlauf

**Gelöscht:**
- `proposals/` kompletter Ordner (Store, Queries, Staging-Logik)
- Dexie-Tabelle `pendingProposals` (Schema-Bump, Tabelle wird beim nächsten Open gedropped)
- `components/ai/AiProposalInbox.svelte` + zugehörige Proposal-Card-Komponente
- Alle `<AiProposalInbox />`-Usages in: `/todo`, `/calendar`, `/places`, `/drink`, `/food`, `/news`, `/notes`, Mission-Detail-Cross-Module-View
- `createProposal()`-Pfad im Tool-Executor

### 4. Server-Runner — `services/mana-ai/`

**Neu:**
- `cron/tick.ts` ruft denselben `runPlannerLoop` — 95% Code-Sharing mit Webapp
- `server-iteration-staging.ts` in der Webapp wird **gelöscht** — Server-produzierte Iterations enthalten jetzt ausgeführte Tool-Calls, nicht gestaged Proposals; sie erscheinen direkt als Timeline-Einträge nach Sync

**Gelöscht:**
- `services/mana-ai/src/planner/tools.ts` Drift-Guard (nicht mehr nötig — Single-Source-of-Truth bleibt der Catalog, aber die server/webapp Derivate existieren nicht mehr separat)

### 5. Companion Chat — `apps/mana/apps/web/src/lib/modules/companion/`

- `engine.ts` wird auf denselben `runPlannerLoop` umgestellt (statt ad-hoc 3-Round-Loop)
- Semantisch unverändert für den User: Tool-Aufrufe executen direkt, Result landet in der Chat-Antwort
- Sharing mit Planner eliminiert zwei parallele Tool-Call-Loops

### 6. Timeline-UI Polishing

Da die Timeline jetzt das primäre Review-Surface ist, ein bisschen Design-Energie:
- **Revert-Button pro Iteration-Bucket** — schon da, aber prominenter machen (nicht im Hover-Overlay verstecken)
- **Tool-Call-Cards** zeigen Tool-Name + Params (pretty-printed) + Success/Error-Indikator
- **Filter-Erweiterung** — „nur Iterationen der letzten 24h", „nur mit Fehler"
- Separater PR OK, aber im selben Sprint

## Was gelöscht wird (explizite Liste)

```
packages/shared-ai/src/planner/parser.ts              [- ~100 Zeilen]
packages/shared-ai/src/planner/parser.test.ts         [- ~150 Zeilen]

apps/mana/apps/web/src/lib/data/ai/proposals/         [- ganzer Ordner, ~400 Zeilen]
apps/mana/apps/web/src/lib/components/ai/AiProposalInbox.svelte      [- ~200 Zeilen]
apps/mana/apps/web/src/lib/data/ai/missions/server-iteration-staging.ts [- ~80 Zeilen]

apps/mana/apps/web/src/lib/modules/todo/ListView.svelte       [usage raus, Komponent bleibt]
apps/mana/apps/web/src/lib/modules/calendar/…                 [usage raus]
apps/mana/apps/web/src/lib/modules/places/…                   [usage raus]
apps/mana/apps/web/src/lib/modules/drink/…                    [usage raus]
apps/mana/apps/web/src/lib/modules/food/…                     [usage raus]
apps/mana/apps/web/src/lib/modules/news/…                     [usage raus]
apps/mana/apps/web/src/lib/modules/notes/…                    [usage raus]
apps/mana/apps/web/src/lib/modules/ai-missions/DetailView… (Inbox-Block) [usage raus]

apps/mana/apps/web/src/lib/data/database.ts           [Dexie-Schema-Bump: pendingProposals-Tabelle raus]
```

Summe: ~1000 Zeilen Code weg, deutlich reduzierte kognitive Komplexität.

## Dexie-Migration

Da **noch nicht live**, ist die Migration trivial:
- Schema-Version bumpen (z. B. v21 → v22)
- `db.version(22).stores({ pendingProposals: null, ... })` — Null-Store löscht die Tabelle
- Beim nächsten Open wird die Tabelle gedroppt. Keine User-Daten gehen verloren (lokale Dev-DBs haben nur Test-Einträge).

## Test-Strategie

### Mock-LLM-Client für deterministische Runner-Tests

```typescript
// packages/shared-ai/src/planner/mock-llm.ts
class MockLlmClient {
  private turns: MockTurn[] = [];
  enqueueToolCalls(calls: Array<{name: string, args: object}>): this { ... }
  enqueueStop(): this { ... }
  async chat(req): Promise<ChatResponse> { /* dequeue next turn */ }
}
```

Damit sind Runner-Tests deterministisch — kein echter LLM-Call nötig.

### Integration-Tests

Ein E2E-Test pro repräsentativer Mission in `apps/mana/apps/web/src/lib/data/ai/missions/runner.test.ts`:
- Quiz-Create (create_quiz + 8× add_quiz_question parallel)
- Note-Tagging (list_notes auto → für jede Note add_tag_to_note)
- Research-Flow (research_news auto → save_news_article × N)

Alle mit Mock-LLM + fake-indexeddb. Kein echter Provider im CI-Pfad.

### Provider-Smoke-Tests

Pro Provider (Gemini, Ollama, OpenAI) ein echter Call mit Trivial-`echo`-Tool. Läuft nur, wenn entsprechendes API-Secret in CI gesetzt — sonst skip. Verifiziert Schema-Passthrough.

### Schema-Round-Trip

Jeder `ToolSchema` im Catalog durch `toolToFunctionSchema` → gegen OpenAI-Function-Schema-JSON-Validator prüfen. Fängt Fehler im Konverter früh ab.

## Observability

Prometheus-Metriken (via bestehender `services/mana-ai/src/metrics.ts`-Pattern):

```
mana_ai_tool_calls_total{tool, policy, outcome}
mana_ai_planner_rounds_total             (histogram)
mana_ai_provider_errors_total{provider, kind}   kind ∈ {safety, rate_limit, capability, auth, unknown}
mana_ai_iteration_duration_seconds       (histogram)
```

Webapp-Runner trackt dieselben Metriken lokal im `_aiDebugLog` für In-App-Diagnose (keine Prom-Exposition aus dem Browser).

## Sicherheits-Review

Die Abschaffung des Approve-Gates ist ein **Policy-Shift**, keine technische Absenkung:

| Aspekt | Vorher (Propose) | Nachher (Auto + Revert) |
|---|---|---|
| **Was kann kaputt gehen?** | Falsche Proposals (User lehnt ab) | Falsche Writes in Dexie (User revertiert Iteration) |
| **Wie weit kann Schaden gehen?** | Klickermüdung, User-Frustration | Lokale Dexie-Einträge bis zum Revert. Sync pusht an Server — aber Revert syncs ebenfalls (Tombstone). |
| **Externe Side-Effects?** | Keine — alle Tools sind lokal | Keine — gleich. Wenn/wenn wir externe Tools einführen, kommt `confirm` zurück. |
| **Kredit-Kosten?** | LLM-Calls für Planung | Gleich. Tool-Execution kostet nichts extra außer `research_news deep` — das bleibt `auto`, aber `Mission.budget.maxCreditsPerIteration` ist der Guard. |

Kein Datenschutz-Unterschied — Encrypted Tables bleiben verschlüsselt, Executor läuft mit User-Actor-Kontext (AI-Actor-Attribution unverändert).

## Out of Scope

- **Streaming Tool-Calls** — v1 wartet auf volle Response. Nice-to-have für Chat-UX, separater PR.
- **Confirm-Policy** — YAGNI. Einfügen wenn echte External-Side-Effect-Tools gebaut werden.
- **Dry-Run-Mode** — „simuliere was passieren würde". Optional. Für jetzt reicht manual-Cadence + Revert.
- **Typed Tool-Params** — Generierung von TS-Types aus dem Catalog. Separater PR.
- **Browser-local LLM als Planner** — `@mana/local-llm` (Gemma via transformers.js) unterstützt Tool-Calling nicht zuverlässig. Bleibt Out-of-Scope.
- **shared-llm Tool-Call-Integration** (deferred 2026-04-20) — der webapp- und server-LlmClient sprechen aktuell direkt gegen mana-llm (`/v1/chat/completions`), an `LlmOrchestrator` vorbei. Damit verpassen Planner-Calls die Tier-Routing-Logik (BYOK / browser → server → cloud Fallback, per-task-Override). Ursprünglich Teil des Plans, aber die konkreten Vorteile sind gering: Browser-local Gemma unterstützt Function-Calling nicht zuverlässig (fällt als Tool-Tier eh aus), und BYOK/Cloud über mana-llm-Proxy ist mit Direct-Fetch funktional äquivalent. Einstiegspunkt für später: `LlmBackend`-Interface in `packages/shared-llm/src/types.ts` um `tools`/`toolCalls` erweitern, Backends durchreichen, Adapter `createLlmClientFromOrchestrator(task)` bauen. ~6 h Aufwand wenn der Use-Case konkret wird.

## PR-Struktur-Vorschlag

Ein logischer PR, aber in reviewbaren Commits:

```
1. chore(mana-llm): structured finish_reason errors in google provider
2. feat(mana-llm): tool schema + tool_calls passthrough (all providers)
3. feat(shared-ai): function schema converter from catalog
4. feat(shared-ai): runPlannerLoop with multi-turn tool-calling
5. feat(webapp): migrate runner to runPlannerLoop; delete parser + proposals
6. feat(mana-ai): migrate tick to runPlannerLoop; delete server-iteration-staging
7. feat(companion): share runPlannerLoop with planner
8. chore: dexie schema bump to drop pendingProposals
9. test: mock llm client + e2e mission tests
```

Jeder Commit kompiliert für sich. Der große Delete (Commit 5) passiert atomar mit dem Ersatz — keine kaputten Zwischenstände.

## Aufwand

| Posten | Aufwand |
|---|---|
| Phase 0 — Hotfix google.py finish_reason | 1h |
| Provider-Layer Tool-Schema + tool_calls | 4h |
| shared-ai Converter + Runner + Prompt schrumpfen | 5h |
| Webapp-Runner + großer Delete | 4h |
| mana-ai Server-Runner | 2h |
| Companion-Chat-Migration | 2h |
| Timeline-UI-Polish | 3h |
| Tests (Mock-LLM + E2E) | 4h |
| **Summe** | **~25h** |

Kein Kalender-Overhead (kein schrittweiser Rollout, keine Beobachtungsphase).

## Ergebnis

Nach dem PR:
- ~1000 Zeilen Code gelöscht, ~600 hinzugekommen — Netto ~400 LoC weniger
- Ein Ausführungspfad statt zwei
- Robuste LLM-Output-Struktur (SDK-garantiert)
- Missionen laufen end-to-end ohne User-Interaction
- Companion Chat antwortet sofort mit Tool-Results
- Timeline wird das zentrale AI-UI — ein Ort statt acht
