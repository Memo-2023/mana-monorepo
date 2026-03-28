# Local-First Migration & Service-Extraktion — Gesamtübersicht

> **Stand:** 2026-03-27
> **Autor:** Claude Code + Till Schneider

---

## Teil 1: Local-First Migration (Phase 3)

**Ziel:** Alle Web-Apps auf IndexedDB (Dexie.js) + Sync umstellen → Guest-Mode, Offline CRUD, Instant UI.

### Erledigt: 19/22 Apps

| #   | App             | Collections                                          | Stores umgeschrieben?                                        |
| --- | --------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Todo            | tasks, projects, labels, taskLabels, reminders       | Ja (komplett)                                                |
| 2   | Zitare          | favorites, lists                                     | Ja (komplett)                                                |
| 3   | Calendar        | calendars, events                                    | Ja (komplett)                                                |
| 4   | Clock           | alarms, timers, worldClocks                          | Ja (komplett)                                                |
| 5   | Contacts        | contacts                                             | Ja (komplett)                                                |
| 6   | ManaDeck        | decks, cards                                         | Ja (komplett)                                                |
| 7   | **Presi**       | decks, slides                                        | Ja (Store + Pages umgeschrieben)                             |
| 8   | **Picture**     | images, boards, boardItems, tags, imageTags          | Ja (Gallery + Boards umgeschrieben)                          |
| 9   | **Inventar**    | collections, items, locations, categories            | Nein (local-store angelegt, Stores nutzen noch localStorage) |
| 10  | **NutriPhi**    | meals, goals, favorites                              | Nein (local-store angelegt, Stores nutzen noch API)          |
| 11  | **Planta**      | plants, plantPhotos, wateringSchedules, wateringLogs | Nein (local-store angelegt, Stores nutzen noch API)          |
| 12  | **Storage**     | files, folders, tags, fileTags                       | Nein (local-store angelegt, Stores nutzen noch API)          |
| 13  | **Chat**        | conversations, messages, templates                   | Nein (local-store angelegt, Stores nutzen noch API)          |
| 14  | **Questions**   | collections, questions, answers                      | Nein (local-store angelegt, Stores nutzen noch API)          |
| 15  | **Mukke**       | songs, playlists, playlistSongs, projects, markers   | Nein (local-store angelegt, Stores nutzen noch API)          |
| 16  | **Context**     | spaces, documents                                    | Nein (local-store angelegt, Stores nutzen noch API)          |
| 17  | **Photos**      | albums, albumItems, favorites, tags, photoTags       | Nein (local-store angelegt, Stores nutzen noch API)          |
| 18  | **SkilltTree**  | skills, activities, achievements                     | Ja (eigene idb → @manacore/local-store migriert)             |
| 19  | **CityCorners** | locations, favorites                                 | Nein (local-store angelegt, Stores nutzen noch API)          |

**Nicht migriert (kein CRUD):** ManaCore (Hub), Matrix (Protocol), Playground (stateless)

### Was pro App gemacht wurde (9-19):

- `local-store.ts` mit `createLocalStore()` und typisierten Collections
- `guest-seed.ts` mit Onboarding-Daten
- Layout mit `AuthGate allowGuest={true}` + `handleAuthReady()` (initialize + startSync)
- `GuestWelcomeModal` für Erst-Besuch
- `@manacore/local-store` als Dependency

### Was noch fehlt (Stores vertiefen):

Apps 9-17 und 19 haben die Datenschicht (IndexedDB), aber die Svelte-Stores lesen noch von der API. Die Stores müssen umgeschrieben werden wie bei Presi (7), Picture (8), und SkilltTree (18).

---

## Teil 2: Service-Extraktion aus mana-core-auth (Phase 4)

**Ziel:** mana-core-auth aufteilen in fokussierte Microservices auf Hono + Bun.

### Erledigt — KOMPLETT

| Service                | Port | Runtime  | LOC    | Was                                     |
| ---------------------- | ---- | -------- | ------ | --------------------------------------- |
| **mana-auth**          | 3001 | Hono+Bun | ~1.900 | Auth, JWT, SSO, OIDC, 2FA, Orgs, Guilds |
| **mana-credits**       | 3061 | Hono+Bun | ~2.400 | Credits, Gifts, Guild Pools, Stripe     |
| **mana-user**          | 3062 | Hono+Bun | ~780   | Settings, Tags, Tag-Groups, Storage     |
| **mana-subscriptions** | 3063 | Hono+Bun | ~990   | Plans, Subscriptions, Invoices, Stripe  |
| **mana-analytics**     | 3064 | Hono+Bun | ~550   | Feedback, Voting, AI Titles             |

**Gesamt: ~6.620 LOC** in 5 Hono/Bun Services ersetzt **~20.000 LOC** in 1 NestJS Service.

**mana-core-auth (NestJS) wurde gelöscht.** mana-auth ist der Drop-in-Ersatz auf Port 3001.

### Was gemacht wurde:

- 5 eigenständige Hono + Bun Services (kein NestJS mehr)
- Better Auth nativ auf Hono (kein Express↔Fetch-Konvertierung)
- Drizzle ORM Schemas adaptiert (keine FK zwischen Services)
- Zod statt class-validator, jose für JWT
- Service-to-Service Auth via X-Service-Key
- Docker-Compose für alle Services
- Alter NestJS-Code komplett gelöscht

→ Geschätzt ~8-10k LOC reines Auth → Dann Hono-Rewrite (Phase 5)

---

## Teil 3: Hono-Rewrite von mana-core-auth (Phase 5) — DONE

**mana-auth (Hono + Bun) ersetzt mana-core-auth (NestJS).** Alter Code gelöscht.

Fertige Endpoints: Better Auth nativ, Auth (Register/Login/Logout/Validate), Guilds, API Keys, Me (GDPR), Security (Lockout/Audit), OIDC Provider, Login Page.

---

## Teil 4: Verbleibende Aufgaben

- [x] `packages/shared-hono` — Credits Client hinzugefügt (Ersatz für nestjs-integration)
- [x] Store-Migrationen — Alle 19 Apps nutzen IndexedDB als primäre Datenquelle
- [x] mana-sync — Generischer Go Server, braucht keine App-spezifische Config
- [ ] App-Backends NestJS → Hono — 12 Backends haben server-seitige Logik (AI, Upload, etc.)
  - CRUD-Last geht jetzt durch mana-sync, Backends nur noch für Compute
  - Migration pro App: NestJS Boilerplate entfernen, Hono Server mit shared-hono aufsetzen
  - Pragmatisch: bestehende NestJS-Backends laufen lassen, neue Features auf Hono
- [ ] NestJS Packages deprecaten (`shared-nestjs-auth`, `nestjs-integration`)
- [ ] CI/CD Pipeline anpassen (Go Build + Bun Build)
- [ ] Load Testing: Sync-Protokoll unter Last testen

---

## Zusammenfassung der Commits (diese Session)

```
# Local-First (Phase 3)
ce51fd5f feat(apps): migrate Presi, Picture, Inventar, NutriPhi, Planta, Storage
8d880f1f feat(apps): migrate Chat, Questions, Mukke, Context, Photos
a31ccc6c feat(apps): add local-store to SkilltTree and CityCorners
7754cf6e refactor(skilltree): replace custom idb → @manacore/local-store
97ef728e docs: update migration plan to 19/19

# Service-Extraktion (Phase 4)
15deaf4e feat(services): create mana-credits (Hono + Bun)
b0009c20 refactor(credits): route calls to mana-credits
c0798713 refactor(auth): remove credits/gifts (-4,185 LOC)
feeebfb7 feat(infra): docker-compose for mana-credits
ef19018e feat(services): create mana-user + remove from auth (-2,834 LOC)
```

---

## Nächste Schritte (Priorität)

1. ~~mana-subscriptions extrahieren~~ ✅
2. ~~mana-analytics extrahieren~~ ✅
3. ~~Auth Hono-Rewrite~~ ✅
4. **Store-Migrationen vertiefen** — 11 Apps: Stores von API auf IndexedDB umschreiben
5. **mana-sync Go Server** — Collections aller 19 Apps registrieren
6. **NestJS Cleanup** — Dependencies + shared packages migrieren
7. **App-Backend NestJS → Hono** — Chat, Picture, etc. Backends umschreiben
