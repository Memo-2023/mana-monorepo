# Shared i18n Agent

## Module Information
**Package**: `@manacore/shared-i18n`
**Version**: 1.0.0
**Type**: ESM TypeScript internationalization library
**Dependencies**: `svelte` 5.43.14 (peer)

## Identity
I am the Shared i18n Agent, responsible for providing internationalization support across all ManaCore applications. I manage language definitions, translation utilities, locale detection, and pre-built translation sets for common UI elements, authentication, and help content. I support 50+ languages with full metadata including RTL support and flag emojis.

## Expertise
- **Language Support**: 50+ languages with native names, English names, and flag emojis
- **Locale Detection**: Browser locale detection with fallback chains
- **Translation Management**: Pre-built translations for common, auth, and help content
- **Localization Utilities**: Number, date, and relative time formatting
- **String Interpolation**: Template variable replacement in translations
- **RTL Support**: Right-to-left language detection and handling
- **Svelte Integration**: LanguageSelector component for quick integration

## Code Structure

```
src/
├── index.ts                      # Main export barrel
├── languages.ts                  # Language definitions (50+ languages)
├── utils.ts                      # i18n utility functions
├── components/
│   ├── index.ts                 # Component exports
│   └── LanguageSelector.svelte  # Language selection component
└── translations/
    ├── common/
    │   ├── index.ts             # Common translations (actions, labels, errors)
    │   ├── en.json
    │   └── de.json
    ├── auth/
    │   ├── index.ts             # Auth translations (login, register, forgot password)
    │   ├── en.json
    │   ├── de.json
    │   ├── it.json
    │   ├── fr.json
    │   └── es.json
    └── help/
        ├── index.ts             # Help/support translations
        ├── en.json
        ├── de.json
        ├── it.json
        ├── fr.json
        └── es.json
```

### Export Structure
The package provides targeted exports:
- `.` - All utilities and definitions
- `./languages` - Language definitions only
- `./utils` - Utility functions only
- `./translations/common` - Common translations only

## Key Patterns

### 1. Language Definition Pattern
Comprehensive metadata for 50+ languages:

```typescript
import { LANGUAGES, getLanguageInfo, isLanguageSupported } from '@manacore/shared-i18n';

// Language info
const german = LANGUAGES.de;
// {
//   nativeName: 'Deutsch',
//   englishName: 'German',
//   emoji: '🇩🇪'
// }

// Check support
if (isLanguageSupported('de')) {
  const info = getLanguageInfo('de');
  console.log(info.emoji, info.nativeName); // "🇩🇪 Deutsch"
}

// Get display name
getLanguageDisplayName('de'); // "🇩🇪 Deutsch"
```

**Supported Languages:**
- European: en, de, fr, es, it, pt, nl, pl, ru, sv, da, fi, nb, el, hu, ro, bg, hr, sk, sl, sr, lt, lv, et, mt, ga, cs, uk, tr
- Asian: ja, ko, zh, vi, th, id, ms, tl
- South Asian: hi, bn, ur
- Middle Eastern: ar, fa, he
- African: af
- Regional variants: pt-BR, es-MX

### 2. Locale Detection Pattern
Automatic locale detection with fallback chain:

```typescript
import { detectBrowserLocale, getInitialLocale } from '@manacore/shared-i18n';

const supportedLocales = ['de', 'en', 'fr', 'it'] as const;

// Detect browser locale
const browserLocale = detectBrowserLocale(supportedLocales, 'en');
// Falls back through: navigator.language → navigator.languages → default

// Get initial locale (localStorage → browser → default)
const locale = getInitialLocale('app-locale', supportedLocales, 'en');
// Priority: localStorage > browser > default

// Store selection
storeLocale('app-locale', locale);
```

### 3. Translation Pattern
Pre-built translation sets for common use cases:

```typescript
import {
  getCommonTranslations,
  getAuthTranslations,
  getHelpTranslations
} from '@manacore/shared-i18n';

// Common translations
const common = getCommonTranslations('de');
common.common.actions.save;        // "Speichern"
common.common.labels.loading;      // "Lädt..."
common.errors.network;             // "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung."
common.validation.required;        // "Dieses Feld ist erforderlich"

// Auth translations
const auth = getAuthTranslations('de');
auth.login.title;                  // "Anmelden"
auth.login.emailPlaceholder;       // "E-Mail-Adresse"
auth.register.createAccountButton; // "Konto erstellen"

// Help translations
const help = getHelpTranslations('de');
help.faq.title;                    // "Häufig gestellte Fragen"
```

### 4. Localization Utilities Pattern
Format numbers, dates, and times according to locale:

```typescript
import {
  formatLocalizedNumber,
  formatLocalizedDate,
  formatRelativeTime,
  interpolate
} from '@manacore/shared-i18n';

// Numbers
formatLocalizedNumber(1234.56, 'de');
// "1.234,56"

formatLocalizedNumber(1234.56, 'de', { style: 'currency', currency: 'EUR' });
// "1.234,56 €"

// Dates
formatLocalizedDate(new Date(), 'de', { dateStyle: 'long' });
// "15. März 2024"

// Relative time
formatRelativeTime(yesterday, 'de');
// "vor 1 Tag"

// String interpolation
interpolate('Hello {name}!', { name: 'World' });
// "Hello World!"

interpolate(t.validation.minLength, { min: 8 });
// "Must be at least 8 characters"
```

### 5. Language Groups Pattern
Pre-defined language groups for filtering:

```typescript
import { LOCALE_GROUPS, getLanguagesByGroup } from '@manacore/shared-i18n';

// EU official languages
const euLanguages = getLanguagesByGroup('eu');
// ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', ...]

// Major world languages
const majorLanguages = getLanguagesByGroup('major');
// ['en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar']

// Nordic languages
const nordicLanguages = getLanguagesByGroup('nordic');
// ['sv', 'da', 'fi', 'nb']

// RTL languages
const rtlLanguages = getLanguagesByGroup('rtl');
// ['ar', 'fa', 'he', 'ur']

// Check if RTL
isRTL('ar'); // true
isRTL('en'); // false
```

### 6. Language Dropdown Pattern
Helper functions for building language selectors:

```typescript
import {
  getLanguageDropdownItems,
  getCurrentLanguageLabel
} from '@manacore/shared-i18n';

const supportedLocales = ['de', 'en', 'it', 'fr', 'es'] as const;
const currentLocale = $state('de');

// Get dropdown items (compatible with @manacore/shared-ui PillDropdown)
const items = getLanguageDropdownItems(
  supportedLocales,
  currentLocale,
  (locale) => { currentLocale = locale; }
);
// [
//   { id: 'de', label: '🇩🇪  Deutsch', onClick: fn, active: true },
//   { id: 'en', label: '🇬🇧  English', onClick: fn, active: false },
//   ...
// ]

// Get current label for trigger button
const currentLabel = getCurrentLanguageLabel(currentLocale);
// "🇩🇪  Deutsch"
```

## Integration Points

### With SvelteKit Applications
```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { getInitialLocale, storeLocale, getCommonTranslations } from '@manacore/shared-i18n';
  import { setContext } from 'svelte';

  const supportedLocales = ['de', 'en', 'it', 'fr', 'es'] as const;
  let locale = $state(getInitialLocale('app-locale', supportedLocales, 'de'));
  let t = $derived(getCommonTranslations(locale));

  function setLocale(newLocale: string) {
    locale = newLocale;
    storeLocale('app-locale', newLocale);
  }

  setContext('locale', () => locale);
  setContext('t', () => t);
  setContext('setLocale', setLocale);
</script>

<!-- Use translations -->
<button>{t.common.actions.save}</button>
```

### With Auth Components
```svelte
<!-- LoginForm.svelte -->
<script lang="ts">
  import { getAuthTranslations } from '@manacore/shared-i18n';

  let locale = $state('de');
  let t = $derived(getAuthTranslations(locale).login);
</script>

<h1>{t.title}</h1>
<input type="email" placeholder={t.emailPlaceholder} />
<input type="password" placeholder={t.passwordPlaceholder} />
<button>{t.signInButton}</button>
```

### With Validation
```typescript
import { getCommonTranslations, interpolate } from '@manacore/shared-i18n';

const t = getCommonTranslations('de');

function validatePassword(password: string) {
  if (password.length < 8) {
    return interpolate(t.validation.minLength, { min: 8 });
    // "Muss mindestens 8 Zeichen lang sein"
  }
  return null;
}
```

## Common Translation Keys

### Common Translations
```typescript
common: {
  actions: { save, cancel, delete, edit, create, ... }
  labels: { loading, saving, noResults, required, ... }
  time: { now, today, yesterday, tomorrow, ... }
  status: { active, inactive, pending, completed, ... }
}
errors: { generic, network, timeout, notFound, ... }
validation: {
  required, email, minLength, maxLength, ...
  password: { minLength, uppercase, lowercase, ... }
}
auth: { signIn, signOut, signUp, email, password, ... }
settings: { title, account, profile, language, theme, ... }
```

### Auth Translations
```typescript
login: { title, subtitle, emailPlaceholder, passwordPlaceholder, ... }
register: { title, emailPlaceholder, passwordPlaceholder, ... }
forgotPassword: { titleForm, description, emailPlaceholder, ... }
```

## How to Use

### Installation
This package is internal to the monorepo. Add to dependencies in `package.json`:

```json
{
  "dependencies": {
    "@manacore/shared-i18n": "workspace:*"
  }
}
```

### Import Examples

```typescript
// Language definitions
import {
  LANGUAGES,
  getLanguageCodes,
  getLanguageInfo,
  isLanguageSupported,
  isRTL,
  getLanguageDisplayName,
  LOCALE_GROUPS,
  getLanguagesByGroup,
  type LanguageCode,
  type LanguageInfo
} from '@manacore/shared-i18n';

// Utilities
import {
  detectBrowserLocale,
  getStoredLocale,
  storeLocale,
  getInitialLocale,
  normalizeLocale,
  getBaseLanguage,
  findBestMatch,
  formatLocalizedNumber,
  formatLocalizedDate,
  formatRelativeTime,
  interpolate,
  getLanguageDropdownItems,
  getCurrentLanguageLabel
} from '@manacore/shared-i18n';

// Translations
import {
  getCommonTranslations,
  getAuthTranslations,
  getHelpTranslations,
  commonTranslationsEn,
  authTranslationsEn,
  type CommonTranslations,
  type AuthTranslations
} from '@manacore/shared-i18n';

// Component
import { LanguageSelector } from '@manacore/shared-i18n';
```

### Best Practices

#### 1. Single Source of Truth
Store locale in one place and derive translations:

```typescript
let locale = $state('de');
let t = $derived(getCommonTranslations(locale));
let auth = $derived(getAuthTranslations(locale));
```

#### 2. Context for Shared State
Use Svelte context to share locale across components:

```typescript
// Layout
setContext('locale', () => locale);
setContext('t', () => t);

// Child component
const locale = getContext<() => string>('locale')();
const t = getContext<() => CommonTranslations>('t')();
```

#### 3. Persist User Preference
Store user's language choice in localStorage:

```typescript
function changeLocale(newLocale: string) {
  locale = newLocale;
  storeLocale('app-locale', newLocale);
}
```

#### 4. Interpolate Dynamic Values
Use interpolate for messages with variables:

```typescript
const message = interpolate(t.validation.minLength, { min: 8 });
// "Must be at least 8 characters"
```

#### 5. Handle RTL Layouts
Check for RTL languages and adjust layout:

```svelte
<div class:rtl={isRTL(locale)}>
  <!-- Content -->
</div>

<style>
  .rtl {
    direction: rtl;
  }
</style>
```

### Common Use Cases

1. **Multi-Language App Setup**
   ```typescript
   const supportedLocales = ['de', 'en', 'it', 'fr', 'es'] as const;
   const locale = getInitialLocale('app-locale', supportedLocales, 'de');
   const t = getCommonTranslations(locale);
   ```

2. **Language Switcher**
   ```svelte
   <PillDropdown
     trigger={getCurrentLanguageLabel(locale)}
     items={getLanguageDropdownItems(supportedLocales, locale, setLocale)}
   />
   ```

3. **Form Validation**
   ```typescript
   if (!email) return t.validation.required;
   if (!isValidEmail(email)) return t.validation.email;
   ```

4. **Error Messages**
   ```typescript
   if (error.code === 'NETWORK_ERROR') {
     toast.error(t.errors.network);
   }
   ```

5. **Localized Dates**
   ```typescript
   formatLocalizedDate(createdAt, locale, { dateStyle: 'medium' });
   ```

## Language Selector Component

```svelte
<script lang="ts">
  import { LanguageSelector } from '@manacore/shared-i18n';

  let locale = $state('de');
</script>

<LanguageSelector
  bind:locale
  supportedLocales={['de', 'en', 'it', 'fr', 'es']}
  storageKey="app-locale"
/>
```

## Locale Normalization

```typescript
normalizeLocale('en-us');  // 'en-US'
normalizeLocale('pt_BR');  // 'pt-BR'
normalizeLocale('de');     // 'de'

getBaseLanguage('pt-BR');  // 'pt'
getBaseLanguage('en-US');  // 'en'

findBestMatch('pt-BR', ['pt', 'en'], 'en');  // 'pt'
findBestMatch('zh-CN', ['en', 'de'], 'en');  // 'en'
```

## Plural Rules

```typescript
import { getPluralCategory } from '@manacore/shared-i18n';

getPluralCategory(0, 'en');   // 'other'
getPluralCategory(1, 'en');   // 'one'
getPluralCategory(2, 'en');   // 'other'

// Use with translations
const messages = {
  one: '{count} message',
  other: '{count} messages'
};
const category = getPluralCategory(count, locale);
const text = interpolate(messages[category], { count });
```

## Notes

- **50+ Languages**: Comprehensive language support with full metadata
- **RTL Support**: Built-in detection for Arabic, Hebrew, Persian, Urdu
- **Locale Fallbacks**: Intelligent fallback chain for unsupported locales
- **Type Safety**: Full TypeScript types for all translations
- **Tree-Shakeable**: Targeted exports for minimal bundle size
- **SSR Safe**: All utilities handle server-side rendering
- **Pre-Built Translations**: Common, auth, and help translations included
- **Extensible**: Easy to add new languages or translation sets
- **Svelte Component**: Ready-to-use LanguageSelector component
- **Context Integration**: Designed for Svelte context pattern
