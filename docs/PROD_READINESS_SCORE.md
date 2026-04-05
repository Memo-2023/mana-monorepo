# Production Readiness Score

Bewertungssystem für die Produktionsreife der Mana Apps. Jede App wird in 8 Kategorien (0-100) bewertet. Der Gesamtscore ist ein gewichteter Durchschnitt.

## Kategorien & Gewichtung

| Kategorie | Gewicht | Was wird bewertet |
|-----------|---------|-------------------|
| **Backend** (20%) | 20 | Module, Controller, Services, DTOs, Validation, Error Handling |
| **Frontend** (20%) | 20 | Routes, Components, Stores, Responsiveness, Loading States |
| **Database** (10%) | 10 | Schema-Design, Migrations, Seeds, Indexes, Constraints |
| **Testing** (15%) | 15 | Unit Tests, Integration Tests, E2E Tests, Coverage, Mock Infra |
| **Deployment** (10%) | 10 | Dockerfile, Docker Compose, Health Checks, CI/CD, Env Config |
| **Documentation** (5%) | 5 | CLAUDE.md, API Docs, README, Code Comments |
| **Security** (10%) | 10 | Auth Guards, Rate Limiting, Input Validation, CORS, GDPR |
| **UX** (10%) | 10 | i18n, PWA, Offline, Accessibility, Animations, Error Boundaries |

## Bewertungsskala pro Kategorie

| Score | Level | Beschreibung |
|-------|-------|--------------|
| 0-20 | Nicht vorhanden | Feature existiert nicht oder ist Placeholder |
| 21-40 | Prototyp | Grundstruktur vorhanden, nicht funktional |
| 41-60 | Alpha | Funktional aber unvollständig, viele Lücken |
| 61-80 | Beta | Weitgehend komplett, einige Lücken |
| 81-95 | Production | Produktionsreif, minor Verbesserungen möglich |
| 96-100 | Mature | Vollständig, getestet, gehärtet |

## Gesamtscore → Status-Mapping

| Score | Status | Beschreibung |
|-------|--------|--------------|
| 0-25 | `prototype` | Konzept/Prototyp, nicht nutzbar |
| 26-50 | `alpha` | Grundfunktionen, instabil |
| 51-70 | `beta` | Feature-complete, nicht gehärtet |
| 71-85 | `production` | Produktionsreif, stabil |
| 86-100 | `mature` | Ausgereift, umfassend getestet |

## Scoring-Details

### Backend (0-100)
- 0-10: Kein Backend
- 11-30: Grundstruktur (main.ts, 1-2 Module)
- 31-50: CRUD vorhanden, keine Validation
- 51-70: DTOs, Guards, Error Handling
- 71-85: Rate Limiting, Admin Endpoints, Metrics
- 86-100: Comprehensive Validation, alle Edge Cases

### Frontend (0-100)
- 0-10: Kein Frontend
- 11-30: Grundrouten, kein State Management
- 31-50: CRUD-Seiten, basic Stores
- 51-70: Loading States, Error Handling, Navigation
- 71-85: Responsive, Animations, Keyboard Support
- 86-100: PWA, Offline, Accessibility vollständig

### Testing (0-100)
- 0: Keine Tests
- 1-20: Jest Config vorhanden, keine Tests
- 21-40: 1-5 Test Files, nur Happy Path
- 41-60: Mock Infra, Service Tests, Error Cases
- 61-80: Controller Tests, Integration Tests
- 81-100: E2E Tests, >80% Coverage

### Security (0-100)
- 0-20: Keine Auth
- 21-40: Auth Guards vorhanden
- 41-60: + Input Validation, CORS
- 61-80: + Rate Limiting, GDPR Endpoints
- 81-100: + Encryption, Audit Logs, Pen-Testing

## Audit-Ablauf

1. Code-Review aller Projektdateien
2. Zählung: Module, Routes, Components, Tests, Tables
3. Bewertung jeder Kategorie (0-100)
4. Gewichteter Gesamtscore berechnen
5. Status ableiten
6. Audit als Content in `apps/mana/apps/landing/src/content/audits/` ablegen
7. Empfehlungen für Verbesserungen dokumentieren
