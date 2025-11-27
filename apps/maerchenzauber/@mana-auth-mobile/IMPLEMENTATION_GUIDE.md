# Implementation Guide for @mana/auth-mobile

## Overview

This package contains a reusable authentication system extracted from the Storyteller mobile app. It provides a complete authentication solution for Mana Core-powered React Native apps with full customization support.

## Package Structure

```
@mana-auth-mobile/
├── src/
│   ├── services/           # Auth and token management services
│   │   ├── authService.ts         # Main authentication service
│   │   └── tokenManager.ts        # JWT token manager with auto-refresh
│   ├── components/         # UI components
│   │   ├── ManaLoginScreen.tsx    # Complete login/register flow
│   │   ├── GoogleSignInButton.tsx # Google OAuth button
│   │   └── AppleSignInButton.tsx  # Apple Sign In button
│   ├── contexts/           # React contexts
│   │   └── ManaAuthContext.tsx    # Authentication state management
│   ├── utils/              # Utility functions
│   │   ├── safeStorage.ts         # Secure storage wrapper
│   │   ├── logger.ts              # Logging utilities
│   │   ├── deviceManager.ts       # Device identification
│   │   └── networkErrorUtils.ts   # Network helpers
│   ├── types/              # TypeScript definitions
│   │   └── index.ts               # Auth-related types
│   ├── config/             # Configuration system
│   │   ├── types.ts               # Config type definitions
│   │   ├── defaults.ts            # Default configurations
│   │   └── ManaAuthConfigProvider.tsx  # Config provider
│   ├── hooks/              # React hooks
│   │   └── useManaAuth.ts         # Main auth hook
│   └── index.ts            # Package exports
├── package.json
├── tsconfig.json
├── README.md
└── IMPLEMENTATION_GUIDE.md
```

## Core Components to Implement

### 1. Services (Already Structured)

The following services need to be copied from the storyteller codebase with minimal modifications:

- **authService.ts**: Copy from `mobile/src/services/authService.ts`
  - Replace hardcoded `BACKEND_URL` with `config.environment.backendUrl`
  - Replace storage keys with `config.environment.storageKeys`

- **tokenManager.ts**: Copy from `mobile/src/services/tokenManager.ts`
  - No configuration changes needed (works with authService)

### 2. Components

- **ManaLoginScreen.tsx**: Copy from `mobile/app/login.tsx`
  - Use `useManaAuthConfig()` hook to access theme/text configuration
  - Replace hardcoded colors with `config.theme.colors.*`
  - Replace hardcoded text with `config.text.*`
  - Replace background image with `config.theme.backgroundImage`

- **GoogleSignInButton.tsx**: Copy from `mobile/components/molecules/GoogleSignInButton.tsx`
  - Use `config.environment.googleClientId`
  - Use `config.theme.colors.googleButton`
  - Use `config.text.loginWithGoogle`

- **AppleSignInButton.tsx**: Copy from `mobile/components/molecules/AppleSignInButton.tsx`
  - Use `config.environment.appleClientId`
  - Use `config.theme.colors.appleButton`
  - Use `config.text.loginWithApple`

### 3. Context (ManaAuthContext.tsx)

Copy from `mobile/src/contexts/AuthContext.tsx` with these changes:

- Remove Supabase-specific code (or make it optional)
- Remove RevenueCat-specific code (or make it optional)
- Use configuration for analytics instead of hardcoded PostHog
- Export `useManaAuth` hook

### 4. Main Export (index.ts)

```typescript
// Configuration
export { ManaAuthConfigProvider, useManaAuthConfig } from './config/ManaAuthConfigProvider';
export * from './config/types';

// Context & Hooks
export { ManaAuthProvider, useManaAuth } from './contexts/ManaAuthContext';

// Components
export { default as ManaLoginScreen } from './components/ManaLoginScreen';
export { GoogleSignInButton } from './components/GoogleSignInButton';
export { AppleSignInButton } from './components/AppleSignInButton';

// Services (for advanced usage)
export { authService } from './services/authService';
export { tokenManager } from './services/tokenManager';

// Types
export * from './types';
```

## Usage in Storyteller (Example)

### Step 1: Install the Package

```bash
# From the storyteller mobile directory
npm install ../../../@mana-auth-mobile
```

### Step 2: Configure in App Root

```typescript
// mobile/app/_layout.tsx
import { ManaAuthConfigProvider } from '@mana/auth-mobile';

export default function RootLayout() {
  return (
    <ManaAuthConfigProvider
      environment={{
        backendUrl: process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL || 'http://localhost:3002',
        googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        enableGoogleSignIn: true,
        enableAppleSignIn: true,
        devMode: __DEV__,
        devCredentials: {
          email: 'till.schneider@memoro.ai',
          password: 'Aa-12345678'
        },
      }}
      theme={{
        colors: {
          primary: '#FFCB00',
          buttonPrimary: '#FFCB00',
        },
        fonts: {
          header: 'Grandstander_700Bold',
        },
        backgroundImage: require('../assets/images/marchenzauber-dadgirl.jpg'),
      }}
      text={{
        appName: 'Märchenzauber',
        loginTitle: 'Märchenzauber',
        loginSubtitle: 'Erstelle ein Konto oder melde dich an.',
        manaLoginTitle: 'Mana Login',
        showManaLogin: true,
        relatedApps: [
          {
            name: 'Memoro',
            icon: require('../assets/images/Memoro-App-Icon.png'),
            description: 'Zeichne Gespräche auf...',
            appStoreUrl: 'https://apps.apple.com/app/memoro',
            websiteUrl: 'https://memoro.ai',
          },
        ],
      }}
    >
      <ManaAuthProvider>
        {/* Rest of your app */}
      </ManaAuthProvider>
    </ManaAuthConfigProvider>
  );
}
```

### Step 3: Use in Screens

```typescript
// mobile/app/login.tsx
import { ManaLoginScreen } from '@mana/auth-mobile';

export default function LoginScreen() {
  return <ManaLoginScreen />;
}
```

```typescript
// mobile/app/(tabs)/index.tsx
import { useManaAuth } from '@mana/auth-mobile';

export default function HomeScreen() {
  const { user, signOut } = useManaAuth();

  return (
    <View>
      <Text>Welcome {user?.name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## Configuration Examples

### German Language

```typescript
<ManaAuthConfigProvider
  text={{
    appName: 'Meine App',
    loginTitle: 'Anmelden',
    loginButton: 'Anmelden',
    registerTitle: 'Konto erstellen',
    registerButton: 'Registrieren',
    loginWithEmail: 'Mit E-Mail anmelden',
    loginWithGoogle: 'Mit Google anmelden',
    loginWithApple: 'Mit Apple anmelden',
    emailPlaceholder: 'E-Mail Adresse eingeben...',
    passwordPlaceholder: 'Passwort eingeben...',
    forgotPassword: 'Passwort vergessen?',
    emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein',
    passwordTooShort: 'Das Passwort muss mindestens 8 Zeichen lang sein',
    loginError: 'Anmeldung fehlgeschlagen',
    backButton: 'Zurück',
  }}
/>
```

### Custom Colors

```typescript
<ManaAuthConfigProvider
  theme={{
    colors: {
      primary: '#FF6B6B',
      buttonPrimary: '#FF6B6B',
      background: 'rgba(30, 30, 40, 0.95)',
      inputBackground: 'rgba(50, 50, 70, 0.8)',
      text: '#FFFFFF',
      googleButton: '#4285F4',
      appleButton: '#000000',
    },
  }}
/>
```

### Minimal Configuration

```typescript
<ManaAuthConfigProvider
  environment={{
    backendUrl: 'https://api.myapp.com',
  }}
  text={{
    appName: 'My App',
  }}
/>
```

## Migrating from Hardcoded Auth

### Before (Storyteller)

```typescript
// Hardcoded in login.tsx
const handleLogin = async () => {
	await authService.signIn(email, password);
};

// Hardcoded colors
const styles = StyleSheet.create({
	button: {
		backgroundColor: '#FFCB00', // Hardcoded
	},
});
```

### After (Using Package)

```typescript
import { ManaLoginScreen, useManaAuth } from '@mana/auth-mobile';

// Configuration-driven
<ManaLoginScreen /> // Uses configured colors/text

// Or custom implementation
const { signIn } = useManaAuth();
const { colors, text } = useManaAuthConfig();

const handleLogin = async () => {
  await signIn(email, password);
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.buttonPrimary, // From config
  },
});
```

## Testing the Package

### Local Testing (Before Publishing)

```bash
# In @mana-auth-mobile directory
npm link

# In your app directory
npm link @mana/auth-mobile
```

### Publishing to npm

```bash
# In @mana-auth-mobile directory
npm run build
npm publish
```

## Next Steps

1. Complete the missing service files (copy from storyteller with configuration updates)
2. Test locally with `npm link`
3. Publish to npm (or private registry)
4. Update storyteller to use the package
5. Update other Mana apps (Memoro) to use the same package

## Benefits

- ✅ Single authentication codebase for all Mana apps
- ✅ Consistent UX across apps with app-specific branding
- ✅ Easy to maintain and update
- ✅ Type-safe configuration
- ✅ Reduced code duplication
- ✅ Faster development of new apps
