# Monorepo Konsistenz-Bericht

> Erstellt: 29. Januar 2026
> Zuletzt aktualisiert: 29. Januar 2026

## Übersicht

Nach eingehender Analyse aller Web-Apps im Monorepo wurden folgende Bereiche auf Inkonsistenzen untersucht:

| Bereich | Konsistenz | Priorität | Status |
|---------|------------|-----------|--------|
| Dependencies & Versionen | ✅ Gut | ~~Hoch~~ | ✅ Erledigt |
| Toast System | ✅ Gut | ~~Hoch~~ | ✅ Erledigt |
| API Client Patterns | ⚠️ Mittel | **Hoch** | 🚧 In Arbeit |
| i18n Implementation | ⚠️ Mittel | Mittel | Offen |
| Auth Implementation | ✅ Gut | Niedrig | - |
| Styling & Tailwind | ✅ Sehr gut | Niedrig | - |
| Komponenten & Layouts | ⚠️ Mittel | Mittel | Offen |

### Erledigte Aufgaben (29.01.2026)

1. ✅ **Tailwind auf Vite-Plugin migrieren** - Alle 4 Apps (manadeck, chat, manacore, presi) migriert
2. ✅ **SvelteKit, Svelte, TypeScript Versionen vereinheitlicht** - Alle 15 Web-Apps auf gleicher Version
3. ✅ **Toast System zentralisiert** - `@manacore/shared-ui` Toast für 6 Apps (calendar, chat, clock, contacts, picture, storage)
4. ✅ **lucide-svelte entfernt** - shared-ui nutzt jetzt nur noch `@manacore/shared-icons`
5. 🚧 **@manacore/shared-api-client Package erstellt** - Clock App als erstes migriert

---

## 1. Dependencies & Versionen ✅

> **Status: Erledigt (29.01.2026)**

### Durchgeführte Änderungen

#### Tailwind CSS
- ✅ Alle Apps nutzen jetzt `@tailwindcss/vite` (manadeck, chat, manacore, presi migriert)
- PostCSS-Konfigurationen entfernt

#### Dependency Versionen standardisiert
- ✅ `@sveltejs/kit`: `^2.47.1` (alle 15 Web-Apps)
- ✅ `svelte`: `^5.41.0` (alle 15 Web-Apps)
- ✅ `svelte-check`: `^4.3.3` (alle 15 Web-Apps)
- ✅ `typescript`: `^5.9.3` (alle 15 Web-Apps)

#### Verbleibende Unterschiede (akzeptabel)
- Vite v6.x vs v7.x - Kann bei nächstem Major-Update vereinheitlicht werden

---

## 2. API Client Patterns 🚧

> **Status: In Arbeit (29.01.2026)**
> - ✅ `@manacore/shared-api-client` Package erstellt
> - ✅ Clock App migriert (Proof of Concept)
> - ⏳ Verbleibende Apps: calendar, chat, contacts, manadeck, manacore, nutriphi, picture, planta, presi, questions, skilltree, storage, todo

### Kritische Inkonsistenzen (vor Migration)

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

#### Toast System ✅

> **Status: Erledigt (29.01.2026)**

- ✅ Zentrales Toast-System in `@manacore/shared-ui`
- ✅ Migrierte Apps: calendar, chat, clock, contacts, picture, storage
- API: `toastStore.success()`, `.error()`, `.warning()`, `.info()`
- `ToastContainer` Komponente mit Phosphor Icons

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

### ✅ Erledigt

| Aufgabe | Status |
|---------|--------|
| ~~Tailwind auf Vite-Plugin migrieren (4 Apps)~~ | ✅ Erledigt |
| ~~Toast System vereinheitlichen~~ | ✅ Erledigt |
| ~~Dependencies aktualisieren~~ | ✅ Erledigt |
| ~~lucide-svelte aus shared-ui entfernen~~ | ✅ Erledigt |

### 🔴 Hohe Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| API Client Package erstellen | Hoch | Alle Apps |

### 🟡 Mittlere Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| i18n zu 7 Apps hinzufügen | Mittel | Internationalisierung |
| AuthGateModal in Shared Package | Niedrig | Code-Reduktion |
| Global Error Handler extrahieren | Niedrig | Error UX |

### 🟢 Niedrige Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| App-Skeletons vereinheitlichen | Niedrig | Code-Reduktion |
| Auth Store Pattern dokumentieren | Niedrig | Onboarding |

---

## Nächste Schritte

1. **API Client Package** als nächstes angehen (höchster Impact)
2. **i18n** zu fehlenden 7 Apps hinzufügen
3. **AuthGateModal** in Shared Package extrahieren
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
