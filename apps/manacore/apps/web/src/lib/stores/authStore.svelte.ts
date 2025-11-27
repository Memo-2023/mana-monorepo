import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create browser Supabase client
function getSupabaseClient() {
	return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

export const authStore = {
	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string) {
		const supabase = getSupabaseClient();
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return {
				success: false,
				error: error.message,
			};
		}

		return { success: true };
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(email: string, password: string) {
		const supabase = getSupabaseClient();
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			return {
				success: false,
				error: error.message,
			};
		}

		// Check if email confirmation is required
		const needsVerification = !data.session;

		return {
			success: true,
			needsVerification,
		};
	},

	/**
	 * Send password reset email
	 */
	async forgotPassword(email: string) {
		const supabase = getSupabaseClient();
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/reset-password`,
		});

		if (error) {
			return {
				success: false,
				error: error.message,
			};
		}

		return { success: true };
	},

	/**
	 * Sign out
	 */
	async signOut() {
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
	},
};
