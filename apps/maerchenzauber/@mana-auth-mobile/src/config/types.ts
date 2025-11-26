import { ImageSourcePropType } from 'react-native';

/**
 * Configuration types for @mana/auth-mobile
 */

/**
 * Theme configuration for authentication screens
 */
export interface ManaAuthTheme {
  // Colors
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    border: string;
    inputBackground: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonText: string;
    googleButton: string;
    appleButton: string;
  };

  // Fonts
  fonts: {
    regular?: string;
    bold?: string;
    header?: string;
  };

  // Spacing
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  // Border radius
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  // Background image (optional)
  backgroundImage?: ImageSourcePropType;

  // Blur intensity for glassmorphism effect
  blurIntensity?: number;
}

/**
 * Text/wording configuration
 */
export interface ManaAuthText {
  // App branding
  appName: string;
  appIcon?: ImageSourcePropType;

  // Login screen
  loginTitle?: string;
  loginSubtitle?: string;
  loginButton?: string;
  loginWithEmail?: string;
  loginWithGoogle?: string;
  loginWithApple?: string;

  // Register screen
  registerTitle?: string;
  registerSubtitle?: string;
  registerButton?: string;
  createAccount?: string;

  // Email/password fields
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  confirmPasswordPlaceholder?: string;

  // Forgot password
  forgotPassword?: string;
  resetPasswordTitle?: string;
  resetPasswordButton?: string;
  resetPasswordSuccess?: string;

  // Validation messages
  emailRequired?: string;
  emailInvalid?: string;
  passwordRequired?: string;
  passwordTooShort?: string;
  passwordMissingUppercase?: string;
  passwordMissingLowercase?: string;
  passwordMissingNumber?: string;
  passwordMismatch?: string;

  // Error messages
  loginError?: string;
  registerError?: string;
  genericError?: string;

  // Email confirmation
  emailConfirmationTitle?: string;
  emailConfirmationMessage?: string;
  emailConfirmationButton?: string;

  // Legal text
  legalText?: string;
  termsLink?: string;
  privacyLink?: string;

  // Navigation
  backButton?: string;

  // Mana Core branding (optional)
  manaLoginTitle?: string;
  manaLoginSubtitle?: string;
  showManaLogin?: boolean;

  // Cross-app promotion (optional)
  relatedApps?: Array<{
    name: string;
    icon: ImageSourcePropType;
    description: string;
    appStoreUrl?: string;
    websiteUrl?: string;
  }>;
}

/**
 * Environment configuration
 */
export interface ManaAuthEnvironment {
  // Backend URL (required)
  backendUrl: string;

  // OAuth configuration
  googleClientId?: string;
  googleWebClientId?: string;
  appleClientId?: string;

  // Analytics (optional)
  analyticsEnabled?: boolean;
  posthogApiKey?: string;
  posthogHost?: string;

  // Feature flags
  enableGoogleSignIn?: boolean;
  enableAppleSignIn?: boolean;
  enableEmailSignIn?: boolean;
  enablePasswordReset?: boolean;

  // Storage keys (optional - defaults provided)
  storageKeys?: {
    appToken?: string;
    refreshToken?: string;
    userEmail?: string;
    appSupabaseToken?: string;
  };

  // Dev mode settings
  devMode?: boolean;
  devCredentials?: {
    email: string;
    password: string;
  };
}

/**
 * Complete configuration object
 */
export interface ManaAuthConfig {
  theme: ManaAuthTheme;
  text: ManaAuthText;
  environment: ManaAuthEnvironment;
}
