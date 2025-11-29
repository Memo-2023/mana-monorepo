# @mana/auth-mobile

Reusable Mana Core authentication package for React Native mobile apps.

## Features

- 🔐 Email/password authentication
- 🔑 JWT token management with automatic refresh
- 🌐 Google OAuth integration
- 🍎 Apple Sign In support
- 📱 Multi-device session support
- 🎨 Fully customizable theming
- 🌍 Internationalization support
- 💾 Secure token storage
- 🔄 Automatic token refresh with retry logic
- 📊 Optional analytics integration

## Installation

```bash
npm install @mana/auth-mobile
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install react react-native expo expo-router @react-native-async-storage/async-storage @react-native-google-signin/google-signin expo-apple-authentication @expo/vector-icons @react-native-community/netinfo
```

## Quick Start

### 1. Wrap your app with ManaAuthConfigProvider

```typescript
import { ManaAuthConfigProvider } from '@mana/auth-mobile';

export default function App() {
  return (
    <ManaAuthConfigProvider
      environment={{
        backendUrl: 'https://your-backend.com',
        googleClientId: 'your-google-client-id',
        enableGoogleSignIn: true,
        enableAppleSignIn: true,
      }}
      theme={{
        colors: {
          primary: '#FFCB00',
          buttonPrimary: '#FFCB00',
        },
      }}
      text={{
        appName: 'My App',
        loginTitle: 'Welcome Back',
      }}
    >
      <YourApp />
    </ManaAuthConfigProvider>
  );
}
```

### 2. Use the authentication components

```typescript
import { ManaAuthProvider, useManaAuth, ManaLoginScreen } from '@mana/auth-mobile';

function LoginScreen() {
  return <ManaLoginScreen />;
}

function ProtectedScreen() {
  const { user, signOut } = useManaAuth();

  return (
    <View>
      <Text>Welcome {user?.name}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

## Configuration

### Environment Configuration

```typescript
{
  // Required
  backendUrl: string;

  // Optional OAuth
  googleClientId?: string;
  googleWebClientId?: string;
  appleClientId?: string;

  // Feature flags
  enableGoogleSignIn?: boolean;  // default: true
  enableAppleSignIn?: boolean;   // default: true
  enableEmailSignIn?: boolean;   // default: true
  enablePasswordReset?: boolean; // default: true

  // Dev mode
  devMode?: boolean;
  devCredentials?: { email: string; password: string };
}
```

### Theme Configuration

```typescript
{
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    error: string;
    buttonPrimary: string;
    googleButton: string;
    appleButton: string;
    // ... and more
  },
  fonts: {
    regular?: string;
    bold?: string;
    header?: string;
  },
  spacing: { xs, sm, md, lg, xl },
  borderRadius: { sm, md, lg, xl },
  backgroundImage?: ImageSource,
  blurIntensity?: number
}
```

### Text/Wording Configuration

```typescript
{
  appName: string;
  appIcon?: ImageSource;

  // All text strings are customizable
  loginTitle?: string;
  loginButton?: string;
  registerTitle?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  forgotPassword?: string;

  // Error messages
  emailInvalid?: string;
  passwordTooShort?: string;
  loginError?: string;

  // ... and many more
}
```

## API

### useManaAuth Hook

```typescript
const {
	isAuthenticated,
	user,
	loading,
	signIn,
	signUp,
	signInWithGoogle,
	signInWithApple,
	signOut,
} = useManaAuth();
```

### Components

- `<ManaLoginScreen />` - Complete login/register flow
- `<GoogleSignInButton />` - Google OAuth button
- `<AppleSignInButton />` - Apple Sign In button

## Backend Requirements

Your backend must implement these endpoints:

- `POST /auth/signin` - Email/password login
- `POST /auth/signup` - Email/password registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - Logout
- `POST /auth/google-signin` - Google OAuth
- `POST /auth/apple-signin` - Apple Sign In
- `POST /auth/forgot-password` - Password reset

## Example: Custom Styling

```typescript
<ManaAuthConfigProvider
  theme={{
    colors: {
      primary: '#FF6B6B',
      buttonPrimary: '#FF6B6B',
      background: 'rgba(0, 0, 0, 0.9)',
    },
    fonts: {
      header: 'CustomHeaderFont',
      regular: 'CustomBodyFont',
    },
  }}
  text={{
    appName: 'My Awesome App',
    loginTitle: 'Welcome to My App!',
    registerButton: 'Join Now',
  }}
  environment={{
    backendUrl: process.env.BACKEND_URL,
  }}
>
  <App />
</ManaAuthConfigProvider>
```

## License

MIT
