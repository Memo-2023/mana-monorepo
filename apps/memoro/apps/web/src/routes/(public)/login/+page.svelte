<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import MemoroLogo from '$lib/components/MemoroLogo.svelte';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';

	import { theme } from '$lib/stores/theme';
	import { ringsInitialized } from '$lib/stores/ringsInitialized';
	import { t } from 'svelte-i18n';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';

	// Check if rings should show intro animation (only on first load)
	let showIntro = $state(!$ringsInitialized);
	let ringReaction = $state<'none' | 'pulse'>('none');

	onMount(() => {
		// Mark rings as initialized after intro animation completes
		if (!$ringsInitialized) {
			setTimeout(() => {
				ringsInitialized.set(true);
			}, 1200); // After intro animation finishes
		}
	});

	// Trigger ring reaction animation before navigation
	function triggerRingReaction(callback: () => void) {
		ringReaction = 'pulse';
		setTimeout(() => {
			callback();
			// Reset after navigation
			setTimeout(() => {
				ringReaction = 'none';
			}, 100);
		}, 300); // Short delay to show reaction
	}

	type AuthMode = 'initial' | 'login' | 'forgot-password' | 'password-reset-success';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');
	let password = $state('');
	let mode = $state<AuthMode>('initial');
	let showManaInfoModal = $state(false);
	let showMemoroInfoModal = $state(false);
	let resetEmail = $state(''); // Store email for success message
	let showPassword = $state(false); // Toggle password visibility
	let emailInput: HTMLInputElement | null = $state(null);

	// Auto-focus email input when switching to login mode
	$effect(() => {
		if (mode === 'login' && emailInput) {
			setTimeout(() => emailInput?.focus(), 100);
		}
	});

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
				special: false,
			};
		}

		return {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^a-zA-Z0-9]/.test(password),
		};
	});

	// Display OAuth error from URL if present
	let oauthErrorRaw = $derived($page.url.searchParams.get('error'));
	let oauthError = $derived.by(() => {
		if (!oauthErrorRaw) return null;

		// Map OAuth error codes to translation keys
		const errorMap: Record<string, string> = {
			access_denied: 'auth.oauth_error_access_denied',
			server_error: 'auth.oauth_error_server_error',
			temporarily_unavailable: 'auth.oauth_error_temporarily_unavailable',
			invalid_request: 'auth.oauth_error_invalid_request',
			unauthorized_client: 'auth.oauth_error_unauthorized_client',
			unsupported_response_type: 'auth.oauth_error_unsupported_response_type',
			invalid_scope: 'auth.oauth_error_invalid_scope',
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
				ocean: '#039BE5',
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5',
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
				ocean: '#121212',
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#dddddd',
				nature: '#FBFDF8',
				stone: '#F5F7F9',
				ocean: '#F5FCFF',
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

		const result = await authStore.signIn(email, password);

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
		const result = await authStore.resetPassword(email);

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
	class="flex min-h-screen flex-col justify-between relative overflow-hidden"
	style="background-color: {getPageBackground()};"
>
	<!-- Concentric Circles Background -->
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<svg
			class="min-w-full min-h-full"
			style="width: max(100vw, 100vh); height: max(100vw, 100vh);"
			viewBox="0 0 1000 1000"
			fill="none"
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
		>
			{#each [480, 420, 360, 300, 240, 180, 120, 60] as radius, i}
				<circle
					cx="500"
					cy="500"
					r={radius}
					class="ripple-circle {showIntro ? 'with-intro' : ''} {ringReaction === 'pulse'
						? 'react-pulse'
						: ''}"
					style="--delay: {(7 - i) * 0.15}s; --intro-delay: {(7 - i) * 0.08}s; --react-delay: {(7 -
						i) *
						0.03}s; --base-opacity: {0.1 + i * 0.1}; --base-stroke: {1 + i * 0.5};"
				/>
			{/each}
		</svg>
	</div>

	<!-- Language Selector and Theme Toggle in top right -->
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3">
		<LanguageSelector />
		<ThemeToggle />
	</div>

	<!-- Auth Container -->
	<div class="flex-1 flex items-center justify-center px-5 py-8">
		<div
			class="w-full max-w-md rounded-xl p-6 aspect-square flex flex-col"
			style="background-color: {isDark
				? 'rgba(255, 255, 255, 0.1)'
				: 'rgba(255, 255, 255, 0.6)'}; backdrop-filter: blur(20px); border: 1px solid {isDark
				? 'rgba(255, 255, 255, 0.2)'
				: 'rgba(0, 0, 0, 0.1)'};"
		>
			<!-- Logo Section: Two-column card layout -->
			{#if mode === 'initial'}
				<div class="mb-6">
					<div class="grid grid-cols-2 gap-3">
						<!-- Memoro Card (square, clickable) -->
						<button
							onclick={() => (showMemoroInfoModal = true)}
							class="flex flex-col items-center justify-center rounded-xl aspect-square cursor-pointer transition-all hover:scale-[1.02]"
							style="background-color: {isDark
								? 'rgba(255, 255, 255, 0.05)'
								: 'rgba(0, 0, 0, 0.03)'}; border: 1px solid {isDark
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.08)'};"
						>
							<MemoroLogo size={50} color={getPrimaryColor()} />
							<span
								class="text-lg font-semibold mt-2"
								style="color: {isDark ? '#ffffff' : '#000000'};"
							>
								Memoro
							</span>
						</button>

						<!-- Mana Card (square, clickable) -->
						<button
							onclick={() => (showManaInfoModal = true)}
							class="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all hover:scale-[1.02] aspect-square"
							style="background-color: {isDark
								? 'rgba(3, 155, 229, 0.1)'
								: 'rgba(3, 155, 229, 0.08)'}; border: 1px solid {isDark
								? 'rgba(3, 155, 229, 0.3)'
								: 'rgba(3, 155, 229, 0.2)'};"
						>
							<svg class="w-14 h-14" viewBox="0 0 24 24" fill="#039BE5">
								<path
									d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
								/>
							</svg>
							<span class="text-lg font-bold mt-2" style="color: #039BE5;">Mana</span>
						</button>
					</div>

					<!-- Powered by text -->
					<p
						class="text-center text-sm mt-4"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};"
					>
						powered by <button
							onclick={() => (showManaInfoModal = true)}
							class="font-semibold underline hover:opacity-80 transition-opacity"
							style="color: #039BE5;">Mana</button
						>
					</p>
				</div>
			{:else}
				<div class="mb-6">
					<h2 class="text-center text-xl font-semibold text-theme">
						{#if mode === 'login'}
							{$t('auth.sign_in')}
						{:else if mode === 'forgot-password'}
							{$t('auth.reset_password')}
						{:else if mode === 'password-reset-success'}
							{$t('auth.reset_email_sent_title')}
						{/if}
					</h2>
				</div>
			{/if}

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
						onclick={() => triggerRingReaction(() => goto('/register'))}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
						style="background-color: rgba(3, 155, 229, 0.3); border-color: #039BE5; color: {isDark
							? '#ffffff'
							: '#000000'};"
					>
						<Icon name="user-plus" size={20} />
						{$t('auth.create_account')}
					</button>

					<button
						onclick={() => triggerRingReaction(() => switchMode('login'))}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
						style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark
							? '#ffffff'
							: '#000000'};"
					>
						<Icon name="sign-in" size={20} />
						{$t('auth.sign_in')}
					</button>
				</div>

				<!-- Terms and Privacy -->
				<p class="mt-4 text-sm text-center text-theme-muted px-2">
					{@html $t('auth.terms_agreement')}
				</p>

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
							bind:this={emailInput}
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
							onclick={() => (showPassword = !showPassword)}
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
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark
								? '#ffffff'
								: '#000000'};"
						>
							<Icon name="sign-in" size={20} />
							{loading ? $t('auth.logging_in') : $t('auth.sign_in')}
						</button>
					</div>
				</form>

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
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark
								? '#ffffff'
								: '#000000'};"
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
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark
								? '#ffffff'
								: '#000000'};"
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

	<!-- Bottom Section - App Slider (hidden) -->
	<!-- {#if mode === 'initial'}
		<div class="w-full pb-8 px-2 pt-4">
			<AppSlider />
		</div>
	{/if} -->

	<!-- Mana Info Modal -->
	<Modal
		visible={showManaInfoModal}
		onClose={() => (showManaInfoModal = false)}
		title="Mana"
		maxWidth="md"
		transparentBackdrop={true}
	>
		{#snippet icon()}
			<svg class="h-6 w-6" viewBox="0 0 24 24" fill="#039BE5">
				<path
					d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
				/>
			</svg>
		{/snippet}

		{#snippet children()}
			<div class="space-y-3">
				<p class="text-sm text-theme-muted leading-relaxed">
					Mana ist dein zentraler Zugang zu allen Apps im Mana-Ökosystem. Ein Account für alle
					Mana-Anwendungen.
				</p>

				<div class="space-y-1.5">
					<h4 class="text-sm font-semibold" style="color: #039BE5;">Vorteile</h4>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: rgba(3, 155, 229, 0.08); border: 1px solid rgba(3, 155, 229, 0.2);"
					>
						<svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="#039BE5">
							<path
								d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z"
							/>
						</svg>
						<span class="text-sm text-theme">{$t('auth.mana_login_benefit_0')}</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: rgba(3, 155, 229, 0.08); border: 1px solid rgba(3, 155, 229, 0.2);"
					>
						<span style="color: #039BE5;"><Icon name="key" size={16} class="flex-shrink-0" /></span>
						<span class="text-sm text-theme">Ein Login für alle Mana Apps</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: rgba(3, 155, 229, 0.08); border: 1px solid rgba(3, 155, 229, 0.2);"
					>
						<span style="color: #039BE5;"
							><Icon name="shield-check" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Sichere Authentifizierung</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: rgba(3, 155, 229, 0.08); border: 1px solid rgba(3, 155, 229, 0.2);"
					>
						<span style="color: #039BE5;"
							><Icon name="arrows-left-right" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Sync über alle Apps</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: rgba(3, 155, 229, 0.08); border: 1px solid rgba(3, 155, 229, 0.2);"
					>
						<span style="color: #039BE5;"
							><Icon name="folder" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Zentrale Datenverwaltung</span>
					</div>
				</div>

				<p class="text-xs text-theme-muted">Weitere Mana Apps folgen in Zukunft.</p>
			</div>
		{/snippet}

		{#snippet footer()}
			<button
				onclick={() => (showManaInfoModal = false)}
				class="w-full py-2.5 rounded-lg font-medium text-sm transition-colors hover:opacity-90"
				style="background-color: #039BE5; color: white;"
			>
				Verstanden
			</button>
		{/snippet}
	</Modal>

	<!-- Memoro Info Modal -->
	<Modal
		visible={showMemoroInfoModal}
		onClose={() => (showMemoroInfoModal = false)}
		title="Memoro"
		maxWidth="md"
		transparentBackdrop={true}
	>
		{#snippet icon()}
			<div class="h-6 w-6">
				<MemoroLogo size={24} color={getPrimaryColor()} />
			</div>
		{/snippet}

		{#snippet children()}
			<div class="space-y-3">
				<p class="text-sm text-theme-muted leading-relaxed">
					Memoro ist dein KI-gestützter Sprachassistent für Notizen und Memos. Nimm Gedanken auf und
					lass sie automatisch transkribieren und analysieren.
				</p>

				<div class="space-y-1.5">
					<h4 class="text-sm font-semibold" style="color: {getPrimaryColor()};">Features</h4>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: {isDark
							? 'rgba(255, 255, 255, 0.05)'
							: 'rgba(0, 0, 0, 0.03)'}; border: 1px solid {isDark
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(0, 0, 0, 0.08)'};"
					>
						<span style="color: {getPrimaryColor()};"
							><Icon name="microphone" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Sprachaufnahmen mit einem Klick</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: {isDark
							? 'rgba(255, 255, 255, 0.05)'
							: 'rgba(0, 0, 0, 0.03)'}; border: 1px solid {isDark
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(0, 0, 0, 0.08)'};"
					>
						<span style="color: {getPrimaryColor()};"
							><Icon name="file" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Automatische Transkription</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: {isDark
							? 'rgba(255, 255, 255, 0.05)'
							: 'rgba(0, 0, 0, 0.03)'}; border: 1px solid {isDark
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(0, 0, 0, 0.08)'};"
					>
						<span style="color: {getPrimaryColor()};"
							><Icon name="star" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">KI-gestützte Analyse & Zusammenfassung</span>
					</div>

					<div
						class="rounded-lg p-2.5 flex items-center gap-2.5"
						style="background-color: {isDark
							? 'rgba(255, 255, 255, 0.05)'
							: 'rgba(0, 0, 0, 0.03)'}; border: 1px solid {isDark
							? 'rgba(255, 255, 255, 0.1)'
							: 'rgba(0, 0, 0, 0.08)'};"
					>
						<span style="color: {getPrimaryColor()};"
							><Icon name="download" size={16} class="flex-shrink-0" /></span
						>
						<span class="text-sm text-theme">Verfügbar auf iOS, Android & Web</span>
					</div>
				</div>

				<p class="text-xs text-theme-muted">Memoro nutzt Mana für sichere Authentifizierung.</p>
			</div>
		{/snippet}

		{#snippet footer()}
			<button
				onclick={() => (showMemoroInfoModal = false)}
				class="w-full py-2.5 rounded-lg font-medium text-sm transition-colors hover:opacity-90"
				style="background-color: {getPrimaryColor()}; color: {isDark ? '#000000' : '#000000'};"
			>
				Verstanden
			</button>
		{/snippet}
	</Modal>
</div>

<style>
	/* Base circle styles - breathing animation only (default) */
	.ripple-circle {
		opacity: var(--base-opacity);
		transform-origin: center;
		stroke: #f8d62b;
		stroke-width: var(--base-stroke);
		animation: combo 10s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		animation-delay: var(--delay);
		will-change: opacity, transform, stroke-width, stroke, filter;
	}

	/* With intro animation (only on first page load) */
	.ripple-circle.with-intro {
		opacity: 0;
		animation:
			droplet-intro 1s ease-out forwards,
			combo 10s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		animation-delay: var(--intro-delay), calc(1.2s + var(--delay));
	}

	/* Intro animation - subtle droplet ripple from center */
	@keyframes droplet-intro {
		0% {
			opacity: 0;
			transform: scale(0.98);
			stroke-width: var(--base-stroke);
			stroke: #f8d62b;
			filter: brightness(1);
		}
		70% {
			opacity: calc(var(--base-opacity) * 1.1);
			transform: scale(1.003);
			stroke-width: calc(var(--base-stroke) * 1.05);
			stroke: #f8d62b;
			filter: brightness(1.05);
		}
		100% {
			opacity: var(--base-opacity);
			transform: scale(1);
			stroke-width: var(--base-stroke);
			stroke: #f8d62b;
			filter: brightness(1);
		}
	}

	/* Reaction animation - quick pulse when clicking navigation buttons */
	.ripple-circle.react-pulse {
		animation:
			react-pulse 0.4s ease-out forwards,
			combo 10s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		animation-delay: var(--react-delay), calc(0.4s + var(--delay));
	}

	@keyframes react-pulse {
		0% {
			opacity: var(--base-opacity);
			transform: scale(1);
			stroke-width: var(--base-stroke);
			filter: brightness(1);
		}
		50% {
			opacity: calc(var(--base-opacity) * 1.3);
			transform: scale(1.008);
			stroke-width: calc(var(--base-stroke) * 1.2);
			filter: brightness(1.15);
		}
		100% {
			opacity: var(--base-opacity);
			transform: scale(1);
			stroke-width: var(--base-stroke);
			filter: brightness(1);
		}
	}

	@keyframes combo {
		/* Start - Ausatmen beendet */
		0% {
			opacity: calc(var(--base-opacity) * 0.7);
			transform: scale(0.998);
			stroke-width: calc(var(--base-stroke) * 0.9);
			stroke: #e6b800;
			filter: brightness(0.95);
		}
		/* Einatmen Mitte */
		20% {
			opacity: calc(var(--base-opacity) * 0.95);
			transform: scale(1.001);
			stroke-width: calc(var(--base-stroke) * 1.025);
			stroke: #f0c800;
			filter: brightness(1.015);
		}
		/* 40% = 4s Einatmen abgeschlossen */
		40% {
			opacity: calc(var(--base-opacity) * 1.2);
			transform: scale(1.004);
			stroke-width: calc(var(--base-stroke) * 1.15);
			stroke: #f8d62b;
			filter: brightness(1.08);
		}
		/* Ausatmen langsam */
		60% {
			opacity: calc(var(--base-opacity) * 1.05);
			transform: scale(1.002);
			stroke-width: calc(var(--base-stroke) * 1.075);
			stroke: #f4cf20;
			filter: brightness(1.04);
		}
		80% {
			opacity: calc(var(--base-opacity) * 0.85);
			transform: scale(0.999);
			stroke-width: calc(var(--base-stroke) * 0.95);
			stroke: #ebc010;
			filter: brightness(0.98);
		}
		/* 100% = 6s Ausatmen abgeschlossen */
		100% {
			opacity: calc(var(--base-opacity) * 0.7);
			transform: scale(0.998);
			stroke-width: calc(var(--base-stroke) * 0.9);
			stroke: #e6b800;
			filter: brightness(0.95);
		}
	}
</style>
