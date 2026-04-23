# Agent-Loop Improvements — M1 + M2 (core)

_Started 2026-04-23. M1 + M2 core abgeschlossen 2026-04-23 (13 Commits)._

Ursprünglich drei M1-Verbesserungen (Policy-Gate, Reminder-Channel,
Parallel-Reads). In derselben Session nachgezogen: M2 Context-Compressor
inkl. Producer-Integration (siehe unten), weil die Reminder-Channel-
Infrastruktur das passende Vehikel dafür war.

**Hintergrund:**
- [`docs/reports/claude-code-architecture.md`](../reports/claude-code-architecture.md) — wie Claude Code intern aufgebaut ist
- [`docs/reports/mana-agent-improvements-from-claude-code.md`](../reports/mana-agent-improvements-from-claude-code.md) — vollständige Gap-Analyse mit 8 Verbesserungen; dies hier ist die priorisierte M1-Teilmenge

## Ziel in einem Satz

Den `runPlannerLoop` um drei Primitive erweitern, die Claude Code hat und
wir nicht haben: einen **Permission-Gate vor Tool-Execution**, einen
**transienten Reminder-Channel** für Per-Round-Hinweise, und
**Parallelisierung für reine Read-Tools**.

## Nicht-Ziele

- **Kein** Umbau von `runPlannerLoop`s Grundstruktur — nur Erweiterungen.
- **Keine** Änderung am Message-Log-Format — Iterations bleiben binärkompatibel.
- **Keine** neue LLM-Route, kein neues Modell, kein Haiku-Tier (das ist M2).
- **Kein** Context-Compressor (das ist M2, braucht eigene Archiv-Tabelle).
- **Kein** Sub-Agent-Pattern (das ist M3, zusammen mit dem Persona-Runner).

## Wer profitiert

| Konsument             | Nutzen                                                   |
|-----------------------|----------------------------------------------------------|
| `services/mana-ai`    | bessere Mission-Pläne + schnellere Multi-Read-Ticks      |
| `services/mana-mcp`   | Schutz gegen missbräuchliche MCP-Clients                 |
| Webapp Companion-Chat | bessere Antworten durch Per-Round-Context-Hinweise       |
| Persona-Runner (M3)   | Fundament — braucht Permission-Gate bevor es live darf   |

---

## Verbesserung 1 — Permission-Gate vor Tool-Execution

### Was es macht

Bevor ein Tool-Handler aufgerufen wird, läuft ein zentrales `evaluatePolicy()`
aus `@mana/tool-registry`. Das Gate entscheidet anhand von Tool-Scope,
Policy-Hint, Usage-History und User-Settings, ob die Ausführung erlaubt ist.

### Was es ermöglicht

- **Destructive-Tools werden per Default blockiert.** Heute ist `policyHint:
  'destructive'` nur dokumentiert ([types.ts:48](../../packages/mana-tool-registry/src/types.ts#L48)),
  nicht durchgesetzt. Künftig: User muss in Settings explizit opt-in pro
  Tool oder Scope.
- **Rate-Limiting pro User pro Tool.** Heute kann ein entwendeter JWT in
  10 Sekunden hunderte Calls machen. Künftig: Cap 30 Calls/Tool/Minute
  (konfigurierbar pro Tool).
- **Freitext-Input-Inspektion.** Für Tools mit String-Feldern (`content`,
  `description`, `note`): Marker wie `{{`, `<system`, `ignore previous`
  werden erkannt und als Metrik markiert. Nicht blockiert (zu viele False
  Positives), aber sichtbar.
- **Ein Policy-Ort für beide Consumer.** `mana-mcp` und `mana-ai` rufen
  denselben Code — keine Drift mehr.

### Heutiger Zustand (Problem)

[`services/mana-mcp/src/mcp-adapter.ts:34-37`](../../services/mana-mcp/src/mcp-adapter.ts#L34):

```ts
function isExposable(spec: AnyToolSpec): boolean {
  return spec.scope === 'user-space';
}
```

Das ist der gesamte Gate. `mana-ai`s `onToolCall` hat gar nichts.

### Neuer Zustand (Lösung)

Neues Modul `packages/mana-tool-registry/src/policy.ts`:

```ts
export interface PolicyDecision {
  readonly allow: boolean;
  readonly reason?: string;
  /** Optional hint, wird von M1 Verbesserung 2 als Reminder-Tag
   *  an den nächsten LLM-Turn angehängt. */
  readonly reminder?: string;
}

export interface PolicyInput {
  readonly spec: AnyToolSpec;
  readonly ctx: ToolContext;
  readonly rawInput: unknown;
  readonly userSettings: {
    readonly allowDestructive: readonly string[];  // Tool-Names Whitelist
    readonly perToolRateLimit?: number;             // default 30/min
  };
  readonly recentInvocations: readonly { toolName: string; at: number }[];
}

export function evaluatePolicy(input: PolicyInput): PolicyDecision;
```

Integration:

- [`services/mana-mcp/src/mcp-adapter.ts`](../../services/mana-mcp/src/mcp-adapter.ts) ruft `evaluatePolicy()` in `invoke()` **vor** `spec.handler()`.
- [`services/mana-ai/src/cron/tick.ts`](../../services/mana-ai/src/cron/tick.ts) ruft es im `onToolCall`-Callback.
- `recentInvocations` kommt aus einer In-Memory-Ringbuffer pro User (beide Services).

### Aufwand

~1 Arbeitstag (6-8h).

### Tests

- Unit-Tests in `packages/mana-tool-registry/src/policy.test.ts`: je ein
  Case für allow/deny pro Policy-Regel.
- MCP-Integration-Test: Destructive-Tool-Call ohne Opt-In → 403 mit
  klarer Fehlermeldung.
- Rate-Limit-Test: 31 Calls in 60s → letzter wird geblockt.

### Rollout

Flag-gated per ENV `POLICY_ENFORCE=true` (default off). Erst eine Woche
**log-only** (alle Decisions werden geloggt, nichts blockiert), dann
enforcement flippen.

---

## Verbesserung 2 — Reminder-Channel im Planner-Loop

### Was es macht

`runPlannerLoop` bekommt einen optionalen `reminderChannel`-Callback. Vor
jedem LLM-Call fragt die Loop den Channel nach aktuellen Per-Round-Hinweisen
(„du hast 80 % deines Token-Budgets verbraucht", „Mission ist in 2 min
überfällig"). Die Hinweise werden als **transiente** System-Message vor den
API-Call gesetzt und danach **wieder entfernt**. Sie leben nie in der
persistierten Message-History.

### Was es ermöglicht

- **Per-Round-Steering ohne History-Mutation.** Der Loop sieht den Zustand,
  die Iteration speichert aber nur die Entscheidungen — kein KV-Cache-
  Invalidation, kein Log-Rauschen.
- **Token-Budget-Awareness.** Aktuell weiß das LLM nicht, wie viele Calls
  es noch hat. Künftig: „du hast 2 von 5 Rounds noch".
- **Stale-Data-Warnings.** Wenn `mana-ai` länger nicht sync'd hat, kann
  das LLM warnen statt zu halluzinieren.
- **Zero-Knowledge-Hinweise.** Bei ZK-Usern: „verbotene Tabellen sind
  nicht resolvable — frag nicht nach". Heute muss das im System-Prompt
  stehen und bleibt dort ewig.
- **Policy-Feedback.** `evaluatePolicy()` (Verbesserung 1) kann einen
  `reminder`-String zurückgeben, der dem LLM in der nächsten Runde erklärt,
  warum ein Tool-Call geblockt wurde — statt nur einen Fehler zu werfen.

### Heutiger Zustand (Problem)

[`packages/shared-ai/src/planner/loop.ts:131-135`](../../packages/shared-ai/src/planner/loop.ts#L131):

```ts
const messages: ChatMessage[] = [
  { role: 'system', content: input.systemPrompt },
  ...(input.priorMessages ?? []),
  { role: 'user', content: input.userPrompt },
];
```

Transienter Context geht heute auf einem von zwei schlechten Wegen rein:

1. in den `systemPrompt` eingebacken → bleibt ewig stehen, veraltet schnell,
2. an den `userPrompt` per Concatenation → mutiert die History, landet in Logs.

### Neuer Zustand (Lösung)

[`packages/shared-ai/src/planner/loop.ts`](../../packages/shared-ai/src/planner/loop.ts) bekommt neuen Input-Slot:

```ts
export interface LoopState {
  readonly round: number;
  readonly toolCallCount: number;
  readonly tokensUsed: TokenUsage;
  readonly lastCall?: ExecutedCall;
}

export interface PlannerLoopInput {
  // … bestehende Felder …
  /** Called before each LLM request. Return an array of transient
   *  system-message strings to inject into THIS request only. They
   *  are removed from `messages` before the next iteration and never
   *  appear in the returned message log. */
  readonly reminderChannel?: (state: LoopState) => readonly string[];
}
```

Implementation skizziert (in der Loop):

```ts
while (rounds < maxRounds) {
  rounds++;
  const reminders = input.reminderChannel?.({ round: rounds, /* … */ }) ?? [];
  const reminderMessages: ChatMessage[] = reminders.map(text => ({
    role: 'system',
    content: `<reminder>${text}</reminder>`,
  }));
  const response = await llm.complete({
    messages: [...messages, ...reminderMessages],  // transient, nicht an messages push
    // …
  });
  // … bestehende Logik (messages.push für assistant/tool, NICHT für reminder) …
}
```

### Erste Producer (Beispiele, nicht Scope von M1)

Die Channel-API kommt in M1; die konkreten Reminder-Producer können
inkrementell danach entstehen. Niedrig hängende Früchte:

```ts
// services/mana-ai/src/planner/reminders.ts (später)
export function tokenBudgetReminder(agent: ServerAgent, usage24h: number) {
  if (!agent.maxTokensPerDay) return null;
  const pct = usage24h / agent.maxTokensPerDay;
  if (pct < 0.75) return null;
  return `Agent ${agent.name} hat ${Math.round(pct * 100)}% des Tagesbudgets verbraucht. Plane sparsam.`;
}
```

### Aufwand

4h für die Loop-Änderung + Test. Producer sind eigene kleine PRs danach.

### Tests

- `loop.test.ts`: Reminder wird injiziert, erscheint im LLM-Call, **nicht**
  im `result.messages`.
- `loop.test.ts`: Reminder ist pro Round unabhängig — Round 2 kriegt nicht
  Round 1's Reminder zurück.

### Rollout

Keine Flag-Gating nötig — Channel ist optional. Bestehende Caller, die
ihn nicht setzen, verhalten sich identisch zu heute.

---

## Verbesserung 3 — Parallel-Execution für Read-Tools

### Was es macht

Wenn das LLM in einer Runde mehrere Tool-Calls zurückgibt und **alle**
davon `policyHint: 'read'` sind, führt `runPlannerLoop` sie mit
`Promise.all` parallel aus, Cap bei 10 gleichzeitigen Calls. Sobald
ein Write oder Destructive im Batch ist: wie heute sequenziell.

Die Reihenfolge in `messages` bleibt **Source-Order** (wie das LLM sie
gesendet hat), nicht Completion-Order. Debug-Log bleibt linear lesbar.

### Was es ermöglicht

- **Schnellere Multi-Read-Missions.** Eine Research-Mission mit 5 Read-
  Tools: heute 5× Read-Latenz sequenziell, künftig ~1× Latenz parallel.
  Realer Gewinn: Wall-Clock-Zeit pro Tick halbiert sich in den Fällen,
  wo es zählt.
- **Freie Kapazität für Compactor und Policy-Gate.** Beide Verbesserungen
  von M1/M2 kosten Latenz; der Parallel-Gain gleicht das aus.
- **Kein Risiko bei Writes.** Die Regel „Read-only parallel, Writes
  seriell" ist dieselbe wie in Claude Codes `gW5` — sie macht Consistency
  trivial, ohne dass das Modell darüber nachdenken muss.

### Heutiger Zustand (Problem)

[`packages/shared-ai/src/planner/loop.ts:172-188`](../../packages/shared-ai/src/planner/loop.ts#L172) — expliziter Code-Kommentar:

> „Parallel execution is a perfectly valid optimisation for pure-read tools
> but we keep order here so the message log tells a linear story when the
> user debugs a failure."

Das Argument ist legitim, aber der Message-Log kann Source-Order behalten,
auch wenn die Calls parallel laufen. Wir verlieren nichts an Debug-Ergonomie.

### Neuer Zustand (Lösung)

In [`loop.ts`](../../packages/shared-ai/src/planner/loop.ts) wird der
Tool-Exec-Block ersetzt:

```ts
// Bestimme Parallel-Eligibility aus der Registry
const policyHints = response.toolCalls.map(c => getPolicyHintByName(c.name));
const allRead = policyHints.every(h => h === 'read');

if (allRead && response.toolCalls.length > 1) {
  // Cap 10: bei mehr Tools in Batches à 10
  const BATCH_SIZE = 10;
  const allResults: ExecutedCall[] = [];
  for (let i = 0; i < response.toolCalls.length; i += BATCH_SIZE) {
    const batch = response.toolCalls.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (call) => ({
        round: rounds,
        call,
        result: await onToolCall(call),
      })),
    );
    allResults.push(...results);
  }
  // Append in Source-Order (nicht Completion-Order)
  for (const ex of allResults) {
    executedCalls.push(ex);
    messages.push({
      role: 'tool',
      toolCallId: ex.call.id,
      content: JSON.stringify({ /* … */ }),
    });
  }
} else {
  // Sequenziell wie heute
  for (const call of response.toolCalls) {
    /* bestehend */
  }
}
```

Helper `getPolicyHintByName` kommt aus der Registry (lesbar, da in M1 eh
integriert — Verbesserung 1 zieht die Policy-Information schon an die
Loop-Grenze).

### Abhängigkeit

Braucht **Verbesserung 1** vorher, damit `policyHint` autoritativ
verfügbar ist. Ohne Policy-Gate müsste die Loop die Hints aus der Registry
direkt nachschlagen — nicht schlimm, aber die Abfolge ist sauberer.

### Aufwand

~2h Code + Test.

### Tests

- `loop.test.ts`: 3 Read-Calls → `Promise.all` wird aufgerufen, Wall-Clock
  ~= max(read) statt sum(reads).
- `loop.test.ts`: 2 Read + 1 Write → sequenzielle Abarbeitung.
- `loop.test.ts`: 11 Read-Calls → 2 Batches (10 + 1), aber Source-Order in
  `messages` erhalten.

### Rollout

Keine Flag-Gating nötig. Verhalten ist strikt additiv (sequenzieller Pfad
bleibt unverändert für gemischte Batches und für bestehende Caller, die
keine Registry haben).

---

## Reihenfolge & Zeitplan

| Reihenfolge | Verbesserung              | Aufwand     | Voraussetzung       |
|-------------|---------------------------|-------------|---------------------|
| 1.          | Permission-Gate (§1)      | 1 Tag       | —                   |
| 2.          | Reminder-Channel (§2)     | 4 h         | — (parallel zu §1)  |
| 3.          | Parallel-Reads (§3)       | 2 h         | §1 (für policyHint) |

**Gesamt: ~1.5 Arbeitstage.**

Die drei Verbesserungen sind bewusst *klein*. Der Plan ist:

1. Alle drei in einem Sprint zusammen mergen (eine PR pro Verbesserung,
   drei PRs gesamt).
2. `POLICY_ENFORCE=false` starten (log-only), eine Woche beobachten.
3. Im gleichen Zeitraum die ersten Reminder-Producer in `mana-ai`
   nachziehen (eigene kleine PRs, nicht Teil von M1).
4. Flag flippen, Metriken prüfen (`policy_deny_total`, `parallel_read_batches_total`).

## Exit-Kriterien für M1

- [x] `evaluatePolicy()` existiert in `@mana/tool-registry`, wird von beiden Consumern aufgerufen. (`e5d230e59`)
- [ ] `POLICY_MODE=enforce` läuft eine Woche in Staging ohne False-Positive-Rate > 1 %. **Blockiert durch Ops-Soak** — Metrik-Infrastruktur komplett (`mana_mcp_policy_decisions_total{decision,reason,mode}`, Prometheus-Scrape `d087b4744`, Grafana-Dashboard `004b3b7fc`).
- [x] `runPlannerLoop` hat `reminderChannel`-API, Tests grün, mindestens ein Real-Producer live. (`e5d230e59` API + `faa472be9` tokenBudgetReminder + `8f283726b` retryLoopReminder + `72f7978ed` compactedReminder — drei Producer live)
- [~] Parallel-Read-Speedup in `mana-ai`: **ursprüngliches Kriterium war falsch formuliert**. Server-Tools in `mana-ai` sind per `SERVER_TOOLS`-Filter ALLE propose-policy, also greift Parallelisierung dort nicht. Ersetzt durch: **Webapp Companion/Mission-Runner parallelisiert auto-policy-Reads** (`54a12ffd5`). Wall-Clock-Messung via `mana_mcp_tool_duration_seconds` + Companion-Chat-Domain-Events, formale Messung nicht durchgeführt (domain-events sind nicht promscraped).

## Abgeschlossen: 2026-04-23

13 Commits, 154 Tests grün. Siehe [`claude-code-architecture.md`](../reports/claude-code-architecture.md) + [`mana-agent-improvements-from-claude-code.md`](../reports/mana-agent-improvements-from-claude-code.md) für Design-Hintergrund.

## M2 — Context-Compressor

M2 war im ursprünglichen Bericht als eigener 3-5-Tage-Block gedacht. Wir
haben die Kern-Primitive in derselben Session mitgenommen, weil die
Reminder-Channel-Infrastruktur aus M1 das Vehikel ist, über das der
Compactor dem LLM mitteilt, dass komprimiert wurde.

### M2 Umfang & Stand

| Teil       | Inhalt                                                                      | Status |
|------------|------------------------------------------------------------------------------|--------|
| M2.1       | `compactHistory()` + `shouldCompact()` + Prompt/Parser in `@mana/shared-ai`  | ✅ `13361eb08` |
| M2.2       | Trigger + Splice in `runPlannerLoop` (`compactor` option, fire-once policy)  | ✅ `3d8214a14` |
| M2.3       | `mana-ai` Mission-Runner Wiring, `MANA_AI_COMPACT_MAX_CTX` env, 2 Metriken   | ✅ `83a4606a9` |
| M2.4       | Webapp Companion + Mission-Runner Wiring                                     | ✅ `703ef69ca` |
| M2-Bonus   | `LoopState.compactionsDone` + `compactedReminder` Producer (info-severity)   | ✅ `72f7978ed` |
| **M2.5**   | **Haiku-Tier in `mana-llm`** — Compactor auf billigerem Modell routen         | ⏳ offen, rein Kostenoptimierung, nicht blockiert |

### M2-Konfiguration

| Env                         | Default       | Wirkung |
|-----------------------------|---------------|---------|
| `MANA_AI_COMPACT_MAX_CTX`   | `1000000`     | 1M-Token-Ceiling matching gemini-2.5-flash. Trigger bei 92%. `0` = Compactor aus. |

### M2-Metriken

- `mana_ai_compactions_triggered_total` — Counter pro Firing
- `mana_ai_compacted_turns` — Histogram, Anzahl gefalteter middle-Turns pro Event (<3 = Config-Problem)

## Offene Polish-Items aus M1

Nicht blockiert durch M2, aber noch pending:

- **allowDestructive aus mana-auth-Profil** — heute hardcoded `[]` in `mana-mcp/mcp-adapter.ts::settingsFor()`. Ohne das macht `POLICY_MODE=enforce` für destruktive Tools nur "alles blockiert" Sinn. Braucht Profil-Endpoint in mana-auth + Settings-UI + mana-mcp-Laden pro Session.

## Danach

M3 (In-Process Sub-Agents + Persona-Runner) baut auf allen M1+M2-Primitiven auf. Details: [`mana-agent-improvements-from-claude-code.md`](../reports/mana-agent-improvements-from-claude-code.md) §12 Roadmap.
