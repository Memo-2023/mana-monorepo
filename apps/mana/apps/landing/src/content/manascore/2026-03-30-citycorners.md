---
title: 'CityCorners: Production Readiness Audit'
description: 'Stadtführer für Konstanz mit Leaflet-Maps, Marker-Clustering, Nominatim-Geocoding, 11 Standort-Kategorien und Favoriten - local-first mit Sync und Docker-Deployment'
date: 2026-03-30
app: 'citycorners'
author: 'Claude Code'
tags: ['audit', 'citycorners', 'production-readiness', 'alpha']
score: 48
scores:
  backend: 5
  frontend: 60
  database: 55
  testing: 10
  deployment: 65
  documentation: 55
  security: 45
  ux: 65
status: 'alpha'
version: '1.0.0'
stats:
  backendModules: 0
  webRoutes: 27
  components: 27
  dbTables: 3
  testFiles: 2
  testCount: 5
  languages: 2
  linesOfCode: 5342
  sourceFiles: 48
  sizeInMb: 0.3
  commits: 0
  contributors: 2
  firstCommitDate: '2026-03-01'
  todoCount: 0
  apiEndpoints: 1
  stores: 4
  maxFileLines: 300
---

## Zusammenfassung

CityCorners ist ein **Stadtführer** mit interaktiven Leaflet-Karten, Marker-Clustering, Nominatim-Geocoding und 11 Standort-Kategorien. Voll local-first mit Dexie.js und mana-sync. Docker-Deployment konfiguriert und in docker-compose.macmini.yml. Minimale Testabdeckung (2 Dateien).

## Backend (5/100)

- Kein eigenes Backend
- Nur Health-Check Endpoint (`GET /health`)
- Alle Daten über local-first/mana-sync
- Geocoding über externes Nominatim API
- **Designentscheidung:** Frontend-only mit Sync-Backend

## Frontend (60/100)

- SvelteKit 2 + Svelte 5 Runes
- Tailwind CSS 4
- Leaflet 1.9 mit Marker-Clustering
- 27 Routes: Städte, Standorte, Karten, Favoriten, Suche, Auth, Settings
- 4 Svelte 5 Rune Stores (auth, favorites, tags, theme)
- 13 Library-Module (API-Helper, i18n, Dexie, Seed Data)
- i18n mit svelte-i18n (DE + EN)
- PWA-Manifest konfiguriert
- **Lücke:** Keine Skeleton-Loader, begrenzte Offline-Map-Tiles

## Database (55/100)

- IndexedDB via Dexie.js (@mana/local-store)
- 3 Collections: cities (slug/country/name), locations (cityId/category/name), favorites (locationId)
- Live Queries mit Dexie liveQuery
- Sync über mana-sync WebSocket
- Guest Seed Data (Konstanz, Zürich, Berlin)
- **Lücke:** Keine serverseitige Datenbank (by design)

## Testing (10/100)

- 2 Testdateien (api.test.ts, help/index.test.ts)
- Vitest 4.1 konfiguriert
- ~5% Coverage geschätzt
- **Lücke:** Keine Komponenten-Tests, keine E2E Tests, keine Map-Tests

## Security (45/100)

- Mana Core Auth Integration (JWT)
- Guest Mode mit Seed Data
- Creator-only Edit Protection
- **Lücke:** Nicht in trustedOrigins registriert, kein Rate Limiting

## Deployment (65/100)

- Dockerfile vorhanden (Multi-Stage, node:20-alpine, Port 5022)
- Health Check (GET /health, 30s Intervall)
- In docker-compose.macmini.yml (128m Memory Limit)
- Depends on: mana-auth, mana-core-sync
- **Lücke:** Kein CI/CD, kein Error Monitoring

## Documentation (55/100)

- CLAUDE.md vorhanden (4.4 KB, umfassend)
- Architektur, Tech Stack, Datenmodell, Routes dokumentiert
- Features und Kategorien beschrieben
- Docker-Config und Env Vars dokumentiert
- **Lücke:** Keine API-Docs, kein Deployment-Guide

## UX (65/100)

- Interaktive Leaflet-Karten mit Marker-Clustering
- 11 Standort-Kategorien (Sight, Restaurant, Café, Museum, Park, etc.)
- Farbcodierte Marker pro Kategorie
- Suche und Filterung nach Stadt/Standort/Kategorie
- Favoriten (Auth-gated)
- Dark/Light Mode
- **Lücke:** Keine Offline-Map-Tiles, keine Routing/Navigation, keine Bilder

## Top-3 Empfehlungen

1. **Tests erweitern** - Map-Interaktionen, Geocoding-Mock, E2E für Standort-CRUD
2. **Offline-Maps** - Tile-Caching für echte Offline-Nutzung
3. **Bilder** - Standortfotos über MinIO/shared-storage integrieren
