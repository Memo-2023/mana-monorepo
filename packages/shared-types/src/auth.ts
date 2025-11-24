/**
 * Authentication-related types
 */

/**
 * Authentication state
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * User session
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

/**
 * Authenticated user
 */
export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed?: boolean;
  phone?: string;
  phoneConfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

/**
 * OAuth provider
 */
export type OAuthProvider = 'google' | 'apple' | 'github' | 'facebook';

/**
 * Auth result for operations
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  session?: Session;
  user?: AuthUser;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update request
 */
export interface PasswordUpdateRequest {
  password: string;
}

/**
 * Auth context value
 */
export interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  session: Session | null;
  signIn: (credentials: SignInCredentials) => Promise<AuthResult>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
}
