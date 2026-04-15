# AI Agents — Verbesserungsideen

Backlog für das AI-Workbench / Mission-Runner-System (`services/mana-ai`, `@mana/shared-ai`, `apps/mana/apps/web/src/lib/data/ai/`). Stand: 2026-04-15, nach Abschluss der v0.3-Roadmap (materialisierte Snapshots, Metrics, Revert).

Kontext: [`services/mana-ai/CLAUDE.md`](../../services/mana-ai/CLAUDE.md), [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md).

Sortiert grob nach Impact.

---

## 1. Encrypted-Tables serverseitig nutzbar machen

**Problem:** Missions, die notes / kontext / tasks / events / journal als Input brauchen, laufen aktuell **nur im Vordergrund** (offener Browser-Tab), weil diese Tabellen at-rest AES-GCM-verschlüsselt sind und der Server keinen Data-Key hat. Goals etc. (plaintext) laufen serverseitig — asymmetrische UX.

**Ideen:**
- **Per-Mission Key-Grant:** User autorisiert beim Mission-Start einmalig einen KEK-gewrappten Data-Key, scoped auf exakt die referenzierten Record-IDs und die Mission-TTL. Key lebt nur im RAM von `mana-ai`, wird nie persistiert.
- **Headless-Client statt Serverentschlüsselung:** ein Service-Worker- oder WebWorker-"AI-Proxy" im Browser treibt Missions auch ohne offenes UI. Kein Key verlässt das Device; dafür Abhängigkeit von Push / Wake-Lock.

Details + Trade-offs siehe unten — "Details zu Punkt 1".

## 2. Proposal-Qualität messbar machen

Reject-Feedback bleibt heute liegen. Ideen:
- **Reject-Reasons clustern** (LLM-Klassifikation `tooAggressive` | `wrongInput` | `alreadyDone` | `badTiming` | `other`) → als Signal in den Planner-Prompt der nächsten Iteration injizieren.
- **Accept-Rate pro Tool** als Prometheus-Gauge (`mana_ai_proposal_accept_rate{tool=...}`). Tools unter Schwelle X automatisch deaktivierbar.
- **Prompt-A/B:** gleiche Mission, zwei Prompt-Varianten, Accept-Rate als Metrik.

## 3. Scheduler-Intelligenz

`nextRunAt` ist heute ein stumpfes Intervall. Besser:
- **Adaptive Backoff:** nach n Parse-Failures oder konsekutiven 0-Proposal-Iterationen exponentiell verlangsamen; nach Accepts beschleunigen.
- **Input-getriggertes Tick:** Mission wird wach, wenn ein referenzierter Input sich ändert (`sync_changes`-Trigger oder NOTIFY/LISTEN) statt nach Wall-Clock. Spart LLM-Calls drastisch bei seltenen Input-Updates.

## 4. Mission-Templates / Catalog

Users müssen heute Missions from-scratch konfigurieren. Ein kuratierter Katalog ("Weekly Review", "Inbox Triage", "Goal Check-in", "Kontext Verdichten") mit vordefinierten Inputs, Prompt-Overlay und Policies. 10× niedrigere Einstiegshürde, konsistentere Ergebnisse.

## 5. Multi-Step Proposals (Plans statt Steps)

Aktuell: ein PlanStep = ein Proposal. Für zusammenhängende Aktionen (z. B. "Task erstellen **und** Kalendereintrag dazu") sollte es ein **Plan-Level-Accept** geben — atomar, mit atomarem Revert. Dafür braucht es eine neue `proposalGroupId` auf Dexie-Ebene und eine Group-UI in der Inbox.

## 6. Cost / Token Budget pro Mission

LLM-Calls sind nicht gratis. Pro Mission `maxTokensPerDay` + gerollter Verbrauch, sichtbar in der Workbench. Runner stoppt automatisch bei Überschreitung und markiert `state='budget-exceeded'`. Dashboard-Gauge für Gesamtsystem.

## 7. Workbench-UX

- **Diff-Ansicht pro Iteration:** was hätte der Accept konkret geändert (Before/After-Panel). Wir haben `__fieldActors`, also können wir den hypothetischen Post-Accept-State projizieren.
- **Batch-Accept / -Reject** via Tastatur (`a` / `r`, mit `shift` für alle in der Iteration).
- **"Warum?"-Button** auf jedem Proposal → zeigt `rationale` + die konkreten Input-Records, die der Planner zitiert hat. Schließt die Vertrauenslücke.

## 8. Reliability

- **Multi-Instance-Deploy** mit Postgres-Advisory-Locks auf Snapshot-Refresh und Mission-Claim (steht schon auf der polish-Liste in `services/mana-ai/CLAUDE.md`).
- **Dead-Letter:** nach n konsekutiven Parse-Failures pro Mission → `state='errored'` mit letzter Error-Message, statt still weiter zu ticken.
- **Planner-Prompt-Versionierung:** `iteration.promptVersion` (Hash des Prompt-Templates) → reproduzierbare Reviews + saubere Migrationsbasis, wenn wir Prompts umbauen.

---

## Details zu Punkt 1: Encrypted-Tables serverseitig nutzbar machen

### Status quo

Privacy-Modell siehe `services/mana-ai/src/db/resolvers/types.ts`:
- `mana-ai` hat `SYNC_DATABASE_URL` nur lesend + scoped via RLS (`withUser`).
- Für `tables` in der Encryption-Registry (`apps/mana/apps/web/src/lib/data/crypto/registry.ts`) liegen im Postgres nur AES-GCM-Ciphertexts.
- Master-Key lebt in `mana-auth`, KEK-gewrappt via `MANA_AUTH_KEK`.
- **Foreground-Runner** (Browser-Tab) kann entschlüsseln, weil er die gleiche Auth-Session hat. **Background-Runner** (`mana-ai`) kann nicht.

Konsequenz: die interessantesten Inputs (Notes, freie Texte im Kontext, Journal-Einträge) sind für autonome Missions tot.

### Option A — Per-Mission Key-Grant (serverseitige Entschlüsselung, scoped)

**Mechanik:**
1. User erstellt / aktiviert eine Mission mit einer encrypted-Input-Source. UI fragt explizit: _"Diese Mission liest deine Notes/Kontext. Serverseitige Ausführung benötigt Zugriff auf den Entschlüsselungs-Key. OK?"_
2. Webapp leitet aus dem Master-Key einen **Mission-Data-Key** ab:
   `MDK = HKDF(masterKey, info="mission:"+missionId+":"+tableAllowlist)`
3. `MDK` wird via `mana-auth` public-key-verschlüsselt für `mana-ai` (Service-Public-Key) und als `Mission.grant.{wrappedKey, expiresAt, tables, recordIdAllowlist?}` am Mission-Record gespeichert.
4. `mana-ai` entwrappt beim Tick, hält Plaintext-Key nur im RAM, löscht ihn am Tick-Ende. Nie Disk, nie Log.
5. Grant hat TTL (z. B. 7 Tage rollend) und `recordIdAllowlist` — der Server darf nur explizit referenzierte Records entschlüsseln, nicht die ganze Tabelle.

**Vorteile:**
- Einheitliches Ausführungsmodell (alle Missions laufen serverseitig).
- User kontrolliert Scope: pro Mission, pro Tabellen-Subset, mit Ablauf.
- Key ist *abgeleitet*, nie der Master. Kompromittierte Mission → nur deren Records exponiert.

**Nachteile / Risiken:**
- Privacy-Promise "encrypted data never leaves client in plaintext" wird aufgeweicht — muss in UX ehrlich kommuniziert werden.
- `mana-ai`-RAM-Dump = Key-Leak. Mitigation: Prozess-Isolation, `mlock`, kurze Grant-TTL, Audit-Log jeder Entschlüsselung.
- Zero-Knowledge-Mode (Settings → Sicherheit) ist inkompatibel → dort muss A hart disabled sein, User fällt auf Option B zurück.
- Key-Rotation wird komplex: rotiert der Master-Key, müssen alle aktiven Grants re-wrapped werden.

**Aufwand:** mittel-hoch. Neue Felder in `aiMissions`, Key-Derivation in `mana-auth`, Decrypt-Pfad in `mana-ai`, Resolver-Erweiterung, UX-Dialog. ~1–2 Sprints.

### Option B — Headless Client (browserseitige Ausführung ohne offenen Tab)

**Mechanik:**
1. Service-Worker + `Periodic Background Sync` / Push auf dem User-Device treibt einen dedizierten "AI-Runner-Worker", der dieselbe IndexedDB + denselben Decrypt-Pfad nutzt wie der Foreground-Runner.
2. `mana-ai` wird zum **Trigger** statt zum Executor: findet due Missions, sendet via Web-Push "wake up user X's device". Device führt Planner aus, schreibt Iterationen via sync zurück.
3. Fallback: wenn kein Device seit N Minuten geantwortet hat, Mission bleibt pending (nicht ausgeführt — aber keine Privacy-Verletzung).

**Vorteile:**
- **Keine Schlüssel verlassen das Device.** Privacy-Promise bleibt intakt, Zero-Knowledge-Mode weiterhin unterstützt.
- Wiederverwendung des gesamten Foreground-Pfads (Decrypt, Staging, Proposal-Erzeugung) — kein Drift-Risiko zwischen zwei Implementierungen.

**Nachteile / Risiken:**
- Browser-Hintergrund-APIs sind **unzuverlässig**. `Periodic Background Sync` ist Chrome-only + opportunistisch; Safari hat nichts Vergleichbares. Web-Push zwingt zu Notification-Permission.
- Latenz unvorhersehbar: Mission kann stundenlang schlafen, wenn kein Device online ist.
- Multi-Device: welcher Worker führt aus? Braucht Device-Leader-Election (z. B. über sync-gestütztes Heartbeat-Feld).
- Dev-Komplexität: Service-Worker-Updates sind zickig; IndexedDB-Lifecycle im Worker vs. Tab.

**Aufwand:** hoch. Neue Service-Worker-Entry, Push-Infra in `mana-notify`, Device-Leader-Logik, ausführliche Fallback-Tests über Browser. ~2–3 Sprints.

### Option C — Hybrid (default)

Foreground-Runner bleibt primär für encrypted Missions (= Option B ohne Push, nur wenn Tab offen). Option A **opt-in pro Mission** für User, die Server-Autonomie explizit wollen. Goals / plaintext-Missions unverändert serverseitig.

- Default: kein neues Risiko, kein Regression.
- Power-User bekommen echte autonome Missions auf sensiblen Daten mit explizitem Consent.
- Zero-Knowledge-User blockiert Option A komplett, keine Sonderfälle.

**Empfehlung:** **C als Zielbild, Option A als Unterbau bauen.** Option B ist attraktiv, aber die Browser-Hintergrund-APIs sind zu unzuverlässig, um Verlass darauf zu schaffen — taugt höchstens als Augmentierung ("run more often when a device is online"), nicht als Ersatz.

### Offene Fragen

- Key-Scope: pro Mission ein Key (einfache Revocation) oder pro Tabelle (weniger Wrap-Operationen)? → vermutlich pro Mission.
- Audit: wo loggen wir serverseitige Decrypts? Eigene Tabelle `mana_ai.decrypt_audit` mit `{missionId, recordId, tickId, timestamp}`, vom User in der Workbench einsehbar.
- Revocation-UX: ein "🔒 Key zurückziehen"-Button pro Mission in der Workbench → Grant wird gelöscht, Mission pausiert, nächster Tick bemerkt den fehlenden Grant.
- Prompt-Injection: entschlüsselter User-Content geht in den Planner-Prompt. Braucht stärkere Prompt-Isolation (klare Marker, Output-Validation) — aber das gilt heute schon für Goals.
