---
status: living
owner: till
created: 2026-04-27
parent: docs/plans/feedback-rewards-and-identity.md
---

# Feedback-Hub — Manual Test-Checklist

> Was du im Browser durchklicken solltest, um Phase 3.A–3.F live
> verifiziert zu haben. Was hier nicht steht, ist durch automatisierte
> Tests abgedeckt (siehe `services/mana-analytics/CLAUDE.md` §Tests).
>
> **Format**: jede Zeile ist eine Action + Expected Outcome.
> Hak ab im commit-message wenn du's durchgespielt hast — z.B.
> `chore(testing): manual checklist run-through 2026-04-28`.

---

## 0. Setup — was du brauchst

| Account | Zweck | Wo |
|---|---|---|
| **Founder (du)** — `tills95@gmail.com` | Admin-Triage, Status-Setzen | mana.how Login |
| **Test-A** — neuer Account | Wish posten + Credits empfangen (Founder-Whitelist greift bei dir) | `mana.how/register` |
| **Test-B** — neuer Account | Auf Wishes reagieren, Reactioner-Bonus testen | `mana.how/register` |

Schnell-Login zwischen Accounts: Inkognito-Tab oder zweiter Browser. JWT lebt im Cookie + im SessionStorage; Inkognito-Sessions sind unabhängig.

**Vor dem Test prüfen:**

```bash
ssh mana-server 'export DOCKER_HOST=unix:///Users/mana/.colima/default/docker.sock && /usr/local/bin/docker ps --filter "name=mana-analytics" --filter "name=mana-credits" --filter "name=mana-app-web" --filter "name=mana-auth" --format "{{.Names}}: {{.Status}}"'
```

Alle 4 sollten `(healthy)` sein. Wenn nicht: `bash scripts/mac-mini/build-app.sh mana-web --force-free` bzw. `docker compose up -d <service>`.

---

## 1. Onboarding-Wish (Phase 1, mit Phase 3.A Reward-Chip)

**Account: Test-A (frisch registriert)**

- [ ] Frisch einloggen → Onboarding-Flow startet (`/onboarding/name` … `/onboarding/wish`)
- [ ] Step 4 (Wish): Textarea + "Öffentlich teilen / Nur für Admins"-Toggle sichtbar
- [ ] Toggle auf "Öffentlich" lassen, ≥20 Zeichen tippen, "Fertig"
- [ ] **Expect**: Confirm zeigt `Sichtbar als Wachsame Eule #XXXX` + animierten Reward-Chip `+5 Mana Credits`
- [ ] Auf `mana.how/credits` (oder Workbench → Credits) sichtbar: Balance ist 5

**Edge:**
- [ ] Onboarding-Wish leer abschicken → Reward-Chip erscheint NICHT, kein Credit
- [ ] Toggle auf "Nur für Admins" → Wish kommt nicht im Public-Feed

---

## 2. Inline FeedbackHook + Modal (Phase 2)

**Account: Test-A**

- [ ] Workbench öffnen (`mana.how`), eine Modul-Card (z.B. Todo) anklicken
- [ ] Im ModuleShell-Header rechts ein 💡-Lightbulb-Icon sichtbar
- [ ] Klick → Modal öffnet sich, "Modul: todo"-Badge oben
- [ ] Category-Dropdown wählbar (feature/improvement/bug/praise/question)
- [ ] Senden → Confirm zeigt Eulen-Pseudonym + `+5 Mana Credits`-Chip
- [ ] **Expect**: Wenn du noch kein Modul-Wish hattest, Balance um +5 hoch

**Globale Pille:**
- [ ] Auf `/settings` oder `/profile` (kein Modul-Shell) → "Idee?"-Pille rechts unten erscheint
- [ ] Pille klicken → Modal öffnet sich (gleiche Funktion)
- [ ] **Expect** auf `/onboarding`, `/feedback`, `/community`: Pille **nicht** sichtbar

---

## 3. Public-Community-Feed (Phase 2 + 3.C Avatare)

**Eingeloggt (Test-A) auf `mana.how/community`:**

- [ ] Feed zeigt Test-A's Onboarding-Wish + Test-A's Modul-Wish
- [ ] Jeder Post hat: **Pixel-Identicon-Avatar** (32×32, deterministisch farbig) + Pseudonym
- [ ] Author-Klick → navigiert zu `/community/eule/<hash>`
- [ ] Reaction-Bar (👍❤️🚀🤔🎉) klickbar
- [ ] Filter: Category-Dropdown + Modul-Input

**Anonymous (Inkognito) auf `mana.how/community` UND `community.mana.how`:**

- [ ] Feed lädt ohne Login
- [ ] Pseudonym + Avatar sichtbar — **NIE Klarname** (auch wenn Test-A opted-in wäre)
- [ ] Reaction-Buttons read-only mit Tooltip "Login zum Reagieren"
- [ ] **Expect**: keine `myReactions`-Highlighting auf den Pills

---

## 4. Reactions + Karma (Phase 2 + 3.C)

**Account: Test-B (zweiter Account)**

- [ ] Auf Test-A's Wish 👍 reagieren
- [ ] **Expect** sofort: Pill zeigt `1` Counter, mit aktiv-Highlight
- [ ] **Expect** in DB: Test-A's `community_karma` ist 1 (über `/community/eule/<test-a-hash>` sichtbar als "1 Karma" / "Bronze-Eule" Badge)

**Account-Wechsel zu Test-A:**
- [ ] `/community/eule/<test-a-hash>` öffnen
- [ ] **Expect**: Hero zeigt Pixel-Avatar 96×96, Bronze-Eule-Badge, "1 Karma", Post-Count
- [ ] Eigene Posts sichtbar

**Karma-Edge:**
- [ ] Test-A reagiert auf eigenen Post 👍 → Karma bleibt **unverändert** (Self-React-Schutz)
- [ ] Test-B unreact (👍 nochmal klicken) → Test-A's Karma fällt zurück auf 0

---

## 5. Status-Flow + Loop-Closure (Phase 3.B)

**Account: Founder (du, als Admin)**

- [ ] `mana.how/community/admin` öffnen
- [ ] Test-A's Wish in der Liste
- [ ] Status auf `planned` ändern → speichert sofort

**Account: Test-A (Tab-Switch / nach Login):**

- [ ] **Expect**: Toast erscheint beim nächsten App-Open: `Geplant: ›X‹`
- [ ] `/profile/my-wishes` öffnen → Tab "Inbox" zeigt 1 unread Notification mit Status-Pill
- [ ] Tab "Eigene" zeigt Wish mit Status-Badge "Geplant" (lila)

**Account: Founder, Status auf `in_progress`:**

- [ ] Test-A: Toast `Wir bauen ›X‹ gerade`
- [ ] Inbox: 2 unread
- [ ] Tab "Eigene": Status "In Arbeit" (orange)

**Account: Founder, Status auf `completed`:**

- [ ] Test-A: Toast `Dein Wunsch ist live: ›X‹ · +500 Mana` (success-style)
- [ ] Test-A's Balance: +500 Credits sichtbar
- [ ] Test-B (der reagiert hat): Toast `Dein Like ist gelandet · +25 Mana`
- [ ] Test-B's Balance: +25 Credits

**Idempotency:**
- [ ] Founder ändert Status auf `in_progress`, dann zurück auf `completed`
- [ ] Test-A bekommt **keine** weiteren +500
- [ ] Test-A's Balance unverändert

---

## 6. AdminResponse + Notification (Phase 3.B)

**Account: Founder, auf einem Test-A-Wish:**

- [ ] In `/community/admin` AdminResponse setzen (z.B. "Schauen wir uns an")

**Account: Test-A:**

- [ ] Toast: `Antwort vom Team: ›X‹` (info-style, kein Credit)
- [ ] `/profile/my-wishes` Tab "Inbox": admin-response-Notification
- [ ] `/community/<id>` (Detail-Page): Admin-Response-Block sichtbar
- [ ] `/profile/my-wishes` Tab "Eigene": "Antwort vom Team"-Block neben dem Wish

---

## 7. Klarname-Toggle (Phase 3.C)

**Account: Test-A**

- [ ] `/settings` → "Community"-Tab anklicken
- [ ] **Expect**: Avatar-Preview, "Wachsame Eule #XXXX" + Bronze-Eule-Badge + 0 Karma
- [ ] Toggle "Klarnamen neben Pseudonym zeigen" einschalten
- [ ] **Expect**: Switch animiert zu rechts (primary-color), Eulen-Display zeigt jetzt "… · Test-A's Klarname"

**Eingeloggt (Test-A oder Test-B) auf `mana.how/community`:**
- [ ] Test-A's Posts zeigen `Wachsame Eule #XXXX · Test-A` neben dem Avatar

**Inkognito auf `mana.how/community`:**
- [ ] Test-A's Posts zeigen NUR `Wachsame Eule #XXXX` — **kein Klarname**, auch nicht im HTML-Source (View-Source prüfen)

**Toggle aus:**
- [ ] Switch wieder ausschalten → eingeloggte Sicht zeigt nur Pseudonym
- [ ] **Expect**: Optimistic-Update + Rollback bei Fehler funktioniert (kann man im Network-Panel sehen)

---

## 8. Eulen-Profil (Phase 3.C)

**Eingeloggt auf `/community`, Klick auf einen Pseudonym-Link:**

- [ ] Browse zu `/community/eule/<hash>`
- [ ] Hero: 96×96 Avatar, Pseudonym, Tier-Pill (Bronze/Silver/Gold/Platin), Karma-Count, Post-Count
- [ ] Liste aller public Posts dieser Eule
- [ ] "← Zurück zum Feed"-Link funktioniert

**Inkognito (kein Login):**
- [ ] `community.mana.how/community/eule/<hash>` (oder mana.how/community/eule/<hash>) lädt SSR-rendered
- [ ] **Expect**: Anzeige identisch — Avatar, Tier-Badge, Karma, Posts; KEIN Klarname
- [ ] HTML-Source: enthält `<meta name="description"...>` mit Pseudonym + Karma + Post-Count

**Edge:**
- [ ] `/community/eule/abc` (zu kurzer Hash) → 404 "Eulen-Profil nicht gefunden"
- [ ] `/community/eule/<64-hex-noch-nie-genutzt>` → leere Liste, Karma 0, "Diese Eule hat noch nichts gepostet"

---

## 9. Threading / Replies

**Account: Test-A öffnet einen seiner Wishes über `/community/<id>`:**

- [ ] Detail-View zeigt Original-Wish + Reactions-Bar
- [ ] "X Antworten"-Sektion unten
- [ ] Eingeloggte Reply-Box am Ende mit Textarea + Antworten-Button

**Account: Test-B reply-postet:**
- [ ] Reply erscheint sofort in der Liste
- [ ] **Expect**: KEIN +5-Credit für Replies (nur top-level zählt — siehe Plan)

---

## 10. Phase 3.F — Legacy ist weg (Verifikation)

- [ ] `mana.how/feedback` → 404 (alte Route gelöscht)
- [ ] App-Switcher / Workbench: kein "Feedback"-Modul mehr in der App-Liste
- [ ] Browser-Console im Submit-Flow: kein Aufruf an `/feedback/:id/vote` (alte Vote-Endpoints sind raus)

---

## 11. Founder-Whitelist (du selbst kannst NICHT farmen)

**Account: Founder (du):**

- [ ] Selbst einen Wish über Lightbulb posten
- [ ] **Expect**: Confirm zeigt KEINEN +5-Reward-Chip (Whitelist greift)
- [ ] Credits-Balance unverändert
- [ ] Wish kommt im Feed an (nur kein Bonus)

- [ ] Founder selbst auf eigenen Wish-Status `completed` setzen
- [ ] **Expect**: KEIN +500 ausgezahlt (founder-author skip)
- [ ] Credits unverändert

---

## 12. Rate-Limit (10 Submits / 24h)

**Account: Test-A** (oder ein 3. Test-Account, weil Test-A schon Credits hat)

- [ ] 11 Wishes innerhalb weniger Minuten posten (jeweils ≥20 chars)
- [ ] **Expect**: 1.–10. Submit zeigt Reward-Chip, +5/Submit
- [ ] **Expect**: 11. Submit landet im Feed, aber Confirm zeigt **keinen** Reward-Chip
- [ ] Balance: +50 (nicht +55)

---

## 13. Voting-Score (für Sortierung)

**Drei Wishes von Test-A vorbereiten, Test-B reagiert verschieden:**

| Wish | Reactions von Test-B | Score |
|---|---|---|
| W1 | 👍 (weight 1) | 1 |
| W2 | 🚀 (weight 2) | 2 |
| W3 | 🤔 (weight 0) | 0 |

- [ ] `/community` Feed-Reihenfolge: W2 oben, W1 mitte, W3 unten / oder gleichberechtigt
- [ ] Test-A's Karma: 2 (W3's 🤔 zählt nicht für score, aber zählt für Karma als 1; W1=1, W2=1, W3=1 → Karma=3)
  - **Hinweis**: Karma += 1 pro Reaction (egal welches Emoji), nur Score-Weight unterscheidet

---

## 14. Mobile-Responsiveness (Quick-Check)

Alles oben in Mobile-Viewport (DevTools → 375×667 iPhone) durchgehen:

- [ ] Onboarding-Wish + Reward-Chip
- [ ] Lightbulb-Modal
- [ ] Floating "Idee?"-Pille (sollte sich auf "💡" verkürzen)
- [ ] /community Feed
- [ ] /community/eule/<hash> Hero-Layout
- [ ] /profile/my-wishes Tabs
- [ ] /settings Community-Section

---

## 15. Quick-DB-Sanity (optional)

Auf Mac Mini `psql` mit `mana_platform` öffnen:

```sql
-- Wer hat wieviel Karma?
SELECT id, name, community_karma, community_show_real_name
FROM auth.users WHERE community_karma > 0 ORDER BY community_karma DESC LIMIT 10;

-- Letzte 10 Notifications
SELECT user_id, kind, title, credits_awarded, read_at, created_at
FROM feedback.feedback_notifications ORDER BY created_at DESC LIMIT 10;

-- Letzte 10 Credit-Grants (über mana-credits)
SELECT user_id, amount, balance_after, metadata->>'reason' AS reason, created_at
FROM credits.transactions WHERE type = 'grant' ORDER BY created_at DESC LIMIT 10;

-- Reaction-Counter pro Wish
SELECT id, title, reactions, score
FROM feedback.user_feedback WHERE is_public = true ORDER BY score DESC LIMIT 5;
```

---

## Bekannte Lücken (nicht Test-blocker, aber gut zu wissen)

- **Auto-Test-Zugriff**: `pnpm test:integration` läuft gegen `mana_platform` direkt — Test-User-Rows werden mit `test-`-Prefix angelegt + cleanen sich auf. Kein Test-Pollution-Risiko.
- **Email-Notifications**: Stand jetzt nur In-App-Toast/Inbox, keine Email. Phase 3.B.3 (Monthly-Digest) ist im Plan, nicht gebaut.
- **Voice-Submit**: Phase 3.E offen — Mic-Button im FeedbackQuickModal noch nicht da.
- **Trending / Match-Existing**: Phase 3.D offen.
- **Karma-Decay**: Alte Posts akkumulieren immer mehr Karma. Phase 3 backlog.

---

## Wenn was kaputt ist

1. **Container-Logs**: `ssh mana-server 'docker logs mana-analytics --tail 50'` (analog auth/credits/web)
2. **DB-Konsistenz**: Sanity-SQLs oben
3. **Eintragsspur**: `feedback.user_feedback.id` → `feedback.feedback_notifications.feedback_id` → `auth.users.id`
4. **Plan-Doc Phase 3** (`feedback-rewards-and-identity.md`) für Architektur-Kontext
