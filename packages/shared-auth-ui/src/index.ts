// Pages
export { default as LoginPage } from './pages/LoginPage.svelte';
export { default as RegisterPage } from './pages/RegisterPage.svelte';

// Components
export { default as Icon } from './components/Icon.svelte';
export { default as GoogleSignInButton } from './components/GoogleSignInButton.svelte';
export { default as AppleSignInButton } from './components/AppleSignInButton.svelte';

// Utilities
export {
  setGoogleClientId,
  initializeGoogleAuth,
  renderGoogleButton,
  isGoogleAuthLoaded,
  waitForGoogleAuth
} from './utils/googleAuth';

export {
  setAppleConfig,
  initializeAppleAuth,
  signInWithApple,
  parseAppleAuthorizationResponse,
  getStoredReturnUrl,
  clearAppleSignInSession,
  isAppleAuthLoaded,
  waitForAppleAuth,
  type AppleAuthorizationResponse
} from './utils/appleAuth';

// Types
export type {
  AuthUIConfig,
  AuthServiceInterface,
  AuthResult,
  IconName
} from './types';

// Icon paths
export { iconPaths } from './icons/iconPaths';
