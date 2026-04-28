# Demo-Personas — Runbook

Wie wir Pitch-Demo-Accounts mit echten Vereinen / Solo-Selbstständigen /
Familien befüllen. Pro Persona ein **echter, lebender User-Account** auf
`mana.how`-Prod, gefüllt mit recherchierten echten Daten des Ziels. Kein
spezielles Demo-Subsystem, keine Fork-Infrastruktur, keine Resets.

Wenn der Ziel-Verein irgendwann tatsächlich Kunde wird, übernimmt er den
existierenden Account. Null Migration.

---

## Account-Konvention

| | |
|---|---|
| Email | `<slug>@mana.how` ohne `demo-`-Prefix |
| Initial-Passwort | Zufällig generiert, an Till übergeben |
| Tier | `founder` |
| Role | `admin` |
| Mailbox | Stalwart-Provisionierung läuft automatisch |
| Spaces | `personal` (auto) + meist `club`/`practice`/`family`/`brand` |

---

## Phasen pro Persona

### Phase 1 — Recherche (~20–40 min)

Primärquelle ist die offizielle Website. Sekundärquellen nur bei Lücken.
Output: `docs/demo-personas/<slug>/README.md` mit drei Pflicht-Sektionen:

1. **Quellen** — Liste aller URLs mit Datum
2. **Daten** — strukturiert nach Modul
3. **Lücken** — was fehlt + wie wir damit umgehen (kein Erfinden)

### Phase 2 — Account anlegen (~5 min, auf Mac-Mini-Prod)

```bash
ssh mana-server
export PATH="/opt/homebrew/bin:$PATH"

# 1. Register via Better-Auth
curl -sS -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"<slug>@mana.how","password":"<random>","name":"<Name>"}'

# 2. Promote: founder + admin + verified + sync gifted + 10k credits
docker exec -i mana-infra-postgres psql -U postgres -d mana_platform <<'SQL'
UPDATE auth.users
   SET email_verified = true,
       access_tier    = 'founder'::access_tier,
       role           = 'admin'::user_role,
       updated_at     = NOW()
 WHERE email = '<slug>@mana.how';

INSERT INTO credits.sync_subscriptions (user_id, active, billing_interval, amount_charged, activated_at, is_gifted, gifted_by, gifted_at, created_at, updated_at)
SELECT id, true, 'monthly', 0, NOW(), true, 'demo-personas-runbook', NOW(), NOW(), NOW()
  FROM auth.users WHERE email = '<slug>@mana.how'
ON CONFLICT (user_id) DO UPDATE SET active = true, is_gifted = true, updated_at = NOW();

INSERT INTO credits.balances (user_id, balance, total_earned, total_spent, version, created_at, updated_at)
SELECT id, 10000, 10000, 0, 0, NOW(), NOW()
  FROM auth.users WHERE email = '<slug>@mana.how'
ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(credits.balances.balance, 10000), updated_at = NOW();
SQL
```

User-ID notieren für Phase 4.

### Phase 3 — Zweiten Space anlegen (direkt via SQL)

```sql
WITH new_org AS (
  INSERT INTO auth.organizations (id, name, slug, metadata, created_at, updated_at)
  VALUES (REPLACE(gen_random_uuid()::text, '-', ''), '<Name>', '<slug>-2',
          '{"type":"club","tier":"founder"}'::jsonb, NOW(), NOW())
  RETURNING id
)
INSERT INTO auth.members (id, organization_id, user_id, role, created_at)
SELECT REPLACE(gen_random_uuid()::text, '-', ''), new_org.id, '<userId>', 'owner', NOW()
  FROM new_org;
```

Personal-Space-Slug ist `<slug>` (vom Email-Localpart abgeleitet); der
zweite Space bekommt `<slug>-2` — Convention vom Slug-Resolver in
`createPersonalSpaceFor`. Space-ID notieren für Phase 4.

### Phase 4 — Persona-Skript schreiben + ausführen

Skript-Layout: `scripts/demo/personas/<slug>/{data.ts, seed.ts}`. Pures
Bun. Pattern aus `services/mana-auth/src/services/bootstrap-singletons.ts`.

```bash
ssh -L 5433:localhost:5432 -N -f mana-server
SYNC_DATABASE_URL="postgresql://postgres:manacore123@localhost:5433/mana_sync" \
  bun scripts/demo/personas/<slug>/seed.ts
```

Wichtige Konventionen:

- `actor = { kind: 'system', principalId: 'system:demo-seed', displayName: 'Demo-Seed' }`
- `client_id = 'system:demo-seed'`
- `field_timestamps` (Prod-Schema) — **NICHT `field_meta`** (das ist das
  Sync-Field-Meta-Overhaul-Schema, auf Prod noch nicht deployed)
- `schema_version = 1`
- Deterministische `record_id` via `${slug}:${module}:${index}`-Schema
- RLS-Bypass: `SELECT set_config('app.current_user_id', '<userId>',
  false)` + `set_config('app.current_user_space_ids', ...)` — Prod hat
  forced-RLS auf `sync_changes`
- Idempotency: am Anfang `DELETE WHERE client_id = 'system:demo-seed'
  AND space_id IN (...)` — Re-Run ersetzt sauber

**Reihenfolge der Inserts:**

1. kontextDoc (1 record)
2. contacts (Vorstand + Mitglieder)
3. calendar (1 Calendar-Liste + recurring + Termine + Konzerte = je 2
   Records: timeBlock + event)
4. events (1 SocialEvent für öffentliches Konzert)
5. library (Repertoire + Konzertarchiv)
6. notes (Vereinsphilosophie / Vorstand / Aktuelles Repertoire)
7. website (1 site + 4 pages + Blocks)
8. ai-missions (3 paused: Probenrückblick / Newsletter / Geburtstage)

### Phase 5 — Smoke-Test im Browser

Auf `https://mana.how/login` als der Persona-User einloggen. Jedes
befülltes Modul abklicken: contacts mit Tags, Calendar mit Recurring
Probe + Konzerten, Event-Public-Share-Link, kontextDoc rendert,
Website-Pages, AI-Workbench mit Companion.

### Phase 6 — Lessons ins Runbook

Konkrete Lessons aus dem Lauf in §Lessons unten ergänzen.

---

## Modul-Mapping-Konventionen

| Modul | appId | tableName(s) | Was rein |
|---|---|---|---|
| `contacts` | `contacts` | `contacts` | firstName/lastName, Tags je Funktion + Stimmgruppe/Mannschaft. Adressen+Geburtstage nur wenn öffentlich. |
| `calendar` | `calendar` | `calendars`, `events` | 1 default-Calendar + Events; jedes Event braucht ein TimeBlock unter `timeblocks/timeBlocks` mit sourceModule='calendar'. Recurring via `recurrenceRule: 'FREQ=WEEKLY;BYDAY=TH'`. |
| `events` | `events` | `socialEvents`, `eventGuests`, `eventInvitations`, `eventItems` | Nur öffentliche, beworbene Termine (Konzerte). Jedes SocialEvent braucht ebenfalls einen TimeBlock mit sourceModule='events'. `publicToken` für Share-Link. |
| `notes` | `notes` | `notes` | Vereinsphilosophie / Vorstand / Repertoire. `content` ist Markdown. Encryption: client tolerant für Klartext-Inserts. |
| `library` | `library` | `libraryEntries` | Discriminator `kind: 'book'` reicht für alle Werke + Konzertarchive. |
| `website` | `website` | `websites`, `websitePages`, `websiteBlocks` | Spiegelbild der echten Vereinswebsite. NICHT eine bessere erfinden — Replik ist wertvoller. |
| `kontext` | `kontext` | `kontextDoc` | Vereins-DNA in Markdown-Sektionen. Wichtigstes Stück Inhalt — Companion injiziert das in jede Mission. |
| `ai-missions` | `ai` | `aiMissions` | 3 generische paused: Probenrückblick weekly / Newsletter monthly / Geburtstagsgrüsse daily. Status `paused`. |
| `invoices`, `finance`, `broadcast` | div | div | Nur befüllen wenn echte Daten öffentlich (Beitragshöhe, Bilanz, Newsletter-Archiv). Sonst leer lassen. |

Die TimeBlock-Doppelung pro Calendar-Event/SocialEvent ist die Konsequenz
des unified time-models — siehe `apps/mana/apps/web/src/lib/data/time-blocks/`.

---

## Common Pitfalls

- **Prod-Sync-DB hat altes Schema** — `field_timestamps` (jsonb<string,
  string>), kein `field_meta`, kein `origin`-Column. Das
  Sync-Field-Meta-Overhaul (2026-04-26 lokal shipped) ist auf Prod nicht
  deployed. Bootstrap-Singletons in mana-auth schlagen entsprechend bei
  jeder Registrierung fehl — wir schreiben Singletons via unser
  Seed-Skript selbst.
- **Forced RLS auf sync_changes** — selbst Postgres-Superuser ist
  betroffen. `SET LOCAL app.current_user_id` + `app.current_user_space_ids`
  vor dem INSERT setzen. `set_config(...)` in postgres.js.
- **Slug-Collision** — Personal-Space klaut die Email-Localpart als Slug.
  Zweiter Space muss `-2` Suffix bekommen (Convention vom
  `resolveUniqueSlug`-Resolver).
- **Ports auf Dev-Maschine** — auf macOS hört Docker oft schon auf 5432.
  Tunnel-Port 5433 ist aber häufig auch belegt durch Docker-eigenen
  Postgres. SSH-Tunnel auf 5433 via IPv6 funktioniert trotzdem; wenn
  nicht, auf 5434/5435 ausweichen.
- **DB-Connection ohne RLS-Setting** schlägt INSERT silent fehl mit „new
  row violates row-level security policy". Immer `setRlsContext()` als
  erste Aktion.
- **mkdir -p vor Schreibvorgängen** — manche Tool-Layer legen parent-dirs
  nicht selbst an. Lieber explizit `mkdir -p` als verlorene Files.

---

## Helpers

*(emergiert ab Persona zwei. Erste Persona = alles inline.)*

---

## Lessons

### Aus Persona 1 — Chor Tägerwilen (2026-04-28)

- **ClubDesk-Self-Hosting-Tag**: Der Verein war bereits ClubDesk-Kunde
  (alte Site auf `<slug>.clubdesk.com`). Das ist kein Zufall, sondern
  potenzielles Pattern: viele Vereine, deren Website seriös aussieht und
  öffentlich Mitgliederlisten zeigt, sind ClubDesk-Kunden. Solche
  Vereine sind für Pitches Gold — der Pitch zeigt die direkte
  Migrations-Story.
- **Mitgliederlisten in Stimmgruppen-Subseiten** — chor-taegerwilen.ch
  listet alle 54 Mitglieder mit vollem Namen unter
  `/verein/register_{sopran,alt,tenor,bass}`. Das ist ein häufiger
  ClubDesk-Modul-Auto-Render. Bei künftigen Chören erstmal nach
  `/verein/register_*` oder `/mitglieder/*` suchen.
- **Vorstand-Vornamen-Only** — die Vorstandsseite nennt manche nur mit
  Vornamen. Nachnamen via Cross-Reference mit Stimmgruppen-Listen
  ableitbar (eindeutig bei seltenen Vornamen). Annahmen explizit im
  Recherche-Brief notieren.
- **kontextDoc ist 80% des Pitch-Wertes** — der Companion zieht es
  automatisch in jede Mission. Mehr Substanz dort = jeder AI-Demo wirkt
  vereinsspezifisch. Lieber 120 Zeilen Markdown als 30.
- **calendar = 2 Records pro Event** — 1 timeBlock (sourceModule) + 1
  event (calendarId, timeBlockId). Vergessen heißt: Event taucht im
  Kalender nicht auf. Pattern in Helper kapseln, sobald Persona zwei.
- **Forced RLS hat mich kostbar 5 Minuten gekostet** — INSERTs liefen
  silent durch ohne Wirkung, bis `set_config('app.current_user_id', …)`
  gesetzt war. Künftige Skripte: setRlsContext() ist die erste
  Tu-Sache nach Connection-Open.
- **Prod-Sync-DB-Schema-Drift** vs. der lokalen Codebase ist ein echter
  Befund — Bootstrap-Singletons haben bei jeder Prod-Registrierung
  silent gefehlt. Backlog-Eintrag wert: Sync-Field-Meta-Overhaul nach
  Prod ziehen, oder Bootstrap-Code mit Schema-Fallback ausstatten.
- **Write-Tool-Sandbox-Quirk** — Files in noch-nicht-existierenden
  Subdirs gingen in ein Limbo, das für Bash unsichtbar war. Workaround:
  immer `mkdir -p` per Bash vor Write.

---

## Liste angelegter Personas

| Slug | Verein/Person | Datum | Status | User-ID | Club-Space-ID |
|---|---|---|---|---|---|
| `chor-taegerwilen` | chor tägerwilen | 2026-04-28 | aktiv (118 Records geseedet) | `TCYOdiUdpMSCkw4OW8i7JB7Vn6XI81qf` | `6a3a4d4c1c0e4e5ea918dd30102067cb` |
