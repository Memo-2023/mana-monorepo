# Mana MCP + Personas + Visual Suite

_Started 2026-04-22._

Autonome Nutzung und Test von Mana durch Claude (und andere Agents) über ein einziges, sauberes Protokoll — plus eine Persona-Simulation, die Mana dauerhaft mit realistischem Content bespielt, und eine visuelle Regression-Suite, die das Ergebnis tatsächlich anschaut.

Voraussetzung: **nicht live, unbegrenzte Ressourcen, keine Migrations-Kompromisse.** Wir bauen die Endzustands-Architektur direkt, ohne Legacy-Reste.

## Ziel in einem Satz

Jeder Agent (Claude Desktop, Claude Code, ein interner Tick-Loop, ein MCP-fähiger Voice-Client) spricht **ein** Protokoll mit Mana — und dasselbe Protokoll wird von simulierten Personas genutzt, deren akkumulierender Content nachts durch eine Playwright-Suite visuell geprüft wird.

## Nicht-Ziele

- **Kein** Ersatz der Svelte-UI durch Agent-Flows. Die UI bleibt primäres Frontend für Menschen.
- **Keine** MCP-Exposition von Admin- oder Auth-Endpoints. Personas registrieren sich nicht selbst.
- **Keine** parallele Tool-Registry. mana-ai und mana-mcp konsumieren dasselbe Paket (siehe Entscheidung D3).
- **Keine** Persona-Daten in Produktion-Spaces. Personas sind eigene User mit klarer Kennzeichnung, ihre Spaces sind isoliert.

## Architektur

```
           ┌────────────────────────────────────────────────┐
           │ Claude Desktop / Claude Code / persona-runner  │
           └───────────────┬────────────────────────────────┘
                           │  MCP (Streamable HTTP + JWT)
                           ▼
                 ┌─────────────────────┐
                 │ services/mana-mcp   │  :3069
                 │ (Hono/Bun)          │
                 └──────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────────┐
        │                   │                       │
        ▼                   ▼                       ▼
   mana-auth           mana-api                 mana-sync
   (JWT/JWKS)          (Module-REST)            (SSE, RLS)
                            │
                            ▼
                      PostgreSQL
                      (mana_platform, mana_sync)


  ┌─────────────────────────────┐
  │ services/mana-persona-runner│  :3070
  │ Claude Agent SDK + MCP      │
  │ Tick-Loop (daily per user)  │
  └──────────┬──────────────────┘
             │ writes: persona_actions, persona_feedback
             ▼
          Postgres

  ┌─────────────────────────────┐
  │ tests/personas/*.spec.ts    │
  │ Playwright, nightly         │
  │ Login als Persona → Tour    │
  │ toHaveScreenshot Baselines  │
  └──────────┬──────────────────┘
             ▼
    Visual Diff Report
```

## Entscheidungen

Explizit und mit Begründung, damit wir bei späteren Zweifeln den Pfad kennen.

### D1 — Personas sind echte Mana-User

Kein Bypass, kein Service-Key-Trick. Jede Persona macht ein ganz normales `POST /api/v1/auth/register`, bekommt ein reguläres JWT, landet mit RLS-geschütztem Zugriff auf ihre `personal` Space.

**Warum:** Jeder andere Weg erzeugt zwei Code-Pfade — den normalen und den Persona-Pfad. Zwei Pfade bedeuten: Tests decken nur den Persona-Pfad ab, Bugs im echten Pfad bleiben unsichtbar. Wir wollen, dass Personas exakt dasselbe durchlaufen wie echte Nutzer.

**Abgrenzung zu echten Usern:** Neue Spalte `users.kind` mit Enum `'human' | 'persona' | 'system'`. Defaults auf `'human'`. Admin-UIs und Metriken filtern standardmäßig auf `kind = 'human'`. Email-Namespace `persona.<name>@mana.test` (nicht-existierende TLD, visuell sofort erkennbar).

### D2 — Auth via JWT-per-Agent, kein Service-Key

Der MCP-Server akzeptiert ausschließlich gültige mana-auth JWTs. Claude hält pro Persona ein Token (oder Refresh-Token) und authentifiziert sich wie ein Mensch.

**Warum:** Service-Key + `X-User-Id` (wie heute mana-ai → mana-research) bypassed RLS-Logik und erlaubt jedem Request, sich als jeden User auszugeben. Für interne service-to-service ok. Für einen offenen MCP-Endpoint inakzeptabel.

**Konsequenz:** MCP-Server ist JWKS-validiert über mana-auth. Standard `authMiddleware()` aus `@mana/shared-hono`. Jeder Tool-Call erbt User-Context aus Token, forwarded das an mana-api, mana-sync.

### D3 — Tool-Registry ist ein neues Shared Package

`packages/mana-tool-registry/` wird der einzige Ort, an dem Tools definiert werden. mana-ai (Mission-Runner) und mana-mcp (MCP-Server) konsumieren denselben Registry. Jedes Modul (`todo`, `journal`, `calendar`, …) liefert einen Tool-Spec (Zod-Schema + Description + Implementation-Stub) und registriert ihn.

**Warum:** mana-ai hat heute 67 Tools über 21 Module, großteils hartcodiert. Duplizieren im MCP-Server wäre der sofortige Rutsch in Legacy. Einmal zentral, beide konsumieren.

**Was das enthält:**
- Zod-Schema pro Tool-Input/Output (generiert Json-Schema für MCP + TS-Types für mana-ai)
- `scope`: `'per-user-space'` vs. `'global-admin'` — MCP exponiert nur ersteres
- `policy-hint`: `'read' | 'write' | 'destructive'` — für mana-ai Policy-Layer UND MCP Consent-Flows
- `implementation`: Funktion `(input, ctx) => result`, wobei `ctx` User+Space+JWT enthält

**Reihenfolge:** Wir ziehen mana-ai während M4 auf die neue Registry um. Nicht vorher. Sonst blockiert der Mission-Runner den MCP-MVP.

### D4 — MCP-Transport: Streamable HTTP

Nicht stdio. Der MCP-Server läuft als echter HTTP-Service, Multi-Client-fähig, durch dasselbe Cloudflare-Tunnel/nginx-Setup wie andere Services erreichbar.

**Warum:** stdio erzwingt 1:1 Child-Process-Modell. Ungeeignet für einen gemeinsamen Server, den Claude Desktop, der Persona-Runner und ad-hoc Agents gleichzeitig nutzen.

### D5 — Persona-Runner als eigener, minimaler Service

`services/mana-persona-runner/` (Bun/Hono, :3070). Uses `@anthropic-ai/claude-agent-sdk` direkt, konfiguriert mit dem MCP-Endpoint, iteriert pro Persona einmal pro Tag (configurable).

**Warum nicht in mana-ai mit reinpacken:** mana-ai ist für _unsere Nutzer_ und deren Missionen. Persona-Runner ist Test-Infrastruktur. Unterschiedliche Lifecycle, unterschiedliche Observability, unterschiedliche Risiko-Profile. Vermischt = später schwer zu trennen.

**Warum nicht Claude Code als Daemon:** Claude Code ist eine interaktive CLI. `claude -p` geht, aber Setup ist fragiler als 200 Zeilen Agent-SDK-Code mit klarem Tick-Loop.

### D6 — Persona-Metadata als eigene Tabelle

`platform.personas` in mana_platform:
- `userId` (FK, PK zu `users.id`, 1:1)
- `archetype` (z.B. `'adhd-student'`, `'ceo-busy'`, `'creative-parent'`)
- `systemPrompt` (Text, das was die Persona charakterisiert)
- `moduleMix` (jsonb, Gewichtungen — welche Module wie oft)
- `tickCadence` (`'daily'` | `'weekdays'` | `'hourly'`)
- `createdAt`, `lastActiveAt`

Nicht auf `users` geklatscht, damit die User-Tabelle pur bleibt — echte User und Personas teilen nur Auth/Identity, nicht ihre Charakterisierung.

### D7 — Spaces: Personas nutzen auto-erstellte `personal` Space plus Cross-Space-Testing

Bei Persona-Registrierung wird durch den normalen Signup-Flow bereits eine `personal` Space angelegt (Spaces-Foundation). Zusätzlich definieren wir im Persona-Katalog **Space-Rollen**: z.B. `Anna + Ben` sind Member einer `family` Space, `Marcus + Lena` einer `team` Space. Das testet Shared-Space-Mechanik ohne Extra-Framework.

**Warum:** Wenn alle Personas nur Personal-Spaces haben, testen wir Shared-Spaces nie. Die Kopplung im Persona-Katalog ist billig und deckt das ab.

### D8 — Visual Regression: Playwright built-in

`toHaveScreenshot()` mit Baselines in `tests/personas/__snapshots__/`. Konfiguration: 3 Viewports (Desktop 1440×900, iPad 768×1024, iPhone 390×844), threshold konservativ (0.2% pixel diff).

**Kein Chromatic, kein Percy.** Die Baselines werden ins Repo committed (nicht zu groß bei 3 Viewports × ~20 Screens × ~10 Personas = ~600 PNGs, overlap hoch durch WebP-Komprimierung).

**Warum:** Dritt-Services bedeuten Kosten, Accounts, Integration. Wir sind nicht live, brauchen das nicht. Wenn Baseline-Drift zum Problem wird, können wir später zu Chromatic wechseln.

### D9 — Ratings als strukturiertes Feedback

Jeder Persona-Tick endet mit einem Rating-Schritt: Claude generiert (als Persona) für jedes genutzte Modul eine 1–5 Bewertung plus Freitext-Notiz. Landet in `platform.persona_feedback`.

**Warum:** Der ganze Sinn von "Persona spielt Produkt" ist die qualitative Beobachtung. Ohne strukturierte Ausgabe erzeugen wir Logs niemand liest. Mit Ratings kannst du dir Montagfrüh ein Dashboard anschauen.

### D10 — Keine Exposition von destruktiven Admin-Tools via MCP

Tool-Registry markiert Operationen mit `policy-hint`. MCP exponiert nur `read` und `write`. `destructive` (User-Löschung, Space-Löschung, Tier-Änderung) bleibt interner Admin-API, erreichbar nur über Admin-UI mit echter 2FA-Sitzung.

**Warum:** Wenn wir jemals den MCP-Server extern zugänglich machen (Claude Desktop mit OAuth), soll kompromittiertes Token nicht bedeuten "User ist weg".

## Komponenten

### Komponente 1 — `packages/mana-tool-registry`

Neues Workspace-Paket. Zuerst gebaut, weil alles andere darauf aufbaut.

**Public API (Skizze):**
```ts
export interface ToolSpec<Input, Output> {
  name: string;                  // z.B. 'todo.create'
  description: string;           // Für LLM/Doku
  module: ModuleId;              // 'todo', 'journal', …
  scope: 'user-space' | 'admin';
  policyHint: 'read' | 'write' | 'destructive';
  input: ZodSchema<Input>;
  output: ZodSchema<Output>;
  handler: (input: Input, ctx: ToolContext) => Promise<Output>;
}

export interface ToolContext {
  userId: string;
  spaceId: string;
  jwt: string;
  logger: Logger;
}

export function registerTool(spec: ToolSpec<any, any>): void;
export function getRegistry(): ToolSpec<any, any>[];
export function getToolsByModule(module: ModuleId): ToolSpec<any, any>[];
```

Implementation der Handler ruft `mana-api` und `mana-sync` HTTP-Endpoints (mit `ctx.jwt`). Das hält die Registry dünn und zwingt korrekte RLS-Durchgänge. Direkte DB-Zugriffe wären schneller, aber würden RLS umgehen — genau das wollen wir nicht.

**Module-Coverage M1–M4:**
- **M1**: todo, journal, notes, calendar, contacts (5 Module, ~20 Tools)
- **M4 expand**: articles, picture, cards, missions, tags, spaces, goals, mood, dreams, library (10 weitere, ~45 Tools)
- **Nicht in scope initial**: voice-bot, video-gen, image-gen (die haben eigene Async-Flows, eigene Phase)

### Komponente 2 — `services/mana-mcp`

Hono/Bun, port 3069. Nutzt MCP TypeScript SDK (`@modelcontextprotocol/sdk`). Streamable HTTP Transport.

**Server-Struktur:**
```
services/mana-mcp/
├── src/
│   ├── index.ts              # Server bootstrap
│   ├── mcp-adapter.ts        # tool-registry → MCP tool definitions
│   ├── auth-middleware.ts    # JWKS verify
│   └── transport.ts          # Streamable HTTP
├── package.json
└── CLAUDE.md
```

Adapter-Logik: Für jeden `ToolSpec` aus `mana-tool-registry`, generiere eine MCP-Tool-Definition. Input-Schema aus `zod-to-json-schema`. Bei Invoke: User-Context aus JWT ziehen, `ctx` aufbauen, `handler` aufrufen, Output streamen.

**Auth-Flow:**
1. Client öffnet MCP-Session mit `Authorization: Bearer <jwt>`.
2. Middleware verifiziert gegen JWKS von mana-auth.
3. User-ID und aktive Space-ID aus Token-Claims.
4. Active Space wird aus `X-Mana-Space` Header überschrieben werden können (wichtig für Cross-Space-Tests).

**Logging:** Pro Tool-Call ein structured log mit `{persona, toolname, inputHash, latencyMs, result: 'ok'|'error'}`. Landet in `platform.persona_actions` falls `users.kind = 'persona'`, sonst nur stdout (echte User).

### Komponente 3 — `services/mana-persona-runner`

Hono/Bun, port 3070. Tick-Loop.

**Loop pro Tick (pro Persona):**

```
1. Lade persona record + systemPrompt + tickCadence + recent actions
2. Prüfe ob persona fällig ist (basierend auf tickCadence + lastActiveAt)
3. Falls ja:
   a. Hole JWT für persona (via stored refresh token oder re-login)
   b. Starte Claude Agent SDK session mit:
      - system: persona.systemPrompt + "Heute ist {date}, du hast Zugriff
        auf deine persönliche Mana-App. Was würdest du heute hier tun?"
      - mcp: localhost:3069 mit persona JWT
      - max_turns: 15
   c. Claude ruft MCP-Tools auf, erzeugt Content in Mana
   d. Abschließend Rating-Prompt: "Bewerte jedes Modul, das du heute
      genutzt hast, 1-5 mit einer Begründung."
   e. Parse Rating, schreibe zu persona_feedback
4. Update persona.lastActiveAt
```

**Concurrency:** Default 2 parallele Personas (Claude API rate limits schonen). Konfigurierbar über `PERSONA_CONCURRENCY` env.

**Scheduling:** Interner `setInterval` + `tickCadence`-Check. Kein externes Cron — Service muss eh durchlaufen, Metriken zu haben. Health-Endpoint `/health`, Prometheus-Metriken `/metrics`.

**Fehlertoleranz:** Timeout pro Persona-Tick 10 Minuten. Bei Fehler: Eintrag in `persona_actions` mit `error` Field, nächster Tick fährt weiter.

### Komponente 4 — Persona-Katalog

10 Personas, handgeschrieben, committed als JSON in `scripts/personas/catalog.json`.

**Archetype-Verteilung (Entwurf):**

| Name | Archetype | Modul-Mix | Space-Setup |
|------|-----------|-----------|-------------|
| Anna | adhd-student | todo, journal, notes, mood | personal only |
| Ben | adhd-student | todo, calendar, todos, journal | personal + family(mit Anna) |
| Marcus | ceo-busy | contacts, calendar, tasks, articles | personal + team(mit Lena) |
| Lena | ceo-busy | contacts, meetings, journal | personal + team(mit Marcus) |
| Sofia | creative-parent | journal, picture, notes, dreams | personal + family(mit Tom) |
| Tom | creative-parent | cards, calendar, todos | personal + family(mit Sofia) |
| Kai | solo-dev | articles, notes, library, goals | personal + practice |
| Julia | researcher | articles, news-research, notes | personal only |
| Paul | freelancer | invoices, calendar, contacts | personal + brand |
| Maya | overwhelmed-newbie | nur todo+journal, macht viele Fehler | personal only |

Die "overwhelmed-newbie" Persona ist bewusst dabei, um Onboarding-Bugs und Confusing-UX zu finden. Ihr System-Prompt erlaubt Claude, "verwirrt" zu sein und suboptimale Dinge zu tun.

### Komponente 5 — `tests/personas/`

Playwright-Suite. Läuft nachts gegen Staging (oder lokal gegen dev).

**Struktur:**
```
tests/personas/
├── fixtures/
│   └── persona-auth.ts       # Login-Helper, produziert Auth-State
├── flows/
│   ├── home-tour.spec.ts     # Alle Personas: Home + Navigation
│   ├── todo.spec.ts          # Todo-Personas: Liste + Detail
│   ├── journal.spec.ts       # Journal-Personas: Schreiben + Archive
│   └── ...
└── __snapshots__/
    └── <test>-<persona>-<viewport>.png
```

**Jeder Test-Lauf:**
1. Hole Persona-Liste aus `persona_catalog` (DB, gefüllt durch seed).
2. Für jede Persona × Flow × Viewport:
   - Login via API (bypass Browser-Login, wir testen nicht Login hier)
   - Storage-State setzen
   - Flow ausführen
   - Screenshot nehmen, vergleichen
3. Bei Diff: report generieren, bei `--update-snapshots` neue Baseline.

**CI-Integration:** GitHub Action nightly, oder Mac-Mini-Cron. Diff-HTML-Report in MinIO uploaded, Link in Slack gepostet.

## Datenmodell-Erweiterungen

Drei neue Tabellen in `platform.*`:

```sql
-- 1. Persona-Metadaten (1:1 mit users.kind='persona')
CREATE TABLE platform.personas (
  user_id UUID PRIMARY KEY REFERENCES platform.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  module_mix JSONB NOT NULL,
  tick_cadence TEXT NOT NULL DEFAULT 'daily',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Was Personas tun (audit trail)
CREATE TABLE platform.persona_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES platform.personas(user_id),
  tick_id UUID NOT NULL,                -- zusammenhängender Tick
  tool_name TEXT NOT NULL,
  input_hash TEXT,                      -- für dedup analytics
  result TEXT NOT NULL,                 -- 'ok' | 'error'
  error_message TEXT,
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON platform.persona_actions (persona_id, created_at DESC);

-- 3. Persona-Feedback pro Tick
CREATE TABLE platform.persona_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES platform.personas(user_id),
  tick_id UUID NOT NULL,
  module TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON platform.persona_feedback (module, created_at DESC);
```

Plus **ein** Feld auf existierender `platform.users`:

```sql
ALTER TABLE platform.users
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'human'
    CHECK (kind IN ('human', 'persona', 'system'));
```

## No-Legacy-Residues

Explizite Anti-Patterns, gegen die wir uns committen:

1. **Kein `isBot` Boolean.** `users.kind` Enum mit klaren Werten. Boolean-Flags wachsen immer ungeklärt.
2. **Keine parallele Tool-Definition.** Wenn mana-ai und mana-mcp je eigene Tool-Listen hätten, bekommen wir Drift. D3 zwingt die gemeinsame Registry.
3. **Kein Service-Key-Shortcut.** Auch nicht "nur für Personas, weil's einfacher wäre". D1+D2 machen klar: Personas gehen den Nutzer-Pfad.
4. **Kein versteckter Persona-Endpoint.** Alles was MCP kann, könnte auch ein echter Nutzer. Wenn ein Tool "nur für Personas" wäre, ist es Admin-Tool und gehört nicht in MCP.
5. **Keine Placeholder-Daten direkt in DB.** Persona-Content wird ausschließlich via MCP/REST erzeugt, durchläuft RLS, Encryption, Validation. Wenn wir DB-direkt seeden würden, testen wir nicht was wir testen wollen.
6. **Keine `if (user.email.endsWith('mana.test'))` Special-Cases.** Wenn Logik nach Persona verzweigen muss, dann über `users.kind`, und Grund muss in Commit dokumentiert sein.
7. **Keine Screenshot-Baselines ohne Review.** `--update-snapshots` ist kein Routine-Run. Jede Baseline-Änderung erzeugt einen Diff, und der wird menschlich angeschaut.

## Milestones

Jeder Milestone landet als klar erkennbares Commit-Set, ist standalone nützlich, typechecked + validate:all grün.

### M1 — Foundation (Tool-Registry + MCP-MVP, plaintext only)

**Scope-Refinement (gegenüber initialer Plan-Skizze):** Die ursprünglich gelisteten Tools (`todo.create`, `journal.add`, `notes.create`) zielen alle auf **encrypted** Tabellen. Server-side Encryption braucht eine MK-Unwrap-Infrastruktur, die noch nicht existiert. Statt M1 zu vergrößern, hält M1 sich strikt an plaintext-Tabellen — die MCP-Plumbing wird unabhängig von Encryption sauber bewiesen. Encryption-Path wird **M1.5**.

- [ ] `packages/mana-tool-registry/` scaffold: types, register/get, context type
- [ ] 5 Tools implementieren — alle plaintext: `habits.create`, `habits.list`, `habits.log`, `habits.recent_logs`, `spaces.list`
- [ ] `services/mana-mcp/` scaffold + Hono server + JWKS auth middleware
- [ ] MCP-Adapter: Registry → MCP tool definitions
- [ ] Streamable HTTP transport
- [ ] Integration-Test: lokaler Claude Code verbindet sich, listet Tools, ruft `habits.create` auf, Row erscheint in `mana_sync.sync_changes`
- [ ] Port 3069 in `docs/PORT_SCHEMA.md`
- [ ] `services/mana-mcp/CLAUDE.md` mit Architektur + Ports

**Exit criteria:** Claude Code kann mit einem dev-user-JWT gegen lokalen MCP-Server Habits anlegen, loggen und listen. Persona-Browser-Login (M5) zeigt diese Habits später visuell.

### M1.5 — Server-side encryption capability — ✅ SHIPPED 2026-04-22

**Scope-Update gegenüber initialer Skizze:** Der geplante neue Service-Key-gated Endpoint `POST /api/v1/internal/users/:id/mk` wurde **nicht gebaut** — nicht nötig. Der existierende Endpoint `GET /api/v1/me/encryption-vault/key` (JWT-gated, ZK-aware, bereits mit Audit-Trail) erfüllt genau den Zweck: Agent hält das JWT seiner Persona → fragt die Vault-API → bekommt MK für Non-ZK-User, recovery-blob für ZK (wir rejecten das mit `ZeroKnowledgeUserError`). Vorteil: zero neue Angriffsfläche, zero neuer Admin-Pfad.

- [x] `packages/shared-crypto/` extracted — `aes.ts` zieht um, Web-App `$lib/data/crypto/aes.ts` re-exportiert. Identische Wire-Format-Garantie (same code).
- [x] `@mana/tool-registry.MasterKeyClient` — cached Vault-Fetch per userId, 5-min TTL
- [x] `ToolContext.getMasterKey()` lazy — tools that need crypto call it, plaintext tools never do
- [x] `ToolSpec.encryptedFields?` declarative — `{table, fields}` pro tool, matches web-app registry verbatim (M4 audit script wird das cross-checken)
- [x] 5 neue encrypted tools: `todo.create`, `todo.list`, `todo.complete`, `notes.create`, `notes.search`, `journal.add` (ended up being 6 — `todo.complete` landed gratis, reines plaintext-update)
- [x] mana-mcp adapter baut `getMasterKey` in den ToolContext beim Session-Start ein, ein `MasterKeyClient` pro Prozess, cache teilen

**Exit criteria — erfüllt:** Encrypted Module sind über MCP für Non-ZK-User erreichbar. Type-check über alle 3 Pakete grün. Smoke-Boot: Service registriert 9 Tools total (4 habits + 1 spaces + 3 todo + 2 notes + 1 journal = 11, check-me), unauthed bleibt 401.

**Nicht gemacht (bewusst, M4 gehört das hin):**
- Audit-Script der `encryptedFields` vs. Web-App-Registry cross-checkt
- Einheitliche Registry-Daten zwischen Web-App und shared-crypto (heute: Web-App hält seine typed `entry<T>()` Version, tools halten ihre eigene Feldliste pro Spec — CI-Audit muss später drift fangen)

### M2 — Persona-Primitives — ✅ M2.a–M2.c SHIPPED 2026-04-22

**Namespace-Korrektur gegenüber initialer Skizze:** Die Tabellen landen in `auth.*` (nicht `platform.*`). Grund: mana-auth besitzt die Schemas `auth` (users) und `spaces` (orgs). Personas sind 1:1 mit users gekoppelt — gehören in den gleichen Schema-Namespace, erspart Cross-Schema-FKs. `platform.*` existiert in mana-auth nicht als Konvention.

#### M2.a — Schemas ✅

- [x] `userKindEnum` (`'human' | 'persona' | 'system'`) + `users.kind` column, default `'human'`
- [x] `auth.personas` (userId PK → users.id CASCADE, archetype, systemPrompt, moduleMix jsonb, tickCadence, lastActiveAt, createdAt)
- [x] `auth.persona_actions` (audit: tickId, toolName, inputHash, result, errorMessage, latencyMs)
- [x] `auth.persona_feedback` (structured ratings: tickId, module, rating 1–5, notes)
- [x] Better-auth `additionalFields.kind` wired so JWT/user-object carry the flag
- [x] Schema-barrel updated
- [ ] `bun run db:push` — **PENDING user action** (braucht Postgres lokal; `pnpm docker:up && cd services/mana-auth && bun run db:push`)

#### M2.b — Admin-Endpoints ✅

`services/mana-auth/src/routes/admin-personas.ts`, mounted at `/api/v1/admin/personas`, admin-tier-gated:

- [x] `POST /` — create-or-update by email. Uses `auth.api.signUpEmail` if missing, then stamps `kind=persona`, `accessTier=founder`, `emailVerified=true`, upserts persona row
- [x] `GET /` — list with 7-day action count per persona
- [x] `GET /:id` — detail + recent 20 actions + per-module feedback aggregate
- [x] `DELETE /:id` — hard delete, refuses non-persona users (defense-in-depth against admin typos)

#### M2.c — Catalog + seed ✅

- [x] `scripts/personas/catalog.json` — 10 personas, archetypes from plan D7 (adhd-student ×2, ceo-busy ×2, creative-parent ×2, solo-dev, researcher, freelancer, overwhelmed-newbie)
- [x] `scripts/personas/catalog.ts` — zod-validated loader, refine enforces `@mana.test` TLD
- [x] `scripts/personas/password.ts` — deterministic `HMAC-SHA256(PERSONA_SEED_SECRET, email)` → base64-stripped. Refuses dev-fallback in production
- [x] `scripts/personas/seed.ts` — orchestrates POST /admin/personas per catalog entry; `--dry-run`, `--auth=`, `--jwt=` flags
- [x] `scripts/personas/cleanup.ts` — lists personas from mana-auth, deletes every one (with warning on drift from catalog)
- [x] `pnpm seed:personas` + `pnpm seed:personas:cleanup` in root package.json
- [ ] Dry-run verified: `bun run scripts/personas/seed.ts --dry-run` lists all 10 personas
- [ ] Live seed run — **PENDING user action** (braucht laufendes mana-auth + admin JWT)

#### M2.d — Cross-Space memberships — DEFERRED

Plan D7 wollte `family`/`team`/`practice` Shared-Spaces zwischen Persona-Paaren. Bewusst auf später verschoben — Better-auth's organization invite flow ist mehrstufig, würde M2 ~2× blown. Persona-Runner (M3) kann erstmal nur in `personal` Spaces arbeiten; Shared-Space-Tests kommen als eigener Milestone.

**Exit criteria — erfüllt:** Schema + Code + Katalog shipped, dry-run grün. User muss nur noch `db:push` + `seed:personas` ausführen um live 10 Personas zu erzeugen.

### M3 — Persona-Runner — ✅ M3.a–M3.d SHIPPED 2026-04-22

Full tick loop live. End-to-end pipeline proven through type-check + boot smoke; full Postgres verification pending `db:push` + live seed + `ANTHROPIC_API_KEY` run. Smoke recipe documented in [`services/mana-persona-runner/CLAUDE.md`](../../services/mana-persona-runner/CLAUDE.md).

- [x] M3.a — Service scaffold on :3070 (config, auth client, password, `/health`, `/diag/login`)
- [x] M3.b — Tick loop: due-query → concurrent fan-out → `@anthropic-ai/claude-agent-sdk.query()` with MCP HTTP transport → tool-use + error extraction → rating turn with JSON parse → batched persistence
- [x] M3.c — Internal endpoints in mana-auth: `GET /due`, `POST /:id/actions`, `POST /:id/feedback`. All idempotent via deterministic row-ids
- [x] M3.d — CLAUDE.md updated with pipeline diagram + full end-to-end smoke recipe

#### Archived initial checklist

- [ ] `services/mana-persona-runner/` scaffold
- [ ] Tick-Loop: liest Personas aus DB, Cadence-Check, pro fällige Persona → Claude Agent SDK Aufruf
- [ ] JWT-Handling: Refresh-Token-Storage in `platform.personas` (encrypted field), auto-refresh
- [ ] Concurrency-Control (default 2)
- [ ] `persona_actions` + `persona_feedback` Writes
- [ ] Prometheus metrics: `persona_ticks_total`, `persona_tool_calls_total`, `persona_errors_total`
- [ ] Observability-Dashboard (Markdown in `docs/observability/personas.md`, evtl. später Grafana)

**Exit criteria:** Service läuft lokal, nach 24h haben alle 10 Personas mindestens einen Tick ausgeführt, in der App ist sichtbarer Content pro Persona.

### M4 — Full Tool Coverage + Three-Catalog Unification

**Aufgefundener Stand (2026-04-22):** Es existieren bereits drei Tool-Kataloge im Repo, die alle gemerged werden:

1. `packages/shared-ai/AI_TOOL_CATALOG` — konsumiert von `apps/api/src/mcp/server.ts`
2. `services/mana-ai/` interne Tool-Definitionen (~67 Tools, 21 Module) — Mission-Runner
3. `packages/mana-tool-registry/` — neu in M1, wird der SSOT

- [ ] Tool-Registry auf 15+ Module ausbauen (siehe Komponente 1)
- [ ] mana-ai migrieren: alle heute hartcodierten Tools ziehen in `mana-tool-registry`, mana-ai konsumiert via `getRegistry()`
- [ ] `packages/shared-ai/AI_TOOL_CATALOG` löschen, `apps/api/src/mcp/server.ts` löschen (mana-mcp übernimmt die Funktion)
- [ ] Alte Tool-Definitionen in mana-ai löschen (harter Cut, keine Parallelität)
- [ ] End-to-end-Test: sowohl eine mana-ai-Mission als auch ein Persona-Runner-Tick nutzen dieselbe `todo.create`

**Exit criteria:** Grep nach duplizierten Tool-Definitionen → leer. Beide Consumer grün.

### M5 — Visual Suite — ✅ M5.a scaffold SHIPPED 2026-04-23

Single-flow foundation. Fixture + config + one spec + README + pnpm-scripts. Extension is copy-paste per module. Live baseline capture is user-side (needs running stack + seeded + persona-runner ticked).

- [x] `tests/personas/playwright.config.ts` — own config, 2 viewports (desktop + mobile Pixel 5), 0.2 % diff threshold, animations disabled, `snapshotPathTemplate` scoped to per-spec folder, no auto-webServer (regressions only matter against a real running stack)
- [x] `tests/personas/fixtures/persona-auth.ts` — HMAC-SHA256 password derivation (bit-identical mirror of `scripts/personas/password.ts` + `services/mana-persona-runner/src/password.ts` — **3-way contract**, changing one breaks the others), Set-Cookie parsing, typed `test.extend` with `personaKey` worker option + `personaPage` fixture
- [x] `tests/personas/flows/home.spec.ts` — smoke flow, captures home-tour screenshot as `anna-adhd-student`
- [x] `tests/personas/README.md` — prerequisites, run recipe, architecture diagram, "adding a flow" steps
- [x] `pnpm test:personas` + `pnpm test:personas:update` on the root

**Deferred** (copy-paste extensions once user has stack running):
- Per-module flows: todo, journal, notes, habits, calendar, contacts
- Additional viewports (iPad, webkit)
- Nightly CI job via GitHub Action or Mac-Mini cron

#### Archived initial checklist

- [ ] `tests/personas/` Struktur
- [ ] Persona-Login-Fixture (API-Login → storageState)
- [ ] Flow-Specs: `home-tour`, `todo`, `journal`, `notes`, `calendar`, `articles`, `contacts`, `cards`, `missions`, `settings` (10 Flows)
- [ ] 3 Viewports: Desktop, iPad, iPhone
- [ ] Baseline-Capture pro Persona × Flow × Viewport
- [ ] Playwright-Config: threshold 0.2%, animation-handling, font-loading wait
- [ ] Nightly-Run: GitHub Action oder Mac-Mini-Cron, Report zu MinIO, Slack-Notify bei Diff
- [ ] `docs/testing/visual-regression.md`

**Exit criteria:** Nightly läuft, baseline committed, bei Code-Change sehen wir Diff-Report.

### M6 — Polish (optional, nach M1–M5)

- [ ] Admin-UI-Tab "Personas" in der Web-App: Liste, letzte Actions, Feedback-Dashboard pro Modul
- [ ] Rating-Aggregations-View: `"Modul X bekommt seit 3 Wochen schlechtere Ratings als vorher"`
- [ ] MCP-OAuth-Flow für externe Clients (wenn wir das je öffnen)
- [ ] Chaos-Personas: gezielt fehlerhafte Inputs, Edge-Cases, Unicode-Chaos

## Risiken + Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-----|-----|------------|
| Claude API Rate-Limits bei 10 Personas × täglich × 15 Turns | Mittel | Mittel | Concurrency-Config (default 2), Retry-with-backoff, Tier-Upgrade falls nötig |
| Persona-Daten "leaken" in Produktion-Dashboards | Niedrig | Hoch | `users.kind` Filter standardmäßig in allen Admin-Queries, Review-Checklist bei neuen Dashboards |
| Tool-Registry wird zu groß / unübersichtlich | Mittel | Niedrig | Pro Modul eine Datei, Index nur re-exportiert; CI-Check max Tools-pro-Modul |
| Visual Baselines drift durch zufällige Daten (z.B. Zeitanzeige, IDs) | Hoch | Mittel | Deterministic persona seed (fixed dates), `data-testid` statt visueller Hashes, frozen clock in Playwright |
| MCP-SDK API ändert sich | Niedrig | Mittel | Dünner Adapter-Layer in `mcp-adapter.ts`, Pin der SDK-Version |
| Persona-Refresh-Token läuft ab | Hoch (über Wochen) | Niedrig | Auto-refresh in Runner, Alert wenn Refresh fehlschlägt |

## Offene Entscheidungen (später)

- **Tool-Versioning:** Wenn wir `todo.create` ändern, Breaking für MCP-Clients? Wir sind noch nicht live, brauchen das noch nicht. Nach M4 einmal reviewen.
- **MCP für externe Nutzer:** Wenn/wann jemals Mana als Tool für Claude Desktop released werden soll → OAuth-Flow statt JWT-Bearer. Phase M6+.
- **Persona-Content-Cleanup:** Nach 90 Tagen werden Persona-Spaces massiv, DB wächst. Brauchen wir `persona.maxHistoryDays`? Beobachten, M3 sammelt erst mal Daten.
- **Langzeit-Konsistenz:** Wenn Anna 30 Tage lang Todos anlegt, wird Claude sich an eigene frühere Einträge erinnern können (durch MCP-List-Tools). Wir müssen prüfen, ob der System-Prompt + letzte N Actions genug ist oder ob wir eine explizite "Anna's story so far"-Zusammenfassung pflegen.

## Shipping Log

(Leer — wird befüllt, während M1 → M6 gehen.)

| Phase | Purpose | Commit |
| --- | --- | --- |
| — | — | — |
