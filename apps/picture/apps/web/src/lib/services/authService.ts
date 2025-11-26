/**
 * Authentication service for Picture Web
 * Uses Supabase auth with compatible interface for shared-auth-ui
 */

import { supabase } from '$lib/supabase';

export interface AuthResult {
	success: boolean;
	error?: string;
	needsVerification?: boolean;
}

export interface UserData {
	id: string;
	email: string;
	role: string;
}

/**
 * Authentication service compatible with @manacore/shared-auth-ui
 */
export const authService = {
	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string): Promise<AuthResult> {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				// Handle specific error cases
				if (error.message?.includes('Invalid login credentials')) {
					return {
						success: false,
						error: 'INVALID_CREDENTIALS'
					};
				}

				if (error.message?.includes('Email not confirmed')) {
					return {
						success: false,
						error: 'EMAIL_NOT_VERIFIED'
					};
				}

				return {
					success: false,
					error: error.message || 'Sign in failed'
				};
			}

			if (data.session) {
				return { success: true };
			}

			return {
				success: false,
				error: 'No session returned'
			};
		} catch (error) {
			console.error('Error signing in:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during sign in'
			};
		}
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(email: string, password: string): Promise<AuthResult> {
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});

			if (error) {
				if (error.message?.includes('already registered')) {
					return {
						success: false,
						error: 'This email is already in use'
					};
				}

				return {
					success: false,
					error: error.message || 'Registration failed'
				};
			}

			// Check if email confirmation is required
			if (data.user && !data.session) {
				return {
					success: true,
					needsVerification: true
				};
			}

			return { success: true };
		} catch (error) {
			console.error('Error signing up:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during registration'
			};
		}
	},

	/**
	 * Sign in with Google (OAuth)
	 */
	async signInWithGoogle(): Promise<AuthResult> {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/app/gallery`
				}
			});

			if (error) {
				return {
					success: false,
					error: error.message || 'Google Sign-In failed'
				};
			}

			// OAuth redirects, so if we get here, it's working
			return { success: true };
		} catch (error) {
			console.error('Error signing in with Google:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during Google Sign-In'
			};
		}
	},

	/**
	 * Sign in with Apple (OAuth)
	 */
	async signInWithApple(): Promise<AuthResult> {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'apple',
				options: {
					redirectTo: `${window.location.origin}/app/gallery`
				}
			});

			if (error) {
				return {
					success: false,
					error: error.message || 'Apple Sign-In failed'
				};
			}

			return { success: true };
		} catch (error) {
			console.error('Error signing in with Apple:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during Apple Sign-In'
			};
		}
	},

	/**
	 * Sign out
	 */
	async signOut(): Promise<void> {
		try {
			await supabase.auth.signOut();
		} catch (error) {
			console.error('Error signing out:', error);
		}
	},

	/**
	 * Forgot password
	 */
	async forgotPassword(email: string): Promise<AuthResult> {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});

			if (error) {
				if (error.message?.includes('rate limit')) {
					return {
						success: false,
						error: 'Too many password reset attempts. Please wait a few minutes before trying again.'
					};
				}

				return {
					success: false,
					error: error.message || 'Password reset failed'
				};
			}

			return { success: true };
		} catch (error) {
			console.error('Error sending password reset email:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during password reset'
			};
		}
	}
};
