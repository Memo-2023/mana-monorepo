/**
 * @mana/auth-mobile
 * Reusable Mana Core authentication package for React Native mobile apps
 */

// Configuration
export { ManaAuthConfigProvider, useManaAuthConfig } from './config/ManaAuthConfigProvider';
export * from './config/types';
export { defaultTheme, defaultText, defaultEnvironment } from './config/defaults';

// Types
export * from './types';

// Utils (for advanced usage)
export { safeStorage } from './utils/safeStorage';
export { DeviceManager } from './utils/deviceManager';
export * as logger from './utils/logger';

/**
 * NOTE: The following exports need to be implemented by copying
 * the corresponding files from the storyteller mobile app:
 *
 * Services:
 * - export { authService } from './services/authService';
 * - export { tokenManager, TokenState } from './services/tokenManager';
 *
 * Context:
 * - export { ManaAuthProvider, useManaAuth } from './contexts/ManaAuthContext';
 *
 * Components:
 * - export { default as ManaLoginScreen } from './components/ManaLoginScreen';
 * - export { GoogleSignInButton } from './components/GoogleSignInButton';
 * - export { AppleSignInButton } from './components/AppleSignInButton';
 *
 * See IMPLEMENTATION_GUIDE.md for detailed instructions on how to
 * adapt these files to work with the configuration system.
 */
