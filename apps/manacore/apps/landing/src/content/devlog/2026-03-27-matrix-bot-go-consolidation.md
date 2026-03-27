---
title: 'Matrix Bot Konsolidierung: 21 NestJS-Bots → 1 Go Binary'
description: 'Komplette Neuentwicklung des Matrix-Bot-Systems in Go mit Plugin-Architektur. 21 separate NestJS-Prozesse (~2.1 GB RAM, ~4.2 GB Docker Images) ersetzt durch ein einziges Go-Binary (8.6 MB, ~30 MB RAM). Inklusive Redis Sessions, CI/CD, Docker-Migration und Legacy-Cleanup.'
date: 2026-03-27
author: 'Till Schneider'
category: 'architecture'
tags:
  [
    'go',
    'matrix',
    'bots',
    'performance',
    'infrastructure',
    'docker',
    'consolidation',
    'plugin-architecture',
    'ci-cd',
    'cleanup',
  ]
featured: true
readTime: 12
stats:
  filesChanged: 458
  linesAdded: 8665
  linesRemoved: 47222
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
workingHours:
  start: '2026-03-27T09:00'
  end: '2026-03-27T17:30'
---

Einer der größten Architektur-Umbauten im ManaCore-Monorepo: **21 separate NestJS Matrix-Bot-Prozesse** komplett ersetzt durch **ein einziges Go-Binary mit Plugin-Architektur**. Dazu Legacy-Code aufgeräumt, CI/CD migriert und Docker-Compose aktualisiert.

---

## Das Problem: 21 NestJS-Prozesse

Jeder Matrix-Bot lief als eigenständiger NestJS-Service mit eigenem Docker-Container:

| Bot                    | Funktion                                                                | Port |
| ---------------------- | ----------------------------------------------------------------------- | ---- |
| matrix-mana-bot        | Gateway: AI Chat + Todo + Calendar + Clock + Voice                      | 4010 |
| matrix-ollama-bot      | LLM Chat (Ollama)                                                       | 4011 |
| matrix-stats-bot       | System-Statistiken                                                      | 4012 |
| matrix-project-doc-bot | Projekt-Dokumentation                                                   | 4013 |
| matrix-todo-bot        | Aufgabenverwaltung                                                      | 4014 |
| matrix-calendar-bot    | Kalender                                                                | 4015 |
| matrix-nutriphi-bot    | Ernährungstracking                                                      | 4016 |
| matrix-zitare-bot      | Zitate & Inspiration                                                    | 4017 |
| matrix-clock-bot       | Timer, Alarme, Weltuhren                                                | 4018 |
| matrix-tts-bot         | Text-to-Speech                                                          | 4019 |
| matrix-stt-bot         | Speech-to-Text                                                          | 4021 |
| matrix-onboarding-bot  | User Onboarding                                                         | 4020 |
| matrix-planta-bot      | Pflanzenpflege                                                          | 4022 |
| + 8 weitere            | Chat, Contacts, ManaDeck, Picture, Presi, Questions, Skilltree, Storage | —    |

### Ressourcenverbrauch vorher

| Metrik               | Wert                             |
| -------------------- | -------------------------------- |
| **Prozesse**         | 21 (+ 13 in docker-compose)      |
| **RAM gesamt**       | ~2.1 GB (je ~80-120 MB pro Bot)  |
| **Docker Images**    | ~21 × 200 MB = **~4.2 GB** Disk  |
| **Docker Container** | 13 aktive Container              |
| **Ports belegt**     | 4010-4022 (13 Ports)             |
| **Startup-Zeit**     | ~30s pro Bot, ~5 Min gesamt      |
| **Source Code**      | ~21 Services + 2 Shared Packages |
| **node_modules**     | ~21 × node_modules Kopien        |
| **CI Build Jobs**    | 10 separate Docker-Build Jobs    |

---

## Die Lösung: Go Binary mit Plugin-Architektur

### Architektur-Entscheidungen

| Entscheidung      | Gewählt                       | Alternativen verworfen                   |
| ----------------- | ----------------------------- | ---------------------------------------- |
| **Sprache**       | Go 1.25                       | NestJS Monolith, Rust                    |
| **Matrix SDK**    | mautrix-go                    | Raw CS API                               |
| **Plugin-System** | Compile-time Interfaces       | Go `plugin` Package, hashicorp/go-plugin |
| **Identities**    | Ein mautrix.Client pro Plugin | Shared Client mit Routing                |
| **Sessions**      | In-Memory + Redis             | Nur In-Memory                            |
| **Config**        | Environment Variables         | YAML Config                              |

### Warum Go?

- **RAM:** Go-Prozesse brauchen ~10-30 MB statt ~100 MB pro NestJS-Instanz
- **Binary:** Ein statisch kompiliertes Binary, kein node_modules
- **Concurrency:** 21 Matrix `/sync`-Loops als Goroutines (quasi kostenlos)
- **Startup:** <1 Sekunde für alle 21 Plugins
- **Docker:** Alpine-basiert, 7.5 MB statt ~200 MB pro Image
- **Konsistenz:** Passt zum bestehenden Go Sync-Server (mana-sync)

---

## Projektstruktur

```
services/mana-matrix-bot/          # 50 Dateien, 7.620 Zeilen Go
├── cmd/server/main.go             # Entry Point (21 Plugin-Imports)
├── internal/
│   ├── config/config.go           # Env-Config mit Legacy-Token-Support
│   ├── runtime/
│   │   ├── runtime.go             # Plugin-Orchestrator, Sync-Loops, Event-Routing
│   │   └── health.go              # Health + Prometheus Metrics
│   ├── matrix/
│   │   ├── client.go              # mautrix-go Wrapper
│   │   ├── markdown.go            # Markdown→HTML (Port von TypeScript)
│   │   └── types.go               # IsBot, IsEdit, IsText Guards
│   ├── plugin/
│   │   ├── plugin.go              # Plugin Interface + SessionManager
│   │   ├── registry.go            # Compile-time Registration
│   │   ├── command.go             # !command Router
│   │   └── keyword.go             # Keyword-Detector (DE/EN)
│   ├── session/
│   │   ├── session.go             # In-Memory Store
│   │   └── redis.go               # Redis Store (Cross-Bot SSO)
│   ├── services/
│   │   ├── backend.go             # Generic HTTP Client
│   │   ├── voice.go               # STT/TTS Client
│   │   ├── auth.go                # Login via mana-core-auth
│   │   └── credit.go              # Credit Balance & Consumption
│   └── plugins/                   # 21 Plugin-Verzeichnisse
│       ├── gateway/               # Composite: AI + Todo + Cal + Clock + Voice
│       ├── todo/                  # Vollständig: !todo, !list, !done, !delete, etc.
│       ├── calendar/              # !heute, !morgen, !woche, !termine
│       ├── clock/                 # !timer, !stop, !alarm, !zeit
│       ├── contacts/              # !kontakte, !suche, !favoriten, !edit
│       ├── zitare/                # !zitat, !suche, !kategorie, !favoriten
│       ├── planta/                # !pflanzen, !giessen, !fällig, !historie
│       ├── ollama/                # AI Chat, !models, !all, !mode
│       ├── stt/                   # Audio→Text, !language, !model
│       ├── tts/                   # Text→Audio, !voice, !speed
│       └── ... (11 weitere)
├── Dockerfile                     # Multi-stage Alpine Build
├── go.mod / go.sum
└── CLAUDE.md
```

---

## Vorher → Nachher: Die Zahlen

### Ressourcen

| Metrik               | Vorher (NestJS)    | Nachher (Go) | Ersparnis   |
| -------------------- | ------------------ | ------------ | ----------- |
| **Prozesse**         | 21                 | 1            | **-95%**    |
| **RAM**              | ~2.1 GB            | ~30 MB       | **-98.6%**  |
| **Docker Images**    | ~4.2 GB (21×200MB) | 7.5 MB       | **-99.8%**  |
| **Docker Container** | 13                 | 1            | **-92%**    |
| **Ports**            | 13 (4010-4022)     | 1 (4000)     | **-92%**    |
| **Startup**          | ~5 Min             | <1 Sek       | **-99%**    |
| **Binary**           | —                  | 8.6 MB       | Single file |

### Codebase

| Metrik                    | Vorher (NestJS)   | Nachher (Go)        | Delta    |
| ------------------------- | ----------------- | ------------------- | -------- |
| **Service-Verzeichnisse** | 21 + 2 Packages   | 1                   | **-22**  |
| **Source Files**          | ~400+ (TS)        | 39 (Go)             | **-90%** |
| **Test Files**            | verteilt          | 5                   | —        |
| **Source Lines**          | ~15.000+          | 7.293               | **-51%** |
| **Test Lines**            | —                 | 327                 | —        |
| **Dependencies**          | 21 × package.json | 1 × go.mod (4 deps) | **-99%** |
| **CI Build Jobs**         | 10                | 1                   | **-90%** |

### Docker Compose

| Metrik               | Vorher                    | Nachher                    |
| -------------------- | ------------------------- | -------------------------- |
| **Bot-Services**     | 13 Definitionen           | 1 Definition               |
| **YAML Zeilen**      | ~475                      | ~90                        |
| **Environment Vars** | verteilt über 13 Services | zentralisiert in 1 Service |
| **Volume Mounts**    | 13 × matrix_bots_data     | 1 × matrix_bots_data       |

---

## Plugin Interface

Jedes Plugin implementiert ein minimales Interface:

```go
type Plugin interface {
    Name() string
    Init(ctx context.Context, cfg PluginConfig) error
    HandleTextMessage(ctx context.Context, mc *MessageContext) error
    Commands() []CommandDef
}

// Optional: Audio und Image Handler
type AudioHandler interface {
    HandleAudioMessage(ctx context.Context, mc *MessageContext, audioData []byte) error
}
```

Neues Plugin hinzufügen = 3 Schritte:

1. `internal/plugins/mybot/mybot.go` erstellen
2. `plugin.Register("mybot", ...)` in `init()`
3. Import in `main.go`

---

## Feature-Vollständigkeit der Plugins

### Voll portiert (mit allen Commands)

| Plugin       | Commands                                                                                    | Features                                        |
| ------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **todo**     | !todo, !list, !today, !inbox, !done, !delete, !projekte                                     | German date parsing, Priority, Projects         |
| **calendar** | !heute, !morgen, !woche, !termine, !termin, !löschen, !kalender                             | Event creation, Date parsing                    |
| **clock**    | !timer, !stop, !resume, !reset, !timers, !alarm, !alarme, !zeit                             | Duration parsing (25m, 1h30m)                   |
| **contacts** | !kontakte, !suche, !favoriten, !kontakt, !neu, !edit, !fav, !delete                         | 16 editierbare Felder, Number-References        |
| **zitare**   | !zitat, !heute, !suche, !kategorie, !kategorien, !motivation, !favorit, !favoriten, !listen | Categories, Favorites, Lists                    |
| **planta**   | !pflanzen, !pflanze, !neu, !giessen, !fällig, !historie, !intervall, !edit, !delete         | Watering schedule, Health tracking              |
| **ollama**   | AI Chat, !models, !model, !clear, !all, !mode                                               | Chat history, System prompts, Model comparison  |
| **stt**      | Audio→Text, !language, !model, !status                                                      | Whisper/Voxtral, Language selection             |
| **tts**      | Text→Audio, !voice, !voices, !speed, !status                                                | Voice selection, Speed control                  |
| **gateway**  | Alles oben + !morning, Voice pipeline                                                       | Composite: AI + Todo + Calendar + Clock + Voice |

### Skeleton (Grundgerüst mit !help, !status)

stats, chat, manadeck, nutriphi, picture, presi, questions, skilltree, storage, projectdoc, onboarding

---

## Runtime-Architektur

```
┌─────────────────────────────────────────────────┐
│                    main.go                       │
│   21 Plugin-Imports → init() Registration        │
├─────────────────────────────────────────────────┤
│                   Runtime                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Plugin 1│  │ Plugin 2│  │Plugin 21│  ...     │
│  │ @mana-  │  │ @todo-  │  │ @tts-   │         │
│  │  bot    │  │  bot    │  │  bot    │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │                │
│  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐         │
│  │mautrix  │  │mautrix  │  │mautrix  │         │
│  │Client 1 │  │Client 2 │  │Client 21│         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
├───────┼────────────┼────────────┼────────────────┤
│       └────────────┼────────────┘                │
│              Matrix /sync                        │
│         (21 Goroutines, ~0 RAM)                  │
├──────────────────────────────────────────────────┤
│  Health :4000   │  Sessions (Redis/Memory)       │
│  Metrics        │  Auth Client → mana-core-auth  │
│  Login/Logout   │  Credit Client                 │
└──────────────────────────────────────────────────┘
```

**Event-Flow:**

1. Matrix `/sync` empfängt Event
2. Runtime filtert: eigene Messages, Bot-Messages, Edits
3. Room-Allowlist-Check
4. `!login`/`!logout` global abgefangen
5. Text → Plugin.HandleTextMessage()
6. Audio → Plugin.HandleAudioMessage() (wenn implementiert)

---

## Globale Features

### Login/Logout (Runtime-Level)

```
User: !login user@example.com meinpasswort
Bot:  ✅ Angemeldet als user@example.com

User: !logout
Bot:  ✅ Abgemeldet.
```

Wird im Runtime abgefangen, bevor es an Plugins geht. Token in Redis gespeichert → alle Plugins haben sofort Zugriff.

### Redis Sessions

Sessions persistent über Container-Restarts. Alle 21 Plugins teilen sich den Session-Store:

```
Redis Key: mana-bot:session:token:@user:mana.how
Value:     {token: "eyJ...", expires_at: "2026-03-28T..."}
```

---

## Legacy Cleanup

### Gelöscht

| Was                           | Menge                                           |
| ----------------------------- | ----------------------------------------------- |
| `services/matrix-*-bot/`      | 21 Verzeichnisse                                |
| `packages/matrix-bot-common/` | 1 Package (~30 Dateien)                         |
| `packages/bot-services/`      | 1 Package (~50 Dateien)                         |
| Docker-Compose Bot-Services   | 13 Service-Definitionen (~475 Zeilen)           |
| CI Build Jobs                 | 10 Jobs (~300 Zeilen)                           |
| CI Change Detection           | 10 Blöcke + Outputs (~100 Zeilen)               |
| Root package.json Scripts     | 10 Legacy-Bot-Scripts                           |
| Deploy Scripts                | setup-mana-bot.sh, deploy-mana-bot.sh           |
| **Netto**                     | **-47.222 Zeilen gelöscht, +8.665 hinzugefügt** |

### Was bleibt

- `services/mana-matrix-bot/` — Der Go-Service
- Ein `mana-matrix-bot` Service in docker-compose
- Ein `build-mana-matrix-bot` CI Job
- Historische Devlog-Referenzen (als Dokumentation)

---

## CI/CD

### GitHub Actions

- **CI:** `build-mana-matrix-bot` Job mit Docker Multi-Platform Build (amd64 + arm64)
- **CD:** Auto-Deploy bei Changes in `services/mana-matrix-bot/`
- **Change Detection:** Nur Go-Service, keine Shared-Package-Dependencies mehr

### Deployment

```bash
ssh mana-server
cd ~/projects/manacore-monorepo && git pull
./scripts/mac-mini/build-app.sh mana-matrix-bot
curl http://localhost:4000/health
# → {"status":"ok","plugins":["todo","calendar",...],"count":21}
```

---

## Fazit

| Aspekt              | Bewertung                                     |
| ------------------- | --------------------------------------------- |
| **RAM-Ersparnis**   | ~2 GB frei auf dem Mac Mini                   |
| **Disk-Ersparnis**  | ~4.2 GB Docker Images weniger                 |
| **Wartbarkeit**     | 1 Service statt 21                            |
| **Deployment**      | 1 Container statt 13                          |
| **Startup**         | <1s statt ~5 Min                              |
| **Erweiterbarkeit** | Neues Plugin = 1 Go-Datei + Import            |
| **Codebase**        | -47.222 Zeilen, netto -38.557 Zeilen sauberer |

Die 2 GB RAM-Ersparnis auf dem Mac Mini sind besonders wertvoll — das ist Platz für 2-3 weitere Web-Apps oder ein größeres Ollama-Modell.
