# Quick Start Guide

## 🎯 What You Have

A complete, configurable authentication package for React Native apps using Mana Core.

## 📦 Package Location

```
/Users/wuesteon/memoro_new/mana-2025/storyteller-project/@mana-auth-mobile/
```

## ⚡ Quick Usage (After Completion)

### 1. Install in Your App

```bash
# Local testing
cd @mana-auth-mobile && npm link
cd ../mobile && npm link @mana/auth-mobile

# Or from npm (after publishing)
npm install @mana/auth-mobile
```

### 2. Wrap Your App

```typescript
// app/_layout.tsx
import { ManaAuthConfigProvider, ManaAuthProvider } from '@mana/auth-mobile';

export default function RootLayout() {
  return (
    <ManaAuthConfigProvider
      environment={{
        backendUrl: 'https://your-backend.com',
        googleClientId: 'your-google-client-id',
      }}
      theme={{
        colors: { primary: '#FFCB00' },
      }}
      text={{
        appName: 'My App',
      }}
    >
      <ManaAuthProvider>
        {/* Your app content */}
      </ManaAuthProvider>
    </ManaAuthConfigProvider>
  );
}
```

### 3. Use in Screens

```typescript
// app/login.tsx
import { ManaLoginScreen } from '@mana/auth-mobile';

export default function LoginScreen() {
  return <ManaLoginScreen />;
}
```

```typescript
// Any screen
import { useManaAuth } from '@mana/auth-mobile';

function MyScreen() {
  const { user, signOut, isAuthenticated } = useManaAuth();
  
  if (!isAuthenticated) return <LoginScreen />;
  
  return (
    <View>
      <Text>Welcome {user?.name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## 🔧 What Still Needs to be Done

To complete the package, copy these files from storyteller and adapt them:

### Files to Copy:

1. **Services** (from `mobile/src/services/`)
   - `authService.ts` → Adapt backend URL and storage keys to use config
   - `tokenManager.ts` → No changes needed

2. **Components** (from `mobile/app/` and `mobile/components/molecules/`)
   - `login.tsx` → `ManaLoginScreen.tsx` (adapt to use theme/text config)
   - `GoogleSignInButton.tsx` → Adapt to use config
   - `AppleSignInButton.tsx` → Adapt to use config

3. **Context** (from `mobile/src/contexts/`)
   - `AuthContext.tsx` → `ManaAuthContext.tsx` (make Supabase/RevenueCat optional)

### Key Adaptations:

```typescript
// BEFORE (Hardcoded)
const BACKEND_URL = 'http://localhost:3002';
const title = 'Märchenzauber';
const buttonColor = '#FFCB00';

// AFTER (Configurable)
const { environment } = useManaAuthConfig();
const { text, theme } = useManaAuthConfig();
const BACKEND_URL = environment.backendUrl;
const title = text.appName;
const buttonColor = theme.colors.buttonPrimary;
```

## 📚 Documentation Files

- **README.md** - User documentation for npm
- **IMPLEMENTATION_GUIDE.md** - Detailed step-by-step implementation
- **PACKAGE_SUMMARY.md** - Complete overview of the package
- **QUICK_START.md** - This file

## 🎨 Configuration Examples

### Storyteller (German)

```typescript
<ManaAuthConfigProvider
  environment={{
    backendUrl: process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    enableGoogleSignIn: true,
    enableAppleSignIn: true,
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
    loginButton: 'Anmelden',
    registerButton: 'Registrieren',
    loginWithEmail: 'Mit E-Mail anmelden',
    loginWithGoogle: 'Mit Google anmelden',
    loginWithApple: 'Mit Apple anmelden',
    emailPlaceholder: 'E-Mail Adresse eingeben...',
    passwordPlaceholder: 'Passwort eingeben...',
    forgotPassword: 'Passwort vergessen?',
    backButton: 'Zurück',
  }}
/>
```

### Memoro (English)

```typescript
<ManaAuthConfigProvider
  environment={{
    backendUrl: process.env.EXPO_PUBLIC_MEMORO_BACKEND_URL,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  }}
  theme={{
    colors: {
      primary: '#0099FF',
      buttonPrimary: '#0099FF',
    },
    backgroundImage: require('../assets/images/memoro-background.jpg'),
  }}
  text={{
    appName: 'Memoro',
    loginTitle: 'Welcome to Memoro',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
  }}
/>
```

## ✅ Benefits

- ✅ One codebase for all Mana apps
- ✅ App-specific branding through configuration
- ✅ Easy maintenance and updates
- ✅ Type-safe configuration
- ✅ Supports multiple languages
- ✅ No code changes in storyteller

## 🚀 Next Steps

1. Read **IMPLEMENTATION_GUIDE.md** for detailed instructions
2. Copy the service files and adapt them
3. Copy the component files and adapt them
4. Test locally with `npm link`
5. Publish to npm
6. Update all Mana apps to use the package

## 📁 Package Structure

```
@mana-auth-mobile/
├── 📄 package.json              # NPM configuration
├── 📄 tsconfig.json             # TypeScript config
├── 📄 README.md                 # Public documentation
├── 📄 IMPLEMENTATION_GUIDE.md   # Implementation steps
├── 📄 PACKAGE_SUMMARY.md        # Complete overview
├── 📄 QUICK_START.md            # This file
└── 📂 src/
    ├── 📂 config/               # Configuration system ✅
    ├── 📂 types/                # TypeScript definitions ✅
    ├── 📂 utils/                # Utilities ✅
    ├── 📂 services/             # Auth services ⏳ TO COPY
    ├── 📂 components/           # UI components ⏳ TO COPY
    ├── 📂 contexts/             # Auth context ⏳ TO COPY
    └── 📄 index.ts              # Main exports ✅
```

Legend:
- ✅ = Created and ready
- ⏳ = Needs to be copied from storyteller

## 💡 Pro Tips

1. **Test locally first** - Use `npm link` before publishing
2. **Use TypeScript** - It will catch configuration errors
3. **Start simple** - Use default theme/text, then customize
4. **One app at a time** - Migrate storyteller first, then others
5. **Keep storyteller working** - This package is separate, no impact on current code

## 🤝 Support

If you have questions:
1. Check IMPLEMENTATION_GUIDE.md
2. Look at the storyteller implementation as reference
3. All types are documented with JSDoc comments
