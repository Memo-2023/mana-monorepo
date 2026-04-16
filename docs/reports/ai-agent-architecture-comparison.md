# AI-Agent-Architektur: Mana vs. Industrie-Frameworks

**Stand:** 2026-04-16  
**Zweck:** Vergleich der Mana AI-Workbench-Architektur mit Google A2A, MCP, OpenAI Agents SDK, LangGraph, CrewAI und Microsoft Agent Framework. Stärken identifizieren, Verbesserungspotenzial aufzeigen.

---

## 1. Zusammenfassung der Mana-Architektur

### Was wir haben

Mana implementiert ein **Dual-Runtime AI-Agent-System**:

| Komponente | Beschreibung |
|------------|-------------|
| **Foreground Runner** (Browser) | `runner.ts` — Reasoning-Loop mit bis zu 5 Planner-Iterationen, direkte Dexie-Writes, E2E-verschlüsselt |
| **Background Runner** (mana-ai, Port 3067) | `tick.ts` — 60s Cron-Tick, scannt fällige Missions, plant via mana-llm, schreibt über sync_changes zurück |
| **Planner** | Shared Prompt-Template (`@mana/shared-ai/src/planner/`) → OpenAI-kompatible API auf mana-llm |
| **Tool-System** | 13 Tools (todo, calendar, places, notes, news, drink), policy-gated (auto/propose/deny) |
| **Agents** | Named Personas mit eigener systemPrompt, memory, policy, Budget, Concurrency-Limits |
| **Proposals** | Mutationen unter `propose`-Policy erzeugen Proposals → User muss approven |
| **Actor-System** | Jeder Write trägt einen immutablen Actor (user/ai/system) mit frozen displayName |
| **Encryption** | Mission Key-Grants für serverseitige Entschlüsselung, AES-GCM-256, HKDF-scoped |

### Execution Flow

```
Mission (title, objective, inputs, cadence)
    → Input Resolution (Dexie oder DB + optionale Grant-Entschlüsselung)
    → Planner Call (system prompt + tools + inputs → JSON plan)
    → Policy Gate pro Step (auto → execute, propose → Proposal, deny → reject)
    → Iteration Write-back (LWW sync via mana-sync)
    → Optional: Chained Reasoning (tool output → nächster Planner Call)
```

---

## 2. Industrie-Frameworks im Überblick

### 2.1 Google A2A (Agent-to-Agent Protocol)

**Was es ist:** Offenes Protokoll für Inter-Agent-Kommunikation. Linux Foundation, 150+ Organisationen, v1.0 seit 2026.

**Kernkonzepte:**
- **Agent Cards** (`/.well-known/a2a/agent-card`) — JSON-Selbstbeschreibung: Capabilities, Skills (mit Input/Output JSON-Schemas), Security, Protocol Bindings. Signiert für dezentrales Trust.
- **Tasks** — Kern-Arbeitseinheit: `SUBMITTED → WORKING → COMPLETED/FAILED`. Plus `INPUT_REQUIRED` und `AUTH_REQUIRED` für HITL-Flows.
- **Messages & Parts** — Modalitätsagnostisch: text, raw (binary), url (Datei), data (strukturiertes JSON).
- **Artifacts** — Task-Outputs, getrennt von Konversation. Streambar (`append: true`, `lastChunk: true`).

**Kommunikationsmuster:**
- Blocking (Request/Response)
- Streaming (SSE, gRPC, JSON-RPC)
- Push Notifications (Webhooks für long-running Tasks)

**Protocol Bindings:** JSON-RPC 2.0, HTTP/REST, gRPC.

### 2.2 Anthropic MCP (Model Context Protocol)

**Was es ist:** Offenes Protokoll für die Verbindung von LLM-Anwendungen mit externen Tools/Daten. Linux Foundation, 10.000+ Server, 97M monatliche SDK-Downloads.

**Architektur (Host → Client → Server):**
- **Host** = LLM-Anwendung, managed Security
- **Client** = 1:1 zu Server, JSON-RPC 2.0 Session
- **Server** = Lightweight Adapter, exponiert drei Primitives:

| Primitive | Gesteuert von | Zweck |
|-----------|---------------|-------|
| **Resources** | Application | Kontextdaten (Dateien, DB-Einträge) |
| **Tools** | Model | Ausführbare Funktionen |
| **Prompts** | User | Vordefinierte Templates |

**Entscheidende Design-Regel:** Server sehen nie die volle Konversation oder andere Server. Host kontrolliert alle Cross-Server-Interaktionen.

### 2.3 OpenAI Agents SDK

**Kernprimitive:**
- **Agent** — LLM + instructions + tools + handoffs
- **Runner** — Orchestriert den Execution Loop
- **Handoffs** — First-class Primitive für Multi-Agent-Delegation (kein separater Orchestrator nötig)
- **Guardrails** — Input/Output-Validierung parallel zur Ausführung
- **Sessions** — Persistente Memory (SQLite, Redis, verschlüsselt)
- **Tracing** — Built-in Observability (LLM calls, tool calls, handoffs, OpenTelemetry)

### 2.4 LangGraph

**Kernarchitektur — StateGraph:**
- **Nodes** = Funktionen (Agents, Tools, Logik)
- **Edges** = Kontrollfluss (statisch oder conditional)
- **State** = Zentraler TypedDict, immutable Updates
- **Checkpointing** = State-Persistenz mit Time-Travel-Debugging

**Multi-Agent-Patterns:** Subagents, Handoffs, Router, Supervisor, Scatter-Gather, Subgraphs.

### 2.5 CrewAI

**Kernarchitektur:**
- **Agent** = role + goal + backstory + tools + LLM
- **Task** = Beschreibung + erwartetes Output-Format + Guardrails + HITL
- **Crew** = Agents + Tasks + Prozesstyp (sequential, hierarchical, consensual)
- **Flows** = Event-driven Orchestrierung für Produktion
- **Memory** = 4 Typen: Short-term, Long-term (Embeddings), Entity, Contextual

### 2.6 Microsoft Agent Framework

**Vereinigung von AutoGen + Semantic Kernel:**
- **Agents** = LLM + Tools + MCP-Server + Middleware
- **Workflows** = Graph-basiert mit Type-safe Routing, Checkpointing, HITL
- **Sessions** = Enterprise-grade State Management
- Multi-Provider (Anthropic, Azure OpenAI, OpenAI, Ollama)

---

## 3. Vergleichsmatrix

| Dimension | Mana | A2A | MCP | OpenAI SDK | LangGraph | CrewAI |
|-----------|------|-----|-----|------------|-----------|--------|
| **Agent-Definition** | Agent(name, role, systemPrompt, memory, policy) | Agent Card (JSON, signiert) | N/A (Protokoll) | Agent(instructions, tools, handoffs) | Node-Funktionen | Agent(role, goal, backstory) |
| **Tool-Registration** | Hardcoded Allow-List (13 Tools) | Skills in Agent Card | tools/list + tools/call | @function_tool + MCP | Node context | tools= Parameter |
| **Agent↔Agent** | ❌ Nicht vorhanden | ✅ Kernzweck | ❌ Nicht designed dafür | Handoffs | Edges/Routing | Delegation + Hierarchie |
| **Agent↔Tool** | Policy-gated Executor | Via MCP | ✅ Kernzweck | Function calls + MCP | Node-Aufrufe | Direkte Zuweisung |
| **State/Memory** | LWW Sync + encrypted IndexedDB | Task contextId | Stateful Sessions | Sessions (SQLite/Redis) | StateGraph + Checkpoints | 4 Memory-Typen |
| **Orchestrierung** | Dual-Runtime (Browser + Server Cron) | Task Lifecycle | Host koordiniert | Runner Loop | DAG Engine | Sequential/Hierarchical |
| **Streaming** | ❌ Kein Streaming | SSE, gRPC, JSON-RPC | JSON-RPC Notifications | Built-in | Native Token-Stream | Log-basiert |
| **Observability** | Prometheus Metrics + Debug Logs | Agent Cards Metadata | Server Logging | Built-in Tracing (OTel) | LangSmith | Built-in Logging |
| **HITL** | Proposal-System (approve/reject) | INPUT_REQUIRED State | Elicitation | Guardrails | Interrupt/Resume | Task-Guardrails |
| **Encryption** | ✅ AES-GCM + Key-Grants | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Local-First** | ✅ Dexie + Offline | ❌ Server-to-Server | ❌ | ❌ | ❌ | ❌ |
| **Multi-Device** | ✅ LWW Sync | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Was Mana gut macht

### 4.1 Privacy-First Architektur (einzigartig in der Industrie)

Kein einziges der verglichenen Frameworks hat ein vergleichbares Verschlüsselungskonzept:
- **AES-GCM-256 at rest** für 27 Tabellen
- **Mission Key-Grants** mit HKDF-Scoping, Audit Trail, TTL
- **Zero-Knowledge-Modus** optional
- Server sieht nie Klartext ohne expliziten Grant

**Bewertung:** Das ist ein echter Wettbewerbsvorteil. A2A, MCP, OpenAI SDK — alle gehen davon aus, dass der Server alles sehen darf.

### 4.2 Dual-Runtime mit Graceful Degradation

- Browser-Runner funktioniert offline und hat Zugriff auf alle verschlüsselten Daten
- Server-Runner läuft scheduled auch wenn kein Browser offen ist
- Bei fehlendem Key-Grant degradiert Server gracefully → Browser übernimmt

**Bewertung:** Kein anderes Framework hat diese Browser/Server-Dualität. LangGraph und CrewAI sind rein serverseitig. OpenAI SDK hat keinen Offline-Modus.

### 4.3 Immutable Actor Attribution

Jeder Write trägt einen eingefrorenen Actor mit `kind`, `principalId`, `displayName`, `missionId`, `iterationId`, `rationale`. Das ist besser als jedes der verglichenen Frameworks:
- OpenAI SDK hat Tracing, aber keine Write-Level Attribution
- LangGraph hat State-Checkpoints, aber keine Actor-Zuordnung pro Mutation
- CrewAI hat keine per-Write-Attribution

**Bewertung:** Exzellent für Audit, Undo, und Vertrauen. Ermöglicht "Wer hat was warum geändert?" auf Feldebene.

### 4.4 Proposal-System (Human-in-the-Loop)

Das dreistufige Policy-System (auto/propose/deny) mit dem Proposal-Lifecycle ist durchdacht:
- Granular pro Tool konfigurierbar
- User-Feedback bei Rejection fließt zurück in den Planner
- Pro-Agent Policies (Phase 3)

**Vergleich:** OpenAI hat Guardrails (aber binär: pass/fail). A2A hat `INPUT_REQUIRED` (aber kein propose/approve-Workflow). LangGraph hat Interrupt/Resume (ähnlich, aber weniger formalisiert).

### 4.5 Local-First + Multi-Device Sync

Field-Level LWW über mana-sync ist einzigartig unter AI-Agent-Frameworks. Missions, Agents und ihre Ergebnisse synchen automatisch über Geräte.

---

## 5. Was Mana verbessern könnte

### 5.1 🔴 Kein Agent-to-Agent-Protokoll

**Problem:** Agents können nicht miteinander kommunizieren. Jeder Agent ist eine isolierte Insel. Ein "Cashflow Watcher" kann keinen "Todo Manager" bitten, eine Aufgabe zu erstellen.

**Was die Industrie macht:**
- **A2A**: Agents discovern sich über Agent Cards und delegieren Tasks
- **OpenAI SDK**: Handoffs als First-class Primitive
- **LangGraph**: Edges zwischen Agent-Nodes
- **CrewAI**: Hierarchical delegation + shared context

**Empfehlung:** Ein leichtgewichtiges internes Agent-to-Agent-Protokoll einführen:

```typescript
interface AgentDelegation {
  fromAgentId: string;
  toAgentId: string;
  intent: ToolCallIntent;   // Was soll der andere Agent tun?
  context: string;           // Warum?
  policy: 'auto' | 'propose'; // User muss bestätigen?
}
```

Langfristig: A2A-kompatible Agent Cards für externe Integration (z.B. Mana-Agents mit Google Agents kommunizieren lassen).

### 5.2 🔴 Kein Streaming

**Problem:** Der aktuelle Flow ist Request/Response. User sieht nichts, bis die gesamte Iteration fertig ist.

**Was die Industrie macht:**
- **A2A**: SSE + gRPC Streaming mit `TaskStatusUpdateEvent` und `TaskArtifactUpdateEvent`
- **OpenAI SDK**: Built-in Token-Streaming
- **LangGraph**: Native Token-by-Token Streaming
- **MCP**: JSON-RPC Notifications

**Empfehlung:** SSE-basiertes Streaming für den Foreground Runner:
1. Planner-Response streamen (Token für Token)
2. Step-Ausführung live anzeigen ("Erstelle Task... ✓", "Tagge Note... ⏳")
3. Server-Runner: SSE-Events an verbundene Clients pushen

### 5.3 🟡 Statisches Tool-System

**Problem:** 13 hardcoded Tools in einer Allow-List. Neue Tools erfordern Code-Änderungen an mindestens 3 Stellen (server tools.ts, shared-ai proposable-tools, executor).

**Was die Industrie macht:**
- **MCP**: Dynamische Tool-Discovery via `tools/list`, Hot-Reload via `notifications/tools/list_changed`
- **OpenAI SDK**: `@function_tool` Decorator, automatische Schema-Generierung
- **LangGraph**: Tools als Node-Funktionen, dynamisch registrierbar
- **A2A**: Skills in Agent Cards mit JSON-Schema

**Empfehlung:** MCP-kompatibles Tool-Registry einführen:
```typescript
// Jedes Modul registriert seine Tools deklarativ
// apps/mana/apps/web/src/lib/modules/todo/ai-tools.ts
export const todoTools: AiToolDefinition[] = [
  {
    name: 'create_task',
    description: 'Create a new task',
    inputSchema: { /* JSON Schema */ },
    module: 'todo',
    annotations: { destructiveHint: false, idempotentHint: false }
  }
];
```
Module registrieren Tools via Registry → Planner bekommt dynamische Tool-Liste → Server synchronisiert über shared-ai Package. **Bonus:** MCP-Server-Export ermöglicht externe Tool-Nutzung.

### 5.4 🟡 Kein Graph-basierter Workflow

**Problem:** Der Reasoning Loop ist linear (Planner → Steps → optional Loop). Komplexe Workflows (Branching, Parallelisierung, Conditional Logic) sind nicht möglich.

**Was die Industrie macht:**
- **LangGraph**: DAG mit Conditional Edges, Parallel Nodes, Subgraphs
- **CrewAI**: Sequential + Hierarchical + Consensual Prozesse
- **Microsoft Agent Framework**: Type-safe Graph Workflows

**Empfehlung:** Für die meisten Mana-Usecases ist der lineare Loop ausreichend. Aber für komplexere Missions (z.B. "Analysiere meine Finanzen, erstelle einen Bericht, und plane Aufgaben basierend auf dem Ergebnis") wäre ein einfacher DAG sinnvoll:

```typescript
interface MissionGraph {
  nodes: MissionStep[];     // Jeder Node = ein Planner-Call oder Tool-Execution
  edges: MissionEdge[];     // Conditional routing
  parallelGroups?: string[][]; // Steps die parallel laufen können
}
```

**Priorität:** Niedrig. Der aktuelle Loop deckt 90% der Usecases ab.

### 5.5 🟡 Keine Agent-Discovery

**Problem:** Agents sind nur ihrem Ersteller bekannt. Kein Mechanismus für:
- "Welche Agents gibt es?"
- "Welcher Agent kann X?"
- Automatische Delegation basierend auf Capabilities

**Was die Industrie macht:**
- **A2A**: Agent Cards mit Skills + JSON-Schemas → automatische Discovery
- **MCP**: Resource Discovery via URI-Schemes

**Empfehlung:** Agent Capabilities als strukturierte Metadaten:
```typescript
interface AgentCapability {
  module: string;          // 'todo', 'notes', 'calendar'
  actions: string[];       // ['create', 'update', 'query']
  inputTypes: string[];    // Welche Inputs kann der Agent verarbeiten?
}
```
Ermöglicht: "Finde den Agent, der Kalender-Events erstellen kann" → automatisches Routing.

### 5.6 🟡 Kein Guardrail-System

**Problem:** Policy (auto/propose/deny) ist ein Gating-Mechanismus, aber kein Guardrail. Es gibt keine:
- Input-Validierung (ist der Prompt safe?)
- Output-Validierung (ist das Ergebnis korrekt/sicher?)
- Budget-Enforcement serverseitig (nur client-seitig)

**Was die Industrie macht:**
- **OpenAI SDK**: Input + Output Guardrails parallel zur Execution
- **CrewAI**: Task-Level Guardrails
- **LangGraph**: Custom Validation Nodes

**Empfehlung:** Guardrails als separate Schicht:
```typescript
interface Guardrail {
  name: string;
  phase: 'pre-plan' | 'post-plan' | 'pre-execute' | 'post-execute';
  check: (context: GuardrailContext) => GuardrailResult;
}
// Beispiele:
// - PII-Detection vor Planner-Call
// - Budget-Check vor Execution
// - Output-Schema-Validierung nach Tool-Call
```

### 5.7 🟢 Tracing & Debugging verbessern

**Problem:** Debug-Info ist in `_aiDebugLog` (localStorage, nie gesynct) + Prometheus Metrics. Kein zusammenhängendes Tracing einer Mission über Browser + Server.

**Was die Industrie macht:**
- **OpenAI SDK**: Built-in Tracing mit visuellen DAGs, OpenTelemetry Export
- **LangGraph**: LangSmith Integration, Step-by-Step Debugging, Time-Travel
- **Microsoft**: Semantic Kernel Telemetry

**Empfehlung:** OpenTelemetry-Spans für den gesamten Mission-Lifecycle:
```
Mission.run (span)
  ├── Input.resolve (span, per input)
  ├── Planner.call (span, mit prompt + response)
  ├── Step[0].execute (span, tool name + params + result)
  ├── Step[1].propose (span, proposal created)
  └── Iteration.write (span, sync write)
```
Exportierbar nach Grafana Tempo oder ähnlichem.

---

## 6. Strategische Empfehlungen (priorisiert)

### Kurzfristig (nächste 2-4 Wochen)

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 1 | **Streaming für Foreground Runner** — SSE vom Planner, live Step-Status im UI | Mittel | Hoch — UX-Sprung |
| 2 | **Dynamisches Tool-Registry** — Module registrieren Tools deklarativ, Server synchronisiert | Mittel | Hoch — Skalierbarkeit |
| 3 | **Budget-Enforcement serverseitig** — Token-Counting pro Agent im tick.ts | Klein | Mittel — Sicherheit |

### Mittelfristig (1-3 Monate)

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 4 | **Agent-to-Agent Delegation** — Internes Protokoll, ein Agent kann einen anderen beauftragen | Groß | Hoch — Multi-Agent |
| ~~5~~ | ~~**MCP-Server-Export**~~ — ERLEDIGT `db4dd437b` + `e969324cc` (29 Tools, 27 mit echten DB-Ops) | ~~Mittel~~ | ~~Hoch~~ |
| 6 | **Guardrail-Layer** — Pre/Post-Execution Checks | Mittel | Mittel — Sicherheit |
| 7 | **OpenTelemetry Tracing** — End-to-End Mission Spans | Mittel | Mittel — Debugging |

### Langfristig (3-6 Monate)

| # | Maßnahme | Aufwand | Impact |
|---|----------|---------|--------|
| 8 | **A2A-kompatible Agent Cards** — Mana-Agents extern discoverable machen | Groß | Hoch — Interop |
| 9 | **Graph-basierte Workflows** — DAG für komplexe Missions | Groß | Mittel — Power-User |
| 10 | **Agent Memory (Embeddings)** — Long-term Memory à la CrewAI | Groß | Mittel — Intelligenz |

---

## 7. Architektur-Diagramm: Ist vs. Soll

### Ist-Zustand
```
┌──────────────────────────────────────────────────────┐
│ Browser (Foreground Runner)                          │
│  Mission → Planner → Policy Gate → Execute/Propose   │
│  ↕ Dexie (encrypted) ↕ mana-sync (LWW)             │
└──────────────────┬───────────────────────────────────┘
                   │ sync_changes
┌──────────────────▼───────────────────────────────────┐
│ mana-ai (Background Runner)                          │
│  Tick → Due Missions → Planner → Write Iteration     │
│  ↕ PostgreSQL (RLS) ↕ mana-llm                      │
└──────────────────────────────────────────────────────┘
```

### Soll-Zustand (mittelfristig)
```
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                       │
│  Mission → [Guardrails] → Planner (streaming) → Policy Gate  │
│  Agent A ←→ Agent B (delegation)                              │
│  ↕ Dexie (encrypted) ↕ mana-sync (LWW + SSE)               │
└──────────────────┬───────────────────────────────────────────┘
                   │ sync_changes + OTel spans
┌──────────────────▼───────────────────────────────────────────┐
│ mana-ai (Background Runner)                                   │
│  Tick → [Budget Check] → Due Missions → Planner → Write      │
│  Tool Registry (dynamic, MCP-compatible)                      │
│  ↕ PostgreSQL (RLS) ↕ mana-llm ↕ Grafana Tempo              │
└──────────────────┬───────────────────────────────────────────┘
                   │ A2A Agent Cards (langfristig)
┌──────────────────▼───────────────────────────────────────────┐
│ Externe Agents (Google ADK, OpenAI, etc.)                     │
│  Discovery via /.well-known/a2a/agent-card                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Fazit

**Mana's AI-Agent-Architektur ist in drei Bereichen führend:**
1. **Privacy/Encryption** — Kein vergleichbares Framework hat Key-Grants, Zero-Knowledge, oder at-rest Encryption für Agent-Daten
2. **Local-First + Multi-Device** — Einzigartige Dual-Runtime mit Offline-Fähigkeit
3. **Actor Attribution** — Bestes Audit-Trail-System unter allen verglichenen Frameworks

**Die größten Lücken gegenüber der Industrie:**
1. **Kein Agent-to-Agent** — Die wichtigste fehlende Capability für echte Multi-Agent-Systeme
2. **Kein Streaming** — Standard in allen modernen Frameworks, fehlt komplett
3. **Statisches Tool-System** — Skaliert nicht, wenn neue Module Tools brauchen

**Die Kernempfehlung:** Mana sollte nicht versuchen, ein General-Purpose-Agent-Framework zu werden (das machen LangGraph/CrewAI besser). Stattdessen die einzigartigen Stärken (Privacy, Local-First, Attribution) ausbauen und gezielt die Industrie-Standards adoptieren, die den größten UX-Impact haben: **Streaming**, **dynamische Tools**, und **Agent-Delegation**.

MCP-Kompatibilität als mittelfristiges Ziel ist strategisch richtig — es ist das Protokoll, das sich als Standard für Agent↔Tool durchgesetzt hat (97M Downloads/Monat). A2A für Agent↔Agent ist das natürliche Pendant, aber erst relevant, wenn interne Multi-Agent-Kommunikation steht.
