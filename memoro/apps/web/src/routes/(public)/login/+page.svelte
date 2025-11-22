<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import GoogleSignInButton from '$lib/components/GoogleSignInButton.svelte';
	import AppleSignInButton from '$lib/components/AppleSignInButton.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import MemoroLogo from '$lib/components/MemoroLogo.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import { auth } from '$lib/stores/auth';
	import { authService } from '$lib/services/authService';
	import { theme } from '$lib/stores/theme';
	import { t } from 'svelte-i18n';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';

	type AuthMode = 'initial' | 'login' | 'forgot-password' | 'password-reset-success';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');
	let password = $state('');
	let mode = $state<AuthMode>('initial');
	let showManaInfoModal = $state(false);
	let resetEmail = $state(''); // Store email for success message
	let showPassword = $state(false); // Toggle password visibility

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');

	// Password validation requirements
	let passwordRequirements = $derived.by(() => {
		if (!password) {
			return {
				length: false,
				lowercase: false,
				uppercase: false,
				digit: false,
				special: false
			};
		}

		return {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^a-zA-Z0-9]/.test(password)
		};
	});

	// Display OAuth error from URL if present
	let oauthErrorRaw = $derived($page.url.searchParams.get('error'));
	let oauthError = $derived.by(() => {
		if (!oauthErrorRaw) return null;

		// Map OAuth error codes to translation keys
		const errorMap: Record<string, string> = {
			'access_denied': 'auth.oauth_error_access_denied',
			'server_error': 'auth.oauth_error_server_error',
			'temporarily_unavailable': 'auth.oauth_error_temporarily_unavailable',
			'invalid_request': 'auth.oauth_error_invalid_request',
			'unauthorized_client': 'auth.oauth_error_unauthorized_client',
			'unsupported_response_type': 'auth.oauth_error_unsupported_response_type',
			'invalid_scope': 'auth.oauth_error_invalid_scope'
		};

		const translationKey = errorMap[oauthErrorRaw] || 'auth.oauth_error_unknown';
		return $t(translationKey);
	});

	// Get primary color based on theme variant
	function getPrimaryColor() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#78909C',
				ocean: '#039BE5'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5'
			};
			return colors[variant];
		}
	}

	// Get page background based on theme variant
	function getPageBackground() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#101010',
				nature: '#121212',
				stone: '#121212',
				ocean: '#121212'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#dddddd',
				nature: '#FBFDF8',
				stone: '#F5F7F9',
				ocean: '#F5FCFF'
			};
			return colors[variant];
		}
	}

	async function handleLogin() {
		loading = true;
		error = null;

		// Validate inputs
		if (!email) {
			error = $t('auth.error_email_required');
			loading = false;
			return;
		}

		if (!password) {
			error = $t('auth.error_password_required');
			loading = false;
			return;
		}

		const result = await auth.signIn(email, password);

		loading = false;

		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error || $t('auth.logging_in');
		}
	}

	async function handleForgotPassword() {
		loading = true;
		error = null;

		// Validate email
		if (!email) {
			error = $t('auth.error_email_required');
			loading = false;
			return;
		}

		// Send password reset email
		const result = await authService.forgotPassword(email);

		loading = false;

		if (result.success) {
			// Store email for success message and switch to success screen
			resetEmail = email;
			resetForm();
			switchMode('password-reset-success');
		} else {
			// Show error with specific handling for rate limiting
			let errorMessage = result.error || $t('auth.reset_password_error');

			// Check if it's a rate limit error
			if (result.error?.includes('rate limit') || result.error?.includes('too many')) {
				errorMessage = $t('auth.reset_password_rate_limit');
			}

			error = errorMessage;
		}
	}

	function resetForm() {
		email = '';
		password = '';
		error = null;
	}

	function switchMode(newMode: AuthMode) {
		mode = newMode;
		error = null;
	}
</script>

<svelte:head>
	<title>Login - Memoro</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col justify-between"
	style="background-color: {getPageBackground()};"
>
	<!-- Language Selector and Theme Toggle in top right -->
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3 opacity-60">
		<LanguageSelector />
		<ThemeToggle />
	</div>

	<!-- Top Section - Logo and Welcome -->
	<div class="flex flex-col items-center justify-center pt-16 pb-8">
		<div
			class="flex items-center justify-center rounded-full transition-all mb-4 bg-black"
			style="width: 120px; height: 120px; border: 3px solid {getPrimaryColor()}; box-shadow: {isDark
				? '0 6px 12px rgba(0, 0, 0, 0.4)'
				: '0 6px 12px rgba(0, 0, 0, 0.15)'};"
		>
			<MemoroLogo size={55} color={getPrimaryColor()} />
		</div>
		<h1 class="text-2xl font-semibold" style="color: {isDark ? '#ffffff' : '#000000'};">
			Memoro
		</h1>
	</div>

	<!-- Middle Section - Auth Buttons Container -->
	<div class="flex-1 flex items-start justify-center px-5 pt-8 pb-8">
		<div
			class="w-full max-w-md rounded-xl p-6"
			style="background-color: {isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
		>
			<!-- Title -->
			<div class="mb-6">
				<h2 class="text-center text-xl font-semibold text-theme flex items-center justify-center gap-2">
					{#if mode === 'initial'}
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
						</svg>
						{$t('auth.mana_login')}
					{:else if mode === 'login'}
						{$t('auth.sign_in')}
					{:else if mode === 'forgot-password'}
						{$t('auth.reset_password')}
					{:else if mode === 'password-reset-success'}
						{$t('auth.reset_email_sent_title')}
					{/if}
				</h2>
				{#if mode === 'initial'}
					<div class="mt-3 flex flex-col items-center justify-center gap-2">
						<p class="text-sm text-center text-theme-muted">
							{$t('auth.mana_login_description')}
						</p>
					<button
						onclick={() => showManaInfoModal = true}
						class="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
						style="color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="info" size={16} />
						Mehr erfahren
					</button>
					</div>
				{/if}
			</div>

			<!-- Error Messages -->
			{#if error}
				<div class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3">
					<p class="text-sm text-red-500">{error}</p>
				</div>
			{/if}

			{#if oauthError}
				<div class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3">
					<p class="text-sm text-red-500">{oauthError}</p>
				</div>
			{/if}

			<!-- Initial Mode -->
			{#if mode === 'initial'}
				<div class="mb-2 flex flex-col gap-3">
					<button
						onclick={() => goto('/register')}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
						style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="user-plus" size={20} />
						{$t('auth.create_account')}
					</button>

					<button
						onclick={() => switchMode('login')}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all bg-content hover:bg-menu-hover text-theme border border-theme"
					>
						<Icon name="sign-in" size={20} />
						{$t('auth.sign_in')}
					</button>
				</div>

				<!-- Terms and Privacy -->
				<div class="mt-4 text-center px-2">
					<p class="text-xs text-theme-muted">
						{@html $t('auth.terms_agreement')}
					</p>
				</div>

			<!-- Login Mode -->
			{:else if mode === 'login'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleLogin();
					}}
					class="pb-4"
				>
					<div class="mb-2">
						<input
							type="email"
							bind:value={email}
							placeholder="Email"
							required
							class="h-14 w-full rounded-xl border border-theme bg-content px-4 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary text-theme placeholder:text-theme-muted"
						/>
					</div>

					<div class="mb-2 relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder={$t('auth.password')}
							required
							class="h-14 w-full rounded-xl border border-theme bg-content px-4 pr-12 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary text-theme placeholder:text-theme-muted"
						/>
						<button
							type="button"
							onclick={() => showPassword = !showPassword}
							class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-menu-hover transition-colors"
							aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
						>
							<Icon name={showPassword ? 'eye-off' : 'eye'} size={20} class="text-theme-muted" />
						</button>
					</div>

					<button
						type="button"
						onclick={() => switchMode('forgot-password')}
						class="mb-4 flex h-10 w-full items-center justify-center rounded-xl font-medium transition-all bg-content hover:bg-menu-hover text-theme border border-theme"
					>
						{$t('auth.forgot_password')}
					</button>

					<div class="mb-0 flex flex-col gap-4">
						<button
							type="submit"
							disabled={loading}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="sign-in" size={20} />
							{loading ? $t('auth.logging_in') : $t('auth.sign_in')}
						</button>
					</div>
				</form>

				<!-- Divider -->
				<div class="my-4 flex items-center gap-3">
					<div class="flex-1 border-t border-theme-light"></div>
					<p class="text-xs text-theme-muted">{$t('common.or')}</p>
					<div class="flex-1 border-t border-theme-light"></div>
				</div>

				<!-- Social Sign-In Options -->
				<div class="mb-4 flex flex-col gap-2">
					<GoogleSignInButton />
					<AppleSignInButton />
				</div>

				<!-- Back Button -->
				<div class="mt-4">
					<button
						onclick={() => {
							resetForm();
							switchMode('initial');
						}}
						class="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:bg-menu-hover text-theme"
					>
						<Icon name="arrow-left" size={20} />
						{$t('auth.back')}
					</button>
				</div>

			<!-- Forgot Password Mode -->
			{:else if mode === 'forgot-password'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleForgotPassword();
					}}
					class="pb-4"
				>
					<p class="mb-4 text-sm text-theme-secondary">
						{$t('auth.reset_password_description')}
					</p>

					<div class="mb-4">
						<input
							type="email"
							bind:value={email}
							placeholder={$t('auth.email')}
							required
							class="h-14 w-full rounded-xl border border-theme bg-content px-4 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary text-theme placeholder:text-theme-muted"
						/>
					</div>

					<div class="flex flex-col gap-4">
						<button
							type="submit"
							disabled={loading}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="key" size={20} />
							{loading ? $t('auth.sending') : $t('auth.reset_password')}
						</button>

						<button
							type="button"
							onclick={() => {
								resetForm();
								switchMode('login');
							}}
							class="flex h-10 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:bg-menu-hover text-theme"
						>
							<Icon name="arrow-left" size={20} />
							{$t('auth.back')}
						</button>
					</div>
				</form>

			<!-- Password Reset Success Mode -->
			{:else if mode === 'password-reset-success'}
				<div class="pb-4">
					<div class="flex flex-col items-center mb-6">
						<div
							class="w-20 h-20 rounded-full flex items-center justify-center mb-6"
							style="background-color: {getPrimaryColor()}30;"
						>
							<Icon name="mail-open" size={40} color={getPrimaryColor()} />
						</div>

						<p class="text-sm text-theme-secondary text-center px-2">
							{$t('auth.reset_email_sent_description').replace('{email}', resetEmail)}
						</p>
					</div>

					<div class="flex flex-col gap-3">
						<button
							onclick={() => {
								resetEmail = '';
								switchMode('login');
							}}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="sign-in" size={20} />
							{$t('auth.back_to_login')}
						</button>

						<button
							onclick={() => switchMode('forgot-password')}
							class="flex h-10 items-center justify-center gap-2 rounded-xl font-medium transition-all bg-content hover:bg-menu-hover text-theme border border-theme"
						>
							{$t('auth.resend_email')}
						</button>
					</div>
				</div>
			{/if}

		</div>
	</div>

	<!-- Bottom Section - App Slider -->
	{#if mode === 'initial'}
		<div class="w-full pb-8 px-2 pt-4">
			<AppSlider />
		</div>
	{/if}

	<!-- Mana Login Info Modal -->
	<Modal
		visible={showManaInfoModal}
		onClose={() => showManaInfoModal = false}
		title="Mana Login"
		maxWidth="lg"
	>
		{#snippet icon()}
			<svg class="h-6 w-6 text-theme" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
			</svg>
		{/snippet}

		{#snippet children()}
			<div class="space-y-4">
				<p class="text-theme">
					Mana Login ist dein zentraler Zugang zu allen Apps im Mana-Ökosystem. Mit einem
					einzigen Account kannst du dich bei allen Mana-Anwendungen anmelden.
				</p>

				<div class="space-y-2">
					<h4 class="font-semibold text-theme mb-1">Vorteile:</h4>

					<div class="rounded-xl bg-content p-3 border border-theme flex items-start gap-2">
						<svg class="h-5 w-5 text-theme flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
						</svg>
						<span class="text-theme">{$t('auth.mana_login_benefit_0')}</span>
					</div>

					<div class="rounded-xl bg-content p-3 border border-theme flex items-start gap-2">
						<Icon name="key" size={20} class="text-theme flex-shrink-0 mt-0.5" />
						<span class="text-theme">Ein Login für alle Mana Apps</span>
					</div>

					<div class="rounded-xl bg-content p-3 border border-theme flex items-start gap-2">
						<Icon name="shield-check" size={20} class="text-theme flex-shrink-0 mt-0.5" />
						<span class="text-theme">Sichere Authentifizierung mit modernen Standards</span>
					</div>

					<div class="rounded-xl bg-content p-3 border border-theme flex items-start gap-2">
						<Icon name="arrows-left-right" size={20} class="text-theme flex-shrink-0 mt-0.5" />
						<span class="text-theme">Synchronisation deiner Einstellungen über alle Apps hinweg</span>
					</div>

					<div class="rounded-xl bg-content p-3 border border-theme flex items-start gap-2">
						<Icon name="folder" size={20} class="text-theme flex-shrink-0 mt-0.5" />
						<span class="text-theme">Einfache Verwaltung deiner Daten an einem zentralen Ort</span>
					</div>
				</div>

				<p class="text-sm text-theme">
					Weitere Mana Apps werden in Zukunft hinzugefügt und können dann ebenfalls mit deinem
					Mana Login genutzt werden.
				</p>
			</div>
		{/snippet}

		{#snippet footer()}
			<button
				onclick={() => showManaInfoModal = false}
				class="w-full px-6 py-2 rounded-xl font-medium bg-content hover:bg-menu-hover text-theme border border-theme transition-colors"
			>
				Verstanden
			</button>
		{/snippet}
	</Modal>
</div>
