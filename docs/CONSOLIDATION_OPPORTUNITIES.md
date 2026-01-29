# Konsolidierungsmöglichkeiten - Monorepo Analyse

> Erstellt: 29. Januar 2026
> Geschätzte Gesamteinsparung: **~6.500-8.000 LOC**

## Übersicht nach Priorität

| Priorität | Bereich | Geschätzte Einsparung | Aufwand |
|-----------|---------|----------------------|---------|
| **KRITISCH** | Backend Metrics Migration | 350 LOC | Niedrig |
| **HOCH** | Skeleton Components | 800-1.000 LOC | Mittel |
| **HOCH** | App Settings Stores | 600-700 LOC | Mittel |
| **HOCH** | Main.ts/CORS Patterns | 1.800 LOC | Mittel |
| **MITTEL** | TypeScript Configs | 400 LOC | Niedrig |
| **MITTEL** | UI Component Cleanup | 400 LOC | Niedrig |
| **MITTEL** | Vite Configs | 300 LOC | Niedrig |
| **MITTEL** | Navigation Stores | 50 LOC | Niedrig |
| **NIEDRIG** | Drizzle Configs | 200 LOC | Niedrig |
| **NIEDRIG** | Logger Utilities | 130 LOC | Niedrig |

---

## 1. Backend Patterns (NestJS)

### 1.1 KRITISCH: Metrics Migration (350 LOC)

**Problem:** 7 Backends haben lokale `MetricsService` Implementierungen, obwohl `@manacore/shared-nestjs-metrics` existiert.

**Betroffene Backends:**
- `apps/chat/apps/backend/src/metrics/` (50 LOC)
- `apps/calendar/apps/backend/src/metrics/` (50 LOC)
- `apps/todo/apps/backend/src/metrics/` (68 LOC)
- `apps/contacts/apps/backend/src/metrics/` (50 LOC)
- `apps/skilltree/apps/backend/src/metrics/` (50 LOC)
- `apps/clock/apps/backend/src/metrics/` (50 LOC)
- `apps/planta/apps/backend/src/metrics/` (50 LOC)

**Aktion:** Migriere zu `@manacore/shared-nestjs-metrics` (bereits vorhanden!)

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

### 2.1 HOCH: App Settings Stores (600-700 LOC)

**Problem:** 3 Apps (todo, calendar, contacts) haben fast identische Settings-Store Implementierungen mit localStorage Persistenz.

**Betroffene Dateien:**
- `apps/todo/apps/web/src/lib/stores/settings.svelte.ts` (259 LOC)
- `apps/calendar/apps/web/src/lib/stores/settings.svelte.ts` (433 LOC)
- `apps/contacts/apps/web/src/lib/stores/settings.svelte.ts` (278 LOC)

**Dupliziertes Pattern (100% identisch):**
```typescript
// Boilerplate in jedem (80-100 LOC):
- TypeScript Interface für Settings
- DEFAULT_SETTINGS Konstante
- STORAGE_KEY
- loadSettings() - localStorage laden + merge mit defaults
- saveSettings() - localStorage speichern
- let settings = $state(...)
- toggleImmersiveMode(), initialize(), set(), update(), reset(), getDefaults()
```

**Empfehlung:** Erstelle `createAppSettingsStore<T>()` Factory in `@manacore/shared-stores`

```typescript
// packages/shared-stores/src/createAppSettingsStore.ts
export function createAppSettingsStore<T extends Record<string, any>>(
  storageKey: string,
  defaultSettings: T,
  options?: { cloudSync?: boolean }
) {
  let settings = $state<T>(defaultSettings);

  function loadSettings(): T { /* localStorage logic */ }
  function saveSettings(newSettings: T): void { /* localStorage logic */ }

  return {
    get value() { return settings; },
    initialize() { settings = loadSettings(); },
    set<K extends keyof T>(key: K, value: T[K]) { /* ... */ },
    update(updates: Partial<T>) { /* ... */ },
    reset() { settings = defaultSettings; saveSettings(settings); },
    getDefaults() { return defaultSettings; },
  };
}
```

**Einsparung:** ~200 LOC Boilerplate pro App = 600 LOC

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

### 4.1 MITTEL: TypeScript Configs (400 LOC)

**Problem:** Identische tsconfig.json in:
- 12+ NestJS Backends (95% identisch)
- 15+ SvelteKit Web Apps (99% identisch)
- 6 Expo Mobile Apps (99% identisch)
- 6+ Astro Landing Pages (95% identisch)

**Empfehlung:** Erstelle `@manacore/shared-tsconfig`

```
packages/shared-tsconfig/
├── nestjs.json
├── sveltekit.json
├── expo.json
├── astro.json
└── base.json
```

**Vorher (30 LOC pro App):**
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    // ... 25 weitere Zeilen
  }
}
```

**Nachher (3 LOC):**
```json
{
  "extends": "@manacore/shared-tsconfig/nestjs"
}
```

---

### 4.2 MITTEL: Vite Configs (300 LOC)

**Problem:** 15 SvelteKit Apps haben 70% identische vite.config.ts.

**Empfehlung:** Factory-Funktion in `@manacore/shared-vite-config`

```typescript
// packages/shared-vite-config/src/sveltekit.ts
export function createSvelteKitConfig(options: {
  port: number;
  packages?: string[];
}) {
  return defineConfig({
    plugins: [sveltekit(), tailwindcss()],
    server: { port: options.port, strictPort: true },
    ssr: { noExternal: options.packages || [] },
    optimizeDeps: { exclude: options.packages || [] },
  });
}
```

---

### 4.3 NIEDRIG: Drizzle Configs (200 LOC)

**Problem:** 12 Backends haben 90% identische drizzle.config.ts.

**Empfehlung:** Factory-Funktion

```typescript
// Vorher (17 LOC pro Backend)
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL || '...' },
});

// Nachher (5 LOC)
import { createDrizzleConfig } from '@manacore/shared-drizzle-config';
export default createDrizzleConfig('chat');
```

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

| Aufgabe | LOC | Aufwand |
|---------|-----|---------|
| Metrics zu shared-nestjs-metrics migrieren (7 Backends) | 350 | Niedrig |
| Picture UI-Komponenten löschen (Button/Input/Card) | 144 | Niedrig |
| AppSlider lokale Kopien entfernen (8 Apps) | 240 | Niedrig |
| Sleep-Duplikat entfernen | 3 | Minimal |

### Phase 2: Stores & Configs (3-5 Tage, ~1.500 LOC)

| Aufgabe | LOC | Aufwand |
|---------|-----|---------|
| `createAppSettingsStore()` Factory erstellen | 600 | Mittel |
| `@manacore/shared-tsconfig` Package erstellen | 400 | Niedrig |
| `@manacore/shared-vite-config` Factory erstellen | 300 | Niedrig |
| Navigation Store Factory erstellen | 50 | Niedrig |

### Phase 3: Backend Setup (5-7 Tage, ~2.000 LOC)

| Aufgabe | LOC | Aufwand |
|---------|-----|---------|
| `@manacore/shared-nestjs-setup` erstellen | 1.800 | Mittel |
| `@manacore/shared-nestjs-health` erstellen | 170 | Niedrig |
| Drizzle Config Factory erstellen | 200 | Niedrig |

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
