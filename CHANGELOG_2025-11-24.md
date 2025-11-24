# Changelog - Shared Packages Integration (2025-11-24)

## Übersicht

Dieses Update führt eine umfassende **Shared Packages Architektur** ein, die gemeinsamen Code über alle vier Web-Apps im Monorepo vereinheitlicht. Die Änderungen reduzieren duplizierter Code erheblich (ca. 3.000 LOC gelöscht), verbessern die Wartbarkeit und sorgen für konsistentes Verhalten und Design.

---

## Neue Shared Packages

### 1. `@manacore/shared-auth` (Neu)
**Pfad**: `packages/shared-auth/`

Einheitliche Authentifizierungslogik für alle Web-Apps:

- **Core Services**:
  - `authService.ts` - Login, Logout, Register, Passwort-Reset
  - `tokenManager.ts` - JWT Token Storage, Refresh, Validierung
  - `jwtUtils.ts` - Token-Dekodierung, Ablaufprüfung, B2B-Erkennung

- **Adapter-Pattern für Plattformunabhängigkeit**:
  - `storage` - LocalStorage/Memory-Adapter
  - `device` - Geräte-Info für Token-Binding
  - `network` - Netzwerk-Status-Erkennung

- **Interceptor**:
  - `fetchInterceptor.ts` - Automatische Token-Injection in API-Calls

- **API**:
  ```typescript
  import { initializeWebAuth } from '@manacore/shared-auth';

  const { authService, tokenManager } = initializeWebAuth({
    baseUrl: 'https://api.example.com',
  });
  ```

### 2. `@manacore/shared-auth-ui` (Neu)
**Pfad**: `packages/shared-auth-ui/`

Wiederverwendbare Auth-UI-Komponenten:

- **Pages**:
  - `LoginPage.svelte` - Vollständige Login-Seite mit OAuth
  - `RegisterPage.svelte` - Vollständige Registrierungs-Seite
  - `ResetPasswordPage.svelte` - Passwort-Reset-Flow

- **Components**:
  - `GoogleSignInButton.svelte` - Google OAuth Button
  - `AppleSignInButton.svelte` - Apple OAuth Button
  - `PasswordInput.svelte` - Passwort-Input mit Validierung

- **Icons**:
  - Google/Apple Logos als Svelte-Komponenten

- **Konfiguration**:
  ```typescript
  import { setGoogleClientId, setAppleConfig } from '@manacore/shared-auth-ui';

  setGoogleClientId('your-client-id');
  setAppleConfig({ clientId: '...', redirectUri: '...' });
  ```

### 3. `@manacore/shared-tailwind` (Neu)
**Pfad**: `packages/shared-tailwind/`

Einheitliche Tailwind-Konfiguration mit 4 Theme-Varianten:

- **Themes**:
  - `lume` - Gold & Modern (Primary: #f8d62b)
  - `nature` - Grün & Beruhigend (Primary: #4CAF50)
  - `stone` - Slate & Elegant (Primary: #607D8B)
  - `ocean` - Blau & Tranquil (Primary: #039BE5)

- **Features**:
  - Light/Dark Mode für jedes Theme
  - 13+ semantische Farb-Tokens pro Theme
  - CSS-Variable-basiertes Theming
  - Fertige Component-Utilities

- **Verwendung**:
  ```javascript
  // tailwind.config.js
  import preset from '@manacore/shared-tailwind/preset';

  export default {
    presets: [preset],
    content: ['./src/**/*.{html,js,svelte,ts}'],
  };
  ```

### 4. `@manacore/shared-icons` (Neu)
**Pfad**: `packages/shared-icons/`

Einheitliche Icon-Bibliothek basierend auf Phosphor Icons:

- **Komponente**:
  ```svelte
  <script>
    import { Icon } from '@manacore/shared-icons';
  </script>

  <Icon name="play" size={24} class="text-primary" />
  ```

- **Icons**: 40+ häufig verwendete Icons (play, pause, settings, user, etc.)

### 5. `@manacore/shared-ui` (Erweitert)
**Pfad**: `packages/shared-ui/`

Atomic Design System für Svelte-Komponenten:

- **Atoms** (`src/atoms/`):
  - `Text.svelte` - Typography mit Varianten
  - `Button.svelte` - Primary, Secondary, Ghost, Danger
  - `Badge.svelte` - Status-Badges

- **Molecules** (`src/molecules/`):
  - `Toggle.svelte` - Toggle-Switch
  - `Input.svelte` - Text-Input mit Label & Validation

- **Organisms** (`src/organisms/`):
  - `Modal.svelte` - Overlay-Modal mit Slots

### 6. `@manacore/shared-types` (Erweitert)
**Pfad**: `packages/shared-types/`

Neue Type-Module hinzugefügt:

- `auth.ts` - Auth-bezogene Types (User, Session, Token)
- `theme.ts` - Theme-Konfiguration Types
- `ui.ts` - UI-Komponenten Types
- `common.ts` - Gemeinsame Utility Types

### 7. `@manacore/shared-utils` (Erweitert)
**Pfad**: `packages/shared-utils/`

Neue Utility-Module hinzugefügt:

- `format.ts` - formatDuration, formatFileSize, formatNumber, formatCurrency
- `validation.ts` - isValidEmail, isValidUrl, validatePassword

### 8. `@manacore/shared-i18n` (Neu)
**Pfad**: `packages/shared-i18n/`

Einheitliche Internationalisierung:

- Locale-Detection
- Common Translations (Buttons, Errors)
- svelte-i18n Integration

### 9. `@manacore/shared-config` (Neu)
**Pfad**: `packages/shared-config/`

Environment-Konfiguration:

- Zod-basierte Env-Validierung
- Typsichere Config-Objekte

### 10. `@manacore/shared-subscription-types` (Neu) / `@manacore/shared-subscription-ui` (Neu)
**Pfad**: `packages/shared-subscription-types/`, `packages/shared-subscription-ui/`

Subscription-bezogene Types und UI-Komponenten (Vorbereitung für zukünftige Integration).

---

## App-Spezifische Änderungen

### Memoro Web (`memoro/apps/web/`)

**Gelöschte Dateien** (Migration zu Shared Packages):
- `src/lib/components/AppleSignInButton.svelte` → `@manacore/shared-auth-ui`
- `src/lib/components/GoogleSignInButton.svelte` → `@manacore/shared-auth-ui`
- `src/lib/components/Modal.svelte` → `@manacore/shared-ui`
- `src/lib/components/Toggle.svelte` → `@manacore/shared-ui`
- `src/lib/components/BillingToggle.svelte` → Nicht mehr benötigt
- `src/lib/components/CostCard.svelte` → Refactored
- `src/lib/components/PackageCard.svelte` → Refactored
- `src/lib/components/SubscriptionCard.svelte` → Refactored
- `src/lib/components/SubscriptionButton.svelte` → Refactored
- `src/lib/components/UsageCard.svelte` → Refactored
- `src/lib/components/ManaIcon.svelte` → `@manacore/shared-icons`
- `src/lib/components/atoms/Text.svelte` → `@manacore/shared-ui`
- `src/lib/components/icons/` → `@manacore/shared-icons`
- `src/lib/utils/appleAuth.ts` → `@manacore/shared-auth-ui`
- `src/lib/utils/googleAuth.ts` → `@manacore/shared-auth-ui`

**Modifizierte Dateien**:
- `tailwind.config.js` - Reduziert von 165 auf 12 Zeilen (nutzt shared-tailwind preset)
- `src/app.css` - Drastisch reduziert (nutzt shared-tailwind CSS)
- `src/routes/(public)/login/+page.svelte` - Von 549 auf 46 Zeilen (nutzt LoginPage)
- `src/routes/(public)/register/+page.svelte` - Von 400+ auf 50 Zeilen (nutzt RegisterPage)
- 30+ Komponenten - Icon-Import auf `@manacore/shared-icons` umgestellt

### ManaCore Web (`manacore/apps/web/`)

**Gelöschte Dateien**:
- `src/routes/(auth)/login/+page.server.ts` → Client-side Auth
- `src/routes/(auth)/register/+page.server.ts` → Client-side Auth

**Neue Dateien**:
- `src/lib/stores/authStore.svelte.ts` - Auth-Store mit shared-auth
- `src/lib/components/Icon.svelte` - Icon-Wrapper
- `src/lib/components/ManaCoreLogo.svelte` - Logo-Komponente
- `src/lib/components/ThemeToggle.svelte` - Theme-Umschalter
- `src/lib/components/AppSlider.svelte` - App-Slider

**Modifizierte Dateien**:
- `tailwind.config.js` - Nutzt shared-tailwind preset
- `src/routes/(auth)/login/+page.svelte` - Nutzt LoginPage von shared-auth-ui
- `src/routes/(auth)/register/+page.svelte` - Nutzt RegisterPage von shared-auth-ui

### ManaDeck Web (`manadeck/apps/web/`)

**Gelöschte Dateien**:
- `src/lib/services/authService.ts` → `@manacore/shared-auth`
- `src/lib/services/tokenManager.ts` → `@manacore/shared-auth`
- `src/lib/services/deviceManager.ts` → `@manacore/shared-auth`
- `src/lib/utils/jwt.ts` → `@manacore/shared-auth`

**Neue Dateien**:
- `src/lib/auth.ts` - Auth-Initialisierung mit shared-auth
- `src/lib/components/Icon.svelte` - Icon-Wrapper
- `src/lib/components/ManaDeckLogo.svelte` - Logo-Komponente

**Modifizierte Dateien**:
- `tailwind.config.js` - Nutzt shared-tailwind
- `src/lib/stores/authStore.svelte.ts` - Nutzt shared-auth
- `src/routes/(auth)/login/+page.svelte` - Nutzt LoginPage
- `src/routes/(auth)/register/+page.svelte` - Nutzt RegisterPage

### Märchenzauber Web (`maerchenzauber/apps/web/`)

**Neue Dateien**:
- `src/lib/auth.ts` - Auth-Setup
- `src/lib/stores/` - Store-Implementierungen
- `src/lib/components/` - Komponenten
- `src/lib/utils/` - Utilities
- `src/lib/types/` - Type-Definitionen
- `src/routes/(auth)/` - Auth-Routen
- `src/app.css` - App-Styles
- `postcss.config.js` - PostCSS-Config
- `.env.example` - Environment-Template

---

## Quantitative Zusammenfassung

| Metrik | Vorher | Nachher | Einsparung |
|--------|--------|---------|------------|
| Dateien geändert | - | 102 | - |
| Zeilen hinzugefügt | - | ~1,400 | - |
| Zeilen gelöscht | - | ~4,300 | ~3,000 LOC |
| Login-Page LOC (Memoro) | 549 | 46 | 92% |
| Tailwind Config LOC (Memoro) | 165 | 12 | 93% |

---

## Abhängigkeiten

Neue Dependencies in App `package.json`:
```json
{
  "dependencies": {
    "@manacore/shared-auth": "workspace:*",
    "@manacore/shared-auth-ui": "workspace:*",
    "@manacore/shared-icons": "workspace:*",
    "@manacore/shared-tailwind": "workspace:*",
    "@manacore/shared-types": "workspace:*",
    "@manacore/shared-ui": "workspace:*",
    "@manacore/shared-utils": "workspace:*"
  }
}
```

---

## Breaking Changes

1. **Icon-Import-Pfade** - Alle Icons müssen von `@manacore/shared-icons` importiert werden
2. **Modal-Import** - Modal kommt jetzt von `@manacore/shared-ui`
3. **Auth-Services** - Lokale authService/tokenManager durch shared-auth ersetzt
4. **OAuth-Buttons** - Konfiguration erfolgt über `setGoogleClientId()` / `setAppleConfig()`

---

## Migration Guide

### Icon Migration
```svelte
<!-- Vorher -->
<script>
  import Icon from '$lib/components/Icon.svelte';
</script>

<!-- Nachher -->
<script>
  import { Icon } from '@manacore/shared-icons';
</script>
```

### Login Page Migration
```svelte
<!-- Vorher: 500+ Zeilen eigener Code -->

<!-- Nachher -->
<script>
  import { LoginPage } from '@manacore/shared-auth-ui';
  import MyLogo from '$lib/components/MyLogo.svelte';
  import { authStore } from '$lib/stores/authStore';

  async function handleSignIn(email, password) {
    return authStore.signIn(email, password);
  }
</script>

<LoginPage
  onSignIn={handleSignIn}
  onForgotPassword={handleForgotPassword}
  registerUrl="/register"
>
  {#snippet logo()}
    <MyLogo />
  {/snippet}
</LoginPage>
```

### Tailwind Config Migration
```javascript
// Vorher: 150+ Zeilen mit Theme-Definitionen

// Nachher
import preset from '@manacore/shared-tailwind/preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{html,js,svelte,ts}'],
};
```

---

## Nächste Schritte

1. **Testing** - Alle Apps auf Funktionalität prüfen
2. **Type-Checking** - `pnpm run type-check` in allen Apps ausführen
3. **Build-Verification** - Production Builds testen
4. **Dokumentation** - README-Dateien für neue Packages erstellen

---

## Referenzen

- `SHARED_PACKAGES_ROADMAP.md` - Vollständige Roadmap der Shared Packages
- `packages/shared-auth/src/index.ts` - Auth-API Dokumentation
- `packages/shared-tailwind/src/preset.js` - Theme-Konfiguration
