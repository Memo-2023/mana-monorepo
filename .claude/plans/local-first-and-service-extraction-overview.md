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

### Erledigt

| Service          | Port | Was extrahiert                                 | LOC (neu) | LOC (entfernt aus Auth) |
| ---------------- | ---- | ---------------------------------------------- | --------- | ----------------------- |
| **mana-credits** | 3061 | Credits, Gifts, Guild Pools, Stripe Payments   | ~2.400    | ~4.200                  |
| **mana-user**    | 3062 | Settings, Tags, Tag-Groups, Tag-Links, Storage | ~780      | ~2.800                  |

**Ergebnis:** mana-core-auth von ~20k auf ~13k LOC reduziert.

**Was gemacht wurde:**

- Neuer Service mit Hono + Bun (kein NestJS)
- Drizzle ORM Schemas adaptiert (keine FK zu Auth-Tabellen)
- Zod statt class-validator für Validation
- JWT-Validierung via JWKS von mana-core-auth
- Service-to-Service Auth via X-Service-Key
- CreditClientService URL auf `MANA_CREDITS_URL` umgestellt
- mana-core-auth Registration Hooks auf HTTP-Calls umgestellt
- Docker-Compose Einträge + Cloudflare Tunnel Labels
- Alter Code komplett aus mana-core-auth entfernt

### Noch zu extrahieren

| Service                | Was                                  | LOC in Auth | Priorität |
| ---------------------- | ------------------------------------ | ----------- | --------- |
| **mana-subscriptions** | Subscriptions, Pläne, Stripe Billing | ~1.100      | Mittel    |
| **mana-analytics**     | Feedback, Analytics (DuckDB), AI     | ~1.000      | Niedrig   |

### Nach vollständiger Extraktion bleibt in mana-core-auth:

- Better Auth (JWT, Sessions, 2FA, Passkeys, Magic Links)
- OIDC Provider (Matrix/Synapse SSO)
- Organizations (Better Auth Org Plugin)
- Guilds (Org-Wrapper, ohne Pool — Pool ist in mana-credits)
- API Keys
- Security (Audit Logs, Lockout)
- Me (GDPR Export/Delete)
- Health, Metrics

→ Geschätzt ~8-10k LOC reines Auth → Dann Hono-Rewrite (Phase 5)

---

## Teil 3: Hono-Rewrite von mana-core-auth (Phase 5)

**Noch nicht begonnen.** Geplante Schritte:

1. Hono App-Skeleton + Better Auth native Handler
2. JWT Middleware + Auth-Guards als Hono Middleware
3. Health + JWKS + Token-Validation Endpoints
4. Auth-Endpoints (Register, Login, Refresh, SSO)
5. Organizations/Guilds
6. OIDC Provider + Matrix Session
7. API Keys, Me (GDPR), Admin
8. Tests + Umschalten

**Voraussetzung:** Subscriptions + Analytics zuerst extrahieren.

---

## Teil 4: Infrastruktur (Phase 5b)

- [ ] NestJS Dependencies aus dem Monorepo entfernen
- [ ] `packages/shared-nestjs-auth` → `packages/shared-hono-auth`
- [ ] `@mana-core/nestjs-integration` → `@mana-core/hono-integration`
- [ ] Docker-Images auf Bun Base Image umstellen
- [ ] CI/CD Pipeline anpassen (Go Build + Bun Build)
- [ ] Monitoring: Prometheus Metrics für neue Services
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

1. **mana-subscriptions extrahieren** — Stripe Billing raus aus Auth
2. **mana-analytics extrahieren** — Feedback + DuckDB raus aus Auth
3. **Auth Hono-Rewrite** — Better Auth mit nativem Hono-Adapter
4. **Store-Migrationen vertiefen** — Apps 9-17, 19: Stores auf IndexedDB umschreiben
5. **mana-sync Go Server** — Collections aller 19 Apps registrieren
