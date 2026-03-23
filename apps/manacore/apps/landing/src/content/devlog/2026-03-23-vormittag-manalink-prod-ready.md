---
title: 'Manalink: Matrix-Client Production-Ready & Live'
description: 'Manalink (Matrix-Chat-Client) auf Prod-Readiness gebracht und erfolgreich auf link.mana.how deployed. Inkl. Security Headers, Error Pages, Tests und E2EE-Feedback.'
date: 2026-03-23
author: 'Till Schneider'
category: 'release'
tags:
  [
    'matrix',
    'manalink',
    'deployment',
    'security',
    'testing',
    'vitest',
    'pwa',
    'e2ee',
    'docker',
    'sso',
  ]
featured: true
commits: 7
readTime: 5
stats:
  filesChanged: 18
  linesAdded: 942
  linesRemoved: 620
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 7
workingHours:
  start: '2026-03-23T09:00'
  end: '2026-03-23T13:30'
---

Manalink, unser Matrix-Chat-Client, ist jetzt **live auf [link.mana.how](https://link.mana.how)** mit **7 Commits**:

- **Prod-Readiness Audit** - Umfassende Analyse der Web-App auf Production-Tauglichkeit
- **Security** - Server-seitige Security Headers (CSP, X-Frame-Options, Referrer-Policy)
- **Error Handling** - Globale Error/404-Page mit Navigation
- **Tests** - Vitest-Setup mit 14 Unit-Tests für Matrix-Client-Funktionen
- **E2EE-Feedback** - Sichtbarer Hinweis wenn Verschlüsselung nicht verfügbar
- **Deployment** - Docker-Build gefixt und Container live auf Mac Mini

---

## Manalink vs. Chat App: Klarstellung

Vor der Arbeit wurde die Abgrenzung zwischen unseren zwei Chat-Systemen geklärt:

|           | **Chat App**       | **Manalink**                       |
| --------- | ------------------ | ---------------------------------- |
| Zweck     | AI-Chat mit LLMs   | Messaging zwischen Menschen & Bots |
| Protokoll | Eigene REST-API    | Matrix (föderiert, dezentral)      |
| Backend   | NestJS (Port 3002) | Synapse Homeserver                 |
| E2EE      | Nein               | Ja (in Arbeit)                     |
| URL       | -                  | https://link.mana.how              |

Beide Apps sind komplementär und werden weiter gepflegt.

---

## Prod-Readiness Fixes

### 1. Error/404-Page

Neue globale `+error.svelte` mit:

- Statuscode-Anzeige (404, 500, etc.)
- Deutsche Fehlermeldungen
- Zurück-Button und Startseite-Link
- Konsistentes Design mit dem Rest der App

### 2. Security Headers

Neuer `hooks.server.ts` mit allen relevanten Headern:

```typescript
response.headers.set('X-Frame-Options', 'SAMEORIGIN');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
```

### 3. SSO Homeserver-Bug gefixt

SSO-Redirect war hardcoded auf `matrix.mana.how`. Jetzt dynamisch:

- Login-Page: nutzt den eingegebenen Homeserver
- Layout SSO-Callback: konfigurierbar via `VITE_MATRIX_HOMESERVER`
- Auth-URL: konfigurierbar via `VITE_MANA_AUTH_URL`

### 4. Console.log Cleanup

**54 `console.log`/`console.warn` Statements** entfernt aus:

- `store.svelte.ts` (Matrix Store)
- `+layout.svelte` (App Layout)

Nur echte `console.error` für Fehlerfälle beibehalten (gehen an GlitchTip).

### 5. PWA devOptions

`devOptions.enabled` war immer `true` - jetzt nur noch in Nicht-Production aktiv.

---

## Tests

Vitest eingerichtet mit **14 Unit-Tests** für die kritischen Client-Funktionen:

| Test-Suite           | Tests | Was wird getestet                                                |
| -------------------- | ----- | ---------------------------------------------------------------- |
| `discoverHomeserver` | 5     | Matrix-User-ID Parsing, .well-known Discovery, Domain-Extraktion |
| `checkHomeserver`    | 5     | URL-Normalisierung, Server-Erreichbarkeit, Fehlerbehandlung      |
| `loginWithToken`     | 4     | Token-Login, URL-Normalisierung, DeviceID-Generierung            |

```bash
pnpm --filter @matrix/web test
# 1 Test File, 14 Tests passed
```

---

## E2EE-Feedback

Wenn die Rust-Crypto-Initialisierung fehlschlägt, sieht der User jetzt einen dezenten Amber-Banner:

```
⚠ Verschlüsselung nicht verfügbar
```

Angezeigt in der Sidebar sowohl auf Mobile als auch Desktop. Vorher fiel der Fallback komplett still zurück.

---

## Deployment

### Docker-Build Fixes

Drei Probleme mussten im Dockerfile gelöst werden:

1. **Fehlende `patches/`** - pnpm braucht den Patches-Ordner auch wenn die Patches nicht anwendbar sind
2. **Fehlendes `eslint-config`** - Root-Dependency die im Workspace aufgelöst werden muss
3. **react-native Patches** - Nicht anwendbar im Web-Only-Kontext, werden jetzt vor `pnpm install` aus der `package.json` entfernt

### Live-Deployment

```
Container: mana-matrix-web
Image: matrix-web:latest
Port: 4090 → 5180
Status: healthy
URL: https://link.mana.how
```

---

## Zusammenfassung

| Bereich    | Commits | Highlights                               |
| ---------- | ------- | ---------------------------------------- |
| Security   | 1       | Headers, Error Page, Console Cleanup     |
| SSO/Config | 1       | Dynamischer Homeserver, Env-Variablen    |
| Tests      | 1       | Vitest + 14 Unit-Tests                   |
| E2EE UX    | 1       | Verschlüsselungs-Warning Banner          |
| Docker     | 4       | Patches, eslint-config, RN-Patches Strip |

---

## Nächste Schritte

1. **E2EE fertigstellen** - Rust Crypto vollständig integrieren und testen
2. **File Uploads** - Bilder und Dateien senden/empfangen
3. **Message Reactions** - Emoji-Reaktionen auf Nachrichten
4. **Test Coverage erweitern** - Store, Notifications, Auth-Flow testen
5. **Mobile App** - Manalink Mobile auf Feature-Parität mit Web bringen
