---
title: 'ManaScore Update: Local-First + Hono Migration'
description: 'Score-Update nach der kompletten Architektur-Migration: Local-First (IndexedDB + Sync), NestJS → Hono/Bun, Guest-Mode, Offline-CRUD. Alle 19 Apps profitieren von besserer UX, schnellerem Loading und Offline-Fähigkeit.'
date: 2026-03-28
app: 'all'
author: 'Till Schneider'
tags: ['audit', 'architecture', 'local-first', 'hono', 'manascore-update']
score: 85
scores:
  backend: 88
  frontend: 90
  database: 85
  testing: 65
  deployment: 90
  documentation: 80
  security: 82
  ux: 92
status: 'production'
---

## Globale Verbesserungen (alle 19 Apps)

Die Architektur-Migration hat alle Apps gleichzeitig verbessert:

### Frontend (+5-10 Punkte)
- **Local-First**: IndexedDB als primäre Datenquelle (< 1ms Reads)
- **Guest-Mode**: Sofortiger Zugang ohne Login
- **Offline CRUD**: Voller Funktionsumfang ohne Internet
- **SyncIndicator**: Floating Pill zeigt Sync-Status
- **GuestWelcomeModal**: Onboarding für neue Nutzer

### Backend (+5 Punkte)
- **Hono + Bun**: ~120 LOC Compute-Server statt ~3.500 LOC NestJS
- **~50ms Cold Start**: statt 2-5 Sekunden
- **~30MB RAM**: statt ~200MB pro Service
- **Shared Package**: `@mana/shared-hono` (Auth, Credits, Health)

### UX (+5-10 Punkte)
- **Time to Interactive**: < 500ms (war 3-5s mit Login)
- **Daten laden**: < 1ms (war 200-500ms API-Roundtrip)
- **Offline**: Voller CRUD (war: "Offline"-Seite)

### Deployment (+5 Punkte)
- **Docker Image**: ~160MB (war ~400-600MB)
- **Build Time**: ~5s (war 60-90s)
- **Unabhängig deploybar**: Jeder Service einzeln

## Aktualisierte Scores

| App | Vorher | Nachher | Δ | Begründung |
|-----|--------|---------|---|------------|
| **Todo** | 96 | 98 | +2 | War schon top, jetzt auch Hono-Server |
| **Chat** | 82 | 90 | +8 | Local-First + SSE Streaming Server |
| **Calendar** | 85 | 92 | +7 | Local-First + RRULE Server |
| **Contacts** | 78 | 87 | +9 | Local-First + vCard Import Server |
| **Picture** | 76 | 85 | +9 | Local-First + Replicate Server |
| **Cards** | 80 | 89 | +9 | Local-First + AI Card Gen Server |
| **Quotes** | 88 | 93 | +5 | Local-First, war schon solide |
| **Clock** | 85 | 91 | +6 | Local-First + keine Backend-Dependency |
| **Storage** | 72 | 82 | +10 | Local-First + S3 Server |
| **Food** | 70 | 82 | +12 | Local-First + Gemini Server |
| **Planta** | 65 | 78 | +13 | Local-First + Vision Server |
| **Mukke** | 68 | 80 | +12 | Local-First + S3 Server |
| **Questions** | 72 | 83 | +11 | Local-First + Search Server |
| **Context** | 68 | 80 | +12 | Local-First + AI Gen Server |
| **Photos** | 60 | 74 | +14 | Local-First (mana-media bleibt extern) |
| **Presi** | 74 | 84 | +10 | Local-First + Hono Server |
| **SkilltTree** | 75 | 85 | +10 | Unified local-store (war eigenes idb) |
| **CityCorners** | 62 | 76 | +14 | Local-First + Guest-Mode |
| **Inventar** | 70 | 82 | +12 | Local-First (localStorage → IndexedDB) |

### Durchschnitt
- **Vorher**: 75.1 / 100
- **Nachher**: 84.8 / 100
- **Verbesserung**: **+9.7 Punkte** im Durchschnitt
