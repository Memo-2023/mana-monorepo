import { ManaAuthTheme, ManaAuthText, ManaAuthEnvironment } from './types';

/**
 * Default theme configuration
 */
export const defaultTheme: ManaAuthTheme = {
  colors: {
    primary: '#FFCB00',
    secondary: '#4285F4',
    background: 'rgba(0, 0, 0, 0.8)',
    surface: 'rgba(0, 0, 0, 0.3)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    error: '#ff4444',
    border: 'rgba(255, 255, 255, 0.2)',
    inputBackground: 'rgba(50, 50, 70, 0.8)',
    buttonPrimary: '#FFCB00',
    buttonSecondary: 'rgba(50, 50, 70, 0.8)',
    buttonText: '#FFFFFF',
    googleButton: '#4285F4',
    appleButton: '#000000',
  },
  fonts: {
    regular: undefined,
    bold: undefined,
    header: undefined,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 10,
    lg: 16,
    xl: 24,
  },
  blurIntensity: 60,
};

/**
 * Default text configuration (English)
 */
export const defaultText: ManaAuthText = {
  appName: 'My App',

  // Login
  loginTitle: 'Sign In',
  loginSubtitle: 'Welcome back!',
  loginButton: 'Sign In',
  loginWithEmail: 'Sign in with Email',
  loginWithGoogle: 'Sign in with Google',
  loginWithApple: 'Sign in with Apple',

  // Register
  registerTitle: 'Create Account',
  registerSubtitle: 'Join us today',
  registerButton: 'Sign Up',
  createAccount: 'Create New Account',

  // Fields
  emailPlaceholder: 'Enter your email...',
  passwordPlaceholder: 'Enter your password...',
  confirmPasswordPlaceholder: 'Confirm your password...',

  // Forgot password
  forgotPassword: 'Forgot Password?',
  resetPasswordTitle: 'Reset Password',
  resetPasswordButton: 'Reset Password',
  resetPasswordSuccess: 'Password reset email sent!',

  // Validation
  emailRequired: 'Please enter your email address',
  emailInvalid: 'Please enter a valid email address',
  passwordRequired: 'Please enter your password',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordMissingUppercase: 'Password must contain at least one uppercase letter',
  passwordMissingLowercase: 'Password must contain at least one lowercase letter',
  passwordMissingNumber: 'Password must contain at least one number',
  passwordMismatch: 'Passwords do not match',

  // Errors
  loginError: 'Login failed. Please check your credentials.',
  registerError: 'Registration failed. Please try again.',
  genericError: 'An unknown error occurred',

  // Email confirmation
  emailConfirmationTitle: 'Confirm your email',
  emailConfirmationMessage: 'Please check your inbox and click the confirmation link.',
  emailConfirmationButton: 'Got it',

  // Legal
  legalText: 'By signing in, you agree to our Terms of Service and Privacy Policy.',
  termsLink: 'Terms of Service',
  privacyLink: 'Privacy Policy',

  // Navigation
  backButton: 'Back',

  // Mana branding
  manaLoginTitle: 'Mana Login',
  manaLoginSubtitle: 'One account for all Mana apps',
  showManaLogin: false,

  relatedApps: [],
};

/**
 * Default environment configuration
 */
export const defaultEnvironment: Partial<ManaAuthEnvironment> = {
  enableGoogleSignIn: true,
  enableAppleSignIn: true,
  enableEmailSignIn: true,
  enablePasswordReset: true,
  analyticsEnabled: false,
  devMode: false,
  storageKeys: {
    appToken: '@auth/appToken',
    refreshToken: '@auth/refreshToken',
    userEmail: '@auth/userEmail',
    appSupabaseToken: '@auth/appSupabaseToken',
  },
};
