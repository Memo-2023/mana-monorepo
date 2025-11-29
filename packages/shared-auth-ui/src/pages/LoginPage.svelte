<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import Icon from '../components/Icon.svelte';
	import GoogleSignInButton from '../components/GoogleSignInButton.svelte';
	import AppleSignInButton from '../components/AppleSignInButton.svelte';

	/** Translation strings for the login page */
	export interface LoginTranslations {
		title: string;
		subtitle: string;
		emailPlaceholder: string;
		passwordPlaceholder: string;
		rememberMe: string;
		forgotPassword: string;
		signInButton: string;
		signingIn: string;
		success: string;
		orDivider: string;
		noAccount: string;
		createAccount: string;
		skipToForm: string;
		showPassword: string;
		hidePassword: string;
		// Error messages
		emailRequired: string;
		emailInvalid: string;
		passwordRequired: string;
		signInFailed: string;
		googleSignInFailed: string;
		// Success messages
		signInSuccess: string;
		googleSignInSuccess: string;
	}

	/** Default English translations */
	const defaultTranslations: LoginTranslations = {
		title: 'Sign In',
		subtitle: 'Sign in with your Mana account',
		emailPlaceholder: 'Email',
		passwordPlaceholder: 'Password',
		rememberMe: 'Remember me',
		forgotPassword: 'Forgot password?',
		signInButton: 'Sign In',
		signingIn: 'Signing in...',
		success: 'Success!',
		orDivider: 'or',
		noAccount: "Don't have an account?",
		createAccount: 'Create one',
		skipToForm: 'Skip to login form',
		showPassword: 'Show password',
		hidePassword: 'Hide password',
		emailRequired: 'Email is required',
		emailInvalid: 'Please enter a valid email address',
		passwordRequired: 'Password is required',
		signInFailed: 'Sign in failed',
		googleSignInFailed: 'Google sign in failed',
		signInSuccess: 'Successfully signed in. Redirecting...',
		googleSignInSuccess: 'Successfully signed in with Google. Redirecting...',
	};

	interface Props {
		/** App name */
		appName: string;
		/** Logo component */
		logo: Component<{ size?: number; color?: string }>;
		/** Primary color (hex) */
		primaryColor: string;
		/** Sign in function */
		onSignIn: (email: string, password: string) => Promise<AuthResult>;
		/** Sign in with Google function */
		onSignInWithGoogle?: (idToken: string) => Promise<AuthResult>;
		/** Sign in with Apple function */
		onSignInWithApple?: (identityToken: string) => Promise<AuthResult>;
		/** Navigation function */
		goto: (path: string) => void;
		/** Enable Google Sign-In */
		enableGoogle?: boolean;
		/** Enable Apple Sign-In */
		enableApple?: boolean;
		/** Success redirect path */
		successRedirect?: string;
		/** Register page path */
		registerPath?: string;
		/** Forgot password page path */
		forgotPasswordPath?: string;
		/** Light background color */
		lightBackground?: string;
		/** Dark background color */
		darkBackground?: string;
		/** AppSlider snippet to render at the bottom (optional) */
		appSlider?: Snippet;
		/** Header snippet for controls like theme toggle and language selector */
		headerControls?: Snippet;
		/** Translations for i18n support */
		translations?: Partial<LoginTranslations>;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onSignIn,
		onSignInWithGoogle,
		onSignInWithApple,
		goto,
		enableGoogle = false,
		enableApple = false,
		successRedirect = '/dashboard',
		registerPath = '/register',
		forgotPasswordPath = '/forgot-password',
		lightBackground = '#f5f5f5',
		darkBackground = '#121212',
		appSlider,
		headerControls,
		translations = {},
	}: Props = $props();

	// Merge provided translations with defaults
	const t = $derived({ ...defaultTranslations, ...translations });

	let loading = $state(false);
	let error = $state<string | null>(null);
	let errorField = $state<'email' | 'password' | 'general' | null>(null);
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let rememberMe = $state(false);
	let showSuccess = $state(false);
	let shakeError = $state(false);
	let emailInput: HTMLInputElement;
	let passwordInput: HTMLInputElement;
	let successAnnouncement = $state('');

	// Check for dark mode
	let isDark = $state(false);
	$effect(() => {
		if (typeof window !== 'undefined') {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const listener = (e: MediaQueryListEvent) => {
				isDark = e.matches;
			};
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
			return () => {
				window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
			};
		}
	});

	// Autofocus email field on mount
	$effect(() => {
		if (emailInput) {
			emailInput.focus();
		}
	});

	function getPageBackground() {
		return isDark ? darkBackground : lightBackground;
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function triggerErrorShake() {
		shakeError = true;
		setTimeout(() => {
			shakeError = false;
		}, 500);
	}

	function setError(message: string, field: 'email' | 'password' | 'general' = 'general') {
		error = message;
		errorField = field;
		triggerErrorShake();

		// Focus the problematic field for better accessibility
		setTimeout(() => {
			if (field === 'email' && emailInput) {
				emailInput.focus();
			} else if (field === 'password' && passwordInput) {
				passwordInput.focus();
			}
		}, 100);
	}

	function clearError() {
		error = null;
		errorField = null;
	}

	async function handleLogin() {
		loading = true;
		clearError();

		if (!email) {
			setError(t.emailRequired, 'email');
			loading = false;
			return;
		}

		if (!isValidEmail(email)) {
			setError(t.emailInvalid, 'email');
			loading = false;
			return;
		}

		if (!password) {
			setError(t.passwordRequired, 'password');
			loading = false;
			return;
		}

		const result = await onSignIn(email, password);

		loading = false;

		if (result.success) {
			// Show success feedback before redirect
			showSuccess = true;
			successAnnouncement = t.signInSuccess;
			setTimeout(() => {
				goto(successRedirect);
			}, 600);
		} else {
			setError(result.error || t.signInFailed, 'general');
		}
	}

	async function handleGoogleSuccess(idToken: string) {
		if (!onSignInWithGoogle) return;

		loading = true;
		clearError();

		const result = await onSignInWithGoogle(idToken);
		loading = false;

		if (result.success) {
			showSuccess = true;
			successAnnouncement = t.googleSignInSuccess;
			setTimeout(() => {
				goto(successRedirect);
			}, 600);
		} else {
			setError(result.error || t.googleSignInFailed, 'general');
		}
	}

	function skipToForm() {
		if (emailInput) {
			emailInput.focus();
		}
	}

	// Dev credentials auto-fill (only works in development)
	function fillDevCredentials() {
		email = 'till.schneider@memoro.ai';
		password = 'Aa-12345678';
	}
</script>

<svelte:head>
	<title>Login - {appName}</title>
</svelte:head>

<!-- Skip Link for keyboard users -->
<button class="skip-link" onclick={skipToForm} type="button">
	{t.skipToForm}
</button>

<!-- Screen reader announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{successAnnouncement}
</div>

<div
	class="flex min-h-screen flex-col justify-between"
	style="background-color: {getPageBackground()};"
>
	<!-- Header Controls (Theme Toggle, Language Selector, etc.) -->
	{#if headerControls}
		<div class="absolute right-4 top-4 z-50 flex items-center gap-3 opacity-60">
			{@render headerControls()}
		</div>
	{/if}

	<main>
		<!-- Top Section - Logo -->
		<div class="flex flex-col items-center justify-center pt-16 pb-8">
			<button
				type="button"
				onclick={fillDevCredentials}
				class="flex items-center justify-center rounded-full transition-all mb-4 cursor-pointer hover:scale-105 active:scale-95"
				class:success-pulse={showSuccess}
				style="width: 120px; height: 120px; border: 3px solid {showSuccess
					? '#22c55e'
					: primaryColor}; background-color: {isDark ? '#000' : '#fff'}; box-shadow: {isDark
					? '0 6px 12px rgba(0, 0, 0, 0.4)'
					: '0 6px 12px rgba(0, 0, 0, 0.15)'};"
				aria-label="{appName} logo - Click to fill dev credentials"
			>
				{#if showSuccess}
					<Icon name="check" size={55} color="#22c55e" />
				{:else}
					<Logo size={55} color={primaryColor} />
				{/if}
			</button>
			<h1 class="text-2xl font-semibold" style="color: {isDark ? '#ffffff' : '#000000'};">
				{appName}
			</h1>
		</div>

		<!-- Middle Section - Auth Form -->
		<div class="flex-1 flex items-start justify-center px-5 pt-8 pb-8">
			<div
				class="w-full max-w-md rounded-xl p-6"
				class:shake={shakeError}
				style="background-color: {isDark
					? 'rgba(255, 255, 255, 0.08)'
					: 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark
					? 'rgba(255, 255, 255, 0.1)'
					: 'rgba(0, 0, 0, 0.1)'};"
			>
				<!-- Title -->
				<div class="mb-6">
					<h2
						class="text-center text-xl font-semibold"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};"
					>
						{t.title}
					</h2>
					<p
						class="mt-2 text-sm text-center"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
					>
						{t.subtitle}
					</p>
				</div>

				<!-- Error Messages -->
				{#if error}
					<div
						id="form-error"
						role="alert"
						aria-live="assertive"
						class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3 flex items-center gap-2"
					>
						<Icon name="warning" size={18} color="#ef4444" />
						<p class="text-sm text-red-500">{error}</p>
					</div>
				{/if}

				<!-- Login Form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleLogin();
					}}
					class="pb-4"
					aria-busy={loading}
					aria-describedby={error ? 'form-error' : undefined}
				>
					<!-- Email Field -->
					<div class="mb-3">
						<label for="email" class="sr-only">{t.emailPlaceholder}</label>
						<input
							id="email"
							type="email"
							bind:this={emailInput}
							bind:value={email}
							placeholder={t.emailPlaceholder}
							required
							autocomplete="email"
							aria-invalid={errorField === 'email'}
							aria-describedby={errorField === 'email' ? 'form-error' : undefined}
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(255, 255, 255, 0.8)'}; border-color: {errorField === 'email'
								? '#ef4444'
								: isDark
									? 'rgba(255, 255, 255, 0.2)'
									: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
								? '#ffffff'
								: '#000000'}; --tw-ring-color: {errorField === 'email' ? '#ef4444' : primaryColor};"
						/>
					</div>

					<!-- Password Field -->
					<div class="mb-3 relative">
						<label for="password" class="sr-only">{t.passwordPlaceholder}</label>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:this={passwordInput}
							bind:value={password}
							placeholder={t.passwordPlaceholder}
							required
							autocomplete="current-password"
							aria-invalid={errorField === 'password'}
							aria-describedby={errorField === 'password' ? 'form-error' : undefined}
							class="h-14 w-full rounded-xl border px-4 pr-12 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(255, 255, 255, 0.8)'}; border-color: {errorField === 'password'
								? '#ef4444'
								: isDark
									? 'rgba(255, 255, 255, 0.2)'
									: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
								? '#ffffff'
								: '#000000'}; --tw-ring-color: {errorField === 'password'
								? '#ef4444'
								: primaryColor};"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors touch-target flex items-center justify-center"
							aria-label={showPassword ? t.hidePassword : t.showPassword}
							aria-pressed={showPassword}
							title={showPassword ? t.hidePassword : t.showPassword}
						>
							<Icon
								name={showPassword ? 'eye-off' : 'eye'}
								size={20}
								color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
							/>
						</button>
					</div>

					<!-- Remember Me & Forgot Password Row -->
					<div class="mb-4 flex items-center justify-between">
						<label class="flex items-center gap-2 cursor-pointer touch-target">
							<input
								type="checkbox"
								bind:checked={rememberMe}
								class="w-5 h-5 rounded border-2 transition-colors cursor-pointer"
								style="accent-color: {primaryColor};"
							/>
							<span
								class="text-sm"
								style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};"
							>
								{t.rememberMe}
							</span>
						</label>

						<button
							type="button"
							onclick={() => goto(forgotPasswordPath)}
							class="text-sm font-medium transition-opacity hover:opacity-70 touch-target flex items-center justify-center px-2"
							style="color: {primaryColor};"
						>
							{t.forgotPassword}
						</button>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading || showSuccess}
						aria-disabled={loading || showSuccess}
						class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2 touch-target"
						style="background-color: {showSuccess
							? '#22c55e'
							: primaryColor + '60'}; border-color: {showSuccess
							? '#22c55e'
							: primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						{#if loading}
							<svg
								class="spinner w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
								<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
							</svg>
							<span>{t.signingIn}</span>
						{:else if showSuccess}
							<Icon name="check" size={20} />
							<span>{t.success}</span>
						{:else}
							<Icon name="sign-in" size={20} />
							<span>{t.signInButton}</span>
						{/if}
					</button>
				</form>

				<!-- Social Login -->
				{#if enableGoogle || enableApple}
					<div class="my-4 flex items-center gap-3" role="separator" aria-orientation="horizontal">
						<div
							class="flex-1 border-t"
							style="border-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
						></div>
						<span
							class="text-xs"
							style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
							>{t.orDivider}</span
						>
						<div
							class="flex-1 border-t"
							style="border-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
						></div>
					</div>

					<div class="mb-4 flex flex-col gap-2" role="group" aria-label="Social login options">
						{#if enableGoogle && onSignInWithGoogle}
							<GoogleSignInButton onSuccess={handleGoogleSuccess} />
						{/if}
						{#if enableApple}
							<AppleSignInButton />
						{/if}
					</div>
				{/if}

				<!-- Register Link -->
				<div class="mt-4 text-center">
					<p
						class="text-sm"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
					>
						{t.noAccount}
						<button
							type="button"
							onclick={() => goto(registerPath)}
							class="font-medium transition-opacity hover:opacity-70 touch-target inline-flex items-center justify-center px-1"
							style="color: {primaryColor};"
						>
							{t.createAccount}
						</button>
					</p>
				</div>
			</div>
		</div>
	</main>

	<!-- App Slider -->
	{#if appSlider}
		<div class="w-full pb-8 px-2 pt-4">
			{@render appSlider()}
		</div>
	{:else}
		<!-- Bottom padding -->
		<div class="pb-8"></div>
	{/if}
</div>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-4px);
		}
		20%,
		40%,
		60%,
		80% {
			transform: translateX(4px);
		}
	}

	.shake {
		animation: shake 0.5s ease-in-out;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes success-pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.05);
			opacity: 0.9;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.success-pulse {
		animation: success-pulse 0.6s ease-in-out;
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		.shake,
		.spinner,
		.success-pulse {
			animation: none;
		}

		* {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* Skip link styling */
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: #000;
		color: #fff;
		padding: 8px 16px;
		z-index: 100;
		text-decoration: none;
		font-weight: 500;
	}

	.skip-link:focus {
		top: 0;
	}

	/* Ensure minimum touch target size (44x44px) */
	.touch-target {
		min-width: 44px;
		min-height: 44px;
	}
</style>
