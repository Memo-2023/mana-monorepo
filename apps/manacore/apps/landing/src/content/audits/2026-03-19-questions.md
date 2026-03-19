---
title: 'Questions: Production Readiness Audit'
description: 'AI Research Assistant mit 32 Endpoints, 11 DTOs, 95 Validatoren - feature-reichstes Backend, aber kein Docker'
date: 2026-03-19
app: 'questions'
author: 'Till Schneider'
tags: ['audit', 'questions', 'production-readiness', 'ai']
score: 48
scores:
  backend: 88
  frontend: 62
  database: 78
  testing: 0
  deployment: 10
  documentation: 72
  security: 55
  ux: 55
status: 'alpha'
stats:
  backendModules: 8
  webRoutes: 12
  components: 16
  dbTables: 5
  testFiles: 0
  testCount: 0
  languages: 3
---

## Zusammenfassung

Questions hat das **komplexeste Backend** aller Apps: 32 Endpoints, 11 DTOs (265 LOC), 95 Validation Decorators. Aber komplett ohne Docker/Deployment-Infrastruktur.

## Backend (88/100)

- 8 Module: Collection, Question, Research, Source, Answer, Admin, Database, Health
- 32 Endpoints (meiste aller Apps)
- 11 DTOs, 265 LOC (beste Validation)
- 95 class-validator Decorators
- AI Research mit mana-search + mana-llm Integration

## Frontend (62/100)

- 12 Routes, 16 Komponenten, 21 Stores
- 3 Sprachen
- **Lücke:** Kein PWA, wenig Komponenten

## Deployment (10/100)

- **Kein Dockerfile** - weder Backend noch Web
- Kein docker-compose Eintrag
- Nicht deployed

## Testing (0/100)

**Keine Tests** trotz komplexer Business-Logik.

## Top-3 Empfehlungen

1. **Docker-Support** - Backend + Web Dockerfiles erstellen
2. **Tests** - Research/Question Service Specs (kritisch bei AI-Logik)
3. **Rate Limiting** - ThrottlerModule für AI-Research Endpoints
