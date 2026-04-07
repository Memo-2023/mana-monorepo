# Central Services

Dieses Verzeichnis dokumentiert zentrale Services, die von allen Mana-Apps gemeinsam genutzt werden. Diese Services laufen in `mana-auth` und bieten einheitliche APIs.

## Übersicht

| Service | Beschreibung | Dokumentation |
|---------|--------------|---------------|
| **Tags** | Einheitliche Tags/Labels für Todo, Calendar, Contacts | [TAGS.md](./TAGS.md) |
| **Theming** | Theme-Varianten, Dark Mode, Accessibility, Custom Themes | [THEMING.md](./THEMING.md) |
| **Help** | Zentrale Hilfeseite mit FAQ, Features, Shortcuts, Changelog | [HELP.md](./HELP.md) |
| **Command Bar** | Globale Schnellsuche und Navigation (Cmd/Ctrl+K) | [COMMAND-BAR.md](./COMMAND-BAR.md) |
| **Split-Screen** | Zwei Apps nebeneinander im Browser (iFrame-basiert) | [SPLIT-SCREEN.md](./SPLIT-SCREEN.md) |

## Architektur-Prinzipien

### Zentralisierung

Bestimmte Daten und Funktionen werden zentral in `mana-auth` verwaltet:

- **User-bezogen:** Jeder Service speichert Daten pro User (`userId`)
- **App-übergreifend:** Daten sind in allen Apps verfügbar
- **API-basiert:** Zugriff erfolgt über REST-APIs

### Soft References

Da die Apps ihre eigenen Datenbanken haben, können keine Foreign Keys zu mana-auth erstellt werden:

```
Todo-DB                      mana-auth-DB
┌─────────────────┐         ┌─────────────────┐
│ task_to_tags    │         │ tags            │
│                 │         │                 │
│ tag_id ─ ─ ─ ─ ─│─ ─ ─ ─ ▶│ id              │
│ (keine FK)      │         │                 │
└─────────────────┘         └─────────────────┘
```

**Konsequenz:** Apps müssen ungültige IDs beim Laden ignorieren.

### Shared Packages

Für jeden zentralen Service gibt es ein entsprechendes Client-Package:

| Service | Package |
|---------|---------|
| Tags | `@mana/shared-tags` |

Diese Packages enthalten:
- TypeScript Types
- API Client Klasse
- Helper-Funktionen

## Lokale Entwicklung

### Alle zentralen Services starten

```bash
# Infrastruktur
pnpm docker:up

# Auth-Service (enthält alle zentralen APIs)
pnpm dev:auth
```

### Datenbank-Schema pushen

```bash
cd services/mana-auth
pnpm db:push
```

## Shared Packages

| Package | Beschreibung |
|---------|--------------|
| `@mana/shared-tags` | Tags Client für zentrale Tags API |
| `@mana/shared-theme` | Theme Store, A11y Store, User Settings |
| `@mana/shared-theme-ui` | Svelte UI-Komponenten für Theming |
| `@mana/shared-help-types` | TypeScript-Typen für Help-Inhalte |
| `@mana/shared-help-content` | Content-Loader, Parser, Merger, Suche |
| `@mana/shared-help-ui` | Svelte UI-Komponenten für Hilfeseite |
| `@mana/shared-help-mobile` | React Native Komponenten für Hilfe |
| `@mana/shared-splitscreen` | Split-Screen Container, Store, Komponenten |

## Hinzufügen neuer zentraler Services

1. **Schema erstellen:** `services/mana-auth/src/db/schema/<name>.schema.ts`
2. **Module erstellen:** `services/mana-auth/src/<name>/`
3. **In app.module.ts registrieren**
4. **Shared Package erstellen:** `packages/shared-<name>/`
5. **Dokumentation schreiben:** `docs/central-services/<NAME>.md`
