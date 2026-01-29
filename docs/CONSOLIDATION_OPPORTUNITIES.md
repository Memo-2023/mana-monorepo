# Konsolidierungsmöglichkeiten - Monorepo Analyse

> Erstellt: 29. Januar 2026
> Geschätzte Gesamteinsparung: **~6.500-8.000 LOC**

## Übersicht nach Priorität

| Priorität | Bereich | Geschätzte Einsparung | Aufwand |
|-----------|---------|----------------------|---------|
| ~~**KRITISCH**~~ | ~~Backend Metrics Migration~~ | ~~350 LOC~~ ✅ **709 LOC entfernt** | ~~Niedrig~~ |
| ~~**HOCH**~~ | ~~Skeleton Components~~ | ~~800-1.000 LOC~~ → **20 LOC** | ~~Mittel~~ → Analysiert ✅ |
| ~~**HOCH**~~ | ~~App Settings Stores~~ | ~~600-700 LOC~~ ✅ **323 LOC entfernt** | ~~Mittel~~ |
| ~~**HOCH**~~ | ~~Main.ts/CORS Patterns~~ | ~~1.800 LOC~~ ✅ **~280 LOC entfernt** | ~~Mittel~~ |
| ~~**MITTEL**~~ | ~~TypeScript Configs~~ | ~~400 LOC~~ ✅ **~280 LOC entfernt** | ~~Niedrig~~ |
| ~~**MITTEL**~~ | ~~UI Component Cleanup~~ | ~~400 LOC~~ ✅ **~74 LOC entfernt** | ~~Niedrig~~ |
| ~~**MITTEL**~~ | ~~Vite Configs~~ | ~~300 LOC~~ ✅ **~350 LOC entfernt** | ~~Niedrig~~ |
| ~~**MITTEL**~~ | ~~Navigation Stores~~ | ~~50 LOC~~ ✅ **~50 LOC entfernt** | ~~Niedrig~~ |
| ~~**NIEDRIG**~~ | ~~Drizzle Configs~~ | ~~200 LOC~~ ✅ **~160 LOC entfernt** | ~~Niedrig~~ |
| ~~**NIEDRIG**~~ | ~~Logger Utilities~~ | ~~130 LOC~~ ✅ **~120 LOC entfernt** | ~~Niedrig~~ |

---

## 1. Backend Patterns (NestJS)

### 1.1 ~~KRITISCH: Metrics Migration~~ ✅ ERLEDIGT (709 LOC entfernt)

**Status:** 6 Backends zu `@manacore/shared-nestjs-metrics` migriert (29.01.2026)

**Migrierte Backends:**
- ~~`apps/chat/apps/backend/src/metrics/`~~ ✅
- ~~`apps/calendar/apps/backend/src/metrics/`~~ ✅
- ~~`apps/todo/apps/backend/src/metrics/`~~ ✅
- ~~`apps/contacts/apps/backend/src/metrics/`~~ ✅
- ~~`apps/skilltree/apps/backend/src/metrics/`~~ ✅
- ~~`apps/clock/apps/backend/src/metrics/`~~ ✅

**Hinweis:** planta hatte keine lokale Metrics-Implementation.

```typescript
// Vorher (50 LOC pro Backend)
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;
  // ... 45 weitere Zeilen
}

// Nachher (5 LOC)
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
@Module({ imports: [MetricsModule.forRoot({ prefix: 'chat_' })] })
```

---

### ~~1.2 HOCH: Main.ts/CORS Setup~~ ✅ TEILWEISE ERLEDIGT (~280 LOC gespart)

**Status:** `@manacore/shared-nestjs-setup` Package erstellt und 8 Backends migriert (29.01.2026)

**Migrierte Backends (8 von 14):**
- ✅ chat (3002), calendar (3014), contacts (3015), zitare (3007)
- ✅ clock (3017), planta (3022), presi (3008), nutriphi (3023)

**Nicht migriert (komplexe Anforderungen):**
- ⏭️ manadeck - ConfigService, AppExceptionFilter
- ⏭️ picture - NestExpressApplication, Static Assets
- ⏭️ todo, skilltree - CORS Callback mit Logger
- ⏭️ questions, storage - ConfigService

**Einsparung:** 8 Backends × ~35 LOC = ~280 LOC

**Empfehlung für komplexe Backends:** Erstelle `@manacore/shared-nestjs-setup`

```typescript
// packages/shared-nestjs-setup/src/bootstrap.ts
export interface BootstrapOptions {
  corsOrigins?: string[];
  apiPrefix?: string;
  excludeFromPrefix?: string[];
  enableMetrics?: boolean;
  defaultPort?: number;
}

export async function bootstrapApp(
  AppModule: Type<any>,
  options: BootstrapOptions = {}
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  // CORS (25 LOC -> 1 LOC)
  setupCors(app, options.corsOrigins);

  // Validation (10 LOC -> 0 LOC)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Prefix (5 LOC -> 0 LOC)
  app.setGlobalPrefix(options.apiPrefix || 'api/v1', {
    exclude: options.excludeFromPrefix || ['health', 'metrics'],
  });

  return app;
}
```

**Vorher (85 LOC pro Backend):**
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [...];
  app.enableCors({ origin: corsOrigins, ... });
  app.useGlobalPipes(new ValidationPipe({ ... }));
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  // ...
}
```

**Nachher (15 LOC):**
```typescript
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await bootstrapApp(AppModule, {
    defaultPort: 3002,
    enableMetrics: true,
  });
  await app.listen(process.env.PORT || 3002);
}
bootstrap();
```

---

### ~~1.3 MITTEL: Health Endpoints~~ ✅ ERLEDIGT (~300 LOC gespart)

**Status:** `@manacore/shared-nestjs-health` Package erstellt und 12 Backends migriert (29.01.2026)

**Erstelltes Package:** `packages/shared-nestjs-health/`
- `HealthModule.forRoot({ serviceName, version?, includeUptime?, route? })`
- Dynamischer Controller mit konfigurierbarer Route (default: 'health')
- Einheitliche HealthCheckResponse mit timestamp

**Migrierte Backends (12 von 13):**
- ✅ calendar, chat, clock, contacts, nutriphi, picture, planta, presi, skilltree, storage, todo, zitare
- ⏭️ questions (übersprungen - hat erweiterten DB-Health-Check)

**Besonderheiten:**
- storage: Custom route `api/v1/health`
- zitare: serviceName `quote-backend`

**Vorher (14 LOC pro Backend):**
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'chat' };
  }
}
```

**Nachher (1 LOC):**
```typescript
import { HealthModule } from '@manacore/shared-nestjs-health';
@Module({ imports: [HealthModule.forRoot({ serviceName: 'chat-backend' })] })
```

**Einsparung:** 12 Backends × 26 LOC (Controller + Module) = ~312 LOC gelöscht

---

## 2. Frontend Stores (Svelte 5)

### ~~2.1 HOCH: App Settings Stores~~ ✅ ERLEDIGT (323 LOC gespart)

**Status:** `createAppSettingsStore<T>()` Factory erstellt und 3 Apps migriert (29.01.2026)

**Erstellte Factory:** `packages/shared-stores/src/settings.svelte.ts`
- Type-safe Settings Store mit localStorage Persistenz
- Optional: `onSettingsChange` Callback für Cloud-Sync
- Reduziert Boilerplate von ~100 LOC pro App auf ~20 LOC

**Migrierte Apps:**
- ~~`apps/todo/apps/web/src/lib/stores/settings.svelte.ts`~~ ✅ (259 → 159 LOC = 100 LOC)
- ~~`apps/contacts/apps/web/src/lib/stores/settings.svelte.ts`~~ ✅ (278 → 173 LOC = 105 LOC)
- ~~`apps/calendar/apps/web/src/lib/stores/settings.svelte.ts`~~ ✅ (433 → 315 LOC = 118 LOC)

```typescript
// Nachher (Beispiel Todo)
import { createAppSettingsStore } from '@manacore/shared-stores';
const baseStore = createAppSettingsStore<TodoAppSettings>('todo-settings', DEFAULT_SETTINGS);
export const todoSettings = {
  get settings() { return baseStore.settings; },
  initialize: baseStore.initialize,
  set: baseStore.set,
  // ... convenience getters
};
```

---

### ~~2.2 MITTEL: Navigation Stores~~ ✅ ERLEDIGT (~50 LOC gespart)

**Status:** `createSimpleNavigationStores()` Factory erstellt und 10 Apps migriert (29.01.2026)

**Erstellte Factory:** `packages/shared-stores/src/navigation-simple.ts`
- Erstellt `isSidebarMode`, `isNavCollapsed` writable Stores
- Optional: `isToolbarCollapsed` mit `withToolbar: true`
- Optional: localStorage Persistenz mit `storageKey`

**Migrierte Apps (10 von 10):**
- ✅ Einfach: chat, contacts, manacore, manadeck, matrix, presi, storage
- ✅ Mit Toolbar: calendar, todo
- ✅ Mit Persistenz: clock

**Vorher (5-36 LOC):**
```typescript
import { writable } from 'svelte/store';
export const isSidebarMode = writable(false);
export const isNavCollapsed = writable(false);
// + optional localStorage handling (30+ LOC)
```

**Nachher (3-5 LOC):**
```typescript
import { createSimpleNavigationStores } from '@manacore/shared-stores';
export const { isSidebarMode, isNavCollapsed } = createSimpleNavigationStores({
  storageKey: 'clock', // optional
});
```

**Einsparung:** ~50 LOC (besonders Clock: 36 → 4 LOC)

---

### ~~2.3 NIEDRIG: Theme Stores Migration~~ ✅ ERLEDIGT (~150 LOC gespart)

**Status:** 2 Apps zu `createThemeStore()` aus `@manacore/shared-theme` migriert (29.01.2026)

**Migrierte Apps:**
- ✅ `apps/storage/apps/web/src/lib/stores/theme.svelte.ts` (96 → 7 LOC = 89 LOC)
- ✅ `apps/questions/apps/web/src/lib/stores/theme.ts` (62 → 47 LOC = 15 LOC, mit Rückwärtskompatibilität)

**Zusätzlich gefixt:**
- ✅ `apps/storage/apps/web/src/routes/themes/+page.svelte` - Bug mit `def.colors.primary` → `def.light.primary`

**Questions Wrapper (Rückwärtskompatibilität):**
```typescript
// Legacy API (current, set, toggle) wird auf neue API gemappt
export const theme = {
  get current() { return sharedTheme.mode; },  // Legacy
  get mode() { return sharedTheme.mode; },     // New
  set(newTheme) { sharedTheme.setMode(newTheme); },  // Legacy
  toggle() { sharedTheme.toggleMode(); },      // Legacy
  // ... new API forwarded
};
```

**Einsparung:** ~104 LOC (158 → 54 LOC)

---

## 3. UI Components

### ~~3.1 HOCH: Skeleton Components~~ ✅ ANALYSIERT (Minimal ~20 LOC gespart)

**Status:** Nach detaillierter Analyse: Die meisten Skeletons sind legitime Domain-Customizations (29.01.2026)

**Ergebnis der Analyse:**
- 29 Skeleton-Dateien über 5 Apps (calendar, clock, contacts, todo, questions)
- **Fazit:** Skeletons nutzen bereits shared-ui Primitives (`SkeletonBox`) korrekt
- Domain-spezifische Layouts (Kalender-Grid, Uhr-Circle) gehören NICHT in shared-ui

**Durchgeführte Konsolidierung:**
- ✅ `calculateFadeOpacity()` Utility nach `@manacore/shared-ui` verschoben
- ✅ Contacts App nutzt jetzt die shared-ui Utility
- ✅ Lokale `utils.ts` in contacts gelöscht (~20 LOC gespart)

**Warum KEINE weitere Konsolidierung:**
| Skeleton | LOC | Status |
|----------|-----|--------|
| Calendar AppLoadingSkeleton | 56 | Keep - 7-Spalten Kalender-Grid Layout |
| Clock AppLoadingSkeleton | 91 | Keep - 300px kreisförmiger Uhr-Platzhalter |
| ContactRowSkeleton, TaskItemSkeleton, etc. | ~800 | Keep - Legitime Domain-spezifische Komponenten |

**Shared-UI hat bereits:**
- `SkeletonBox`, `SkeletonAvatar`, `SkeletonCard`, `SkeletonGrid`, `SkeletonList`, `SkeletonRow`, `SkeletonText`
- `AppLoadingSkeleton` mit 5 Layout-Presets (list, centered, sidebar, tasks, minimal)
- `calculateFadeOpacity()` Utility für Fade-Effekte

---

### ~~3.2 MITTEL: Sofort löschbare Duplikate~~ ✅ TEILWEISE ERLEDIGT

**Picture App - Status (29.01.2026):**

| Datei | LOC | Status |
|-------|-----|--------|
| ~~`Button.svelte`~~ | ~~53~~ | ✅ Migriert zu `@manacore/shared-ui` |
| ~~`Card.svelte`~~ | ~~21~~ | ✅ Gelöscht (unbenutzt) |
| ~~`Input.svelte`~~ | ~~70~~ | ✅ Bereits vorher gelöscht |

**Verbleibendes:**
- `Modal.svelte` könnte migriert werden, aber hat unterschiedliche API (`open` vs `visible`)

---

### ~~3.3 MITTEL: AppSlider Cleanup~~ ✅ ANALYSIERT (Keine Aktion nötig)

**Status:** Nach Analyse: Die lokalen AppSlider.svelte Dateien sind KEINE Duplikate (29.01.2026)

**Ergebnis der Analyse:**
Die 8 lokalen `AppSlider.svelte` Dateien sind **Lokalisierungs-Wrapper**, nicht Duplikate:
- Sie importieren `AppSlider` aus `@manacore/shared-ui`
- Sie mappen `MANA_APPS` aus `@manacore/shared-branding` zu deutschen Labels
- Sie übergeben deutsche Lokalisierung (`APP_STATUS_LABELS.de`, `APP_SLIDER_LABELS.de`) an die shared Komponente

**Beispiel (apps/chat/apps/web):**
```svelte
<script lang="ts">
  import { AppSlider } from '@manacore/shared-ui';
  import { MANA_APPS, APP_STATUS_LABELS, APP_SLIDER_LABELS } from '@manacore/shared-branding';

  const apps = MANA_APPS.map((app) => ({
    name: app.name,
    description: app.description.de,  // German localization
    longDescription: app.longDescription.de,
    // ...
  }));

  const statusLabels = APP_STATUS_LABELS.de;
  const labels = APP_SLIDER_LABELS.de;
</script>

<AppSlider {apps} title={labels.title} {statusLabels} ... />
```

**Fazit:** Korrekte Architektur - shared-ui stellt die Komponente bereit, Apps liefern lokalisierte Daten.

---

### ~~3.4 NIEDRIG: LanguageSelector~~ ✅ ANALYSIERT (Korrekte Architektur)

**Status:** Die lokalen LanguageSelector sind korrekte Wrapper, keine Duplikate (29.01.2026)

**Ergebnis der Analyse:**
- 9 Apps haben lokale `LanguageSelector.svelte` (~19 LOC jede)
- Diese sind **Wrapper** die app-spezifisches i18n mit shared Helpers verbinden

**Architektur ist korrekt:**
```svelte
<script lang="ts">
  import { PillDropdown } from '@manacore/shared-ui';          // Shared UI
  import { getLanguageDropdownItems } from '@manacore/shared-i18n';  // Shared Helper
  import { setLocale, supportedLocales } from '$lib/i18n';     // App-spezifisch

  // ... connect the pieces
</script>

<PillDropdown items={languageItems} label={currentLabel} />
```

**Shared-i18n hat bereits:**
- `LanguageSelector.svelte` (242 LOC) - Standalone Komponente für andere Anwendungsfälle
- `getLanguageDropdownItems()` - Helper für PillDropdown-Items
- `getCurrentLanguageLabel()` - Helper für aktuelle Sprache

**Fazit:** Keine Konsolidierung nötig - jede App braucht ihren eigenen Wrapper für app-spezifisches i18n Setup.

---

## 4. Konfigurationsdateien

### ~~4.1 MITTEL: TypeScript Configs~~ ✅ ERLEDIGT (~280 LOC gespart)

**Status:** `@manacore/shared-tsconfig` Package erstellt und 13 Backends migriert (29.01.2026)

**Erstelltes Package:** `packages/shared-tsconfig/`
- `base.json` - Gemeinsame Basis-Optionen
- `nestjs.json` - NestJS Backend Config (erweitert base)
- `sveltekit.json` - SvelteKit Web Config
- `expo.json` - Expo Mobile Config
- `astro.json` - Astro Landing Config

**Migrierte Backends (13 von 14):**
- ✅ calendar, chat, clock, contacts, nutriphi, picture, planta, presi, questions, skilltree, storage, todo, zitare
- ⏭️ manadeck (übersprungen - verwendet `nodenext` statt `commonjs`)

**Vorher (25 LOC pro Backend):**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    // ... 20+ weitere Zeilen
  }
}
```

**Nachher (3 LOC):**
```json
{
  "extends": "@manacore/shared-tsconfig/nestjs"
}
```

**Einsparung:** 13 Backends × ~22 LOC = ~280 LOC

---

### ~~4.2 MITTEL: Vite Configs~~ ✅ ERLEDIGT (~350 LOC gespart)

**Status:** `@manacore/shared-vite-config` erweitert und 15 SvelteKit Apps migriert (29.01.2026)

**Erweitertes Package:** `packages/shared-vite-config/`
- `createViteConfig()` - Factory mit Port und additionalPackages
- `mergeViteConfig()` - Deep-merge für App-spezifische Overrides
- `MANACORE_SHARED_PACKAGES` - 22+ Pakete für SSR/optimizeDeps

**Migrierte Apps (15 von 15):**
- ✅ calendar, chat, clock, contacts, manadeck, manacore, matrix, nutriphi, picture, planta, presi, questions, skilltree, storage, todo

**Vorher (30-60 LOC pro App):**
```typescript
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: { port: 5174, strictPort: true },
  ssr: { noExternal: ['@manacore/shared-icons', ...] },
  optimizeDeps: { exclude: ['@manacore/shared-icons', ...] },
});
```

**Nachher (12-14 LOC):**
```typescript
import { createViteConfig, mergeViteConfig } from '@manacore/shared-vite-config';

const baseConfig = createViteConfig({
  port: 5174,
  additionalPackages: ['@app/shared'], // optional
});

export default defineConfig(mergeViteConfig(baseConfig, {
  plugins: [tailwindcss(), sveltekit()],
}));
```

**Hinweis:** Matrix behält spezielle WASM-Konfiguration für matrix-js-sdk crypto.

**Einsparung:** 15 Apps × ~23 LOC = ~350 LOC

---

### ~~4.3 NIEDRIG: Drizzle Configs~~ ✅ ERLEDIGT (~160 LOC gespart)

**Status:** `@manacore/shared-drizzle-config` Package erstellt und 16 Configs migriert (29.01.2026)

**Erstelltes Package:** `packages/shared-drizzle-config/`
- `createDrizzleConfig()` - Factory mit dbName, schemaPath, outDir, schemaFilter, etc.
- Standardwerte: schema `./src/db/schema/index.ts`, out `./src/db/migrations`
- Fallback URL: `postgresql://manacore:devpassword@localhost:5432/{dbName}`

**Migrierte Configs (16 von 20):**
- ✅ Backends: calendar, chat, clock, contacts, nutriphi, picture, planta, presi, questions, skilltree, storage, todo
- ✅ Services: mana-core-auth, telegram-zitare-bot, telegram-todo-bot, telegram-nutriphi-bot

**Nicht migriert (Sonderfälle):**
- ⏭️ telegram-project-doc-bot (postgres:postgres Credentials)
- ⏭️ matrix-project-doc-bot (leere Fallback-URL)
- ⏭️ manadeck-database, nutriphi-database (Packages mit kompiliertem JS-Pfad)

**Vorher (10-15 LOC):**
```typescript
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL || '...' },
  verbose: true,
  strict: true,
});
```

**Nachher (1-5 LOC):**
```typescript
import { createDrizzleConfig } from '@manacore/shared-drizzle-config';
export default createDrizzleConfig({ dbName: 'chat' });
```

**Einsparung:** 16 Configs × ~10 LOC = ~160 LOC

---

## 5. Utility Functions

### ~~5.1 NIEDRIG: Logger Utilities~~ ✅ ERLEDIGT (~120 LOC gespart)

**Status:** `@manacore/shared-logger` Package erstellt und 2 Mobile Apps migriert (29.01.2026)

**Erstelltes Package:** `packages/shared-logger/`
- `logger.debug/info/warn/error/success/log` - Standard Logger
- `perfLogger.start/end` - Performance-Messung
- `networkLogger.request/response/error` - Netzwerk-Debugging
- Individuelle Exports für Rückwärtskompatibilität: `debug`, `info`, `warn`, `error`, `log`

**Migrierte Apps:**
- ✅ `apps/manadeck/apps/mobile/utils/logger.ts` (34 → 5 LOC)
- ✅ `apps/picture/apps/mobile/utils/logger.ts` (92 → 5 LOC)

**Einsparung:** ~120 LOC (126 → 10 LOC, Shared Package: 100 LOC reusable)

---

### ~~5.2 NIEDRIG: Sleep Function Duplikat~~ ✅ BEREITS ERLEDIGT

**Status:** `shared-api-client` importiert bereits `sleep` aus `@manacore/shared-utils` (29.01.2026)

```typescript
// packages/shared-api-client/src/client.ts
import { sleep } from '@manacore/shared-utils';
```

**Fazit:** Kein Duplikat vorhanden - Dokumentation war veraltet.

---

## Aktionsplan

### Phase 1: Quick Wins (1-2 Tage, ~1.000 LOC)

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~Metrics zu shared-nestjs-metrics migrieren (6 Backends)~~ | ~~350~~ → **709** | ~~Niedrig~~ | ✅ Erledigt |
| ~~Picture Input.svelte löschen (unbenutzt)~~ | ~~70~~ | ~~Niedrig~~ | ✅ Erledigt |
| ~~Sleep-Duplikat entfernen~~ | ~~8~~ | ~~Minimal~~ | ✅ Erledigt |
| ~~Picture UI-Komponenten (Button/Card)~~ | ~~74~~ → **74** | ~~Niedrig~~ | ✅ Erledigt |
| AppSlider Wrapper evaluieren (8 Apps) | - | Niedrig | Nicht nötig (sind Lokalisierungs-Wrapper) |

### Phase 2: Stores & Configs (3-5 Tage, ~1.500 LOC)

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~`createAppSettingsStore()` Factory erstellen~~ | ~~600~~ → **323** | ~~Mittel~~ | ✅ Erledigt |
| ~~`@manacore/shared-tsconfig` Package erstellen~~ | ~~400~~ → **280** | ~~Niedrig~~ | ✅ Erledigt |
| ~~`@manacore/shared-vite-config` erweitern (15 Apps)~~ | ~~300~~ → **350** | ~~Niedrig~~ | ✅ Erledigt |
| ~~Navigation Store Factory erstellen~~ | ~~50~~ → **50** | ~~Niedrig~~ | ✅ Erledigt |

### Phase 3: Backend Setup (5-7 Tage, ~2.000 LOC)

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~`@manacore/shared-nestjs-setup` erstellen~~ | ~~1.800~~ → **280** | ~~Mittel~~ | ✅ 8 Backends migriert |
| ~~`@manacore/shared-nestjs-health` erstellen~~ | ~~170~~ → **312** | ~~Niedrig~~ | ✅ 12 Backends migriert |
| ~~Drizzle Config Factory erstellen~~ | ~~200~~ → **160** | ~~Niedrig~~ | ✅ Erledigt |

### ~~Phase 4: Skeleton Refactoring~~ ✅ ANALYSIERT

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~Page-Level Skeleton Presets~~ | ~~400~~ → **0** | ~~Mittel~~ | Nicht nötig - Shared-UI hat bereits 5 Presets |
| ~~Bestehende Skeletons refactoren~~ | ~~400~~ → **20** | ~~Mittel~~ | ✅ Nur `calculateFadeOpacity` Utility |

**Ergebnis:** Domain-spezifische Skeletons sind korrekt designed. Keine große Konsolidierung nötig.

---

## Zusammenfassung

| Kategorie | Geschätzte Einsparung |
|-----------|----------------------|
| Backend (NestJS) | 2.300 LOC |
| Frontend Stores | 700 LOC |
| UI Components | 1.200 LOC |
| Konfigurationen | 900 LOC |
| Utilities | 130 LOC |
| **Gesamt** | **~5.200-6.500 LOC** |

Plus Wartungsvorteile:
- Einheitliche Patterns über alle Apps
- Single Point of Change für Updates
- Bessere Onboarding-Erfahrung für neue Entwickler
- Reduzierte Fehlerquellen durch Duplikate
