# Manacore Monorepo - Befehle

# Alles starten (PostgreSQL, Redis, Auth, Chat)

pnpm docker:up:all

pnpm docker:down

pnpm dev:calendar:app
pnpm dev:chat:app
pnpm dev:clock:app
pnpm dev:contacts:app
pnpm dev:context:app
pnpm dev:manacore:app # Nur ManaCore Web
pnpm dev:manacore:backends # Alle 9 Backends für Dashboard-Widgets
pnpm dev:manacore:full # Web + alle Backends (empfohlen)
pnpm dev:manadeck:app
pnpm dev:picture:app

pnpm dev:inventory:app
pnpm dev:presi:app
pnpm dev:storage:app
pnpm dev:techbase:app
pnpm dev:todo:app
pnpm dev:zitare:app

# Deployment Landingpages:

## Einzelne Landing Page

pnpm deploy:landing:chat
pnpm deploy:landing:picture
pnpm deploy:landing:manacore
pnpm deploy:landing:manadeck
pnpm deploy:landing:zitare

Hier sind alle Landing Page URLs:

    | Projekt  | URL                                |

|----------|------------------------------------|
| Chat | https://chat-landing-90m.pages.dev |
| Picture | https://picture-landing.pages.dev |
| ManaCore | https://manacore-landing.pages.dev |
| ManaDeck | https://manadeck-landing.pages.dev |
| Zitare | https://zitare-landing.pages.dev |
| Presi | https://presi-landing.pages.dev |

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
- [Zitare](#zitare)
- [Presi](#presi)
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

## Zitare

| App     | Port | Befehl                    |
| ------- | ---- | ------------------------- |
| Web     | -    | `pnpm dev:zitare:web`     |
| Backend | -    | `pnpm dev:zitare:backend` |
| Mobile  | 8081 | `pnpm dev:zitare:mobile`  |
| Landing | -    | `pnpm dev:zitare:landing` |

```bash
# Web + Backend zusammen starten
pnpm dev:zitare:app

# Alles
pnpm zitare:dev
```

---

## Presi

| App     | Port | Befehl                   |
| ------- | ---- | ------------------------ |
| Web     | -    | `pnpm dev:presi:web`     |
| Backend | -    | `pnpm dev:presi:backend` |
| Mobile  | 8081 | `pnpm dev:presi:mobile`  |

```bash
# Web + Backend zusammen starten
pnpm dev:presi:app

# Alles
pnpm presi:dev

# Datenbank
pnpm presi:db:push     # Schema pushen
pnpm presi:db:studio   # Drizzle Studio
pnpm presi:db:seed     # Seed-Daten
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

# Alle Backends für Dashboard-Widgets starten (9 Services parallel)
# Startet: auth, chat, calendar, contacts, todo, zitare, picture, manadeck, clock
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
| Tasks Today/Upcoming | todo     | 3017 |
| Zitare Quote         | zitare   | 3007 |
| Picture Recent       | picture  | 3006 |
| Manadeck Progress    | manadeck | 3009 |
| Clock Timers         | clock    | 3018 |

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

## App-Übersicht (30 Apps gesamt)

### Aktive Apps (apps/) - 13 Apps

calendar - Kalender-App für persönliches und geteiltes Zeitmanagement mit wiederkehrenden Terminen, CalDAV/iCal-Sync und Erinnerungen
chat - KI-Chat-Anwendung mit verschiedenen KI-Modellen und Konversationsverlauf
clock - Uhren-App mit Weltzeituhr, Wecker, Timer, Stoppuhr und Pomodoro-Timer
contacts - Kontaktverwaltung mit Import/Export und Google-Synchronisation
inventory - Inventar-/Besitzverwaltung mit Fotos, Kaufbelegen, Garantie-Dokumenten und Standorten
manacore - Multi-App Ecosystem Platform - zentrales Dashboard für alle Mana-Apps
manadeck - Karteikarten-/Lernkarten-Management für Spaced Repetition Learning
picture - KI-Bildgenerierung mit verschiedenen Modellen und Galerie-Verwaltung
presi - Präsentations-Tool für Slides und Vorträge
storage - Cloud-Speicher-App für Dateiverwaltung (ähnlich Dropbox/Google Drive)
techbase - Mehrsprachige Software-Vergleichsplattform mit Astro.js, Voting-System und Kommentaren
todo - Task-Management mit Projekten, Subtasks, Labels und wiederkehrenden Aufgaben
zitare - Tägliche Inspirations-Zitate mit Favoriten und personalisierten Empfehlungen

### Archivierte Apps (apps-archived/) - 11 Apps

bauntown - Community-Website für Entwickler mit News, Projekten und Tutorials
finance - Budget-Tracker & Finanzübersicht mit Multi-Currency-Konten, Transaktionen, Budgets und Reports
maerchenzauber - KI-gestützte Kindermärchen-Generierung mit illustrierten Geschichten
mail - E-Mail-Client mit KI-Unterstützung für intelligentes Sortieren und Antworten
memoro - Sprachnotizen-App mit KI-Transkription und Analyse
moodlit - Ambient Lighting & Mood App für Stimmungsbeleuchtung
news - News-Aggregator für personalisierte Nachrichten
nutriphi - KI-gestützter Ernährungs-Tracker mit Foto-Analyse via Google Gemini
reader - Text-to-Speech App mit Google Chirp Voices für Offline-Wiedergabe
uload - URL-Shortener und Link-Management-Platform (Live: ulo.ad)
wisekeep - KI-gestützte Wissensextraktion aus YouTube-Videos mit Transkription

### Games (games/) - 5 Games

figgos - Collectible Figure Game mit KI-generierten Fantasy-Figuren zum Sammeln
mana-games - Browser-Spieleplatform mit 22+ Spielen und KI-Spielgenerierung
voxelava - 3D Voxel Building & Platforming Game mit Level-Editor und Sharing
whopixels - Pixel-Art-Editor-Spiel mit Phaser.js
worldream - Text-first World-Building-Plattform für fiktive Welten mit @slug-Referenzen

### Services (services/) - 1 Service

mana-core-auth - Zentraler Authentifizierungs-Service für alle Apps (Better Auth + EdDSA JWT)

### Shared Packages (packages/) - 4 Kern-Packages

shared-ui - Gemeinsame UI-Komponenten für alle Web-Apps
shared-auth - Client-seitige Auth-Integration für Web/Mobile
shared-nestjs-auth - NestJS Guards/Decorators für JWT-Validierung
shared-storage - S3-kompatible Storage-Abstraktion (MinIO/Hetzner)
