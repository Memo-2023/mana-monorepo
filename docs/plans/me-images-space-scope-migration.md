# meImages — User-Scoped → Space-Scoped Migration

## Status (2026-04-23)

Greenfield-Folge-Plan zu `me-images-and-reference-generation.md` (M1–M5 shipped) und Precursor zu `wardrobe-module.md`. Flippt die `meImages`-Tabelle von User-Level auf Space-Scoped — einmalige retro-Migration bestehender Zeilen plus Code-Shift in Queries, Store, Avatar-Sync und MCP-Tool.

## Warum

Nach der Wardrobe-Entscheidung "alle sechs Space-Typen bekommen wardrobe" ist User-Level-`meImages` der einzige Sonderfall im System, wo der *Input* für Space-Daten cross-Space lebt während der *Output* (Wardrobe-Katalog, Try-On-Ergebnisse in Picture) space-scoped ist. Drei konkrete Gewinne durch Angleichung:

1. **Privacy zwischen Spaces.** `me.listReferenceImages` sieht heute den gesamten User-Pool, egal aus welchem Space gerufen. In einem Brand-Space, der mit einem Geschäftspartner geteilt wird, würden dessen Personas/MCP-Tools potenziell private Selfies zu Gesicht bekommen. Nach Migration: jeder Space sieht nur seinen eigenen Pool.

2. **Kontext-Match.** Brand-Space will Studio-Portrait, Personal-Space will Selfie, Club-Space will Action-Shot. Heute: Nutzer muss aus einem Pool die richtige Referenz pro Generation manuell aussuchen. Nachher: jeder Space hat seine 2-3 passenden Referenzen, null Denkarbeit.

3. **Architektur-Kohärenz.** Eine Regel weniger zu erklären: *alle* Daten-Tabellen sind space-scoped, *alle* Singletons (userSettings, userContext, …) sind user-level.

Die eine Reibung: wer drei Spaces hat, muss potenziell in jeden einmal ein Gesicht hochladen. Für Brand-/Club-Spaces ist das ohnehin erwünscht (anderes Bild als privat). Für Family-Spaces ist der Edge-Case dokumentiert (Try-On nutzt Caller-Identität, nicht Kind).

## Entscheidungen

1. **Strikte Scope-Trennung** — kein Fallback von Brand-Space auf Personal-Space-Referenzen. Leere Space = explizite Aufforderung zum Upload. Matched Wardrobe-Plan Decision #6.
2. **`auth.users.image` bleibt an Personal-Space gekoppelt** — die globale SSO-Identity ist persönlich. Wer im Brand-Space ein Profilbild setzt, ändert damit sein Brand-Avatar, *nicht* seinen Better-Auth-Account-Avatar. Konkret: `syncAvatarToAuth` gatet auf `activeSpace.type === 'personal'`.
3. **Einmaliger Dexie v40-Upgrade** — Sentinel-Stamping (`spaceId=_personal:<uid>`, `authorId=<uid>`, `visibility='space'`) plus `delete record.userId` in einer Version. Kein split auf v40+v41 nötig: Dexie-Upgrade läuft *vor* App-Start, die neue Code-Version trifft stets auf gestampte Daten. Multi-Tab-Edge-Cases sind benign — alte Tabs nutzen direkten Table-Access (pre-migration), sehen ihre Daten weiter, Reload lädt neue Code-Version.
4. **Bestehende Zeilen → Personal-Space-Sentinel.** `reconcileSentinels()` im Scope-Bootstrap löst die Sentinel automatisch zur echten Personal-Space-ID auf, sobald der Nutzer den Personal-Space lädt. Kein Extra-Code.
5. **Legacy-Avatar-Migration pinnt auf Personal-Space-Sentinel explizit.** Der Legacy-Avatar ist per Definition die globale Identity → gehört in Personal-Space, auch wenn der Nutzer die Migration zufällig aus einem Brand-Space triggert.
6. **Keine Schema-Index-Änderungen.** meImages-Pools sind klein (typ. 2–10 Bilder), `scopedTable` filtert in-memory. Falls später >100 Zeilen pro Nutzer auftauchen, ist `[spaceId+kind]`-Compound-Index eine eigene ~5-Minuten-Änderung.

## Change Matrix

| Datei | Änderung |
|---|---|
| `apps/mana/apps/web/src/lib/modules/profile/types.ts` | `LocalMeImage` bekommt `spaceId?`, `authorId?`, `visibility?`; Public `MeImage` ebenfalls; in `toMeImage()` durchreichen |
| `apps/mana/apps/web/src/lib/data/database.ts` | `'meImages'` raus aus `USER_LEVEL_TABLES`; neuer `db.version(40).upgrade(...)` block der meImages-Rows mit Sentinel stampt + userId löscht |
| `apps/mana/apps/web/src/lib/modules/profile/queries.ts` | Alle 4 Hooks (`useAllMeImages`, `useMeImagesByKind`, `useReferenceImages`, `useImageByPrimary`) lesen via `scopedForModule<LocalMeImage, string>('profile', 'meImages')` |
| `apps/mana/apps/web/src/lib/modules/profile/stores/me-images.svelte.ts` | `setPrimaryInTx` nutzt `scopedForModule` statt `meImagesTable` für die Primary-Holder-Suche; `createMeImage` akzeptiert optional `spaceId`-Override (für legacy-avatar); `syncAvatarToAuth` gatet auf `getActiveSpace()?.type === 'personal'` und nutzt `scopedForModule` |
| `apps/mana/apps/web/src/lib/modules/profile/migration/legacy-avatar.ts` | ruft `createMeImage` mit explizitem `spaceId = _personal:<userId>` Sentinel |
| `apps/mana/apps/web/src/lib/modules/profile/MeImagesView.svelte` | dezenter Badge in der Intro-Card: "Pool für: {Space-Name}" damit Nutzer bei Space-Switch merkt, welcher Pool angezeigt wird |
| `packages/mana-tool-registry/src/modules/me.ts` | `me.listReferenceImages` filtert nach `pullAll` client-seitig auf `row.spaceId === ctx.spaceId` |

## Migration-Risikoanalyse

- **Multi-Tab während Upgrade**: Tab A auf alter Version, Tab B triggert Upgrade → Tab A sieht potenziell Ghost-Records bis Reload. Akzeptabel — Tab A nutzt direkten Table-Access (user-scoped, noch vor scopedForModule), alles bleibt sichtbar für ihn.
- **Kein Personal-Space geladen**: Sehr früh nach Login, vor Bootstrap, ist `getActiveSpace()` null. Stores guarden mit Throw; Queries geben leere Arrays. Kein Data-Loss, nur "noch nichts da"-UI. Bootstrap resolved in < 200ms, Problem lokal und selbstheilend.
- **Bestehender `auth.users.image`**: bleibt wie er ist. Die M2.5-Migration (legacy-avatar.ts) war ein One-Shot; meImages-Zeilen mit `primaryFor='avatar'` existieren bei Nutzern die vor M2.5 auf der Route waren. Diese werden durch v40 mit `spaceId=_personal:<uid>` gestampt, `reconcileSentinels()` rewritet zur echten Personal-Space-ID. Sync-Hook auf Personal-Space holt Primary → schreibt `auth.users.image` — Wert bleibt identisch, Null-Operation im Happy-Path.
- **ZK-Nutzer**: unverändert; die Encryption-Eigenschaften der Tabelle ändern sich nicht (`label`+`tags` bleiben encrypted).

## Milestones

Ein Commit. Ein atomic `git add && git commit`.

- [ ] Types extended (spaceId/authorId/visibility auf Local + Public)
- [ ] Dexie v40 upgrade stamped sentinel + drops userId
- [ ] `USER_LEVEL_TABLES` bereinigt
- [ ] Queries über `scopedForModule<>`
- [ ] Store setPrimary/setPrimaryInTx scope-aware
- [ ] `createMeImage` nimmt optional spaceId-Override
- [ ] `syncAvatarToAuth` gate + scope
- [ ] legacy-avatar.ts stampt Personal-Sentinel
- [ ] MeImagesView Space-Badge
- [ ] MCP tool me.listReferenceImages filter
- [ ] validate:all + type-check web + type-check api + type-check tool-registry + type-check mana-mcp
- [ ] atomic commit

## Was NACH der Migration möglich wird

Wardrobe-Modul M1 startet direkt auf der neuen Grundlage, ohne Sonderfall-Ausnahmen für meImages. Try-On in Brand-Space nutzt automatisch die Brand-Space-Referenzen des Nutzers (oder zeigt den Upload-Empty-State). Personas in einem geteilten Space sehen nur die dort freigegebenen Referenzen.
