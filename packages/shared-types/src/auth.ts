/**
 * Authentication-related types
 */

/**
 * Authentication state
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Standard authentication error codes
 */
export type AuthErrorCode =
	| 'INVALID_CREDENTIALS'
	| 'EMAIL_NOT_CONFIRMED'
	| 'USER_NOT_FOUND'
	| 'EMAIL_ALREADY_EXISTS'
	| 'WEAK_PASSWORD'
	| 'INVALID_EMAIL'
	| 'RATE_LIMITED'
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'NETWORK_ERROR'
	| 'SERVER_ERROR'
	| 'UNKNOWN_ERROR';

/**
 * Structured authentication error
 */
export interface AuthError {
	code: AuthErrorCode;
	message: string;
	originalError?: unknown;
}

/**
 * Map common Supabase error messages to AuthErrorCode
 */
export function mapSupabaseErrorToCode(message: string): AuthErrorCode {
	const lowerMessage = message.toLowerCase();

	if (lowerMessage.includes('invalid login credentials')) return 'INVALID_CREDENTIALS';
	if (lowerMessage.includes('email not confirmed')) return 'EMAIL_NOT_CONFIRMED';
	if (lowerMessage.includes('user not found')) return 'USER_NOT_FOUND';
	if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists'))
		return 'EMAIL_ALREADY_EXISTS';
	if (lowerMessage.includes('password') && lowerMessage.includes('weak')) return 'WEAK_PASSWORD';
	if (lowerMessage.includes('invalid email')) return 'INVALID_EMAIL';
	if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) return 'RATE_LIMITED';
	if (lowerMessage.includes('token') && lowerMessage.includes('expired')) return 'TOKEN_EXPIRED';
	if (lowerMessage.includes('token') && lowerMessage.includes('invalid')) return 'TOKEN_INVALID';
	if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) return 'NETWORK_ERROR';
	if (lowerMessage.includes('server') || lowerMessage.includes('500')) return 'SERVER_ERROR';

	return 'UNKNOWN_ERROR';
}

/**
 * Create an AuthError from a Supabase error message
 */
export function createAuthError(message: string, originalError?: unknown): AuthError {
	return {
		code: mapSupabaseErrorToCode(message),
		message,
		originalError,
	};
}

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
