# Konsolidierungsmöglichkeiten - Monorepo Analyse

> Erstellt: 29. Januar 2026
> Geschätzte Gesamteinsparung: **~6.500-8.000 LOC**

## Übersicht nach Priorität

| Priorität | Bereich | Geschätzte Einsparung | Aufwand |
|-----------|---------|----------------------|---------|
| ~~**KRITISCH**~~ | ~~Backend Metrics Migration~~ | ~~350 LOC~~ ✅ **709 LOC entfernt** | ~~Niedrig~~ |
| **HOCH** | Skeleton Components | 800-1.000 LOC | Mittel |
| ~~**HOCH**~~ | ~~App Settings Stores~~ | ~~600-700 LOC~~ ✅ **323 LOC entfernt** | ~~Mittel~~ |
| **HOCH** | Main.ts/CORS Patterns | 1.800 LOC | Mittel |
| ~~**MITTEL**~~ | ~~TypeScript Configs~~ | ~~400 LOC~~ ✅ **~280 LOC entfernt** | ~~Niedrig~~ |
| **MITTEL** | UI Component Cleanup | 400 LOC | Niedrig |
| ~~**MITTEL**~~ | ~~Vite Configs~~ | ~~300 LOC~~ ✅ **~350 LOC entfernt** | ~~Niedrig~~ |
| **MITTEL** | Navigation Stores | 50 LOC | Niedrig |
| ~~**NIEDRIG**~~ | ~~Drizzle Configs~~ | ~~200 LOC~~ ✅ **~160 LOC entfernt** | ~~Niedrig~~ |
| **NIEDRIG** | Logger Utilities | 130 LOC | Niedrig |

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

### 1.2 HOCH: Main.ts/CORS Setup (1.800 LOC)

**Problem:** 14 Backends haben fast identische `main.ts` mit CORS, ValidationPipe, GlobalPrefix.

**Empfehlung:** Erstelle `@manacore/shared-nestjs-setup`

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

### 1.3 MITTEL: Health Endpoints (170 LOC)

**Problem:** 13 Backends haben identische Health-Controller.

**Empfehlung:** Erstelle `@manacore/shared-nestjs-health`

```typescript
// Vorher (14 LOC pro Backend)
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'chat' };
  }
}

// Nachher (1 LOC)
import { HealthModule } from '@manacore/shared-nestjs-health';
@Module({ imports: [HealthModule.forRoot('chat-backend')] })
```

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

### 2.2 MITTEL: Navigation Stores (50 LOC)

**Problem:** 9 Apps haben fast identische Navigation-Stores.

**Pattern (5-6 LOC pro App):**
```typescript
import { writable } from 'svelte/store';
export const isSidebarMode = writable(false);
export const isNavCollapsed = writable(false);
```

**Ausnahme:** Clock (36 LOC) mit localStorage Persistenz + Media Query Listeners

**Empfehlung:** Factory in `@manacore/shared-stores`

```typescript
export function createNavigationStore(options?: {
  persist?: boolean;
  mediaQueryCollapse?: string;
}) {
  // ...
}
```

---

### 2.3 NIEDRIG: Theme Stores Migration

**Problem:** 2 Apps nutzen nicht `@manacore/shared-theme`:
- `apps/storage/apps/web/src/lib/stores/theme.svelte.ts` (96 LOC - custom)
- `apps/questions/apps/web/src/lib/stores/theme.ts` (custom)

**Aktion:** Migriere zu `createThemeStore()` aus `@manacore/shared-theme`

---

## 3. UI Components

### 3.1 HOCH: Skeleton Components (800-1.000 LOC)

**Problem:** 31 Skeleton-Komponenten über Apps verteilt, obwohl shared-ui Primitives hat.

**Betroffene Apps:**
- `apps/contacts/` - 11 Skeletons (925 LOC)
- `apps/calendar/` - 5 Skeletons (338 LOC)
- `apps/todo/` - 5 Skeletons

**Shared-UI hat bereits:**
- `SkeletonBox`, `SkeletonAvatar`, `SkeletonCard`, `SkeletonGrid`, `SkeletonList`, `SkeletonRow`, `SkeletonText`

**Empfehlung:**
1. Dokumentation für Skeleton-Komposition aus Primitives
2. Page-Level Presets erstellen: `ListPageSkeleton`, `DetailPageSkeleton`, `GridPageSkeleton`

---

### 3.2 MITTEL: Sofort löschbare Duplikate (144 LOC)

**Picture App hat lokale Kopien von shared-ui Komponenten:**

| Datei | LOC | shared-ui Alternative |
|-------|-----|----------------------|
| `apps/picture/apps/web/src/lib/components/ui/Button.svelte` | 53 | `@manacore/shared-ui/Button` |
| `apps/picture/apps/web/src/lib/components/ui/Input.svelte` | 70 | `@manacore/shared-ui/Input` |
| `apps/picture/apps/web/src/lib/components/ui/Card.svelte` | 21 | `@manacore/shared-ui/Card` |

**Aktion:** Lösche lokale Dateien, importiere aus shared-ui.

---

### 3.3 MITTEL: AppSlider Cleanup (240 LOC)

**Problem:** 8 Apps haben lokale `AppSlider.svelte` Kopien, obwohl shared-ui Version existiert.

**Betroffene Apps:** calendar, chat, contacts, manadeck, manacore, picture, presi, todo

**Aktion:** Verifiziere Import aus `@manacore/shared-ui`, lösche lokale Kopien.

---

### 3.4 NIEDRIG: LanguageSelector (75 LOC)

**Problem:** 5+ Apps haben identische LanguageSelector Implementierungen.

**Empfehlung:** Verschiebe nach `@manacore/shared-ui/navigation/LanguageSelector.svelte`

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

### 5.1 NIEDRIG: Logger Utilities (130 LOC)

**Problem:** 2 Mobile Apps haben eigene Logger:
- `apps/manadeck/apps/mobile/utils/logger.ts` (34 LOC)
- `apps/picture/apps/mobile/utils/logger.ts` (92 LOC - erweitert)

**Empfehlung:** Erstelle `@manacore/shared-logger` mit:
- `logger.debug/info/warn/error/success`
- `perfLogger.start/end`
- `networkLogger.request/response/error`

---

### 5.2 NIEDRIG: Sleep Function Duplikat

**Problem:** `sleep()` existiert in:
- `packages/shared-utils/src/async.ts` (8 LOC)
- `packages/shared-api-client/src/utils.ts` (3 LOC)

**Aktion:** Entferne aus shared-api-client, importiere aus shared-utils.

---

## Aktionsplan

### Phase 1: Quick Wins (1-2 Tage, ~1.000 LOC)

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~Metrics zu shared-nestjs-metrics migrieren (6 Backends)~~ | ~~350~~ → **709** | ~~Niedrig~~ | ✅ Erledigt |
| ~~Picture Input.svelte löschen (unbenutzt)~~ | ~~70~~ | ~~Niedrig~~ | ✅ Erledigt |
| ~~Sleep-Duplikat entfernen~~ | ~~8~~ | ~~Minimal~~ | ✅ Erledigt |
| Picture UI-Komponenten (Button/Card) | 74 | Niedrig | Offen |
| AppSlider Wrapper evaluieren (8 Apps) | - | Niedrig | Nicht nötig (sind Lokalisierungs-Wrapper) |

### Phase 2: Stores & Configs (3-5 Tage, ~1.500 LOC)

| Aufgabe | LOC | Aufwand | Status |
|---------|-----|---------|--------|
| ~~`createAppSettingsStore()` Factory erstellen~~ | ~~600~~ → **323** | ~~Mittel~~ | ✅ Erledigt |
| ~~`@manacore/shared-tsconfig` Package erstellen~~ | ~~400~~ → **280** | ~~Niedrig~~ | ✅ Erledigt |
| ~~`@manacore/shared-vite-config` erweitern (15 Apps)~~ | ~~300~~ → **350** | ~~Niedrig~~ | ✅ Erledigt |
| Navigation Store Factory erstellen | 50 | Niedrig | Offen |

### Phase 3: Backend Setup (5-7 Tage, ~2.000 LOC)

| Aufgabe | LOC | Aufwand |
|---------|-----|---------|
| `@manacore/shared-nestjs-setup` erstellen | 1.800 | Mittel | Offen |
| `@manacore/shared-nestjs-health` erstellen | 170 | Niedrig | Offen |
| ~~Drizzle Config Factory erstellen~~ | ~~200~~ → **160** | ~~Niedrig~~ | ✅ Erledigt |

### Phase 4: Skeleton Refactoring (Optional, ~800 LOC)

| Aufgabe | LOC | Aufwand |
|---------|-----|---------|
| Page-Level Skeleton Presets erstellen | 400 | Mittel |
| Bestehende Skeletons refactoren | 400 | Mittel |

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
