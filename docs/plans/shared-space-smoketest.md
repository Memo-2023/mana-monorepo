# Shared-Space Smoketest

Schritt-für-Schritt-Anleitung, um das Shared-Space-Ende zu validieren.
Zwei Nutzer, ein gemeinsamer Space, echtes Sync + Einladungsflow.

## Vorbereitung

Lokaler Stack läuft (`pnpm docker:up && pnpm run mana:dev`). Vor dem Test
einmal sicherstellen:

1. **DB-Migrationen aktuell:**
   ```bash
   cd services/mana-auth && bun run db:push
   ```
   Holt das `spaces`-Schema (v004) mit `credentials` + `module_permissions`.
   mana-sync's eigene Migration (inkl. multi-member RLS) läuft beim Service-Start automatisch.

2. **Dev-User vorhanden:**
   ```bash
   pnpm setup:dev-user
   ```
   Legt drei Accounts an (`tills95@gmail.com`, `tilljkb@gmail.com`,
   `rajiehq@gmail.com`), alle mit Passwort `Aa-123456789` und Founder-Tier.
   Durch den Signup-Hook bekommt jeder automatisch seinen Personal-Space.

3. **SMTP-Stub aktiv (für Invite-Mails):**
   Stalwart SMTP läuft im `docker-compose.macmini.yml`-Stack. Lokal kann
   man den Invite-Link auch direkt aus den Logs von mana-auth ziehen,
   falls die Mail nicht ankommt.

## Szenario: Familie

**Zwei getrennte Browser-Profile** (oder ein normales + ein Inkognito-Fenster).
Ohne Profil-Trennung teilen sich die Sessions die Cookies, und der Test
ist wertlos.

### User A (Besitzer)

1. Einloggen als `tills95@gmail.com`
2. Oben rechts im Space-Switcher "+ Neuer Space" klicken
3. Typ **Familie**, Name "Schmidt Family", Slug automatisch
4. Erstellen → Reload in den neuen Space, Switcher zeigt "Schmidt Family" + grünes Family-Badge
5. Im Switcher → "Mitglieder verwalten …"
6. Einladen-Formular: `tilljkb@gmail.com` als `Mitglied` → Senden
7. Erfolgsmeldung "Einladung an … gesendet", Invite erscheint in "Offene Einladungen"

### User B (Eingeladener)

1. E-Mail öffnen, Einladungslink anklicken (`/accept-invitation?id=…`)
2. Falls nicht eingeloggt: "Einloggen & annehmen" — bringt zu Login,
   nach erfolgreicher Authentifizierung automatisch zurück auf Accept-Seite
3. Space-Vorschau zeigt: "tills95@gmail.com lädt dich in **Schmidt Family** ein",
   Typ-Badge "Familie", Rolle "Mitglied"
4. Annehmen klicken → Redirect auf `/`, Space-Switcher oben rechts zeigt jetzt "Schmidt Family"

### Gemeinsamer Test (wichtig!)

5. **User A** legt im Familien-Space ein Event für morgen an (Kalender-Modul)
6. **User B** öffnet den Kalender — das Event erscheint nach ≤1 s
7. **User B** legt ein Rezept an
8. **User A** sieht das Rezept nach ≤1 s

### Isolation-Check (wichtig!)

9. **User A** wechselt auf den Personal-Space (Switcher)
10. User A trägt einen privaten Mood-Eintrag ein
11. **User B** wechselt auf den Familien-Space und öffnet den Kalender-Modul
    — User A's Personal-Daten dürfen **nicht** sichtbar sein. Mood-Modul
    ist im Familien-Space eh nicht freigeschaltet (SPACE_MODULE_ALLOWLIST).

### Rücktritt-Test

12. **User A** öffnet "Mitglieder verwalten …" und entfernt User B
13. **User B** lädt die Seite neu — Familien-Space ist verschwunden,
    aktiver Space fällt zurück auf Personal

## Was dabei geprüft wird

| Feature | Erwartung |
|---|---|
| Invite-Mail versandt | Stalwart-Log zeigt Mail, oder E-Mail-Inbox hat Link |
| Better-Auth `accept-invitation` | `auth.invitations.status` → `accepted` |
| Member-Datensatz | `auth.members` hat neuen Row für User B × org |
| `activeOrganizationId` gesetzt | Session-Cookie zeigt den neuen Space |
| Scope-Filter greift | User B sieht keine Personal-Daten von User A |
| Multi-Member-RLS greift | User B sieht neue Events/Rezepte von User A |
| Membership-Lookup in mana-sync | Keine 404s im mana-sync-Log beim Zugriff |
| Encryption-Skip | Records im Familien-Space werden plaintext synced (prüfen via DevTools → IndexedDB) |
| Rollen-Enforcement | User B kann **nicht** weitere einladen (Rolle=Mitglied, canManage=false) |

## Bekannte Phase-1-Einschränkungen

- **Daten im Shared-Space sind unverschlüsselt** (nur RLS-geschützt) — im
  RFC `docs/plans/spaces-foundation.md` als bewusster Phase-1-Kompromiss
  dokumentiert. Phase 2 addiert einen pro-Space-Schlüssel mit Per-Member-Wrap.
- **Subscription-Fan-Out läuft noch per-User** — User A's Write triggert
  Mana-Sync's Pull erst nach seinem eigenen Tick; User B sieht den
  Eintrag nach bis zu 1 s, nicht instant. Sobald Fan-Out steht, ist das
  Sub-200ms.
- **Role-Änderungen brauchen Cache-Invalidierung**: nach Role-Update
  dauert die mana-sync-Membership-Cache bis zu 5 min. Für Tests nach
  dem Leave einfach den Service neu starten.

## Was tun wenn's nicht klappt

- **E-Mail kommt nicht an**: in mana-auth-Logs nach `accept-invitation?id=`
  suchen — Better Auth loggt den Link bei `sendInvitationEmail`.
- **User B sieht Space nicht nach Accept**: Browser-DevTools → Cookies →
  `mana.session_data` auf die neue Session-ID prüfen, dann `loadActiveSpace`
  in der Konsole forcen: `await (await import('/src/lib/data/scope/index.ts')).loadActiveSpace({ force: true })`
- **Rezepte erscheinen bei A nicht**: mana-sync-Logs auf `[memberships]`
  oder Policy-Denials checken. `app.current_user_space_ids` sollte die
  Schmidt-Family-Org-ID enthalten.
- **Kein Access zu Mitglieder-Seite**: Personal-Space kann per Design
  keine Mitglieder haben — vorher auf den Familien-Space wechseln.

## Nächste Schritte nach Smoketest

Wenn alle 9+ Checks grün sind: Foundation ist validated.
Follow-ups (nicht blockierend):
- Echtes WebSocket-Fan-Out an Space-Mitglieder
- Shared-Space-Encryption mit per-Member-Key-Wrap
- Member-Activity-Log (wer hat wann was geändert)
- Rollen-spezifische Permissions (trainer darf kein club-finance)
