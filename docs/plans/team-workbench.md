# Plan: Team Workbench — Multi-User-Workbench mit geteiltem AI-Kontext

**Status:** Forward-looking Plan, nicht gestartet. 2026-04-15.
**Scope:** Erweitere den bestehenden Single-User-Multi-Agent-Workbench so, dass mehrere User einen gemeinsamen "TeamSpace" bewohnen: geteilte Daten, geteilte Agenten, geteilte Missions-Queue. Admin-Sicht auf Team-Mitglieder.
**Abhängigkeiten:** Baut direkt auf [`multi-agent-workbench.md`](./multi-agent-workbench.md) auf — insbesondere die identity-aware `Actor`-Shape und die Agent-als-Bürger-Abstraktion. Ohne diese beiden Foundations wäre dieser Plan 3× so groß.
**Verwandte Docs:** [`docs/architecture/COMPANION_BRAIN_ARCHITECTURE.md`](../architecture/COMPANION_BRAIN_ARCHITECTURE.md) §20–§22, [`ai-mission-key-grant.md`](./ai-mission-key-grant.md) (Key-Wrapping-Muster), [`docs/future/AI_AGENTS_IDEAS.md`](../future/AI_AGENTS_IDEAS.md).

---

## Die zwei Use-Cases

Der Plan deckt zwei verwandte Szenarien, die sich denselben Unterbau teilen:

### A) Team-Workspace (menschliche Mitbenutzer)
Mehrere User teilen einen Workspace. Ein Admin kann durch die Workbench-Scenes _seiner Teammitglieder_ blättern und sieht, woran jeder gerade arbeitet. Gemeinsame Notizen / Tasks / Kalender synchronisieren team-weit.

**Mini-Beispiel:** Till + Anna im gleichen TeamSpace. Anna schreibt ein Note. Till sieht es in seinem Notes-Modul mit Autor-Avatar "Anna". Till hat eine Admin-Lens "Workbench von Anna" und sieht, was sie gerade offen hat.

### B) Multi-Agent mit geteiltem Team-Kontext (AI-Agenten als Team-Mitglieder)
10 benannte Agenten arbeiten autonom, teilen sich aber ein gemeinsames Wissen. Jeder Agent kann Team-scope Dinge lesen/schreiben; manche Dinge bleiben privat pro Agent.

**Mini-Beispiel:** "Cashflow Watcher" legt einen Event "Rechnung fällig am 15." ins Team-Kalender. "Travel Planner" sieht beim nächsten Tick die Rechnung, plant Reisekosten drumherum. Beide greifen auf denselben Team-Kontext zu.

**Der Trick:** A und B sind die gleiche Infrastruktur, nur mit unterschiedlichen `Principal.kind` Werten. Das ist möglich weil Phase 1 des Multi-Agent-Plans die `Actor.principalId`-Abstraktion eingeführt hat.

---

## Entscheidungen zum Diskutieren (noch nicht fix)

Diese Tabelle ist bewusst **nicht** "baked in" — sie ist Diskussionsgrundlage für einen RFC vor Implementierung. Im Unterschied zum Multi-Agent-Plan, wo wir vor-live-Freiraum hatten, geht dieser Plan dann produktiv und bricht teils existierende Crypto-Garantien auf.

| Frage | Kandidat | Risiko / Trade-off |
|---|---|---|
| **TeamSpace-Objekt** | Neues `teamSpaces` Dexie-Table + pgSchema mit RLS auf `team_id` | Neue Entität → Touch-Points in Sync, Modul-Registry, UI-Modell. Aber: klares Schema, eindeutige Eigentumsverhältnisse. |
| **Mitgliedschaft** | `teamMembers (teamId, userId, role, addedAt)` + server-side enforce | Auth-Service braucht Team-Awareness. Memoro hat schon das Muster. |
| **Rollen** | `admin` / `member` / `viewer` Minimal-Set | Mehr Rollen = mehr RLS-Komplexität. 3 reichen für die meisten echten Fälle. |
| **Principal-Kind-Erweiterung** | `Actor.kind = 'user'\|'ai'\|'system'\|'team'`? oder `kind` bleibt, `teamId` wird ein separates Feld? | Bevorzugen: `teamId?: string` als zusätzliches Feld am Actor statt neuer kind. Compat-leicht. |
| **Record-Scoping** | `record.teamId?: string` neben `record.userId` — Sync-Router dispatcht basierend auf Scope | Braucht Mode-Flag pro Modul ("ist diese Tabelle team-fähig?"). Notes, Tasks, Calendar sind offensichtliche Kandidaten; Playground-Snippets wahrscheinlich nicht. |
| **Encryption** | Per-Team-Key, wrapped-per-member analog zu Mission-Grants | Größter Risiko-Punkt. Key-Rotation beim Mitglied-Ausschluss ist non-trivial. Siehe Detail-Abschnitt unten. |
| **Mission-Ownership** | `mission.teamId?` + `mission.ownerUserId` + `mission.agentId` | Frage: können _nur_ Admins team-Missions anlegen, oder jedes Mitglied? Empfehlung: jedes Mitglied kann team-Missions anlegen, Agent-Grants pro Mission wie gehabt. |
| **Agent-Scope** | Agent hat optional `teamId` — ein Agent existiert entweder privat (User-scope) oder team-weit | Alternativen wären komplizierter (Agent in mehreren Teams) und lösen keine echten User-Needs. |
| **Scene-Scope** | Scenes bleiben per-User. Admin-Lens ist eine read-only Projektion auf andere Mitgliedspezifische Scenes. | Scenes team-weit shared hat keinen klaren UX-Wert — jeder hat seinen Arbeitsplatz. |
| **Admin-Lens** | Neuer "Team-Workbench" App-Tab. Admin sieht Tile-Wall der aktiven Scenes aller Mitglieder (Overview + Click-to-Inspect). | Kein versteckter Lens-Modus — immer klar wessen Sicht man gerade hat (Breadcrumb). |

---

## Architektur-Skizze

```
┌─────────────────────────────────────────────────────────────┐
│  Webapp (Dexie) — scopes multiplied                          │
│                                                              │
│  Records carry {userId, teamId?} — sync router fan-out      │
│                                                              │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │ Private scope     │   │ Team scope        │                │
│  │  userId=me        │   │  teamId=team-xyz  │                │
│  │  my notes/tasks   │   │  shared notes     │                │
│  └──────────────────┘   └──────────────────┘                │
└────────────────┬───────────────────┬────────────────────────┘
                 │                   │
                 ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │ mana-sync  │      │ mana-sync  │
         │ user-scope │      │ team-scope │  ← RLS on team_id
         │ RLS        │      │ + team-    │
         │            │      │ membership │
         └────────────┘      └────────────┘
                                    │
                                    ▼
                            ┌────────────────┐
                            │ mana-auth      │
                            │ teams +        │
                            │ memberships +  │
                            │ team-KEK       │
                            └────────────────┘
```

### Datenmodell (Skizze)

```ts
// mana-auth
interface TeamSpace {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: string;
  // Team KEK: ein Master-Key pro Team, gewrapped mit jedem Mitglied-
  // UserKey. Analog zu Mission-Grants aber auf Team-Ebene.
  teamMasterKeyWrapped: Record<userId, WrappedKey>;
}

interface TeamMember {
  teamId: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  addedAt: string;
  addedBy: string;
}

// Shared-AI: Actor gets a third dimension
interface Actor {
  kind: 'user' | 'ai' | 'system';
  principalId: string;
  displayName: string;
  teamId?: string;             // NEW — present when the write is
                               // team-scoped; absent for private writes.
  // ... rest as before
}

// Webapp: Mission + Agent optionally team-scoped
interface Agent {
  // ... existing fields
  teamId?: string;             // NEW
}

interface Mission {
  // ... existing fields
  teamId?: string;             // NEW
}

// Webapp: Scenes stay per-user, but gain an admin-lens feature
interface WorkbenchScene {
  // ... existing fields (NOT changed)
}

interface AdminLensState {        // NEW — per-device localStorage
  activeView: 'self' | { kind: 'member'; userId: string; teamId: string };
}
```

---

## Encryption-Design — der härteste Teil

Das Encryption-Modell ist der größte Posten und verdient einen eigenen Unter-Plan. Drei Hauptfragen:

### Frage E1 — Wie teilen Mitglieder einen Schlüssel?

**Kandidat: Team-KEK, wrapped-per-member.**
- Team hat einen symmetrischen `teamKey` (AES-GCM-256).
- Jedes Mitglied hat ihre eigenen `teamKeyWrappedWith_userPubKey` — eine Kopie pro Mitglied, via RSA-OAEP oder X25519-ECDH gewrapped.
- Mitglied-Hinzufügen = existierender Admin wrapped den Team-Key mit dem Public-Key des neuen Mitglieds, pusht das ins `teamMasterKeyWrapped` Map.
- Mitglied-Entfernen = **komplette Key-Rotation** (siehe E3).

Das ist exakt das Muster aus [Mission-Grants](./ai-mission-key-grant.md), eine Ebene höher. Wir haben das Wrapping-Toolkit schon.

### Frage E2 — Welche Records werden per Team-Key verschlüsselt?

Die bestehende `crypto/registry.ts` definiert User-scope Verschlüsselung. Für Team-Records kommt eine **zweite Registry-Ebene**: `teamEncryptionRegistry` mit den Feldern die unter Team-Scope encrypted sind. In der Praxis oft identisch mit der User-Registry (gleiche Tabellen, gleiche Felder), aber unter dem Team-Key statt User-Key.

### Frage E3 — Mitglied-Entfernung + Key-Rotation

Das ist der Kletterberg. Wenn Bob rausgeworfen wird:
- Alles was er _bisher_ gesehen hat, kann er Cache-seitig behalten (unfixable without TPM).
- Neue Writes dürfen nicht mehr mit dem alten Team-Key verschlüsselt werden.
- → Neuer `teamKey` generieren, alle existierenden Team-Records re-encrypten.

**Das ist teuer.** Bei einem Team mit 10k Notes + 5k Tasks ist Re-Encryption eine Minutes-lange Operation. Optionen:
- **Eager**: synchron im Hintergrund nach Mitglied-Entfernung, mana-ai service macht die Arbeit.
- **Lazy**: Team-Key-Version wird hochgezählt. Alte Records bleiben encrypted unter alter Version; bei jedem Read mit neuem Key failt es, client re-encrypts und sync-pusht. Über Zeit wandert alles auf die neue Version. Mitglied-Ausschluss wirkt "sofort" für Writes, "eventually" für alte Records.

Empfehlung: **Lazy mit Fortschritts-Anzeige**. Stoppt die UI nicht, ist aber für Admin erkennbar ("23% noch auf alter Schlüsselversion").

### Frage E4 — Zero-Knowledge-Mode im Team-Kontext?

Nicht supported. Sobald ein User in einem Team ist, muss mana-auth den Team-Key wrappen können — das geht nur wenn der User _nicht_ Zero-Knowledge ist. Team-Beitritt fragt explizit: "Für Team-Beitritt wird dein Vault aus Zero-Knowledge genommen." Vermutung: akzeptabel. Teams sind per se geteiltes Modell.

---

## Phasen (grob)

Diese Phasierung ist eine erste Skizze — vor Implementierung braucht's einen eigenen RFC.

### T0 — RFC + ADR (1 Woche)
- Dieses Dokument schärfen; Encryption-Frage E1-E4 durch-entscheiden
- ADR "Team-Scope-Data" in `docs/decisions/`
- Schema-Entwürfe in `services/mana-auth/sql/` + `services/mana-sync/`

### T1 — Team-Entität + Membership (1 Woche)
- `teams` Tabelle in mana-auth mit RLS
- `POST /api/v1/teams` create + `POST /api/v1/teams/:id/members` invite
- Minimal-UI: Settings → Teams → "Team anlegen" + Member-List

### T2 — Team-Scope Records, ohne Encryption (1 Woche)
- `record.teamId?` an Records der team-fähigen Tabellen (notes, tasks, events, …)
- Sync-Router fan-out: ein Record mit `teamId` → POST /sync/team/:teamId statt /sync/user/:userId
- `mana-sync` Backend: neue Sync-Channel für Team, RLS auf team-membership
- UI: "Als Team-Note speichern" Toggle in den Create-Flows von notes, tasks, events

An diesem Punkt haben wir Team-geteilte Daten in Plaintext — bewusst ohne Crypto zuerst, um das Datenmodell zu validieren bevor Encryption-Komplexität dazukommt.

### T3 — Team-Encryption (2 Wochen)
- Team-KEK in mana-auth mit wrapped-per-member
- webapp: `getTeamKey(teamId)` Cache, `encryptTeamRecord` / `decryptTeamRecord` in crypto-Layer
- Registry: `teamEncryptionRegistry` mit den encrypted Feldern
- Member-Einladung-Flow: admin wraps team-key with new member's pub-key
- Member-Removal-Flow: lazy-rotation mit Version-Bumping + Background-Re-Encrypt

### T4 — Actor-Erweiterung + AI-Integration (1 Woche)
- `Actor.teamId?` Feld in shared-ai (additiv, compat-leicht)
- Mission-runner checkt bei team-scope mission ob owning agent team-scope ist
- Proposal + Workbench-Timeline zeigen "von User X im Team Y" statt nur "von Agent Z"

### T5 — Admin-Lens (1 Woche)
- Neues Modul `team-workbench` — Admin sieht Tile-Wall der aktiven Scenes der Teammitglieder (ohne Mutations-Rechte standardmäßig)
- Per-Member "View as Alice" Modus für Admins (breadcrumb klar sichtbar: "Du siehst die Scene von Alice")
- Context-Menu auf Members: "Message", "Remove from team"

### T6 — Polish + Rollout (1 Woche)
- Feature-Flag `PUBLIC_TEAM_WORKBENCH`
- Docs: security.mdx Abschnitt "Teams und geteilte Verschlüsselung"
- Prometheus alerts auf team-level failures
- Onboarding-Flow: "Willst du ein Team erstellen?"

**Gesamtaufwand:** ~7 Wochen für eine saubere Erstfassung. Die Hälfte davon ist Encryption + Migration-Robustheit.

---

## Wie Multi-Agent dafür den Weg geebnet hat

Die Multi-Agent-Phase hat bewusst vier Invarianten etabliert, die Team-Features später billig machen:

1. **`Actor.principalId` ist universell.** User, Agent, System sitzen alle auf derselben Achse. Team wird zu einem _context-Feld_ am Actor, nicht zu einem vierten `kind`. Keine discriminated-union-Explosion.
2. **`Actor.displayName` ist cached.** Wenn Alice das Team verlässt, zeigen historische Events trotzdem "Alice". Keine Need-To-Join auf aktuelle Membership-Tabellen.
3. **Scene ↔ Agent ist orthogonal (Lens, nicht Scope).** Die gleiche Idee lässt sich auf Team-Membership anwenden: "Admin-View auf Alice" ist eine Lens, keine Scope-Änderung. Lässt sich oben draufsetzen ohne Scene-Modell zu ändern.
4. **Agent-Memory ist encrypted-at-rest wie Notes.** Das Pattern ist etabliert. Team-Encryption nutzt denselben Pfad (wrapValue/unwrapValue), nur mit einem anderen Key.

Konkret: das L3-Actor-Cutover-Refactor würden wir für Team-Features nochmal machen müssen, wenn wir's nicht jetzt gemacht hätten. Jetzt ist es ein 3-zeiliger Change (`teamId?: string` dazu).

---

## Explizite Nicht-Ziele (auch für T-Phasen)

- **Keine public/open Teams.** Invite-only, auch langfristig. Public-Feeds sind ein völlig anderes Produkt.
- **Keine Real-Time-Presence.** "Alice tippt gerade in Note X" ist ein Follow-Up — Team-Sync bleibt beim etablierten pull/push-Modell.
- **Keine Team-weiten Agent-Mutations durch Admin.** Admin kann sehen was Alice's Agents tun, aber nicht deren Policy ändern. Respektiert Autonomie.
- **Keine Cross-Team-Migration.** Eine Mission/Note ist entweder privat oder team-scoped. Umhängen von Team zu Team ist nicht vorgesehen — wenn User's es brauchen, ist's ein Duplicate-Create.

---

## Offene Fragen (für den T0 RFC)

1. **Owner-Konzept:** Wer besitzt ein Team? Kann Ownership übertragen werden? Was passiert wenn der Owner geht?
2. **Abrechnung:** Mana-Credits sind heute per-User. Teams haben geteilte LLM-Kosten — wer zahlt? Pro-Team-Subscription vs. Pro-Member-Subscription?
3. **Viewer-Rolle:** hat Viewer Write-Access auf Proposals (approve reject)? Oder nur Read? Vermutlich nur Read.
4. **Mission-Rights:** Darf ein Member eine Mission auf einem shared agent starten, die der Admin nicht approved hat? Oder brauchen alle Team-Missions Admin-Approval?
5. **Guest-Mode:** Team-Einladung per Magic-Link für noch-nicht-registrierte User — supported oder nicht? (Vermutlich in T1 nicht, später optional.)
6. **Conflict-Resolution auf Team-Records:** Alice editiert Note A, Bob auch. LWW wie bei User-Records oder expliziter Merge-Editor? Vermutlich LWW fürs Erste; Merge-Editor ist ein Folgeprojekt.
7. **Mobile App:** Mobile läuft hinter der Webapp. Wie lange ist mobile ohne Team-Features akzeptabel? Oder Hand-off via Magic-Link auf Web?
