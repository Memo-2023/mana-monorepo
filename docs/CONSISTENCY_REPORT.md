# Monorepo Konsistenz-Bericht

> Erstellt: 29. Januar 2026

## Übersicht

Nach eingehender Analyse aller Web-Apps im Monorepo wurden folgende Bereiche auf Inkonsistenzen untersucht:

| Bereich | Konsistenz | Priorität |
|---------|------------|-----------|
| Dependencies & Versionen | ⚠️ Mittel | **Hoch** |
| API Client Patterns | ❌ Niedrig | **Hoch** |
| i18n Implementation | ⚠️ Mittel | Mittel |
| Auth Implementation | ✅ Gut | Niedrig |
| Styling & Tailwind | ✅ Sehr gut | Niedrig |
| Komponenten & Layouts | ⚠️ Mittel | Mittel |

---

## 1. Dependencies & Versionen

### Kritische Inkonsistenzen

#### Tailwind CSS Ansatz (2 verschiedene Methoden)

| Methode | Apps |
|---------|------|
| `@tailwindcss/postcss` | manadeck, chat, manacore, presi |
| `@tailwindcss/vite` | clock, planta, skilltree, todo, contacts, nutriphi, questions, calendar, storage, matrix |

#### SvelteKit Versionen

| Version | Apps |
|---------|------|
| ^2.0.0 (minimal) | planta, clock, skilltree, todo, contacts, nutriphi, presi, questions, calendar, storage |
| ^2.15.7 - ^2.47.1 | manadeck, chat, manacore, picture, matrix |

#### Vite Major Version Split

| Version | Apps |
|---------|------|
| v6.0.x | clock, skilltree, todo, contacts, nutriphi, questions, calendar, storage, manacore |
| v7.1.x | manadeck, chat, picture |

#### TypeScript Versionen

- `^5.9.x` (spezifisch): manadeck, chat, manacore, picture
- `^5.0.0` (locker): planta, clock, skilltree, todo, contacts, nutriphi, presi, questions, calendar, storage

### Empfehlungen

1. **Tailwind auf Vite-Plugin vereinheitlichen** - alle 4 PostCSS-Apps migrieren
2. **SvelteKit auf ^2.47.1** für alle Apps aktualisieren
3. **TypeScript auf ^5.9.3** festlegen
4. **Vite auf eine Major-Version** (v7.x empfohlen)

---

## 2. API Client Patterns

### Kritische Inkonsistenzen

#### 3 verschiedene Architektur-Patterns

| Pattern | Apps | Beispiel |
|---------|------|----------|
| Factory Function | calendar, manacore | `createApiClient()` |
| Class-Based Singleton | clock, nutriphi, skilltree, questions, planta, todo | `new ApiClient()` |
| Functional API Objects | chat, picture, contacts, presi, storage | `conversationApi.getAll()` |

#### 4 verschiedene Token-Handling Ansätze

| Ansatz | Apps | Problem |
|--------|------|---------|
| `authStore.getAccessToken()` | clock, contacts, nutriphi, planta, storage | Kein Auto-Refresh |
| `authStore.getValidToken()` | picture, planta, chat | ✅ Auto-Refresh |
| `localStorage.getItem()` | presi, skilltree, questions | Sync, veraltete Tokens möglich |
| Manuelles Token-Property | todo, skilltree | Erfordert externen Setter |

#### 5 verschiedene Error-Handling Strategien

| Strategie | Apps |
|-----------|------|
| Result Type `{data, error}` | calendar, manacore |
| Response Wrapper | clock, storage |
| Throw-on-Error | nutriphi, contacts, skilltree, questions, planta, todo |
| Domain-specific Fallbacks | chat, picture |
| Retry mit Backoff | nur manacore |

#### Base URL Handling

| Methode | Apps | Status |
|---------|------|--------|
| Hardcoded localhost | clock, todo, storage | ❌ Nicht für Produktion |
| Environment Variables | calendar, chat, picture, nutriphi | ⚠️ Build-Zeit |
| Runtime Injection (Docker) | skilltree, questions, planta | ✅ Flexibel |

### Empfehlungen

1. **`@manacore/shared-api-client` Package erstellen** mit:
   - Standardisiertem `createApiClient(config)` Factory
   - `ApiResult<T>` Type (Go-style)
   - Auto-Token-Refresh bei 401
   - Retry mit Exponential Backoff
   - FormData Support

2. **`authStore.getValidToken()`** als Standard für alle Apps

3. **Runtime URL Injection** (Window-Objekt) für Docker-Kompatibilität

---

## 3. i18n Implementation

### Status

#### Apps MIT i18n (10)

| App | Sprachen |
|-----|----------|
| chat | DE, EN, IT, FR, ES |
| picture | DE, EN, IT, FR, ES |
| calendar | DE, EN, IT, FR, ES |
| presi | DE, EN, IT, FR, ES |
| manadeck | DE, EN, IT, FR, ES |
| manacore | DE, EN, IT, FR, ES |
| contacts | DE, EN |
| storage | DE, EN |
| clock | DE, EN |

#### Apps OHNE i18n (7)

- zitare
- skilltree
- planta
- nutriphi
- todo
- matrix
- questions

### Inkonsistenzen

- Verschiedene localStorage Keys: `chat_locale`, `picture_locale`, `locale`
- Unterschiedliche Sprachanzahl (2-5 Sprachen)
- Manacore Landing nutzt Custom-Implementation statt svelte-i18n

### Empfehlungen

1. **i18n zu allen 7 fehlenden Apps hinzufügen**
2. **Storage Key vereinheitlichen** auf `{app}_locale`
3. **Mindestens DE + EN** für alle Apps

---

## 4. Auth Implementation

### Status: ✅ Gut (97% konsistent)

Alle Apps nutzen **Mana Core Auth** mit `@manacore/shared-auth`.

#### Kleine Variationen

| Aspekt | Pattern A | Pattern B |
|--------|-----------|-----------|
| Init | `initializeWebAuth` (8 Apps) | Custom Setup (ManaDeck) |
| URL Config | Window Injection (modern) | Static Import |
| Route Guards | `(protected)/` Ordner | `(app)/` Ordner |

### Empfehlungen

1. **Window Injection für URLs** als Standard dokumentieren
2. **Auth Store Pattern** in Shared Package extrahieren
3. **Server-Side Route Guards** ergänzen (aktuell nur Client-Side)

---

## 5. Styling & Tailwind

### Status: ✅ Sehr gut (97% konsistent)

- Alle Apps nutzen `@manacore/shared-tailwind/preset`
- Einheitliches Theme-System mit CSS Variables
- Dark Mode über `.dark` Klasse
- 4 Themes verfügbar: Lume, Nature, Stone, Ocean

### Kleine Inkonsistenzen

- App-spezifische Farben in `app.css` vs `tailwind.config.js`
- Manche Apps definieren Shadows für Dark Mode doppelt
- Mixed `--theme-*` und `--color-*` Prefixe

### Empfehlungen

1. **App-Farben in tailwind.config.js** statt app.css
2. **Dark Mode Shadows in Shared Preset** konsolidieren

---

## 6. Komponenten & Layouts

### Duplikationen gefunden

#### Toast System (2 Versionen)

| Version | Apps | Status |
|---------|------|--------|
| Svelte 5 Runes | chat, etc. | ✅ Modern |
| Writable Store | contacts, etc. | ⚠️ Legacy |

#### AuthGateModal

- Dupliziert in: chat, todo, contacts, calendar
- Sollte in `@manacore/shared-auth-ui`

#### AppLoadingSkeleton

- Jede App hat eigene Version
- Könnte mit `@manacore/shared-ui` Skeletons vereinheitlicht werden

#### Global Error Handler

- Nur in Contacts App vollständig implementiert
- Sollte extrahiert werden

### Empfehlungen (nach Priorität)

#### Hoch

1. **Toast Store & Component vereinheitlichen** - Svelte 5 Runes Standard
2. **AuthGateModal nach shared-auth-ui** verschieben
3. **Global Error Handler** als Composable extrahieren

#### Mittel

4. **`@manacore/shared-sveltekit-layout`** Package mit Root-Layout Template
5. **FormModal Generator** für config-driven Formulare
6. **AppLoadingSkeleton** vereinheitlichen

---

## Zusammenfassung der Prioritäten

### 🔴 Hohe Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| API Client Package erstellen | Hoch | Alle Apps |
| Tailwind auf Vite-Plugin migrieren (4 Apps) | Mittel | Build-Konsistenz |
| Toast System vereinheitlichen | Niedrig | UX Konsistenz |

### 🟡 Mittlere Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| i18n zu 7 Apps hinzufügen | Mittel | Internationalisierung |
| AuthGateModal in Shared Package | Niedrig | Code-Reduktion |
| Global Error Handler extrahieren | Niedrig | Error UX |
| Dependencies aktualisieren | Mittel | Maintenance |

### 🟢 Niedrige Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| SvelteKit/Vite Versionen angleichen | Niedrig | Konsistenz |
| App-Skeletons vereinheitlichen | Niedrig | Code-Reduktion |
| Auth Store Pattern dokumentieren | Niedrig | Onboarding |

---

## Nächste Schritte

1. **API Client Package** als erstes angehen (höchster Impact)
2. **Tailwind Migration** für 4 Apps durchführen
3. **Toast System** konsolidieren
4. Schrittweise weitere Punkte abarbeiten

---

## Anhang: Analysierte Apps

### Web Apps (16)

- calendar, chat, clock, contacts, manadeck, manacore, matrix, nutriphi, picture, planta, presi, questions, skilltree, storage, todo, zitare

### Shared Packages

- @manacore/shared-auth
- @manacore/shared-auth-ui
- @manacore/shared-icons (Phosphor)
- @manacore/shared-i18n
- @manacore/shared-tailwind
- @manacore/shared-ui
- @manacore/shared-theme
