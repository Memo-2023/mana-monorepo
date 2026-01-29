# Monorepo Konsistenz-Bericht

> Erstellt: 29. Januar 2026
> Zuletzt aktualisiert: 29. Januar 2026

## Übersicht

Nach eingehender Analyse aller Web-Apps im Monorepo wurden folgende Bereiche auf Inkonsistenzen untersucht:

| Bereich | Konsistenz | Priorität | Status |
|---------|------------|-----------|--------|
| Dependencies & Versionen | ✅ Gut | ~~Hoch~~ | ✅ Erledigt |
| Toast System | ✅ Gut | ~~Hoch~~ | ✅ Erledigt |
| API Client Patterns | ✅ Gut | ~~Hoch~~ | ✅ Erledigt |
| i18n Implementation | ✅ Gut | ~~Mittel~~ | ✅ Erledigt |
| Auth Implementation | ✅ Gut | Niedrig | - |
| Styling & Tailwind | ✅ Sehr gut | Niedrig | - |
| Komponenten & Layouts | ✅ Gut | ~~Mittel~~ | ✅ Erledigt |

### Erledigte Aufgaben (29.01.2026)

1. ✅ **Tailwind auf Vite-Plugin migrieren** - Alle 4 Apps (manadeck, chat, manacore, presi) migriert
2. ✅ **SvelteKit, Svelte, TypeScript Versionen vereinheitlicht** - Alle 15 Web-Apps auf gleicher Version
3. ✅ **Toast System zentralisiert** - `@manacore/shared-ui` Toast für 6 Apps (calendar, chat, clock, contacts, picture, storage)
4. ✅ **lucide-svelte entfernt** - shared-ui nutzt jetzt nur noch `@manacore/shared-icons`
5. ✅ **@manacore/shared-api-client Package erstellt** - 10 Apps migriert (clock, todo, contacts, storage, calendar, picture, nutriphi, planta, questions, skilltree)
6. ✅ **i18n zu 6 Apps hinzugefügt** - todo, skilltree, nutriphi, planta, questions, matrix (jeweils DE + EN)
7. ✅ **AuthGateModal zentralisiert** - `@manacore/shared-auth-ui` für 4 Apps (chat, todo, contacts, calendar)

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

## 2. API Client Patterns ✅

> **Status: Erledigt (29.01.2026)**
> - ✅ `@manacore/shared-api-client` Package erstellt
> - ✅ 10 Apps migriert: clock, todo, contacts, storage, calendar, picture, nutriphi, planta, questions, skilltree
> - ⏭️ Nicht migriert (komplexe Custom-Logik): chat, manadeck, manacore, presi

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

## 3. i18n Implementation ✅

> **Status: Erledigt (29.01.2026)**
> - ✅ 6 Apps mit i18n hinzugefügt: todo, skilltree, nutriphi, planta, questions, matrix
> - ⏭️ Nicht migriert: zitare (unvollständiges Web-App Setup)

### Apps MIT i18n (15)

| App | Sprachen | localStorage Key |
|-----|----------|------------------|
| chat | DE, EN, IT, FR, ES | `chat_locale` |
| picture | DE, EN, IT, FR, ES | `picture_locale` |
| calendar | DE, EN, IT, FR, ES | `calendar_locale` |
| presi | DE, EN, IT, FR, ES | `presi_locale` |
| manadeck | DE, EN, IT, FR, ES | `manadeck_locale` |
| manacore | DE, EN, IT, FR, ES | `manacore_locale` |
| contacts | DE, EN | `contacts_locale` |
| storage | DE, EN | `storage_locale` |
| clock | DE, EN | `clock_locale` |
| todo | DE, EN | `todo_locale` |
| skilltree | DE, EN | `skilltree_locale` |
| nutriphi | DE, EN | `nutriphi_locale` |
| planta | DE, EN | `planta_locale` |
| questions | DE, EN | `questions_locale` |
| matrix | DE, EN | `matrix_locale` |

### Apps OHNE i18n (1)

- zitare (Web-App nicht vollständig eingerichtet)

### Durchgeführte Änderungen

- ✅ Einheitlicher localStorage Key Pattern: `{app}_locale`
- ✅ Mindestens DE + EN für alle neuen Apps
- ✅ Konsistentes `svelte-i18n` Setup mit SSR-Support
- ✅ i18n-Loading State in +layout.svelte integriert

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

#### AuthGateModal ✅

> **Status: Erledigt (29.01.2026)**

- ✅ Zentrales AuthGateModal in `@manacore/shared-auth-ui`
- ✅ Migrierte Apps: chat, todo, contacts, calendar
- Unterstützt: 'save', 'sync', 'feature', 'ai' Actions
- i18n: DE + EN eingebaut
- Optionale Migration-Info für Session-Daten

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
| ~~API Client Package erstellen~~ | ✅ Erledigt (10 Apps migriert) |
| ~~i18n zu 6 Apps hinzufügen~~ | ✅ Erledigt |
| ~~AuthGateModal zentralisieren~~ | ✅ Erledigt (4 Apps migriert) |

### 🔴 Hohe Priorität

_(Keine offenen Aufgaben mit hoher Priorität)_

### 🟡 Mittlere Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| ~~AuthGateModal in Shared Package~~ | ~~Niedrig~~ | ✅ Erledigt |
| Global Error Handler extrahieren | Niedrig | Error UX |

### 🟢 Niedrige Priorität

| Aufgabe | Aufwand | Impact |
|---------|---------|--------|
| App-Skeletons vereinheitlichen | Niedrig | Code-Reduktion |
| Auth Store Pattern dokumentieren | Niedrig | Onboarding |

---

## Nächste Schritte

1. ~~**API Client Package** als nächstes angehen (höchster Impact)~~ ✅ Erledigt
2. ~~**i18n** zu fehlenden Apps hinzufügen~~ ✅ Erledigt (6 Apps)
3. ~~**AuthGateModal** in Shared Package extrahieren~~ ✅ Erledigt (4 Apps)
4. **Global Error Handler** extrahieren
5. Schrittweise weitere Punkte abarbeiten

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
