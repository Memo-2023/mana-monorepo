# Manacore Monorepo - Befehle

# Alles starten (PostgreSQL, Redis, Auth, Chat)

pnpm docker:up:all

pnpm docker:down

pnpm dev:chat:full
pnpm dev:picture:full
pnpm dev:calendar:full
pnpm dev:contacts:full
pnpm dev:todo:full
pnpm dev:presi:full
pnpm dev:storage:full
pnpm dev:skilltree:full
pnpm dev:questions:full

pnpm dev:manacore:app # Nur ManaCore Web
pnpm dev:manacore:backends # Alle 7 Backends für Dashboard-Widgets
pnpm dev:manacore:full # Web + alle Backends (empfohlen)

# Deployment Landingpages:

## Einzelne Landing Page

pnpm deploy:landing:chat
pnpm deploy:landing:picture
pnpm deploy:landing:manacore
pnpm deploy:landing:manadeck

Hier sind alle Landing Page URLs:

| Projekt  | URL                                |
| -------- | ---------------------------------- |
| Chat     | https://chat-landing-90m.pages.dev |
| Picture  | https://picture-landing.pages.dev  |
| ManaCore | https://manacore-landing.pages.dev |
| ManaDeck | https://manadeck-landing.pages.dev |

## Alle auf einmal

pnpm deploy:landing:all

Übersicht aller wichtigen Befehle zum Starten, Stoppen und Verwalten der Apps.

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Docker & Infrastruktur](#docker--infrastruktur)
- [Mana Core Auth](#mana-core-auth)
- [Chat](#chat)
- [Picture](#picture)
- [Manadeck](#manadeck)
- [SkillTree](#skilltree)
- [Questions](#questions)
- [Mana Search](#mana-search)
- [Manacore](#manacore)
- [Mana Games](#mana-games)
- [Allgemeine Befehle](#allgemeine-befehle)
- [Stoppen & Aufräumen](#stoppen--aufräumen)

---

## Voraussetzungen

```bash
# Dependencies installieren (generiert auch .env Dateien)
pnpm install

# Nur .env Dateien neu generieren
pnpm setup:env

# Shared Packages bauen
pnpm build:packages
```

---

## Docker & Infrastruktur

### Starten

```bash
# Nur PostgreSQL + Redis (Basis-Infrastruktur)
pnpm docker:up

# Mit Mana Core Auth Service
pnpm docker:up:auth

# Mit Chat Backend
pnpm docker:up:chat

# Alles starten (PostgreSQL, Redis, Auth, Chat)
pnpm docker:up:all
```

### Status & Logs

```bash
# Container-Status anzeigen
pnpm docker:ps

# Alle Logs anzeigen (live)
pnpm docker:logs

# Nur Auth-Logs
pnpm docker:logs:auth

# Nur Chat-Logs
pnpm docker:logs:chat
```

### Stoppen

```bash
# Alle Container stoppen
pnpm docker:down

# Stoppen + Volumes löschen (Datenbank-Reset!)
pnpm docker:clean
```

---

## Mana Core Auth

Der zentrale Authentifizierungs-Service (Port 3001).

```bash
# Im Docker starten (empfohlen)
pnpm docker:up:auth

# Oder lokal starten
cd services/mana-core-auth
pnpm start:dev

# Datenbank-Migration
cd services/mana-core-auth
pnpm migration:generate   # Migration erstellen
pnpm migration:run        # Migration ausführen
pnpm db:push              # Schema direkt pushen (dev)
pnpm db:studio            # Drizzle Studio öffnen
```

---

## Chat

| App     | Port | Befehl                  |
| ------- | ---- | ----------------------- |
| Web     | 5174 | `pnpm dev:chat:web`     |
| Backend | 3002 | `pnpm dev:chat:backend` |
| Mobile  | 8081 | `pnpm dev:chat:mobile`  |
| Landing | -    | `pnpm dev:chat:landing` |

```bash
# Web + Backend zusammen starten
pnpm dev:chat:app

# Alles (Web, Backend, Mobile, Landing)
pnpm chat:dev
```

---

## Picture

| App     | Port | Befehl                     |
| ------- | ---- | -------------------------- |
| Web     | 5173 | `pnpm dev:picture:web`     |
| Backend | -    | `pnpm dev:picture:backend` |
| Mobile  | 8081 | `pnpm dev:picture:mobile`  |
| Landing | -    | `pnpm dev:picture:landing` |

```bash
# Web + Backend zusammen starten
pnpm dev:picture:app

# Alles
pnpm picture:dev
```

---

## Manadeck

| App     | Port | Befehl                      |
| ------- | ---- | --------------------------- |
| Web     | -    | `pnpm dev:manadeck:web`     |
| Backend | -    | `pnpm dev:manadeck:backend` |
| Mobile  | 8081 | `pnpm dev:manadeck:mobile`  |
| Landing | -    | `pnpm dev:manadeck:landing` |

```bash
# Web + Backend zusammen starten
pnpm dev:manadeck:app

# Alles
pnpm manadeck:dev
```

---

## SkillTree

Gamified Skill-Tracking App - wie ein RPG Skill Tree für echte Fähigkeiten.

| App     | Port | Befehl                       |
| ------- | ---- | ---------------------------- |
| Web     | 5195 | `pnpm dev:skilltree:web`     |
| Backend | 3024 | `pnpm dev:skilltree:backend` |

```bash
# Web + Backend zusammen starten
pnpm dev:skilltree:app

# Mit Auth + automatischem DB-Setup (empfohlen)
pnpm dev:skilltree:full

# Datenbank
pnpm skilltree:db:push    # Schema pushen
pnpm skilltree:db:studio  # Drizzle Studio
```

---

## Questions

AI-powered Research Assistant - sammelt Fragen und führt Web-Recherche durch.

| App     | Port | Befehl                       |
| ------- | ---- | ---------------------------- |
| Web     | 5111 | `pnpm dev:questions:web`     |
| Backend | 3011 | `pnpm dev:questions:backend` |

```bash
# Web + Backend zusammen starten
pnpm dev:questions:app

# Mit Auth + Search Service + automatischem DB-Setup (empfohlen)
pnpm dev:questions:full

# Datenbank
cd apps/questions/apps/backend
pnpm drizzle-kit push     # Schema pushen
pnpm drizzle-kit studio   # Drizzle Studio
```

**Hinweis:** Questions benötigt den mana-search Service für Web-Recherche.

---

## Mana Search

Zentraler Such-Microservice mit SearXNG für Web-Suche und Content-Extraktion.

| Service  | Port | Befehl                    |
| -------- | ---- | ------------------------- |
| API      | 3021 | `pnpm dev:search`         |
| SearXNG  | 8080 | (Docker)                  |
| Redis    | 6380 | (Docker)                  |

```bash
# SearXNG + Redis in Docker starten
pnpm dev:search:docker

# NestJS API starten
pnpm dev:search

# Beides zusammen (empfohlen)
pnpm dev:search:full

# Docker stoppen
pnpm dev:search:docker:down

# Logs anzeigen
pnpm dev:search:docker:logs
```

### API testen

```bash
# Health Check
curl http://localhost:3021/api/v1/health

# Web-Suche
curl -X POST http://localhost:3021/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "TypeScript tutorial", "options": {"limit": 5}}'

# Content extrahieren
curl -X POST http://localhost:3021/api/v1/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "options": {"includeMarkdown": true}}'
```

---

## Manacore

| App      | Port | Befehl                       |
| -------- | ---- | ---------------------------- |
| Web      | 5173 | `pnpm dev:manacore:web`      |
| Mobile   | 8081 | `pnpm dev:manacore:mobile`   |
| Landing  | -    | `pnpm dev:manacore:landing`  |
| Backends | -    | `pnpm dev:manacore:backends` |

```bash
# Nur ManaCore Web
pnpm dev:manacore:app

# Alle Backends für Dashboard-Widgets starten (7 Services parallel)
# Startet: auth, chat, calendar, contacts, todo, picture, manadeck
pnpm dev:manacore:backends

# ManaCore Web + alle Backends zusammen (empfohlen für Dashboard-Entwicklung)
pnpm dev:manacore:full

# Alles inkl. Mobile
pnpm manacore:dev
```

### Dashboard-Backends Übersicht

Die Dashboard-Widgets benötigen diese Backend-Services:

| Widget               | Backend  | Port |
| -------------------- | -------- | ---- |
| Credits              | auth     | 3001 |
| Chat Recent          | chat     | 3002 |
| Calendar Events      | calendar | 3014 |
| Contacts Favorites   | contacts | 3015 |
| Tasks Today/Upcoming | todo     | 3018 |
| Picture Recent       | picture  | 3006 |
| Manadeck Progress    | manadeck | 3009 |

---

## Mana Games

```bash
# Web + Backend zusammen starten
pnpm dev:mana-games:app

# Einzeln
pnpm dev:mana-games:web
pnpm dev:mana-games:backend

# Alles
pnpm mana-games:dev
```

---

## Allgemeine Befehle

```bash
# Alles bauen
pnpm build

# Type-Check
pnpm type-check

# Linting
pnpm lint

# Formatierung
pnpm format           # Formatieren
pnpm format:check     # Nur prüfen

# Tests
pnpm test

# Cache leeren
pnpm clean
```

---

## Stoppen & Aufräumen

### Prozesse stoppen

```bash
# Alle Node-Prozesse beenden (macOS/Linux)
pkill -f "node"

# Spezifischen Port freigeben
lsof -ti:3001 | xargs kill -9   # Port 3001 (Auth)
lsof -ti:3002 | xargs kill -9   # Port 3002 (Chat Backend)
lsof -ti:5174 | xargs kill -9   # Port 5174 (Chat Web)

# Turbo Cache leeren
pnpm clean
```

### Docker stoppen

```bash
# Container stoppen (Daten bleiben)
pnpm docker:down

# Container + Volumes löschen (Datenbank-Reset!)
pnpm docker:clean
```

### Komplettes Cleanup

```bash
# Alles stoppen und aufräumen
pnpm docker:down
pkill -f "node"
pnpm clean
rm -rf node_modules/.cache
```

---

## Typische Workflows

### Chat-Entwicklung starten

```bash
# 1. Infrastruktur starten
pnpm docker:up

# 2. Auth-Service starten (neues Terminal)
cd services/mana-core-auth && pnpm start:dev

# 3. Chat App starten (neues Terminal)
pnpm dev:chat:app
```

### Alles mit Docker

```bash
# Alles in Docker starten
pnpm docker:up:all

# Nur Frontend lokal
pnpm dev:chat:web
```

### Nach Code-Änderungen in Shared Packages

```bash
# Packages neu bauen
pnpm build:packages

# Oder spezifisches Package
pnpm --filter @manacore/shared-ui build
```

---

## App-Übersicht

### Aktive Apps (apps/) - 12 Apps

- **calendar** - Kalender-App für persönliches und geteiltes Zeitmanagement mit wiederkehrenden Terminen, CalDAV/iCal-Sync und Erinnerungen
- **chat** - KI-Chat-Anwendung mit verschiedenen KI-Modellen und Konversationsverlauf
- **contacts** - Kontaktverwaltung mit Import/Export und Google-Synchronisation
- **context** - AI document context (Expo mobile only)
- **manacore** - Multi-App Ecosystem Platform - zentrales Dashboard für alle Mana-Apps
- **manadeck** - Karteikarten-/Lernkarten-Management für Spaced Repetition Learning
- **nutriphi** - Nutrition tracking (geplant, noch kein Backend)
- **picture** - KI-Bildgenerierung mit verschiedenen Modellen und Galerie-Verwaltung
- **questions** - AI-powered Research Assistant mit Web-Recherche über mana-search
- **skilltree** - Gamified Skill-Tracking mit XP-System, Leveln und 6 Skill-Branches
- **storage** - Cloud storage (geplant, noch kein Backend)
- **todo** - Task-Management mit Projekten, Subtasks, Labels und wiederkehrenden Aufgaben

### Games (games/) - 5 Games

- **figgos** - Collectible Figure Game mit KI-generierten Fantasy-Figuren zum Sammeln
- **mana-games** - Browser-Spieleplatform mit 22+ Spielen und KI-Spielgenerierung
- **voxel-lava** - 3D Voxel Building & Platforming Game mit Level-Editor und Sharing
- **whopixels** - Pixel-Art-Editor-Spiel mit Phaser.js
- **worldream** - Text-first World-Building-Plattform für fiktive Welten mit @slug-Referenzen

### Services (services/) - 2 Services

- **mana-core-auth** - Zentraler Authentifizierungs-Service für alle Apps (Better Auth + EdDSA JWT)
- **mana-search** - Zentraler Such-Service mit SearXNG für Web-Suche und Content-Extraktion (Port 3021)

### Shared Packages (packages/) - 4 Kern-Packages

shared-ui - Gemeinsame UI-Komponenten für alle Web-Apps
shared-auth - Client-seitige Auth-Integration für Web/Mobile
shared-nestjs-auth - NestJS Guards/Decorators für JWT-Validierung
shared-storage - S3-kompatible Storage-Abstraktion (MinIO/Hetzner)
