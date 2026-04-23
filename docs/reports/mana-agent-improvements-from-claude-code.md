# Mana-Agent-Infrastruktur — Verbesserungen aus den Claude-Code-Learnings

**Stand:** 2026-04-23
**Voraussetzung:** [`claude-code-architecture.md`](./claude-code-architecture.md)

> Konkrete, priorisierte Verbesserungsvorschläge für unser Agent-Stack
> (`services/mana-ai`, `services/mana-mcp`, `packages/mana-tool-registry`,
> `packages/shared-ai`, Persona-Runner), abgeleitet aus den Patterns, die
> Claude Code durch Reverse-Engineering exponiert hat.

---

## Inhalt

1. [Zusammenfassung](#1-zusammenfassung)
2. [Ist-Stand: Wo steht unser Stack wirklich?](#2-ist-stand-wo-steht-unser-stack-wirklich)
3. [Gap-Analyse gegen Claude Code](#3-gap-analyse-gegen-claude-code)
4. [Verbesserung 1 — Permission-Gateway `UH1`-Style](#4-verbesserung-1--permission-gateway-uh1-style)
5. [Verbesserung 2 — Reminder-Injection statt History-Pollution](#5-verbesserung-2--reminder-injection-statt-history-pollution)
6. [Verbesserung 3 — Context-Compressor `wU2`-Style](#6-verbesserung-3--context-compressor-wu2-style)
7. [Verbesserung 4 — Parallel-Execution `gW5`-Style](#7-verbesserung-4--parallel-execution-gw5-style)
8. [Verbesserung 5 — Sub-Agent-Pattern `I2A`-Style](#8-verbesserung-5--sub-agent-pattern-i2a-style)
9. [Verbesserung 6 — Haiku-Tier für Background-Tasks](#9-verbesserung-6--haiku-tier-für-background-tasks)
10. [Verbesserung 7 — Async-Steering-Bus `h2A`-Style](#10-verbesserung-7--async-steering-bus-h2a-style)
11. [Verbesserung 8 — Deprecated-Tool-Training](#11-verbesserung-8--deprecated-tool-training)
12. [Roadmap und Priorisierung](#12-roadmap-und-priorisierung)
13. [Explizit nicht übernehmen](#13-explizit-nicht-übernehmen)

---

## 1. Zusammenfassung

Claude Code ist im Kern ein **minimaler Agent-Loop mit sehr viel Environment-
Engineering drumherum**. Unser Mana-Stack hat den Loop (`runPlannerLoop` in
[`packages/shared-ai/src/planner/loop.ts`](../../packages/shared-ai/src/planner/loop.ts))
und die Tool-Registry bereits sauber getrennt — aber fast das gesamte
„drumherum" fehlt: Permission-Gating, Reminder-Injection, Context-Compression,
parallele Tool-Execution, Sub-Agent-Isolation, Async-Steering.

Die gute Nachricht: unsere Architektur ist *vorbereitet*. Die Registry-
Trennung (`@mana/tool-registry`, `@mana/shared-ai`), die saubere `ToolContext`-
Abstraktion, die LWW-Projektionen — all das sind solide Fundamente, auf denen
man die Claude-Code-Patterns inkrementell nachziehen kann, ohne den Stack
umzubauen.

**Größter Impact-Hebel:** Reminder-Injection + Context-Compression.
**Größtes Sicherheitsdefizit:** fehlendes Permission-Gate auf MCP-Ebene.
**Größter Performance-Hebel:** Parallel-Tool-Execution bei Read-Tools.

---

## 2. Ist-Stand: Wo steht unser Stack wirklich?

### Die Haupt-Loop: `runPlannerLoop`

Unser Äquivalent zu Claude Codes `nO`-Master-Loop lebt in
[`packages/shared-ai/src/planner/loop.ts:117-210`](../../packages/shared-ai/src/planner/loop.ts).
Das Muster ist isomorph zu Claude Code:

```ts
while (rounds < maxRounds) {                   // entspricht Claude's while-loop
  const response = await llm.complete(...);    // entspricht stop_reason-Check
  if (response.toolCalls.length === 0) break;  // terminiert bei Text
  for (const call of response.toolCalls) {
    await onToolCall(call);                    // entspricht MH1-Dispatch
  }
}
```

**Abweichungen:**

- `DEFAULT_MAX_ROUNDS = 5` ([loop.ts:115](../../packages/shared-ai/src/planner/loop.ts#L115)) — Claude Code hat kein hartes Round-Limit, sondern ein Token-Limit.
- Tool-Calls werden **sequenziell** abgearbeitet ([loop.ts:172-188](../../packages/shared-ai/src/planner/loop.ts#L172)) — explizit so dokumentiert: „Parallel execution is a perfectly valid optimisation for pure-read tools but we keep order here".
- Kein Permission-Gate — `onToolCall` wird einfach aufgerufen.
- Kein Reminder-Injection-Mechanismus — System + Prior + User, fertig.

### Mission-Runner: `mana-ai`

[`services/mana-ai/src/cron/tick.ts`](../../services/mana-ai/src/cron/tick.ts)
(670 Zeilen) orchestriert den Loop im Background. Besonderheiten:

- **60-Sekunden-Tick statt event-driven** ([tick.ts:102-286](../../services/mana-ai/src/cron/tick.ts#L102)) — das Polling-Modell fängt DB-Changes nur mit Lag auf.
- **Overlap-Guard** via Module-Level-Boolean `running` ([tick.ts:100](../../services/mana-ai/src/cron/tick.ts#L100)) — einfach aber funktioniert.
- **Cross-Tick-State-Machine** für Deep Research ([tick.ts](../../services/mana-ai/src/cron/tick.ts), `handleDeepResearch`) — das einzige Feature, das „länger als ein Tick" überbrückt.
- **Per-Agent-Concurrency** ([tick.ts:194-208](../../services/mana-ai/src/cron/tick.ts#L194)) — mit Budget-Gate auf Token-Ebene. Gut.
- **Key-Grants** ([tick.ts, crypto/](../../services/mana-ai/src/crypto)) — RSA-OAEP-gewrappte MDKs pro Mission, TTL-clamped. Sehr solide.

### MCP-Gateway: `mana-mcp`

[`services/mana-mcp/src/`](../../services/mana-mcp/src) ist **bereits
implementiert**, nicht nur geplant. 379 LOC total, stateless, JWT-gated.
Tool-Registrierung in
[`mcp-adapter.ts:81-124`](../../services/mana-mcp/src/mcp-adapter.ts#L81):

```ts
for (const spec of getRegistry()) {
  if (!isExposable(spec)) continue;   // filter admin-scoped
  server.tool(spec.name, spec.description, shape, invoke);
}
```

Das ist elegant — aber **`isExposable` ist die einzige Policy-Schicht**
([mcp-adapter.ts:35-37](../../services/mana-mcp/src/mcp-adapter.ts#L35)). Es
gibt keine Rate-Limits, keine pro-Request-Policy, keine User-Whitelist pro
Tool, keine Command-Injection-Prüfung für freie Text-Felder.

### Tool-Registry: `@mana/tool-registry`

[`packages/mana-tool-registry/src/`](../../packages/mana-tool-registry/src)
(rund 400 LOC). Sehr sauber:

- `ToolSpec<I, O>` mit Zod-Schemas ([types.ts:91-122](../../packages/mana-tool-registry/src/types.ts#L91))
- `ToolContext` mit `userId`/`spaceId`/`jwt`/`invoker`/`getMasterKey` ([types.ts:58-74](../../packages/mana-tool-registry/src/types.ts#L58))
- `registerTool` + `getRegistry` Singleton ([registry.ts](../../packages/mana-tool-registry/src/registry.ts))
- `encryptedFields` als **deklaratives** Feld — nicht handler-intern. Genial für zukünftige CI-Drift-Checks gegen die web-app `crypto/registry.ts`.

**Aktuell abgedeckte Module:** `habits`, `spaces`, `todo`, `notes`, `journal`,
`calendar`, `contacts`, `articles`, `missions`, `tags` ([types.ts:18-29](../../packages/mana-tool-registry/src/types.ts#L18)).
Laut `mana-ai/CLAUDE.md`: 31 propose-Tools über 16 Module sind server-seitig
sichtbar; 28 weitere auto-Tools leben ausschließlich in der Webapp.

### Persona-Runner

Nicht implementiert. Plan in
[`docs/plans/mana-mcp-and-personas.md`](../plans/mana-mcp-and-personas.md).
Wichtig: wir haben dort die Chance, die Sub-Agent-Patterns aus §8 **direkt
richtig** zu bauen, statt nachträglich nachzurüsten.

---

## 3. Gap-Analyse gegen Claude Code

| Pattern (Claude Code)               | Mana-Äquivalent                                 | Status                     | Priorität |
|-------------------------------------|-------------------------------------------------|----------------------------|-----------|
| `nO` Master-Loop                    | `runPlannerLoop`                                | ✅ vorhanden, solide        | —         |
| `MH1` Tool-Dispatcher               | `onToolCall` + Registry-Handler                 | ✅ vorhanden                | —         |
| `UH1` Permission-Gateway            | nur `isExposable` Admin-Filter                  | ⚠️ stark lückenhaft        | **hoch**  |
| `gW5` Parallel-Scheduler (max 10)   | sequenziell                                     | ❌ fehlt                    | mittel    |
| `wU2` 92%-Compressor                | keinerlei Context-Kompression                   | ❌ fehlt                    | **hoch**  |
| `<system-reminder>` Reminder-Injection | User-Prompt-Concat, kein transientes Channel | ❌ fehlt                    | **hoch**  |
| `h2A` Async-Message-Queue           | 60s-Tick, kein mid-task interrupt               | ❌ fehlt                    | niedrig   |
| `I2A` Sub-Agent (Fresh-Context)     | Persona-Runner (extern, geplant)                | 🟡 im Plan, nicht isomorph | mittel    |
| File-Freshness-Tracking             | n/a — wir editieren keine Files                 | — n/a                      | —         |
| Haiku für Background-Tasks          | alle Calls gehen an mana-llm primary model      | ❌ fehlt                    | mittel    |
| BatchTool deprecated                | wir haben weder Batch noch parallel             | — n/a                      | —         |
| CLAUDE.md-Disclaimer-Pattern        | Agent-Context / Memory ohne Disclaimer          | 🟡 improvement-worth       | niedrig   |

---

## 4. Verbesserung 1 — Permission-Gateway `UH1`-Style

### Problem

[`services/mana-mcp/src/mcp-adapter.ts:34-37`](../../services/mana-mcp/src/mcp-adapter.ts#L34)
— der einzige Gate ist Scope-Filter:

```ts
function isExposable(spec: AnyToolSpec): boolean {
  return spec.scope === 'user-space';
}
```

Das reicht nicht:

- Kein **pro-User-Opt-In** für gefährliche Tools (z. B. `habits.delete`).
- Kein **Rate-Limit** pro User pro Tool (MCP ist JWT-gated, aber ein entwendeter JWT kann in 10 Sekunden 1000 Calls machen).
- Kein **Path-/Content-Filter** für Freitext-Argumente (Tool `notes.create` mit `content` könnte Prompt-Injection ins Frontend tragen).
- `destructive`-Policy-Hint ist **dokumentiert** ([types.ts:48](../../packages/mana-tool-registry/src/types.ts#L48)) aber nicht **durchgesetzt** — die Registry weiß, welches Tool destructive ist, aber niemand liest das an der Grenze.

### Vorschlag

Ein zentrales `evaluatePolicy()` in `@mana/tool-registry`:

```ts
// packages/mana-tool-registry/src/policy.ts (neu)
export interface PolicyDecision {
  allow: boolean;
  reason?: string;
  /** Optional: inject as <system-reminder> on next turn. */
  reminder?: string;
}

export function evaluatePolicy(
  spec: AnyToolSpec,
  ctx: ToolContext,
  rawInput: unknown,
  opts: {
    userSettings?: { allowDestructive: boolean; perToolRateLimit?: number };
    recentInvocations?: readonly { toolName: string; at: Date }[];
  },
): PolicyDecision;
```

Aufgerufen wird sie in `mcp-adapter.ts` **vor** `spec.handler()` und — wichtig
— auch in `mana-ai`s `onToolCall`-Callback. Damit ist die Policy an einer
Stelle und für beide Consumer gültig.

**Konkrete Regeln für M1:**

- `policyHint: 'destructive'` → Default `deny`, User muss explizit in Settings
  opt-in (pro Tool oder pro Scope).
- Rolling 60-Sekunden-Window: Cap bei 30 Calls/Tool/User/Minute auf MCP.
- Für Tools mit Freitext-Argumenten (`content`, `description`, `note`): ein
  Zod `.refine()` das klassische Injection-Marker (`{{`, `<system`,
  `ignore previous`) erkennt und loggt — nicht blockiert, aber markiert.

### Aufwand

~1 Tag. Die Registry ist dafür gebaut.

---

## 5. Verbesserung 2 — Reminder-Injection statt History-Pollution

### Problem

In [`runPlannerLoop`](../../packages/shared-ai/src/planner/loop.ts#L131) wird
die `messages`-History pro Round durch Assistant- und Tool-Turns erweitert —
korrekt und nötig. Was **nicht** passiert: transienter Kontext (Token-Budget,
Agent-Memory-Updates, User-Interjections, Mission-Deadline-Änderungen) wird
entweder

1. in den System-Prompt eingebacken und bleibt dort ewig (veraltet), oder
2. in den User-Prompt per String-Concatenation injiziert (mutiert die
   History, invalidiert KV-Cache, landet in Logs).

Die `<agent_context>`-Blöcke aus
[`mana-ai` v0.5](../../services/mana-ai/CLAUDE.md) sind schon ein Schritt in
die richtige Richtung, aber sie sind im System-Prompt und nicht transient.

### Vorschlag

**`ReminderChannel`** als neuer Input-Slot für `runPlannerLoop`:

```ts
// packages/shared-ai/src/planner/loop.ts
export interface PlannerLoopInput {
  // … bestehende Felder …
  /** Per-round transient hints. Called after every assistant turn;
   *  injected as a fresh system message at the end of `messages` before
   *  the next LLM call. NOT persisted in the returned message log. */
  readonly reminderChannel?: (roundIndex: number, state: LoopState) => string | null;
}
```

Die Reminder-Strings werden als transiente `{ role: 'system', content: '<reminder>…</reminder>' }`
**vor jedem LLM-Call** eingefügt und **nach** dem Call wieder entfernt — sie
leben nie in `messages`, landen nicht in der Iteration-History. Genau das
Pattern von Claude Codes `<system-reminder>`-Tags.

**Use-Cases heute schon sinnvoll:**

- Token-Budget: „Du hast 80 % deines Mission-Budgets verbraucht. Plane Tool-Calls sparsam."
- Mission-Timer: „Mission ist in 2 Minuten überfällig — priorisiere."
- Zero-Knowledge-Mode: „User ist ZK — verbotene Tabellen werden nicht decrypted. Frag nicht nach."
- Nach TodoWrite: aktuellen Todo-State echoen (wie in Claude Code, §7).
- Stale-Data-Warning: „Letzter Sync vor 45 min — Daten könnten veraltet sein."

### Aufwand

~4h für die Loop-Änderung, ~2 Tage für die ersten drei Reminder-Producer.

### Warum wichtig

Das ist der **größte qualitative Hebel** — er wirkt sich auf jede einzelne
Mission-Iteration aus, nicht nur auf Edge-Cases. Genau das, was Claude Code
so feedback-sensitiv macht.

---

## 6. Verbesserung 3 — Context-Compressor `wU2`-Style

### Problem

Bei langlaufenden Missions (Deep Research, Multi-Round-Plans) wird die
Iteration-History in `Mission.iterations[]` immer länger. Heute wird sie
komplett in den `buildSystemPrompt()`-Call geschoben — irgendwann overflowed
das den Context.

[`services/mana-ai/src/cron/tick.ts:211-221`](../../services/mana-ai/src/cron/tick.ts#L211)
ruft `planOneMission`, das via `runPlannerLoop` alle Iterations durchreicht.
**Kein** Abbruch, kein Pruning, keine Summary.

### Vorschlag

Einen dedizierten `compactHistory()` pro Mission-Lifecycle:

```ts
// packages/shared-ai/src/planner/compact.ts (neu)
export async function compactIterations(
  iterations: readonly MissionIteration[],
  llm: LlmClient,
  opts: { budgetTokens: number; maxInputTokens: number },
): Promise<{ preserved: MissionIteration[]; summary: CompactSummary }>;
```

**Trigger-Heuristik** (analog zum 92 %-Trigger):

- Wenn die kumulierte Token-Schätzung der `iterations[]` > `0.6 × maxInputTokens` → komprimieren.
- Alle Iterations älter als die letzten 3 werden in eine einzelne **Compact-Iteration** gefasst mit dem Schema `{ goal, decisions, filesChanged, currentProgress }` (genau das, was Claude Code persistiert).
- Die Compact-Iteration wird als synthetische Iteration mit `actor: { kind:'system', source:'compactor' }` in `Mission.iterations[]` geschrieben und die summierten Originale werden **archiviert** in einer neuen Tabelle `mana_ai.iteration_archive` (nicht gelöscht, nur nicht mehr Teil des Prompt-Contexts).

**Kompressionsrate** aus Claude Code: ~6.8× gemeldet. Bei uns realistisch
~3-5×, weil Iterations schon strukturiert sind.

### Aufwand

~3-5 Tage inkl. Archiv-Tabelle und Migration.

### Wann sinnvoll

**Jetzt** für Deep-Research-Missions (die schon heute Token-Explosion
riskieren), später für normale Multi-Round-Plans.

---

## 7. Verbesserung 4 — Parallel-Execution `gW5`-Style

### Problem

[`packages/shared-ai/src/planner/loop.ts:172-188`](../../packages/shared-ai/src/planner/loop.ts#L172) —
Kommentar im Code:

> „Parallel execution is a perfectly valid optimisation for pure-read tools
> but we keep order here so the message log tells a linear story when the
> user debugs a failure."

Das Argument ist legitim für Debug-Ergonomie, kostet aber bei multi-Read-
Plans linear Zeit. Mission mit 5 `read_*`-Tools: 5× LLM-Latency statt 1×.

### Vorschlag

Claude Codes `gW5`-Regel direkt übernehmen:

1. **Parallelisieren** wenn alle `toolCalls` einer Round `policyHint: 'read'` haben.
2. **Serialisieren** sobald eine davon `write`/`destructive` ist.
3. **Harte Grenze 10 parallel** — bei mehr: in Batches à 10.

```ts
// packages/shared-ai/src/planner/loop.ts (patch)
const allRead = calls.every(c => getPolicyHint(c.name) === 'read');
if (allRead && calls.length > 1) {
  const results = await Promise.all(
    calls.slice(0, 10).map(call => onToolCall(call))
  );
  // … append to messages in source order, not completion order
} else {
  for (const call of calls) { /* sequential */ }
}
```

Wichtig: Reihenfolge in `messages` bleibt **Source-Order**, nicht
Completion-Order. Das erhält die Debug-Lesbarkeit, die der bisherige
Kommentar schützen wollte — wir verlieren also nichts, gewinnen aber
Wanduhr-Zeit.

### Aufwand

~2h. Die Information (`policyHint`) existiert bereits in der Registry.

### Voraussetzung

Verbesserung 1 (Policy-Gate) sollte vorher laufen, damit `policyHint` an der
Loop-Grenze autoritativ ist.

---

## 8. Verbesserung 5 — Sub-Agent-Pattern `I2A`-Style

### Problem

Der Plan sieht den Persona-Runner als **eigenes Service** auf :3070 vor
([`docs/plans/mana-mcp-and-personas.md`](../plans/mana-mcp-and-personas.md)).
Das ist für Deployment-Isolation sinnvoll, aber es **ist nicht** das
Claude-Code-Pattern.

Claude Codes `I2A` ist *in-process*:

- Fresh `messages[]` (kein Parent-History-Leak)
- eigenes Token-Budget
- eigene Tool-Permissions (restriktiver)
- Parent kriegt **nur die finale Summary** zurück, nicht die Zwischenschritte
- Rekursions-Grenze: 1 Level

### Vorschlag

**Zwei-Schichten-Modell**:

**(a) In-Process Sub-Loop** in `@mana/shared-ai`:

```ts
// packages/shared-ai/src/planner/sub-agent.ts (neu)
export async function runSubAgent(opts: {
  readonly parentLoop: { messages: readonly ChatMessage[]; spec: ToolSpec };
  readonly task: string;
  readonly allowedTools: readonly string[];  // Whitelist, restriktiver als Parent
  readonly maxRounds?: number;                // Default 3
  readonly llm: LlmClient;
  readonly onToolCall: (call: ToolCallRequest) => Promise<ToolResult>;
}): Promise<{ summary: string; usage: TokenUsage }>;
```

Wird vom `Task`-ähnlichen Tool in der Registry aufgerufen. Rekursion wird
über einen Depth-Counter im `ToolContext` verhindert
(`ctx.subAgentDepth >= 1 → error`).

**(b) Persona-Runner als Out-of-Process Orchestrator** für Langläufer — der
bleibt, wie im Plan, ein eigener Service. Aber: er ruft intern denselben
`runSubAgent`-Code, nur mit höherem Round-Budget und Persona-spezifischen
System-Prompt.

### Warum zweistufig

In-Process-Sub-Agents sind für **Context-Laundering** da (dirty Recherche-
Kontext vom Parent fernhalten). Der Persona-Runner ist für **Langzeit-
Lifecycles** (eine Persona lebt über mehrere Wochen). Beides braucht dasselbe
primitive `runSubAgent`, aber andere Deployment-Modelle.

### Aufwand

~1 Woche.

---

## 9. Verbesserung 6 — Haiku-Tier für Background-Tasks

### Problem

Claude Code nutzt Haiku für hochfrequente Nebencalls:

- Quota-Check
- Topic-Detection
- Session-Summarization
- Command-Injection-Detection
- Auto-Compact-Fallback

Bei uns geht **jeder** Call an `mana-llm` mit dem Default-Modell — das ist
für Routing-Entscheidungen ("ist dieser User-Input eine Frage oder eine
Mission?") overkill und teuer.

### Vorschlag

`@mana/shared-ai` bekommt einen `TieredLlmClient`:

```ts
// packages/shared-ai/src/planner/tiered-client.ts (neu)
export function createTieredLlmClient(baseUrl: string): {
  primary: LlmClient;    // für runPlannerLoop
  fast: LlmClient;       // für Classification, Summarization, Guard
};
```

Konkrete Einsätze:

- **`compactIterations`** (§6) → `fast` statt `primary`. Spart 80 % Kosten
  beim Kompressor.
- **Mission-Trigger-Klassifikation** statt Regex (heute
  [`tick.ts:73-82`](../../services/mana-ai/src/cron/tick.ts#L73)): statt
  `DEEP_RESEARCH_TRIGGER` als Regex ein Haiku-Call „Ist dieses Mission-
  Objective Deep Research?" — robuster und überrascht nicht bei neuen
  Formulierungen.
- **Reminder-Producer** (§5): Der Token-Budget-Reminder wird via `fast`
  formuliert statt hartkodiert — variiert die Phrase pro Runde (weniger
  Prompt-Staleness).
- **Command-Injection-Check** für Freitext-Tool-Args (in §4 erwähnt) →
  `fast`.

### Modell-Mapping in mana-llm

Wir müssen `mana-llm` einen `tier: 'primary' | 'fast'` Request-Parameter geben,
der dann intern auf ein billigeres Modell routet (z. B. Ollama `llama3.1:8b`
lokal für `fast`, Claude/Gemini-primary über Cloud für `primary`).

### Aufwand

~3 Tage, fast alles in `mana-llm`.

---

## 10. Verbesserung 7 — Async-Steering-Bus `h2A`-Style

### Problem

Unser Mission-Runner tickt alle 60 Sekunden
([`tick.ts:102`](../../services/mana-ai/src/cron/tick.ts#L102)). Wenn der
User mid-Mission etwas ändert (neues Objective, Mission pausieren, neuen
Kontext hinzufügen), wird das erst im **nächsten** Tick sichtbar.

Claude Codes `h2A` ermöglicht User-Interjections *während* ein Tool läuft.
Das ist für uns **nur teilweise** relevant — Missions sind explizit als
Background-Jobs konzipiert — aber es gibt einen konkreten Use-Case:

### Konkreter Use-Case: Companion-Chat im Frontend

Die Webapp hat einen Companion-Chat (unified mana app). Der läuft interaktiv.
Heute nutzt er vermutlich
([`packages/shared-ai/src/planner/loop.ts`](../../packages/shared-ai/src/planner/loop.ts))
direkt — also dieselbe sequenzielle Loop.

**Vorschlag:** `runPlannerLoop` bekommt einen optionalen `AbortSignal` und
einen `InterruptChannel`:

```ts
export async function runPlannerLoop(opts: {
  // … bestehend …
  readonly signal?: AbortSignal;
  readonly interruptChannel?: {
    readonly take: () => ChatMessage | null;  // non-blocking pull
  };
}): Promise<PlannerLoopResult>;
```

Vor jedem nächsten LLM-Call: `const msg = interruptChannel?.take()` — falls
vorhanden, als `user`-Message einfügen statt die Loop stumpf weiterlaufen
zu lassen.

### Aufwand

~1 Tag.

### Ausdrücklich nicht tun

`h2A` **nicht** für `mana-ai`-Background-Missions einbauen. Der Tick-
Ansatz ist für Server-side-Missions korrekt — User-Interjections kommen dort
über den normalen Sync-Flow (Mission-Update → nächster Tick sieht es).

---

## 11. Verbesserung 8 — Deprecated-Tool-Training

### Problem

Wir haben aktuell 59+ Tools in der Registry/Shared-AI. Nicht alle sind
gleich sinnvoll für LLMs zum Planen — manche sind redundant (`notes.create`
vs. `notes.append_to_note` vs. `notes.update_note`), manche werden praktisch
nie genutzt.

Claude Codes **BatchTool-Deprecation** ist instruktiv: Anthropic hat das
Tool rausgenommen, weil das Modell selbst gelernt hat, mehrere `tool_use`-
Blocks pro Turn zu senden — das Feature war wegtrainiert.

### Vorschlag

Einen monatlichen **Tool-Usage-Audit**:

- Metrik `mana_ai_tool_invocations_total{tool}` aus bereits existierenden Metrics
- Report aller Tools unter Top-50-Percentile-Calls → Kandidat für Deprecation
- Alternative: `mcp-adapter.ts` loggt den **vom Modell geforderten aber
  erfolglosen** Tool-Call — daraus wird sichtbar, welche Tools das Modell
  erfindet, weil der Name „intuitiv" wäre (z. B. `notes.delete` wenn wir nur
  `notes.archive` haben).

Das ist weniger eine Code-Änderung und mehr ein **Prozess**: alle 6 Wochen
einen 1-Stunden-Review, Tools konsolidieren.

### Aufwand

0 für die Infra (Metrics sind da). 1h pro Audit-Zyklus.

---

## 12. Roadmap und Priorisierung

### M1 (2 Wochen)

| # | Verbesserung                       | Aufwand | Abhängigkeit       |
|---|------------------------------------|---------|--------------------|
| 1 | Permission-Gateway (§4)            | 1 Tag   | —                  |
| 2 | Reminder-Injection Loop-API (§5)   | 4 h     | —                  |
| 3 | Parallel-Execution für Reads (§7)  | 2 h     | §4 (policyHint)    |
| 4 | Async-Steering im Companion (§10)  | 1 Tag   | —                  |

**M1-Outcome:** Sicherer MCP-Gateway, qualitativ bessere Mission-Planung durch
Reminders, schnellere Multi-Read-Plans, Companion-Chat abbruchbar.

### M2 (3-4 Wochen)

| # | Verbesserung                         | Aufwand  | Abhängigkeit  |
|---|--------------------------------------|----------|---------------|
| 5 | Context-Compressor `wU2` (§6)        | 3-5 Tage | §9            |
| 6 | Haiku-Tier in `mana-llm` (§9)        | 3 Tage   | —             |
| 7 | Reminder-Producer Library (§5)       | 2 Tage   | M1 #2         |

**M2-Outcome:** Deep-Research-Missions skalieren, Background-Calls 80 %
billiger, Reminder-Channel in Produktion.

### M3 (Persona-Runner)

| # | Verbesserung                         | Aufwand   | Abhängigkeit  |
|---|--------------------------------------|-----------|---------------|
| 8 | In-Process `runSubAgent` (§8)        | 1 Woche   | M1 #1, M2 #5  |
| 9 | Persona-Runner nutzt `runSubAgent`   | 2 Wochen  | M3 #8         |

**M3-Outcome:** Sub-Agent-Pattern einheitlich, Persona-Runner kann
komplexe Multi-Step-Personas orchestrieren, ohne Parent-Context zu
verseuchen.

### Ongoing

| # | Verbesserung                         | Aufwand             |
|---|--------------------------------------|---------------------|
| 10 | Tool-Usage-Audit (§11)              | 1h alle 6 Wochen    |

---

## 13. Explizit nicht übernehmen

Nicht jedes Claude-Code-Pattern macht für uns Sinn:

- **File-Freshness-Tracking** — wir editieren keine Dateien im
  Agent-Kontext. Das Äquivalent wäre „Sync-Freshness-Tracking", das aber
  schon durch `mana_sync` LWW-Semantik adressiert ist.
- **`BatchTool` einführen** — das Claude-Code-Pattern ist, `BatchTool` zu
  *deprecaten*, weil das Modell nativ parallele `tool_use`-Blocks sendet.
  Wir sollten das direkt als Endzustand adoptieren (§7), nicht über ein
  Batch-Zwischenstadium gehen.
- **yoga.wasm / Ink** — die Mana-Webapp ist SvelteKit, kein Terminal-UI.
  Das UI-Layer-Muster ist für uns irrelevant.
- **`--bypassPermissions`-Mode** — für ein Multi-User-Produkt mit
  Zero-Knowledge-Option darf es kein Opt-Out aus der Policy geben.
- **Der Haiku-Quota-Ping** — unser Billing läuft über `mana-credits`, wir
  sehen Quota deterministisch vor dem Call, nicht probabilistisch.

---

## Related

- [`claude-code-architecture.md`](./claude-code-architecture.md) — Technische Grundlage dieses Berichts
- [`docs/plans/mana-mcp-and-personas.md`](../plans/mana-mcp-and-personas.md) — Ongoing-Plan für mana-mcp + persona-runner
- [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20-22 — Agent-Design der Webapp
- [`docs/reports/ai-agent-architecture-comparison.md`](./ai-agent-architecture-comparison.md) — Weiterer externer Vergleich
