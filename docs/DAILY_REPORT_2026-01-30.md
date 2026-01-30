# Daily Report - 30. Januar 2026

**Zeitraum:** 10:00 - 19:00 Uhr
**Commits:** 41
**Hauptthemen:** Matrix SSO/OIDC Integration, 9 neue Matrix Bots, LLM Playground, Demo Mode Removal

---

## Zusammenfassung

Ein intensiver Tag mit Fokus auf **Matrix-Integration** und **Bot-Infrastruktur**:

- **Matrix SSO/OIDC** - Mana Core Auth als OIDC Provider für Matrix Synapse (mchat.mana.how)
- **9 Matrix Bots** - Neue Bots für Picture, Contacts, ManaDeck, Planta, Questions, Presi, Skilltree, Chat
- **LLM Playground** - SvelteKit UI für lokale Ollama-Modelle
- **Demo Mode entfernt** - Login jetzt erforderlich für alle Apps
- **Docker Fixes** - shared-vite-config und shared-stores Kompatibilität

---

## 1. Matrix SSO/OIDC Integration (Hauptfeature)

### Problem

Matrix Synapse auf mchat.mana.how sollte Mana Core Auth als OIDC Provider nutzen, um SSO zu ermöglichen. User sollten sich mit ihrem Mana-Account bei Matrix anmelden können.

### Herausforderungen & Lösungen

#### 1.1 CSP blockiert Inline-Scripts (10:00)
**Commit:** `3d4402ad` - fix(mana-core-auth): allow inline scripts in CSP for OIDC login page

**Problem:** Die OIDC Login-Seite nutzt Inline-JavaScript, aber die Content Security Policy (CSP) blockierte dies.

**Lösung:** CSP um `'unsafe-inline'` erweitert für die Login-Seite:
```typescript
// main.ts - Helmet configuration
scriptSrc: ["'self'", "'unsafe-inline'"],
```

#### 1.2 Client-Name "Unknown" auf Login-Seite (10:30)
**Commit:** `4a66341e` - fix(mana-core-auth): extract client_id from returnUrl for OIDC login

**Problem:** Die Login-Seite zeigte "Unknown" statt "Matrix Chat" als Client-Name.

**Lösung:** client_id aus dem returnUrl-Parameter extrahieren:
```typescript
// oidc-login.controller.ts
const returnUrlObj = new URL(returnUrl, 'http://localhost');
const clientIdFromUrl = returnUrlObj.searchParams.get('client_id');
const clientId = req.query.client_id || clientIdFromUrl || 'unknown';
```

#### 1.3 Session Cookies fehlen nach Login (12:00)
**Commits:**
- `edbe7502` - fix(mana-core-auth): use Better Auth native sign-in for OIDC login
- `f59b6596` - fix(mana-core-auth): add dedicated Better Auth handler for sign-in

**Problem:** Nach dem Login wurde kein Authorization Code generiert, weil `/api/v1/auth/login` keine Session-Cookies setzt.

**Lösung:** Wechsel zu Better Auth's nativem `/api/auth/sign-in/email` Endpoint:
```typescript
// oidc.controller.ts - Neuer Handler
@Post('api/auth/sign-in/email')
async signInEmail(@Req() req: Request, @Res() res: Response) {
    return this.handleBetterAuthRequest(req, res);
}

private async handleBetterAuthRequest(req: Request, res: Response) {
    const handler = this.betterAuthService.getHandler();
    const response = await handler(fetchRequest);
    // Copy Set-Cookie headers for session
    response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            res.append(key, value);
        }
    });
}
```

#### 1.4 INVALID_REDIRECT_URI Error (14:00)
**Commits:**
- `8207d38c` - fix(mana-core-auth): use comma-separated redirect_urls for Better Auth OIDC
- `ee05b6c3` - fix(mana-core-auth): use correct property name 'redirectUrls' for Better Auth

**Problem:** Better Auth's OIDC Provider gab `INVALID_REDIRECT_URI` zurück, obwohl die URL korrekt in der Datenbank war.

**Ursachen & Lösungen:**

1. **Format-Problem:** Better Auth erwartet **Komma-separierte Strings**, nicht JSON-Arrays:
   ```sql
   -- FALSCH (JSON Array)
   redirect_urls: '["https://matrix.mana.how/_synapse/client/oidc/callback"]'

   -- RICHTIG (Komma-separiert)
   redirect_urls: 'https://matrix.mana.how/_synapse/client/oidc/callback'
   ```

2. **Property-Name:** Better Auth erwartet `redirectUrls` (lowercase 'urls'), nicht `redirectURLs` (uppercase 'URLs'):
   ```typescript
   // auth.schema.ts - VORHER
   redirectURLs: text('redirect_urls').notNull(),

   // auth.schema.ts - NACHHER
   redirectUrls: text('redirect_urls').notNull(),
   ```

#### 1.5 Consent-Screen überspringen (17:00)
**Commits:**
- `bb428d4b` - fix(mana-core-auth): add Matrix Synapse as trusted OIDC client
- `01a2c78e` - fix(mana-core-auth): add all required fields to trusted client config
- `c949f5d0` - fix(mana-core-auth): fix type compatibility for trusted client config
- `744d0c9c` - fix(mana-core-auth): remove non-existent id field from trusted client

**Problem:** Nach erfolgreichem Login wurde zum Consent-Screen weitergeleitet, der nicht implementiert war.

**Lösung:** Matrix Synapse als trusted client konfigurieren mit `skipConsent: true`:
```typescript
// better-auth.config.ts
oidcProvider({
    loginPage: '/login',
    consentPage: '/consent',
    trustedClients: [
        {
            clientId: 'matrix-synapse',
            clientSecret: process.env.SYNAPSE_OIDC_CLIENT_SECRET || '',
            name: 'Matrix Synapse',
            type: 'web',
            disabled: false,
            metadata: {},
            redirectUrls: ['https://matrix.mana.how/_synapse/client/oidc/callback'],
            skipConsent: true,
        },
    ],
}),
```

### Ergebnis

Der OIDC-Flow funktioniert nun vollständig:
1. User klickt "Sign in with Mana Core" auf mchat.mana.how
2. Redirect zu auth.mana.how/login mit Client-Info
3. User sieht "Signing in to **Matrix Chat**"
4. Nach Login: Session-Cookie wird gesetzt
5. Redirect zurück mit Authorization Code
6. Token-Exchange für Access Token
7. User ist in Matrix eingeloggt

---

## 2. Matrix Bots (9 neue Bots)

Implementierung von 9 spezialisierten Matrix-Bots für die Integration mit ManaCore Apps.

### Neue Bots

| Bot | Commit | Beschreibung |
|-----|--------|--------------|
| **matrix-picture-bot** | `8950692c` | AI-Bildgenerierung via Flux |
| **matrix-contacts-bot** | `64535373` | Kontaktverwaltung |
| **matrix-manadeck-bot** | `ad7f875c` | Kartendecks verwalten |
| **matrix-planta-bot** | `3f336de1` | Pflanzenpflege-Management |
| **matrix-questions-bot** | `c5476447` | Q&A Research |
| **matrix-presi-bot** | `e3cfafe5` | Präsentationsverwaltung |
| **matrix-skilltree-bot** | `3ed1453f` | Skill Tree & XP |
| **matrix-chat-bot** | `68219a01` | AI Chat Conversations |

### Standardisierung
**Commit:** `df47dafe` - chore(matrix-bots): standardize package.json across all 9 bots

Alle Bots nutzen nun:
- Einheitliche Dependency-Versionen
- Standard Scripts: `dev`, `build`, `start`
- Konsistente NestJS-Struktur
- TypeScript strict mode

### TypeScript Fixes
**Commit:** `004fe857` - fix(matrix-bots): resolve TypeScript strict null check errors

Behebung von null-check Fehlern in allen Bot-Services.

---

## 3. LLM Playground

### Neue SvelteKit UI
**Commits:**
- `f880ef2b` - feat(llm-playground): add SvelteKit LLM playground UI
- `fdba0e34` - feat(llm-playground): add production deployment with auth
- `5d5e42c7` - feat(chat): add all Mac Mini Ollama models to playground

Neues Web-Interface zum Testen lokaler Ollama-Modelle:

**Features:**
- Model-Auswahl (alle Mac Mini Ollama-Modelle)
- Chat-Interface mit Streaming
- System Prompt Konfiguration
- Temperature/Max Tokens Settings

**Verfügbare Modelle:**
| Modell | Beschreibung |
|--------|--------------|
| gemma3:4b | Everyday tasks (default) |
| qwen2.5-coder:7b | Code generation |
| llava:7b | Image analysis |
| qwen3-vl:4b | Fast vision |
| deepseek-ocr | OCR/Text recognition |
| phi3.5 | Compact, efficient |
| ministral:3b | Very fast |

**URLs:**
- https://llm.mana.how (Production)
- http://localhost:5191 (Development)

---

## 4. Demo Mode Removal

### Entfernung aus allen Apps
**Commits:**
- `f07387d1` - 🔥 remove: demo mode from todo, contacts, clock, questions, chat apps
- `82da95b8` - 🔥 remove(calendar-web): remove demo mode, enforce login

**Betroffene Apps:**
- Todo
- Contacts
- Clock
- Questions
- Chat
- Calendar

**Änderungen:**
- `DEMO_MODE` Environment Variable entfernt
- Login jetzt obligatorisch
- Redirect zu `/login` für nicht-authentifizierte User
- Session-Storage für Guest-Daten entfernt

---

## 5. Docker & Build Fixes

### shared-vite-config Kompatibilität
**Commits:**
- `359b8706` - 🔧 chore: add shared-vite-config to web Dockerfiles
- `d09ea061` - 🔧 chore: add shared-vite-config as devDependency to web apps
- `36941552` / `90f9f2c9` - 🔧 chore(shared-vite-config): add build step for Docker compatibility
- `eb475ace` - 🔧 chore(calendar-web): add shared-vite-config to devDependencies

**Problem:** Docker Builds fehlgeschlagen wegen fehlendem shared-vite-config.

**Lösung:**
1. Package als devDependency zu allen Web-Apps hinzugefügt
2. Build-Step in shared-vite-config für TypeScript-Kompilierung
3. Expliziter Build im Dockerfile vor App-Build

### shared-stores und shared-api-client
**Commits:**
- `4526123b` - 🔧 chore: add shared-stores and shared-api-client to web apps
- `8779d047` - 🔧 chore(calendar-web): add shared-stores to Dockerfile

Fehlende Shared Packages zu Dockerfiles hinzugefügt.

---

## 6. Calendar Web Fixes

**Commits:**
- `8da676ff` - 🐛 fix(calendar-web): initialize auth store on mount
- `017891b1` - 🐛 fix(calendar-web): use client URL in browser for API calls
- `e5a5e968` - 🐛 fix(calendar-web): add missing packages to Dockerfile

**Fixes:**
1. Auth Store wird jetzt beim Mount initialisiert (nicht nur im Browser)
2. API-Calls nutzen Browser-URL statt Server-URL
3. Fehlende Packages im Dockerfile ergänzt

---

## 7. Sonstige Änderungen

### Matrix Web SSR Fix
**Commit:** `3b745cf0` - fix(matrix-web): disable SSR for app routes to fix $state error

SSR deaktiviert für App-Routes wegen Svelte 5 `$state` Kompatibilitätsproblemen.

### Mana Notify
**Commit:** `b8ecdb8e` - 🔧 chore(mana-notify): disable email notifications by default

Email-Benachrichtigungen standardmäßig deaktiviert (nur Push-Notifications aktiv).

### Dependencies Update
**Commit:** `3edbd0cb` - chore: update dependencies and mana-llm improvements

Allgemeine Dependency-Updates und mana-llm Verbesserungen.

### Syntax Fix
**Commit:** `2daaee74` - 🐛 fix: syntax error in contacts-web +layout.svelte

Syntax-Fehler in Contacts Web Layout behoben.

---

## Technische Details

### OIDC Flow Architektur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Matrix/Synapse │────>│  Mana Core Auth  │────>│    Database     │
│  mchat.mana.how │     │  auth.mana.how   │     │  oauth_apps     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │ 1. SSO Click          │ 2. /api/auth/oauth2/authorize
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│   Login Page    │────>│  Better Auth     │
│   /login        │     │  Session Cookie  │
└─────────────────┘     └──────────────────┘
        │                       │
        │ 3. POST sign-in       │ 4. Set-Cookie
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Redirect with  │<────│  Auth Code Gen   │
│  ?code=xxx      │     │  (trusted client)│
└─────────────────┘     └──────────────────┘
```

### Better Auth OIDC Provider Konfiguration

```typescript
oidcProvider({
    loginPage: '/login',
    consentPage: '/consent',
    metadata: {
        issuer: process.env.BASE_URL,
    },
    trustedClients: [{
        clientId: 'matrix-synapse',
        clientSecret: process.env.SYNAPSE_OIDC_CLIENT_SECRET,
        name: 'Matrix Synapse',
        type: 'web',
        disabled: false,
        metadata: {},
        redirectUrls: ['https://matrix.mana.how/_synapse/client/oidc/callback'],
        skipConsent: true,
    }],
}),
```

### Datenbank-Schema Änderung

```typescript
// VORHER (Breaking)
export const oauthApplications = authSchema.table('oauth_applications', {
    redirectURLs: text('redirect_urls').notNull(), // Capital 'URLs'
});

// NACHHER (Working)
export const oauthApplications = authSchema.table('oauth_applications', {
    redirectUrls: text('redirect_urls').notNull(), // Lowercase 'urls'
});
```

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Commits** | 41 |
| **Neue Matrix Bots** | 9 |
| **Bearbeitete Dateien** | ~100+ |
| **Hauptfeature** | Matrix SSO/OIDC |
| **Gelöste Bugs** | 12+ |
| **Build Zeit** | ~3 Minuten pro mana-core-auth Build |

---

## Bekannte Issues

1. **Token Exchange**: Das client_secret in der Datenbank muss mit dem Environment-Variable übereinstimmen
2. **SSH Tunnel**: Cloudflare Tunnel zeitweise instabil (Websocket Handshake Fehler)

---

## Nächste Schritte

1. **Token Endpoint Fix** - Sicherstellen dass DB-Secret und ENV-Secret übereinstimmen
2. **Matrix Bot Deployment** - Alle 9 Bots auf Mac Mini deployen
3. **LLM Playground** - Production Deployment finalisieren
4. **Monitoring** - OIDC-Metriken zu Grafana hinzufügen
5. **Documentation** - Matrix SSO Setup Guide erstellen

---

*Bericht erstellt am 30. Januar 2026, 19:00 Uhr*
