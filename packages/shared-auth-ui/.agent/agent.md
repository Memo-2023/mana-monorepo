# Agent: @manacore/shared-auth-ui

## Module Information

**Package:** `@manacore/shared-auth-ui`
**Type:** Shared Package (Svelte 5 Auth UI Components)
**Location:** `/packages/shared-auth-ui`
**Dependencies:** `@manacore/shared-auth`, `@manacore/shared-icons`, `svelte@^5.0.0`

## Identity

I am the authentication UI component library specialist for the ManaCore monorepo. I provide beautiful, accessible, and fully customizable authentication pages and components built with Svelte 5. I handle login, registration, password reset, and social authentication (Google, Apple) with built-in theming, animations, and accessibility features.

## Expertise

### Core Capabilities

1. **Complete Auth Pages**
   - `LoginPage` - Full-featured login with email/password and social auth
   - `RegisterPage` - Account creation with validation
   - `ForgotPasswordPage` - Password reset flow

2. **Social Authentication Components**
   - `GoogleSignInButton` - Google OAuth integration with official SDK
   - `AppleSignInButton` - Apple Sign In with JS SDK

3. **Theming & Customization**
   - Dynamic light/dark mode support
   - Customizable colors, backgrounds, logos
   - Fully customizable translations (i18n ready)
   - Snippet-based extensibility

4. **Accessibility & UX**
   - WCAG 2.1 AA compliant
   - Keyboard navigation support
   - Screen reader announcements
   - Error handling with field-level validation
   - Loading states and success animations

### Technical Patterns

- **Svelte 5 Runes Only**: All components use $state, $derived, $effect
- **Snippets for Extensibility**: Header controls, app sliders, custom content
- **Type-Safe Props**: Full TypeScript interfaces for all components
- **Callback-Based**: Components emit callbacks, app handles logic
- **CSS-in-Svelte**: Scoped styles with CSS variables

## Code Structure

```
src/
├── index.ts                      # Public exports
├── types.ts                      # Shared type definitions
├── pages/
│   ├── LoginPage.svelte         # Full login page with validation
│   ├── RegisterPage.svelte      # Registration page
│   └── ForgotPasswordPage.svelte # Password reset page
├── components/
│   ├── GoogleSignInButton.svelte # Google OAuth button
│   └── AppleSignInButton.svelte  # Apple Sign In button
└── utils/
    ├── googleAuth.ts            # Google OAuth SDK helpers
    └── appleAuth.ts             # Apple Sign In SDK helpers
```

## Key Files

### `src/types.ts`
Core type definitions:
- `AuthUIConfig` - Configuration for auth pages
- `AuthServiceInterface` - Interface for auth callbacks
- `AuthResult` - Standard auth operation result

### `src/pages/LoginPage.svelte`
Comprehensive login page (1000+ lines):
- Email/password authentication
- Optional Google/Apple sign in
- Field-level validation with error highlighting
- Remember me checkbox
- Forgot password link
- Theme toggle (light/dark)
- Success animations
- Accessibility features (skip links, ARIA)
- Customizable translations
- Responsive design

### `src/pages/RegisterPage.svelte`
Registration page with:
- Email/password/confirm password fields
- Real-time password strength indicator
- Password visibility toggle
- Terms of service checkbox
- Social authentication options
- Similar theming and accessibility as LoginPage

### `src/pages/ForgotPasswordPage.svelte`
Password reset flow:
- Email input with validation
- Success state handling
- Back to login navigation
- Consistent styling with other pages

### `src/components/GoogleSignInButton.svelte`
Google OAuth integration:
- Loads Google Identity Services SDK
- Renders official Google Sign In button
- Handles token validation
- Loading states during authentication
- Error handling

### `src/components/AppleSignInButton.svelte`
Apple Sign In integration:
- Loads Apple JS SDK
- Renders official Apple button
- Handles identity token flow
- Redirect URI management

### `src/utils/googleAuth.ts`
Google OAuth helpers:
- `setGoogleClientId()` - Configure client ID
- `initializeGoogleAuth()` - Initialize SDK
- `renderGoogleButton()` - Render button with options
- `waitForGoogleAuth()` - Wait for SDK load

### `src/utils/appleAuth.ts`
Apple Sign In helpers:
- `setAppleConfig()` - Configure Apple credentials
- `initializeAppleAuth()` - Initialize SDK
- `signInWithApple()` - Trigger sign in flow
- `parseAppleAuthorizationResponse()` - Handle callback

## Integration Points

### Consumed By
- **Web Apps** (SvelteKit): Import pages in auth routes
- **Landing Pages** (Astro): Can embed auth pages
- Any Svelte 5 application with authentication needs

### Dependencies
- `@manacore/shared-icons` - Icon components (Eye, Check, Warning, etc.)
- `@manacore/shared-auth` - Auth utilities (may be deprecated, check usage)
- `svelte@^5.0.0` - Peer dependency

### Related Packages
- `@manacore/shared-auth-stores` - State management for auth
- `@manacore/shared-nestjs-auth` - Backend auth validation
- `services/mana-core-auth` - Central auth service

## Key Patterns

### 1. Basic Login Page Setup

```svelte
<script lang="ts">
  import { LoginPage } from '@manacore/shared-auth-ui';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';
  import type { AuthResult } from '@manacore/shared-auth-ui';

  async function handleSignIn(email: string, password: string): Promise<AuthResult> {
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true };
  }
</script>

<LoginPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  onSignIn={handleSignIn}
  goto={goto}
/>
```

### 2. Login with Google OAuth

```svelte
<script lang="ts">
  import { LoginPage } from '@manacore/shared-auth-ui';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';
  import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

  async function handleGoogleSignIn(idToken: string): Promise<AuthResult> {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      return { success: false, error: 'Google sign in failed' };
    }

    return { success: true };
  }
</script>

<svelte:head>
  <script src="https://accounts.google.com/gsi/client" async></script>
  <meta name="google-signin-client_id" content={PUBLIC_GOOGLE_CLIENT_ID} />
</svelte:head>

<LoginPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  onSignIn={handleSignIn}
  onSignInWithGoogle={handleGoogleSignIn}
  goto={goto}
  enableGoogle={true}
/>
```

### 3. Fully Customized Login Page

```svelte
<script lang="ts">
  import { LoginPage } from '@manacore/shared-auth-ui';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';
  import AppCarousel from '$lib/components/AppCarousel.svelte';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';

  const translations = {
    title: 'Willkommen zurück',
    subtitle: 'Melden Sie sich bei Ihrem Konto an',
    emailPlaceholder: 'E-Mail',
    passwordPlaceholder: 'Passwort',
    signInButton: 'Anmelden',
    // ... other translations
  };
</script>

<LoginPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  darkPrimaryColor="#818cf8"
  lightBackground="#f9fafb"
  darkBackground="#0f172a"
  onSignIn={handleSignIn}
  goto={goto}
  successRedirect="/dashboard"
  registerPath="/register"
  forgotPasswordPath="/forgot-password"
  translations={translations}
>
  {#snippet headerControls()}
    <LanguageSelector />
  {/snippet}

  {#snippet appSlider()}
    <AppCarousel />
  {/snippet}
</LoginPage>
```

### 4. Register Page with Custom Validation

```svelte
<script lang="ts">
  import { RegisterPage } from '@manacore/shared-auth-ui';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';

  async function handleSignUp(email: string, password: string): Promise<AuthResult> {
    // Custom validation
    if (password.length < 12) {
      return {
        success: false,
        error: 'Password must be at least 12 characters'
      };
    }

    const response = await fetch('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.message };
    }

    const data = await response.json();
    return {
      success: true,
      needsVerification: data.needsEmailVerification
    };
  }
</script>

<RegisterPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  onSignUp={handleSignUp}
  goto={goto}
/>
```

### 5. Forgot Password Flow

```svelte
<script lang="ts">
  import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';

  async function handleForgotPassword(email: string): Promise<AuthResult> {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to send reset email' };
    }

    return { success: true };
  }
</script>

<ForgotPasswordPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  onForgotPassword={handleForgotPassword}
  goto={goto}
/>
```

### 6. Standalone Google Sign In Button

```svelte
<script lang="ts">
  import { GoogleSignInButton } from '@manacore/shared-auth-ui';

  async function handleGoogleSuccess(idToken: string) {
    // Validate token with your backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });

    if (response.ok) {
      goto('/dashboard');
    }
  }

  function handleGoogleError(error: Error) {
    console.error('Google sign in failed:', error);
  }
</script>

<GoogleSignInButton
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
/>
```

## How to Use

### For App Developers

1. **Install Dependencies**:
   ```bash
   pnpm add @manacore/shared-auth-ui @manacore/shared-icons
   ```

2. **Create Auth Routes**:
   ```
   src/routes/
   ├── login/+page.svelte
   ├── register/+page.svelte
   └── forgot-password/+page.svelte
   ```

3. **Import and Configure Pages**:
   - Import the desired page component
   - Provide required props (appName, logo, primaryColor)
   - Implement auth callback functions
   - Configure optional features (social auth, translations)

4. **Implement Auth Callbacks**:
   - Return `AuthResult` objects from all callbacks
   - Handle success/error states appropriately
   - Set `needsVerification: true` if email verification required

5. **Add Social Auth (Optional)**:
   - Google: Add SDK script tag, set client ID, enable in props
   - Apple: Configure Apple credentials, enable in props
   - Implement server-side token validation

6. **Customize Styling**:
   - Set custom colors via props
   - Provide custom backgrounds for light/dark modes
   - Override translations for internationalization
   - Use snippets for additional UI elements

### Integration with Auth Stores

```svelte
<script lang="ts">
  import { LoginPage } from '@manacore/shared-auth-ui';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';

  async function handleSignIn(email: string, password: string) {
    // Auth store handles the API call and state management
    const result = await authStore.signIn(email, password);
    return result;
  }
</script>

<LoginPage
  appName="MyApp"
  logo={Logo}
  primaryColor="#6366f1"
  onSignIn={handleSignIn}
  goto={goto}
/>
```

### Environment Variables

For social authentication, set these in your `.env` files:

```bash
# Google OAuth
PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Apple Sign In
PUBLIC_APPLE_CLIENT_ID=your-apple-service-id
PUBLIC_APPLE_REDIRECT_URI=https://yourdomain.com/auth/apple/callback
```

### Best Practices

- Always validate tokens on the server side
- Use httpOnly cookies for session tokens
- Implement rate limiting on auth endpoints
- Provide clear, user-friendly error messages
- Test keyboard navigation and screen readers
- Customize translations for your target audience
- Handle edge cases (network errors, timeouts)
- Implement proper CORS for social auth callbacks

## Translation System

All pages accept a `translations` prop with the following pattern:

```typescript
interface LoginTranslations {
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  signInButton: string;
  // ... and more
}
```

Default English translations are provided, but you can override any or all strings for internationalization.

## Accessibility Features

- Skip links for keyboard users
- ARIA labels and roles
- Screen reader announcements for state changes
- Focus management after errors
- High contrast mode support
- Reduced motion support
- Semantic HTML structure
- Keyboard-only navigation

## Theme System

Pages automatically detect system color scheme preference and provide a manual toggle. Theme state is managed internally and applies to:
- Background colors
- Text colors
- Input styles
- Button styles
- Border colors
- Shadow intensities

You can customize colors via props:
- `primaryColor` - Brand color (buttons, links, accents)
- `lightBackground` - Light mode background
- `darkBackground` - Dark mode background

## Notes

- All components built with Svelte 5 runes exclusively
- Fully type-safe with comprehensive TypeScript interfaces
- Production-ready with error handling and loading states
- Optimized for performance (lazy SDK loading, efficient animations)
- Mobile-responsive with touch-friendly targets
- Works in SSR and SPA contexts
- No external CSS dependencies (Tailwind not required)
