# @mana/auth-mobile Package Summary

## What Has Been Created

I've created a complete npm package structure for a reusable Mana Core authentication system. The package is located at:

```
/Users/wuesteon/memoro_new/mana-2025/storyteller-project/@mana-auth-mobile/
```

## Package Structure

```
@mana-auth-mobile/
├── package.json                    # ✅ Package configuration
├── tsconfig.json                   # ✅ TypeScript configuration
├── README.md                       # ✅ User documentation
├── IMPLEMENTATION_GUIDE.md         # ✅ Implementation instructions
├── PACKAGE_SUMMARY.md             # ✅ This file
├── .gitignore                     # ✅ Git ignore rules
├── .npmignore                     # ✅ NPM ignore rules
└── src/
    ├── index.ts                   # ✅ Main export file
    ├── types/
    │   └── index.ts              # ✅ Auth type definitions
    ├── config/
    │   ├── types.ts              # ✅ Configuration types
    │   ├── defaults.ts           # ✅ Default configurations
    │   └── ManaAuthConfigProvider.tsx  # ✅ Config provider
    ├── utils/
    │   ├── safeStorage.ts        # ✅ Storage wrapper
    │   ├── logger.ts             # ✅ Logging utilities
    │   ├── deviceManager.ts      # ✅ Device identification
    │   └── networkErrorUtils.ts  # ✅ Network helpers
    ├── services/                  # ⏳ To be copied from storyteller
    │   ├── authService.ts        # Copy from mobile/src/services/authService.ts
    │   └── tokenManager.ts       # Copy from mobile/src/services/tokenManager.ts
    ├── components/                # ⏳ To be copied from storyteller
    │   ├── ManaLoginScreen.tsx   # Copy from mobile/app/login.tsx
    │   ├── GoogleSignInButton.tsx # Copy from mobile/components/molecules/GoogleSignInButton.tsx
    │   └── AppleSignInButton.tsx  # Copy from mobile/components/molecules/AppleSignInButton.tsx
    ├── contexts/                  # ⏳ To be copied from storyteller
    │   └── ManaAuthContext.tsx   # Copy from mobile/src/contexts/AuthContext.tsx
    └── hooks/                     # ⏳ To be created
        └── useManaAuth.ts        # Extract from AuthContext
```

## What's Configurable

### 1. **Theme Configuration** (ManaAuthTheme)

- Colors (primary, secondary, buttons, inputs, etc.)
- Fonts (regular, bold, header)
- Spacing (xs, sm, md, lg, xl)
- Border radius (sm, md, lg, xl)
- Background image
- Blur intensity

### 2. **Text/Wording Configuration** (ManaAuthText)

- App branding (name, icon)
- All button labels
- All placeholder text
- All validation messages
- All error messages
- Legal text
- Cross-app promotion content

### 3. **Environment Configuration** (ManaAuthEnvironment)

- Backend URL (required)
- OAuth credentials (Google, Apple)
- Feature flags (enable/disable auth methods)
- Analytics settings
- Storage keys
- Dev mode settings

## How to Complete the Package

### Step 1: Copy Service Files

Copy these files from storyteller and adapt them to use configuration:

```typescript
// authService.ts - Replace hardcoded values with config
const BACKEND_URL = config.environment.backendUrl;
const STORAGE_KEYS = config.environment.storageKeys;

// tokenManager.ts - No changes needed
```

### Step 2: Copy Component Files

Copy and adapt UI components to use theme/text config:

```typescript
// ManaLoginScreen.tsx
const { theme, text } = useManaAuthConfig();

// Use config values
<Text style={{ color: theme.colors.text }}>
  {text.loginTitle}
</Text>
```

### Step 3: Copy Context File

Copy AuthContext and make optional integrations:

```typescript
// ManaAuthContext.tsx
- Remove hardcoded Supabase (or make optional)
- Remove hardcoded RevenueCat (or make optional)
- Use config for analytics
```

### Step 4: Build and Test

```bash
cd @mana-auth-mobile
npm install
npm run build

# Test locally
npm link

# In storyteller
npm link @mana/auth-mobile
```

## Usage Example (Storyteller)

### Install

```bash
cd mobile
npm install ../../../@mana-auth-mobile
```

### Configure (app/\_layout.tsx)

```typescript
import { ManaAuthConfigProvider, ManaAuthProvider } from '@mana/auth-mobile';

<ManaAuthConfigProvider
  environment={{
    backendUrl: process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  }}
  theme={{
    colors: { primary: '#FFCB00' },
    fonts: { header: 'Grandstander_700Bold' },
    backgroundImage: require('../assets/images/marchenzauber-dadgirl.jpg'),
  }}
  text={{
    appName: 'Märchenzauber',
    loginTitle: 'Märchenzauber',
    loginWithGoogle: 'Mit Google anmelden',
  }}
>
  <ManaAuthProvider>
    {children}
  </ManaAuthProvider>
</ManaAuthConfigProvider>
```

### Use (app/login.tsx)

```typescript
import { ManaLoginScreen } from '@mana/auth-mobile';

export default function LoginScreen() {
  return <ManaLoginScreen />;
}
```

### Use (any protected screen)

```typescript
import { useManaAuth } from '@mana/auth-mobile';

function MyScreen() {
  const { user, signOut } = useManaAuth();
  return <Text>Welcome {user?.name}!</Text>;
}
```

## Benefits

1. **Single Source of Truth**: One authentication codebase for all Mana apps
2. **Consistent UX**: Same flow across apps with app-specific branding
3. **Easy Maintenance**: Update once, deploy to all apps
4. **Type Safety**: Full TypeScript support with IntelliSense
5. **Flexibility**: Configure everything or use sensible defaults
6. **No Vendor Lock-in**: Can adapt middleware URLs per app
7. **Internationalization**: Easy to support multiple languages

## Next Steps

1. **Copy remaining files** from storyteller to complete the package
2. **Adapt services** to use configuration system
3. **Adapt components** to use theme/text configuration
4. **Test locally** with `npm link`
5. **Update storyteller** to use the package (validate it works)
6. **Publish to npm** (or private registry)
7. **Update other Mana apps** (Memoro) to use the package

## Files Created vs. Files to Copy

### ✅ Created (Infrastructure)

- Package configuration (package.json, tsconfig.json)
- Type definitions (types/index.ts, config/types.ts)
- Configuration system (defaults.ts, ManaAuthConfigProvider.tsx)
- Utilities (safeStorage, logger, deviceManager, networkErrorUtils)
- Documentation (README.md, IMPLEMENTATION_GUIDE.md)

### ⏳ To Copy (Business Logic)

- authService.ts (from mobile/src/services/)
- tokenManager.ts (from mobile/src/services/)
- ManaLoginScreen.tsx (from mobile/app/login.tsx)
- GoogleSignInButton.tsx (from mobile/components/molecules/)
- AppleSignInButton.tsx (from mobile/components/molecules/)
- ManaAuthContext.tsx (from mobile/src/contexts/AuthContext.tsx)

## Important Notes

- **No changes to storyteller code**: The current storyteller codebase is not modified
- **Side-by-side migration**: You can migrate screen-by-screen
- **Backward compatible**: Old auth code continues to work during migration
- **Configuration validation**: TypeScript ensures correct configuration
- **Dev mode support**: Triple-tap auto-login can be configured

## Questions?

See IMPLEMENTATION_GUIDE.md for detailed step-by-step instructions on completing the package implementation.
