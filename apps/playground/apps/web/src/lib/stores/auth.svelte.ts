import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { initializeWebAuth, type AuthService, type UserData } from '@manacore/shared-auth';

let user = $state<UserData | null>(null);
let loading = $state(true);
let initialized = $state(false);

let _authService: AuthService | null = null;

function getAuthUrl(): string {
	if (!browser) return '';
	return (
		(window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__ ||
		import.meta.env.PUBLIC_MANA_CORE_AUTH_URL ||
		'http://localhost:3001'
	);
}

function getLlmUrl(): string {
	if (!browser) return '';
	return (
		(window as unknown as { __PUBLIC_MANA_LLM_URL__?: string }).__PUBLIC_MANA_LLM_URL__ ||
		import.meta.env.PUBLIC_MANA_LLM_URL ||
		'http://localhost:3025'
	);
}

function getAuthService(): AuthService | null {
	if (!browser) return null;
	if (!_authService) {
		const auth = initializeWebAuth({
			baseUrl: getAuthUrl(),
			backendUrl: getLlmUrl(),
		});
		_authService = auth.authService;
	}
	return _authService;
}

export const authStore = {
	get user() {
		return user;
	},
	get loading() {
		return loading;
	},
	get initialized() {
		return initialized;
	},
	get isAuthenticated() {
		return !!user;
	},

	async initialize() {
		if (initialized || !browser) return;
		loading = true;
		try {
			const authService = getAuthService();
			if (authService) {
				const currentUser = await authService.getUserFromToken();
				user = currentUser;
			}
		} catch (error) {
			console.error('Auth initialization failed:', error);
			user = null;
		} finally {
			loading = false;
			initialized = true;
		}
	},

	async signIn(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) throw new Error('Auth not initialized');
		const result = await authService.signIn(email, password);
		if (result.success) {
			const currentUser = await authService.getUserFromToken();
			user = currentUser;
		}
		return result;
	},

	async signUp(email: string, password: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available', needsVerification: false };
		}

		try {
			const sourceAppUrl = browser ? window.location.origin : undefined;
			const result = await authService.signUp(email, password, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Signup failed', needsVerification: false };
			}

			if (result.needsVerification) {
				return { success: true, needsVerification: true };
			}

			// Auto sign in after successful signup
			const signInResult = await this.signIn(email, password);
			return { ...signInResult, needsVerification: false };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage, needsVerification: false };
		}
	},

	async signOut() {
		const authService = getAuthService();
		if (authService) {
			await authService.signOut();
		}
		user = null;
		goto('/login');
	},

	async getValidToken(): Promise<string | null> {
		const authService = getAuthService();
		if (!authService) return null;
		return authService.getAppToken();
	},

	async resendVerificationEmail(email: string) {
		const authService = getAuthService();
		if (!authService) {
			return { success: false, error: 'Auth not available' };
		}

		try {
			const sourceAppUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
			const result = await authService.resendVerificationEmail(email, sourceAppUrl);

			if (!result.success) {
				return { success: false, error: result.error || 'Failed to resend verification email' };
			}

			return { success: true };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	},
};
