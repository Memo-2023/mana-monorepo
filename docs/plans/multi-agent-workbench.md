# Plan: Multi-Agent Workbench — benannte KI-Agenten als erstklassige Bürger

**Status:** ✅ **Shipped** (Phase 0–7 code-complete, 2026-04-15). Follow-up ideas + Team extension: siehe unten + [`team-workbench.md`](./team-workbench.md).
**Scope:** Upgrade vom Single-User-Workbench zum "Orchestration-Cockpit" mit mehreren benannten AI-Agenten, die autonom auf den Daten des einen Users arbeiten. Keine Team-Features (anderer User) in dieser Iteration — das ist bewusst der nächste Plan.
**Motivation:** Heute sind Missionen "nackte Arbeitsaufträge" ohne Identität. Bei 10 laufenden Missionen fehlt die ordnende Identität. Agenten geben jedem Bündel Missionen + Persönlichkeit + Memory ein Zuhause und machen die Workbench zu einem echten Control-Room.
**Verwandte Docs:** [`docs/future/AI_AGENTS_IDEAS.md`](../future/AI_AGENTS_IDEAS.md), [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20–§22, [`docs/plans/ai-mission-key-grant.md`](./ai-mission-key-grant.md), [`docs/plans/team-workbench.md`](./team-workbench.md) (Forward-Plan).

---

## Entscheidungen (baked in)

| Frage | Entscheidung | Begründung |
|---|---|---|
| **Konzept eines Agents** | Option C (Hybrid): Metadaten + Policy + **persistente Memory** die in jede Planner-Prompt injiziert wird | 80% der "echten Agent"-UX für 20% Mehraufwand gegenüber rein additivem Modell. Memory ist kein eigener Denk-Loop, bleibt upgrade-bar. |
| **Refactor-Tiefe** | **L3** — `Actor` wird identitätsbewusst (`{kind, principalId, displayName}`) | Wir sind nicht live. Der Actor-Layer ist frisch. Der Cutover ist *jetzt* billig, später teuer. Alle Follow-ups (Per-Agent-Policy, Timeline-Filter, zukünftige Team-Features) setzen darauf auf. |
| **Scene↔Agent-Beziehung** | **Orthogonal** (Option Y). Scenes können optional `viewingAsAgentId` setzen. | "Agents sind Bürger, Scenes sind Fenster". Keine 1:1-Zwangsbindung — User kann mehrere Scenes auf denselben Agent zeigen. |
| **Agent-Memory** | **Feld auf Agent** (`memory: string`), manuell durch User editierbar. Keine Versionierung, keine Self-Modification. | Simpel. Versionierung + self-modifying ist ein eigenes Projekt (evals, drift, loops). |
| **Default-Agent-Migration** | Auto-Anlage eines "Mana"-Default-Agents bei erster Mission-Sichtung. Alle Legacy-Missions ohne `agentId` werden auf diesen migriert. User-Level-AiPolicy wird seine Policy. | Keine User-Action nötig für Bestandsdaten. User kann ihn später umbenennen / aufteilen. |
| **Agent-Löschung** | Soft-Delete (`deletedAt`). Aktive Missionen des gelöschten Agents werden nicht abgebrochen, laufen orphan-active weiter. Workbench zeigt sie grau. | Kein Daten-Verlust durch Klick. User kann bewusst Missions separat archivieren. |
| **Budget** | `maxTokensPerDay: number` pro Agent. Globaler Default ableitbar. Rollender 24h-Counter in Prometheus + Dexie-Side. | 10 Agents × paralleler Ticks können sonst schnell teuer. Harte Stopp-Semantik wenn Budget überschritten. |
| **Concurrency** | `maxConcurrentMissions` Feld pro Agent (Default: 1). `mana-ai` Tick respektiert das pro Agent. | Verhindert dass 10 Agents × N Missionen den LLM-Pool + PG-Pool überlasten. |
| **Mission Key-Grants** | Bleiben **per-Mission**, kein Redesign. UI zeigt zusätzlich Agent-Avatar + -Name im Consent-Dialog. | Crypto-Modell unverändert. Nur Display erweitert. |
| **Policy-Scope** | AiPolicy wandert von User-global auf Agent-Level. Default-Agent erbt die heutige User-Policy. | Konsistent mit "jede Mission gehört einem Agent". Verschiedene Agents können verschiedene Tool-Zugriffe haben. |
| **System-Prompt & Role** | Optional `systemPrompt: string` (technisch) + `role: string` (UI-Beschreibung). Nur `role` ist Pflicht. | Beide sind separat — Role erklärt dem User, systemPrompt erklärt dem LLM. |
| **Encryption von Agent-Feldern** | `name`, `role`, `avatar`, `policy`, `state` plaintext. `systemPrompt` + `memory` encrypted (Registry-Eintrag). | Name ist Display-Key (Search, Index). Prompt + Memory enthalten oft Kontext über den User → sensibel. |

---

## Datenmodell

### Neuer Record-Typ

```ts
// packages/shared-ai/src/agents/types.ts
export interface Agent {
	readonly id: string;
	readonly createdAt: string;
	readonly updatedAt: string;

	/** Display name, e.g. "Cashflow Watcher". Indexed (lookup key). */
	name: string;
	/** Emoji or media ID for the avatar. */
	avatar?: string;
	/** Short user-facing description: what is this agent for? */
	role: string;

	/** Optional prepend to every Planner prompt for missions owned by
	 *  this agent. Encrypted at rest. */
	systemPrompt?: string;
	/** Persistent, user-curated context markdown. Injected into every
	 *  Planner prompt. Encrypted at rest. */
	memory?: string;

	/** Per-tool allowlist/propose/deny — the heart of what the agent is
	 *  allowed to do autonomously. Replaces the user-level AiPolicy. */
	policy: AiPolicy;

	/** Budget — rolling 24h window, enforced by mana-ai. */
	maxTokensPerDay?: number;
	/** How many missions this agent may run in parallel. Default 1. */
	maxConcurrentMissions: number;

	state: 'active' | 'paused' | 'archived';
	deletedAt?: string;
}
```

### Erweiterte bestehende Typen

```ts
// Mission gets an owner:
export interface Mission {
	// ...existing fields
	/** Owning agent. Missing on legacy records; migration creates a
	 *  "Default Mana" agent and assigns them to it. */
	agentId?: string;
}

// Scene gets an optional lens:
export interface WorkbenchScene {
	// ...existing fields
	/** When set, this scene "belongs to" this agent — its Workbench
	 *  timeline + proposal filters default to scope the agent. Does NOT
	 *  restrict which apps see data; purely a lens. */
	viewingAsAgentId?: string;
}

// Actor becomes identity-aware:
export interface Actor {
	readonly kind: 'user' | 'ai' | 'system';
	/** UUID of the principal. For 'user' that's the userId; for 'ai'
	 *  that's the agentId; for 'system' that's a sentinel like
	 *  'system:projection' or 'system:mission-runner'. */
	readonly principalId: string;
	/** Display name cached on the record — so historic events still
	 *  show "Cashflow Watcher" even after the agent is renamed. */
	readonly displayName: string;
	/** Only for kind='ai'. */
	readonly missionId?: string;
	readonly iterationId?: string;
	readonly rationale?: string;
}
```

**Migration-Semantik:** Alte Events / Records mit `Actor {kind: 'ai', ...}` ohne `principalId` werden bei Read-Time auf den Default-Agent gemappt (Compat-Layer in `data/events/actor.ts`).

---

## Phasen

Alle Phasen sind ✅ abgeschlossen. Die ursprüngliche Gesamtschätzung war ~8–9 Tage; tatsächlicher Durchlauf an einem Abend dank L3-Cutover-Entscheidung (keine Doppel-Implementierung). Commit-Map unten in "Shipping-Historie".

### Phase 0 — RFC + Datenmodell fixieren (0.5 Tag) ✅

- [x] Dieses Dokument durchsprechen, Decision-Table ist Einsatzpunkt.
- [x] Datenmodell in `packages/shared-ai/src/agents/types.ts` anlegen.
- [x] Encryption-Registry-Eintrag vorbereiten: `agents: { enabled: true, fields: ['systemPrompt', 'memory'] }`.

### Phase 1 — Actor-Identität (L3-Cutover) (2 Tage) ✅

Der zentrale Refactor. Alles andere hängt davon ab.

- [x] `Actor` in `@mana/shared-ai/src/actor.ts` erweitern um `principalId` + `displayName`. Compat-Layer: bei Read, alte Events ohne Felder → `principalId = 'legacy:user'` / `'legacy:ai-default'`, `displayName = 'Unbekannt'`.
- [x] `USER_ACTOR` Helper: `makeUserActor(userId, displayName)`.
- [x] Neue Helpers: `makeAgentActor(agent, mission, iteration, rationale)` und `SYSTEM_ACTOR` mit definierten `principalId`-Strings (`system:projection`, `system:mission-runner`, `system:stream`).
- [x] **Touch-Points im Webapp** — `data/events/`, `data/ai/proposals/`, `data/ai/missions/runner.ts`, `data/ai/revert/`, alle Module-Stores die `USER_ACTOR` nutzen. Grep-Lauf, dann systematischer Rewrite.
- [x] **Touch-Points im mana-ai** — `iteration-writer.ts` schreibt heute `{kind: 'system', source: 'mission-runner'}` → wird zu `{kind: 'ai', principalId: agentId, displayName: agent.name, missionId, iterationId}`.
- [x] **Touch-Points in mana-sync** — keine. `sync_changes.actor` ist JSONB, akzeptiert neues Schema transparent.
- [x] Tests anpassen: `packages/shared-ai/src/actor.test.ts`, alle Event-bezogenen Webapp-Tests.

### Phase 2 — Agent CRUD + Daten-Layer (1.5 Tage) ✅

- [x] Neue Dexie-Tabelle `agents` in `apps/mana/apps/web/src/lib/data/database.ts`. Indizes: `by-userId`, `by-name`, `by-state`.
- [x] `apps/mana/apps/web/src/lib/data/ai/agents/store.ts` — CRUD: `createAgent`, `updateAgent`, `archiveAgent`, `deleteAgent`, `useAgents()` liveQuery-Hook, `useAgent(id)`.
- [x] Encryption Registry + Dexie-Hooks fürs `systemPrompt` + `memory` Feld.
- [x] Sync-Appregistry: `appId='ai-agents'` für die Tabelle.
- [x] **Default-Agent-Bootstrap** — Layout-Effect beim Login: wenn 0 Agents existieren, lege "Mana" (Emoji `🤖`) an mit der aktuellen User-Level-AiPolicy.
- [x] **Mission-Migration** — beim ersten Boot nach Rollout: alle `missions.agentId === undefined` kriegen `agentId = defaultAgent.id` (einmaliger Backfill, idempotent).

### Phase 3 — mana-ai runner agent-bewusst (1 Tag) ✅

- [x] `ServerMission` bekommt `agentId`. Projektion liest das Feld aus.
- [x] **Agent-Projektion** serverseitig — analog zu `mission_snapshots` bauen wir `agent_snapshots` (LWW über `sync_changes` für `table='agents'`), scoped auf `mana_ai` Schema.
- [x] `planOneMission` lädt den Agent, injiziert `systemPrompt + memory` in die Planner-Messages vor der Mission-Instruction. Budget-Check: wenn Agent-Budget überschritten → Mission skip mit `state='budget-exceeded'`, Metrik `mana_ai_budget_exceeded_total{agent=}`.
- [x] **Per-Agent Concurrency-Guard** — der Tick tracked `activeMissionsByAgent` in memory, weiter nur wenn unter `maxConcurrentMissions`.
- [x] **Audit + Metriken** — `mana_ai_agent_decisions_total{agent, decision}` (decision = `ran | skipped-budget | skipped-concurrency | skipped-paused`).
- [x] Server-iteration-writer: Actor-JSON bekommt `principalId = agentId`, `displayName = agent.name`.

### Phase 4 — Policy pro Agent (1 Tag) ✅

- [x] `AiPolicy` wandert von `$lib/data/ai/policy.ts` (user-scoped Store) auf ein Feld am Agent. Store bleibt als Helper, nimmt aber Agent als Argument.
- [x] `pendingProposals` Writer: liest Policy vom auslösenden Agent, nicht mehr global.
- [x] `mana-ai`s tools.ts filtert die Tool-Allowlist per Agent-Policy vor jedem Tick.
- [x] Settings-Page "Automatisierungs-Einstellungen" wandert zur Agent-Detail-Seite (jeder Agent hat seine eigene Policy-Tabelle). Legacy-Settings-Route redirected zum Default-Agent.

### Phase 5 — UI: Agents-Modul + Scene-Binding (2 Tage) ✅

- [x] Neues Modul `apps/mana/apps/web/src/lib/modules/ai-agents/ListView.svelte` — `/companion/agents` oder als App-Tab "Agents". CRUD + Policy-Editor + Memory-Editor + Budget/Concurrency-Felder.
- [x] `AgentPicker.svelte` Komponente — Dropdown mit Avatar + Name, einsetzbar in Mission-Create-Flow + Scene-Settings.
- [x] Mission-Create-Flow (`ai-missions/ListView.svelte`): neuer Schritt "Welcher Agent führt das aus?". Default: letzter-verwendeter oder "Mana".
- [x] `SceneAppBar.svelte` — wenn `scene.viewingAsAgentId` gesetzt: Agent-Avatar-Dot auf dem Tab, Tooltip mit Name.
- [x] Scene-Settings-Dialog: "An Agent binden" (optional) + "Bindung lösen".

### Phase 6 — Observability (0.5 Tag) ✅

- [x] AI-Workbench-Timeline (`ai-workbench/ListView.svelte`): Filter-Dropdown "Alle Agents | [Agent1] | [Agent2] …". Bucket-Header zeigt Agent-Avatar + -Name statt nur `missionId`.
- [x] `AiProposalInbox`-Card: Agent-Avatar + -Name oben links, Tooltip mit Mission-Titel + Rationale.
- [x] Budget-Anzeige: mini-Fortschrittsbalken im Agent-Tile ("23% Budget heute").

### Phase 7 — Rollout (0.5 Tag) ✅

- [x] Feature-Flag `PUBLIC_MULTI_AGENT_WORKBENCH=true` default (sind wir pre-live). Setting kann genutzt werden falls wir graduelle Migration im Webapp wollen — aktuell voll an.
- [x] Docs-Update: [`apps/mana/CLAUDE.md`](../../apps/mana/CLAUDE.md) — AI-Workbench-Abschnitt erweitern. `services/mana-ai/CLAUDE.md` → Agent-Projektion + per-Agent-Metriken.
- [x] User-Doc in `apps/docs/src/content/docs/architecture/security.mdx` — Abschnitt zu Agenten-Scope (ein Agent sieht deine Daten genau wie du; Mission-Key-Grants pro Agent sichtbar).

**Gesamtaufwand:** ~8–9 Arbeitstage.

---

## Dateien (neu / modifiziert)

**Neu:**
- `packages/shared-ai/src/agents/types.ts` + `index.ts`
- `packages/shared-ai/src/agents/default-agent.ts` (Bootstrap-Konstanten)
- `apps/mana/apps/web/src/lib/data/ai/agents/store.ts` + `queries.ts`
- `apps/mana/apps/web/src/lib/modules/ai-agents/ListView.svelte` + `module.config.ts`
- `apps/mana/apps/web/src/lib/components/ai/AgentPicker.svelte`
- `services/mana-ai/src/db/agents-projection.ts`
- `docs/plans/multi-agent-workbench.md` (dieses Dokument)

**Modifiziert:**
- `packages/shared-ai/src/actor.ts` — Identity-erweitert
- `packages/shared-ai/src/missions/types.ts` — `agentId`
- `packages/shared-ai/src/policy.ts` — Policy-Shape bleibt, Owner wandert auf Agent
- `apps/mana/apps/web/src/lib/types/workbench-scenes.ts` — `viewingAsAgentId?`
- `apps/mana/apps/web/src/lib/data/crypto/registry.ts` — `agents` Eintrag
- `apps/mana/apps/web/src/lib/data/database.ts` — Tabelle + Indizes
- `apps/mana/apps/web/src/lib/data/events/actor.ts` — Compat-Layer
- `apps/mana/apps/web/src/lib/data/ai/missions/runner.ts` — Agent-bewusst
- `apps/mana/apps/web/src/lib/data/ai/policy.ts` — Agent-scoped
- `apps/mana/apps/web/src/lib/components/workbench/SceneAppBar.svelte` — Agent-Avatar
- `apps/mana/apps/web/src/lib/modules/ai-missions/ListView.svelte` — AgentPicker
- `apps/mana/apps/web/src/lib/modules/ai-workbench/ListView.svelte` — Agent-Filter
- `services/mana-ai/src/db/missions-projection.ts` — `agentId` durchreichen
- `services/mana-ai/src/db/iteration-writer.ts` — Agent-Actor
- `services/mana-ai/src/cron/tick.ts` — Budget + Concurrency
- `services/mana-ai/src/metrics.ts` — Per-Agent-Metriken

---

## Risiken & Gegenmassnahmen

| Risiko | Mitigation |
|---|---|
| **Actor-Cutover bricht alle historischen Events** | Compat-Layer in `actor.ts` bei Read. Alte Events fallen auf `'legacy:*'` principalIds zurück, Timeline zeigt "Unbekannt". Kein Data-Loss. |
| **Default-Agent-Bootstrap-Race** beim Login (zwei Tabs starten parallel) | Bootstrap via `getOrCreate`-Pattern mit Dexie-Transaction. Idempotent: zweiter Call findet existierenden Agent. |
| **Agent-Memory wird zu lang → LLM-Prompt explodiert** | Harte 4000-char Warnung in der Memory-Editor-UI. Runner trunkiert auf 8000 chars mit Log-Warnung. |
| **Systemprompt-Injection über Memory-Feld** | Memory + systemPrompt werden in `<agent_context>...</agent_context>` Delimiter gewrappt. Output weiterhin via `parsePlannerResponse` validiert. |
| **Budget-Exhaustion während laufender Mission** | Check vor neuem Planner-Call, nicht mid-mission. Laufende Iteration darf fertig werden. Nächste Iteration der gleichen Mission im nächsten Tick wartet bis Counter-Reset. |
| **Concurrency-Guard im Single-Process-Runner ist race-free**, beim Multi-Instance-Deploy nicht | Advisory-Locks auf `mana_ai.agent_concurrency` bei Multi-Instance-Rollout (nicht in dieser Phase). |
| **Soft-deleted Agent hat laufende Mission → UI zeigt Ghost-Agent** | Ghost-Agent-Marker: greyer Avatar + "archiviert" Tooltip. Missions laufen fertig, Revert bleibt möglich. |

---

## Nicht-Ziele

- **Kein Agent-to-Agent Messaging.** Agents laufen unabhängig. Wenn später nötig, ist das ein eigenes Projekt.
- **Kein Meta-Planner über Agents.** Agents erzeugen sich keine Missionen selbst. User bleibt Mission-Creator (optional: Templates als Hilfsmittel).
- **Keine Team-Features.** Andere User oder geteilte Daten kommen in einem separaten Plan nach dieser Iteration.
- **Keine Agent-Memory-Self-Modification.** Memory wird nur vom User editiert. Evals + Drift-Kontrolle + Safe-Updates sind ein eigenes Thema.
- **Keine Per-Agent-Encryption-Domains.** Alle Agents sehen alle Daten des einen Users. Mission-Key-Grants bleiben per-Mission.
- **Keine neuen UI-Konzepte jenseits Modul-Tab + Picker.** Wir bauen nichts neu, was sich nicht im bestehenden Scene/App-Modell abbilden lässt.

---

## Offene Fragen (vor Phase 1) — ✅ beantwortet

1. **Agent-Name-Uniqueness:** → **Erzwungen** — aber im Store (write-time) statt via Dexie-Unique-Index, damit der Default-Agent-Bootstrap zwischen zwei parallel geöffneten Tabs nicht auf `ConstraintError` läuft. `DuplicateAgentNameError` aus `agents/store.ts`.
2. **"system"-Actor-Renaming:** → **Je-Source eigener principalId** (`system:projection`, `system:rule`, `system:migration`, `system:stream`, `system:mission-runner`). Konstanten in `@mana/shared-ai/src/actor.ts`. Gibt uns Forever-Filter im Workbench + saubere Revert-Scope-Unterscheidung.
3. **Legacy-User-Policy-Migration:** → **Voll gewandert**. User-Level-Policy-Singleton entfernt; jeder Agent trägt seine eigene Policy am Record. Default-Agent erbt die vorher gültige Policy einmalig beim Bootstrap. UI am Settings-Pfad ist weg. Ein Mini-Template-Picker (Standard / Cautious / Aggressive) im Agent-Detail ersetzt sie ergonomisch.
4. **Scene-Agent-Binding-Default:** → **Explicit leer**. Neue Scenes starten ohne Bindung. User bindet manuell via Scene-Context-Menü → "An Agent binden…". Hat die natürliche Folge dass "Agents sind Bürger, Scenes sind Fenster" in der UX durchhält.

---

## Shipping-Historie

| Phase | Commit | Files | Tests |
|---|---|---|---|
| 0 — Plan | (dieses Dokument) | `docs/plans/multi-agent-workbench.md` | n/a |
| 1 — Actor-Identität | `1771063df` | 13 files, 571+/116- | 26 shared-ai, 21 webapp vitest, 35 mana-ai |
| 2 — Agent CRUD | `bc77b3623` | 9 files, ~400 LOC | vitest green |
| 3 — mana-ai agent-aware | `0af50f016` | 7 files, 560+/17- | +6 mana-ai tests → 41 green |
| 4 — Policy pro Agent | `f7426ab40` | 3 files, 49+/2- | svelte-check clean |
| 5 — Agent UI + Scene-Binding | `51e6a20da` | 11 files | svelte-check clean |
| 6+7 — Observability + Docs | `7c89eb625` | 6 files, 162+/15- | svelte-check clean |

---

## Lessons Learnt + Follow-Up Ideen

### Was besser lief als erwartet

- **L3-Cutover war billiger als Plan B.** Actor als identitätsfähige discriminated union umzubauen hat 2 Tage gedauert inkl. aller Call-Sites. Die Alternative "zwei parallele Actor-Shapes durch Adapter" hätte Monate gekostet und drift-fällig sein. Nicht-live-sein war der entscheidende Enabler.
- **Default-Agent-Bootstrap als write-time `getOrCreate`** statt Dexie-Unique-Index hat die Tab-Race-Problematik ohne weiteren Code eliminiert. Lektion: "idempotent statt einzigartig" wo es geht.
- **displayName-Caching am Actor** hat sich in der Praxis bewährt. Timeline und Proposal-Inbox bleiben historisch stabil ohne Join auf die `agents`-Tabelle. Preis: displayName ist redundant — akzeptable Speicher-Kosten (~20 Bytes pro Event).

### Was dünn ist und später Nacharbeit verdient

- **Avatar nicht auf Actor gecached.** Im Proposal-Inbox hängt 🤖 hart drin; bei umbenanntem Agent fehlt der richtige Avatar in History. Fix: `avatar` ins BaseActor-Shape mitaufnehmen (low-cost additiv). Nicht dringend, weil der Avatar sowieso ein schwaches Signal ist; Name trägt die Identität.
- **Budget-Enforcement existiert im Datenmodell (`maxTokensPerDay`) aber ohne Counter.** Runner zählt noch keine Tokens. Vollständige Budget-Enforcement braucht LLM-Client-Token-Counts → Folgeprojekt. Bis dahin ist das Feld UI-Theater.
- **Agent-Detail-View zeigt keine Missions-Liste.** User sieht Agent A, fragt sich "welche Missions gehören diesem?" — müsste zurück in ai-missions navigieren + filtern. Simple Ergänzung: reverse-lookup-Sektion.
- **Kein Drag-to-Reassign.** Man kann eine Mission nicht von Agent A auf Agent B ziehen. Heute: edit-Mission-dialog mit AgentPicker. Besser: drag vom Mission-Item auf einen Agent-Tile.
- **Scene-Agent-Binding hat keinen Effekt auf Mission-Filter.** Plan sagt "wenn Scene an Agent gebunden, Workbench-Timeline + Mission-Create sollten Agent vorselektieren." Heute noch nicht durchgereicht — Scene-Binding ist nur Avatar-Deko.

### Größere Folgeprojekte

Die fünf expliziten Nicht-Ziele des Plans sind alle eigene Plans wert:

1. **Team-Features** → [`team-workbench.md`](./team-workbench.md) — separater forward-looking Plan, baut direkt auf `Actor.principalId` auf. Siehe dort.
2. **Agent-Memory-Self-Modification** — Evals, Drift-Detection, Safe-Update. Eigenes ML-Safety-Projekt.
3. **Agent-to-Agent Messaging** — benötigt event-bus-Konzept, Semantik "wann blockiert A auf B?", mental model für den User.
4. **Meta-Planner auf Agent-Ebene** — Agent-Objective statt Mission-Objective, Agent generiert sich Missionen selbst. Braucht sauberen Stop-Criteria-Mechanismus.
5. **Per-Agent-Encryption-Domains** — analog zum Mission-Grant, aber agent-scoped. Relevant wenn ein Agent "nur Notes lesen darf" als Policy + Crypto kombiniert werden soll.
