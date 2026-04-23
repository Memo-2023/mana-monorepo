# Destructive-Tools Opt-In — per-Space

_Drafted 2026-04-23. Status: **spec**, nicht implementiert. Bau-Trigger: das erste Tool mit `policyHint: 'destructive'` landet in `@mana/tool-registry`._

Erweitert das M1-Policy-Gate (`evaluatePolicy()` in `@mana/tool-registry`) um eine persistente per-Space-Whitelist, die entscheidet, welche destruktiven Tools die KI in welchem Space wirklich ausführen darf. Bis das hier gebaut ist, lehnt der Gate jeden destruktiven Call ab (`reason: 'destructive-not-allowed'`), was für `POLICY_MODE=log-only` okay ist, aber `enforce` de facto blockiert.

**Hintergrund:**
- [`docs/plans/agent-loop-improvements-m1.md`](./agent-loop-improvements-m1.md) — M1+M2-Implementierung, inkl. der aktuellen `settingsFor()`-Hardcoding-Stelle (`services/mana-mcp/src/mcp-adapter.ts`)
- [`docs/reports/mana-agent-improvements-from-claude-code.md`](../reports/mana-agent-improvements-from-claude-code.md) — Claude-Code-Referenz für das Muster (pro-User im Original, hier pro-Space)
- [`docs/plans/space-scoped-data-model.md`](./space-scoped-data-model.md) — die Space-Semantik, an die wir andocken

## Ziel in einem Satz

Jeder Space trägt eine kleine, Server-authoritative Policy-Konfiguration, die pro destruktivem Tool sagt „darf die KI in diesem Space", geschützt durch Role-Gating, sichtbar im Audit-Log, bearbeitbar in einer Settings-Seite pro Space.

## Nicht-Ziele

- **Per-User** oder **per-Member-innerhalb-Space**. Alle Members eines Spaces teilen die gleiche Policy. Wenn Alice etwas erlaubt, gilt das auch für Bob — ist eine Eigenschaft des Spaces, nicht der Person.
- **Zeitbasierte Permissions** (nur für 24h erlaubt). Später erwägen; heute nicht.
- **Per-Tool-Rate-Limits per Space**. Die Registry hat einen globalen 30/min/User-Default; per-Space-Override ist YAGNI.
- **Tools ausserhalb MCP/mana-ai**. Native App-Buttons (User klickt „Habit löschen") brauchen keine Tool-Policy — das ist User-Intent, nicht AI-Intent.
- **Automatische Migration von existierenden Spaces**. Alle Spaces starten mit leerer Whitelist; User enablet explizit.
- **Registry-Einträge ohne `policyHint: 'destructive'` einschließen**. Writes/Reads bleiben über die bestehende agent.policy gesteuert (per-Mission).

## Entscheidungen (gesetzt)

| Frage | Entscheidung | Warum |
|---|---|---|
| Scope | **Per-Space** | User-Entscheidung. Passt zum Space-scoped-data-model; Destructive-Rechte auf Arbeits-Spaces können strenger sein als auf Private-Spaces. |
| Authority | **Server-authoritative**, nicht Local-First | Security-relevant, Multi-Device-Konsistenz muss sofort greifen. Nicht in Dexie. |
| Storage | Eigene Tabelle `mana_spaces.space_policy_preferences`, **nicht** JSON-Column auf `spaces` | Typisiert, indexierbar, Migrations-freundlich, Audit-Trail natürlicher. |
| Sync | **Nur** Server-Read; keine Dexie-Replik | Write nur via JWT-gated API; Frontend ruft direkt. Cache im mana-mcp-Adapter. |
| Role-Gating | Nur Space-Owner + `admin`-Role-Members dürfen ändern; alle Members dürfen lesen | Minimales Privilegien-Prinzip. Matcht wie andere Space-Settings gehandhabt werden. |
| Default | `[]` — nichts erlaubt, bei neuen und bestehenden Spaces | Sicher by default. User muss explizit opt-in. |
| Toggle-Granularität | Pro Tool, nicht global | Setzt Claude-Code-Pattern um (1:1-Mapping Tool ↔ Permission). Master-Toggle kann später dazu. |
| Confirm-Flow | Explizite Checkbox „Ich verstehe dass diese Tool unwiderruflich löscht" vor Speichern | Anti-Click-Through. |
| Cache-TTL | 30 s in mana-mcp | Gleiches Pattern wie `MasterKeyClient`. Kurz genug für schnelle Reaktion auf Revoke, lang genug für Tool-Burst-Calls in einer Session. |

## Architektur

```
                  apps/mana/apps/web — /s/:spaceId/settings/ai-policy
                               │ HTTP (PUT)
                               ▼
          ┌─────────────────────────────────────┐
          │   apps/api (Hono/Bun, :3060)        │
          │   /api/v1/spaces/:id/policy          │
          │    - GET  (any member)              │
          │    - PUT  (owner + admin only)      │
          │       → role-check                  │
          │       → write to mana_spaces.       │
          │         space_policy_preferences    │
          │       → write audit row             │
          └────────────────┬─────────────────────┘
                           │
                           ▼
                   Postgres (mana_spaces schema)
                           │
                           │ read (GET /internal/spaces/:id/policy)
                           ▼
          ┌─────────────────────────────────────┐
          │   services/mana-mcp (:3069)         │
          │   SpacePolicyClient (like           │
          │   MasterKeyClient — TTL cache)      │
          │    settingsFor(user, spaceId)       │
          └──────────────────┬──────────────────┘
                             ▼
                    evaluatePolicy()
                  (destructive check reads
                   userSettings.allowDestructive)
```

## Storage

### `mana_spaces.space_policy_preferences`

```sql
CREATE TABLE mana_spaces.space_policy_preferences (
  space_id         uuid PRIMARY KEY REFERENCES mana_spaces.spaces(id) ON DELETE CASCADE,
  allow_destructive text[] NOT NULL DEFAULT '{}',
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid NOT NULL REFERENCES auth.users(id),
  schema_version   integer NOT NULL DEFAULT 1
);

CREATE INDEX space_policy_preferences_updated_at_idx
  ON mana_spaces.space_policy_preferences(updated_at DESC);
```

**RLS:**
```sql
ALTER TABLE mana_spaces.space_policy_preferences ENABLE ROW LEVEL SECURITY;

-- Members can SELECT
CREATE POLICY spp_member_read ON mana_spaces.space_policy_preferences
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM mana_spaces.space_members
      WHERE user_id = app.current_user_id()
    )
  );

-- Only owner + admin role can UPDATE / INSERT / DELETE
CREATE POLICY spp_admin_write ON mana_spaces.space_policy_preferences
  FOR ALL USING (
    space_id IN (
      SELECT space_id FROM mana_spaces.space_members
      WHERE user_id = app.current_user_id()
        AND role IN ('owner', 'admin')
    )
  );
```

### `mana_spaces.space_policy_audit`

Append-only. Jede Änderung ein Row.

```sql
CREATE TABLE mana_spaces.space_policy_audit (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id   uuid NOT NULL REFERENCES mana_spaces.spaces(id) ON DELETE CASCADE,
  actor_id   uuid NOT NULL REFERENCES auth.users(id),
  action     text NOT NULL CHECK (action IN ('added', 'removed')),
  tool_name  text NOT NULL,
  at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX space_policy_audit_space_idx
  ON mana_spaces.space_policy_audit(space_id, at DESC);
```

**RLS:**
```sql
ALTER TABLE mana_spaces.space_policy_audit ENABLE ROW LEVEL SECURITY;

-- Members can read audit for their spaces
CREATE POLICY spa_member_read ON mana_spaces.space_policy_audit
  FOR SELECT USING (
    space_id IN (
      SELECT space_id FROM mana_spaces.space_members
      WHERE user_id = app.current_user_id()
    )
  );

-- Writes only from the service role (the PUT endpoint issues these
-- inside the same withUser transaction as the preferences write).
-- No direct client writes — ever.
```

**Retention**: keine — DSGVO-relevant wenn Audit-Dauer; 3 Jahre scheint eine vernünftige Balance für EU-Hosting. Entscheidung offen, siehe §Offene Fragen.

## API (apps/api)

Routes in `apps/api/src/modules/spaces/policy-routes.ts`:

### `GET /api/v1/spaces/:spaceId/policy`

JWT-gated. Any member of the space.

```ts
Response 200:
{
  spaceId: string;
  allowDestructive: string[];   // Tool-Namen, z.B. ['habits.delete', 'notes.delete']
  updatedAt: string;            // ISO 8601
  updatedBy: string;            // userId
}
```

Wenn für den Space noch keine Row existiert: implizit `{ allowDestructive: [] }` mit `updatedAt: null`. Das Frontend rendert das identisch zu „leer".

### `PUT /api/v1/spaces/:spaceId/policy`

JWT-gated. **Role-Check**: nur `owner` + `admin`. 403 sonst.

```ts
Request:
{
  allowDestructive: string[];   // vollständige neue Liste (nicht delta!)
  acknowledged: true;           // UI-Anti-Clickthrough — muss true sein wenn neue Tools hinzugefügt werden
}

Response 200:
{ spaceId, allowDestructive, updatedAt, updatedBy }
```

**Validation** (Zod schema):
- `allowDestructive` max 50 Einträge
- Jeder Eintrag matcht `^[a-z_]+\.[a-z_]+$` (module.verb)
- **Wichtig**: jeder Name wird gegen den Tool-Registry-Bestand geprüft. Unbekannte Tools → 400. Verhindert "vorab-genehmigte" Tool-Namen die später plötzlich live gehen und dann Destructive sind.
- Jeder Eintrag muss `policyHint: 'destructive'` haben (nicht-destruktive landen hier nicht — sichergestellt durch registry-lookup).
- `acknowledged: true` verpflichtend wenn die resultierende Liste strictly größer ist als die bestehende (neue Tools dazu).

**Side-Effects** (in einer Transaktion):
1. Upsert in `space_policy_preferences`
2. Diff gegen alte Liste → ein `space_policy_audit`-Row pro `added` und `removed`

### `GET /api/v1/spaces/:spaceId/policy/audit?limit=50`

JWT-gated. Member-read. Paginiert (cursor via `at < ?`).

```ts
Response 200:
{
  entries: Array<{
    id, spaceId, actorId, actorDisplayName, action: 'added'|'removed', toolName, at
  }>;
  nextCursor?: string;
}
```

### `GET /internal/spaces/:spaceId/policy`

Service-to-service. `X-Service-Key`-gated. Used by mana-mcp's `SpacePolicyClient`. Identisches Response-Shape wie der User-facing GET. **Kein** Role-Check — interne Services dürfen Policy für jeden Space lesen.

## Consumer-Wiring (mana-mcp)

### Neuer Client: `services/mana-mcp/src/space-policy-client.ts`

Gleiches Muster wie `MasterKeyClient`: TTL-Cache, per-space-keyed (nicht per-user — die Policy ist space-bound).

```ts
export interface SpacePolicy {
  allowDestructive: readonly string[];
}

export class SpacePolicyClient {
  private cache = new Map<string, { policy: SpacePolicy; fetchedAt: number }>();
  private static TTL_MS = 30_000;

  constructor(private opts: { apiUrl: string; serviceKey: string }) {}

  async getPolicy(spaceId: string): Promise<SpacePolicy> {
    const hit = this.cache.get(spaceId);
    if (hit && Date.now() - hit.fetchedAt < SpacePolicyClient.TTL_MS) {
      return hit.policy;
    }
    const res = await fetch(
      `${this.opts.apiUrl}/internal/spaces/${encodeURIComponent(spaceId)}/policy`,
      { headers: { 'X-Service-Key': this.opts.serviceKey } }
    );
    if (!res.ok) {
      // Fail-CLOSED — deny destructive by default if we can't reach apps-api.
      // This is the correct security default; the UI will show stale state
      // for 30s after enforcement comes back online, which is acceptable.
      return { allowDestructive: [] };
    }
    const body = await res.json();
    const policy: SpacePolicy = { allowDestructive: body.allowDestructive ?? [] };
    this.cache.set(spaceId, { policy, fetchedAt: Date.now() });
    return policy;
  }
}
```

### Integration in `mcp-adapter.ts`

`settingsFor()` wird async und nimmt die space-id:

```ts
const spacePolicyClient = new SpacePolicyClient({
  apiUrl: process.env.MANA_API_URL,
  serviceKey: process.env.MANA_SERVICE_KEY,
});

async function settingsFor(user: VerifiedUser): Promise<UserPolicySettings> {
  const policy = await spacePolicyClient.getPolicy(user.spaceId);
  return { allowDestructive: policy.allowDestructive };
}
```

`invoke()` wird leicht umgestellt (async settings-fetch vor dem Gate), ansonsten unverändert.

### Integration in `mana-ai`

`services/mana-ai/src/cron/tick.ts`'s `onToolCall` ist heute nur ein Recorder — Tool-Execution passiert client-side via Sync-Staging. Für den Server-Runner ist `allowDestructive` daher nicht sicherheitsrelevant (Plans werden eh vom Client-Side-Executor gegen seine eigene agent.policy geprüft).

**ABER** wenn die Tool-Registry mana-ai komplett absorbiert (M4 aus dem Personas-Plan), wird mana-ai selbst Tools ausführen. Dann gleicher Pattern wie mana-mcp: `SpacePolicyClient` injizieren, `settingsFor(mission.spaceId)` aufrufen, in Mission-State cachen über die Tick-Dauer.

## UI (webapp)

Neue Route: `/s/:spaceSlug/settings/ai-policy` — embedded in die Space-Settings-Area.

### Komponentenbaum

```
<AiPolicySettingsPage>
  <SpaceHeader />
  <section>
    <h2>KI-Aktionen in diesem Space</h2>
    <p>
      Standardmäßig darf die KI keine Daten unwiderruflich löschen.
      Aktivieren bedeutet: wenn du der KI "lösche X" sagst, passiert das
      ohne Papierkorb. Du kannst das jederzeit widerrufen.
    </p>
    <DestructiveToolList
      tools={destructiveToolsFromRegistry}
      enabled={state.allowDestructive}
      onToggle={handleToggle}
      onSave={handleSave}
    />
  </section>
  <AuditLogSection spaceId={spaceId} limit={20} />
</AiPolicySettingsPage>
```

### Destructive-Tool-Karten

Jedes Tool kriegt eine Karte mit:
- Tool-Name (z. B. `habits.delete`)
- Description aus der Registry
- **Toggle** (ein/aus)
- **Affected-data-hint** — "Betrifft: Gewohnheiten in diesem Space" (abgeleitet aus `spec.encryptedFields?.table` oder dem Modul-Namen)
- Für neu-aktivierte Tools: das Save-Button-Modal mit der Pflicht-Checkbox „Ich verstehe, dass das nicht rückgängig gemacht werden kann".

### Audit-Log-Abschnitt

Tabelle mit `at | actor | action | tool`. Pagination-Button "Ältere anzeigen". Niemand kann Einträge löschen (append-only).

### Zugriffs-Gating

`AuthGate` + `SpaceMemberGate` + zusätzlich: nur wenn Member-Role ∈ {`owner`, `admin`} ist die Toggle-UI interaktiv. Sonst: Read-only mit Hinweis "Nur Space-Admins können Einstellungen ändern".

## Audit + Safety

- **Diff-based Audit**: beim PUT wird altes vs. neues `allowDestructive` verglichen; ein Audit-Row pro `added` und `removed`. Keine Löschungen oder Updates an Audit-Rows — immutable.
- **Acknowledgement enforced at API**: der `acknowledged: true` Flag wird geprüft bevor Add-Diff durchrutscht. Frontend kann nicht "vergessen" das Modal zu zeigen und trotzdem den Request absetzen.
- **Fail-closed bei Cache-Miss + API-Error**: Wenn mana-mcp apps-api nicht erreichen kann, wird destructive geblockt. Lieber eine 30s-Lücke mit "deny" als eine 30s-Lücke mit "allow".
- **Kein Self-Gating**: ein Space-Owner kann für seinen eigenen Space aktivieren ohne Second-Approval. Begründung: der Owner trägt bereits die Verantwortung für alle Daten im Space. Pairing-Reviews sind für Production-Deploys, nicht für Consumer-Apps.
- **Revoke wirkt schnell**: 30s max bis zum Cache-Ablauf. Für schnelleren Revoke kann später ein In-Memory-Pub/Sub via Redis geschaltet werden (nicht MVP).

## Metriken

Erweiterung der bestehenden `mana_mcp_policy_decisions_total`:

- `reason="destructive-not-allowed"` bleibt das gleiche. Dashboards müssen nicht geändert werden.
- **Neu**: `mana_api_space_policy_changes_total{action="added"|"removed"}` — zählt User-initiierte Änderungen. Pattern zur Anomalieerkennung (z. B. plötzlicher Flip von deny → allow für einen Space in dem das vorher nie aktiv war).

## Rollout-Reihenfolge

1. **Migration** — `space_policy_preferences` + `space_policy_audit` Tabellen, RLS-Policies, Indexes. `pnpm db:push`.
2. **apps-api endpoints** — GET/PUT/GET-audit + interner GET. Zod-schemas. Registry-lookup für unknown-tool-Validation. Integration-tests.
3. **mana-mcp SpacePolicyClient** — TTL-cache, fail-closed. Unit-tests.
4. **mana-mcp settingsFor() umstellen** auf async + space-policy. Integration-test: Space mit `allowDestructive: ['habits.delete']` → Gate lässt durch; Space ohne → Gate blockiert.
5. **UI** — `/s/:space/settings/ai-policy` + Audit-Sektion. Acknowledgement-Modal.
6. **Metrik** — Counter in apps-api; Grafana-Panel unter dem bestehenden "Policy Gate"-Block in `agent-loop.json`.
7. **Doku-Update** — `services/mana-mcp/CLAUDE.md` §Policy gate um den Per-Space-Hinweis erweitern; Link auf diesen Plan.

## Tests

- **apps-api** — GET (member, non-member=403), PUT (owner ok, member=403, unknown-tool=400, missing-acknowledged-on-add=400), audit-row correctness, concurrent-write LWW behaviour.
- **SpacePolicyClient** — cache hit vs miss, TTL expiry, API-error fail-closed, per-space cache separation.
- **mana-mcp integration** — End-to-End: mock apps-api, MCP call zu destructive tool, mit/ohne opt-in.
- **UI** — role-gate rendering, acknowledgement modal, audit list pagination.
- **RLS** — Postgres-level test: member read, admin write, non-member blocked, direct audit insert blocked.

## Offene Fragen

1. **Audit-Retention**: 3 Jahre? DSGVO sagt "so lange wie nötig" — für Security-Audit ist 3 Jahre defensiv, aber da sind wir auch beim Compliance-Overhead. Entscheidung zum Bau-Zeitpunkt.
2. **Pub/Sub für sofortigen Revoke-Effekt**: heute 30s TTL. Falls wir Hot-Revoke-Szenarios haben (Ex-Admin, kompromittierter Account), lohnt Redis-Pub/Sub? Würde ich später schalten, nicht MVP.
3. **Quorum-Mode für Shared-Spaces**: Bei einem 10-Person-Team-Space — soll eine einzelne Admin-Stimme reichen um Destructive zu enablen? Oder N-of-M? Heute: Einzelperson reicht. Falls später Team-Spaces populär werden, `require_unanimous` oder `require_n_of_admins` als Space-Setting.
4. **Welche Member-Role entscheidet**: `owner` + `admin` ist die Annahme. Falls es eine eigene `policy-manager`-Role gibt, ist das spezifischer. Noch unklar was die final Role-Hierarchie in space_members ist.

## Wann diesen Plan aktivieren

Trigger: **Pull-Request der das erste Tool mit `policyHint: 'destructive'` in `packages/mana-tool-registry/src/modules/*.ts` registriert** — entweder als eigenständiger PR oder als Teil einer Feature-PR. Dieser PR sollte NICHT mergen bis die Schritte 1-4 aus §Rollout durch sind, sonst blockiert der Gate in `enforce`-Mode alle User von dem neuen Tool.

Empfohlener Workflow, wenn der Trigger-PR kommt:
1. Diesen Plan re-checken gegen aktuelle Repo-Realität (`space_members`-Shape, apps-api-Konventionen)
2. Schritte 1-4 als eigener Stack landen (kann parallel zum Trigger-PR laufen)
3. UI (5) + Metrik (6) + Doku (7) im selben Stack
4. Trigger-PR erst danach mergen
5. In den docs/plans diesen Plan als "shipped" markieren und den Trigger-PR referenzieren
