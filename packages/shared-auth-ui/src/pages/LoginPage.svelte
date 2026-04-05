<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import { Check, Warning, Eye, EyeSlash, SignIn, Sun, Moon } from '@mana/shared-icons';
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
		emailRequired: string;
		emailInvalid: string;
		passwordRequired: string;
		signInFailed: string;
		invalidCredentials?: string;
		signInSuccess: string;
		emailVerified?: string;
		emailNotVerified?: string;
		resendVerification?: string;
		resendingVerification?: string;
		verificationEmailSent?: string;
		twoFactorTitle?: string;
		twoFactorSubtitle?: string;
		twoFactorBackupSubtitle?: string;
		twoFactorBackupPlaceholder?: string;
		twoFactorTrustDevice?: string;
		twoFactorVerifying?: string;
		twoFactorConfirm?: string;
		twoFactorUseAuthenticator?: string;
		twoFactorUseBackupCode?: string;
		twoFactorBackToLogin?: string;
		accountLocked?: string;
		tooManyAttempts?: string;
		retryIn?: string;
		resetPassword?: string;
		magicLinkSent?: string;
		magicLinkSending?: string;
		magicLinkButton?: string;
	}

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
		invalidCredentials: 'Invalid email or password',
		signInSuccess: 'Successfully signed in. Redirecting...',
		emailVerified: 'Email successfully verified! Please sign in.',
		emailNotVerified: 'Email not verified.',
		resendVerification: 'Resend verification email',
		resendingVerification: 'Sending...',
		verificationEmailSent: 'Verification email sent! Please check your inbox.',
		twoFactorTitle: 'Zwei-Faktor-Authentifizierung',
		twoFactorSubtitle: 'Gib den Code aus deiner Authenticator-App ein',
		twoFactorBackupSubtitle: 'Gib einen Backup-Code ein',
		twoFactorBackupPlaceholder: 'Backup-Code',
		twoFactorTrustDevice: 'Diesem Gerät 30 Tage vertrauen',
		twoFactorVerifying: 'Prüfe...',
		twoFactorConfirm: 'Bestätigen',
		twoFactorUseAuthenticator: 'Authenticator-App verwenden',
		twoFactorUseBackupCode: 'Backup-Code verwenden',
		twoFactorBackToLogin: 'Zurück zum Login',
		accountLocked: 'Konto vorübergehend gesperrt',
		tooManyAttempts: 'Zu viele fehlgeschlagene Anmeldeversuche.',
		retryIn: 'Erneut versuchen in',
		resetPassword: 'Passwort zurücksetzen',
		magicLinkSent: 'Login-Link an {email} gesendet!',
		magicLinkSending: 'Wird gesendet...',
		magicLinkButton: 'Login-Link per E-Mail senden',
	};

	interface Props {
		appName: string;
		logo: Component<{ size?: number; color?: string }>;
		primaryColor: string;
		onSignIn: (email: string, password: string) => Promise<AuthResult>;
		onResendVerification?: (email: string) => Promise<AuthResult>;
		goto: (path: string) => void;
		successRedirect?: string;
		registerPath?: string;
		forgotPasswordPath?: string;
		lightBackground?: string;
		darkBackground?: string;
		appSlider?: Snippet;
		headerControls?: Snippet;
		translations?: Partial<LoginTranslations>;
		/** Show email verified success banner */
		verified?: boolean;
		/** Pre-fill email field (e.g., after email verification) */
		initialEmail?: string;
		/** Pre-fill password field (for dev mode) */
		initialPassword?: string;
		/** App version string to display */
		version?: string;
		/** Build timestamp (ISO string) to display next to version */
		buildTime?: string;
		onSignInWithPasskey?: () => Promise<AuthResult>;
		passkeyAvailable?: boolean;
		onVerifyTwoFactor?: (code: string, trustDevice?: boolean) => Promise<AuthResult>;
		onVerifyBackupCode?: (code: string) => Promise<AuthResult>;
		onSendMagicLink?: (email: string) => Promise<AuthResult>;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onSignIn,
		onResendVerification,
		goto,
		successRedirect = '/dashboard',
		registerPath = '/register',
		forgotPasswordPath = '/forgot-password',
		lightBackground = '#f5f5f5',
		darkBackground = '#121212',
		appSlider,
		headerControls,
		translations = {},
		verified = false,
		initialEmail = '',
		initialPassword = '',
		version = '',
		buildTime = '',
		onSignInWithPasskey,
		passkeyAvailable = false,
		onVerifyTwoFactor,
		onVerifyBackupCode,
		onSendMagicLink,
	}: Props = $props();

	const t = $derived({ ...defaultTranslations, ...translations });

	// Check if we're in development mode (early for state init)
	const isDevMode = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
	// Local dev credentials (run `pnpm db:seed:dev` in mana-auth to create this user)
	const DEV_EMAIL = 'dev@mana.local';
	const DEV_PASSWORD = 'devpassword123';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let errorField = $state<'email' | 'password' | 'general' | null>(null);
	// In dev mode, pre-fill with test credentials
	let email = $state(initialEmail || (isDevMode ? DEV_EMAIL : ''));
	let password = $state(initialPassword || (isDevMode ? DEV_PASSWORD : ''));
	let showPassword = $state(false);
	let rememberMe = $state(false);
	let showSuccess = $state(false);
	let shakeError = $state(false);
	let emailInput = $state<HTMLInputElement | undefined>(undefined);
	let passwordInput = $state<HTMLInputElement | undefined>(undefined);
	let successAnnouncement = $state('');
	let showVerifiedBanner = $state(verified);
	let showEmailNotVerified = $state(false);
	let resendingVerification = $state(false);
	let verificationEmailSent = $state(false);
	let showTwoFactor = $state(false);
	let twoFactorCode = $state('');
	let useBackupCode = $state(false);
	let trustDevice = $state(false);
	let rateLimitCountdown = $state(0);
	let isLockedOut = $state(false);
	let magicLinkSent = $state(false);
	let sendingMagicLink = $state(false);

	$effect(() => {
		if (rateLimitCountdown > 0) {
			const timer = setTimeout(() => {
				rateLimitCountdown--;
			}, 1000);
			return () => clearTimeout(timer);
		} else if (isLockedOut) {
			isLockedOut = false;
		}
	});

	function formatCountdown(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
	}

	// Theme state - can be toggled manually, defaults to system preference
	let userThemePreference = $state<'light' | 'dark' | null>(null);
	let systemIsDark = $state(
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: false
	);

	// Effective dark mode based on user preference or system
	let isDark = $derived(
		userThemePreference !== null ? userThemePreference === 'dark' : systemIsDark
	);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			systemIsDark = mediaQuery.matches;
			const listener = (e: MediaQueryListEvent) => (systemIsDark = e.matches);
			mediaQuery.addEventListener('change', listener);
			return () => mediaQuery.removeEventListener('change', listener);
		}
	});

	function toggleTheme() {
		if (userThemePreference === null) {
			// First toggle: switch to opposite of system
			userThemePreference = systemIsDark ? 'light' : 'dark';
		} else {
			// Subsequent toggles: just flip
			userThemePreference = userThemePreference === 'dark' ? 'light' : 'dark';
		}
	}

	$effect(() => {
		// Focus password field if email is pre-filled, otherwise focus email
		if (initialEmail && passwordInput) {
			passwordInput.focus();
		} else if (emailInput) {
			emailInput.focus();
		}
	});

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function triggerErrorShake() {
		shakeError = true;
		setTimeout(() => (shakeError = false), 500);
	}

	function setError(message: string, field: 'email' | 'password' | 'general' = 'general') {
		error = message;
		errorField = field;
		triggerErrorShake();
		setTimeout(() => {
			if (field === 'email' && emailInput) emailInput.focus();
			else if (field === 'password' && passwordInput) passwordInput.focus();
		}, 100);
	}

	function clearError() {
		error = null;
		errorField = null;
	}

	async function handleLogin() {
		loading = true;
		clearError();
		showEmailNotVerified = false;
		verificationEmailSent = false;

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

		// Check if 2FA is required
		if ((result as any).twoFactorRedirect) {
			showTwoFactor = true;
			return;
		}

		if (result.success) {
			showSuccess = true;
			successAnnouncement = t.signInSuccess;
			setTimeout(() => goto(successRedirect), 600);
		} else if (result.error === 'EMAIL_NOT_VERIFIED') {
			showEmailNotVerified = true;
			setError(t.emailNotVerified || 'Email not verified.', 'general');
		} else {
			const errorMsg = (() => {
				if (result.error === 'INVALID_CREDENTIALS') return t.invalidCredentials || t.signInFailed;
				if (result.error === 'EMAIL_NOT_VERIFIED') return t.emailNotVerified || t.signInFailed;
				return result.error || t.signInFailed;
			})();
			setError(errorMsg, 'general');

			// Detect rate limiting vs account lockout
			if (result.error?.includes('Too Many') || result.error?.includes('rate limit')) {
				rateLimitCountdown = 60; // 1 minute cooldown
			} else if (
				result.error?.includes('temporarily locked') ||
				result.error === 'ACCOUNT_LOCKED'
			) {
				isLockedOut = true;
				rateLimitCountdown = (result as any).retryAfter || 300; // 5 min default
			}
		}
	}

	async function handleResendVerification() {
		if (!onResendVerification || !email || resendingVerification) return;

		resendingVerification = true;
		clearError();

		const result = await onResendVerification(email);
		resendingVerification = false;

		if (result.success) {
			verificationEmailSent = true;
			showEmailNotVerified = false;
		} else {
			setError(result.error || t.signInFailed, 'general');
		}
	}

	async function handleTwoFactorVerify() {
		if (!twoFactorCode) return;
		loading = true;
		clearError();

		if ((useBackupCode && !onVerifyBackupCode) || (!useBackupCode && !onVerifyTwoFactor)) {
			loading = false;
			return;
		}

		const result = useBackupCode
			? await onVerifyBackupCode!(twoFactorCode)
			: await onVerifyTwoFactor!(twoFactorCode, trustDevice);
		loading = false;

		if (result.success) {
			showSuccess = true;
			successAnnouncement = t.signInSuccess;
			setTimeout(() => goto(successRedirect), 600);
		} else {
			setError(result.error || t.signInFailed, 'general');
			twoFactorCode = '';
		}
	}

	async function handlePasskeySignIn() {
		if (!onSignInWithPasskey) return;
		loading = true;
		clearError();

		const result = await onSignInWithPasskey();
		loading = false;

		if (result.success) {
			showSuccess = true;
			successAnnouncement = t.signInSuccess;
			setTimeout(() => goto(successRedirect), 600);
		} else if (result.error === 'Passkey authentication was cancelled') {
			// User cancelled - don't show error
		} else {
			setError(result.error || t.signInFailed, 'general');
		}
	}

	async function handleSendMagicLink() {
		if (!onSendMagicLink || !email) return;
		if (!isValidEmail(email)) {
			setError(t.emailInvalid, 'email');
			return;
		}
		sendingMagicLink = true;
		clearError();
		magicLinkSent = false;

		const result = await onSendMagicLink(email);
		sendingMagicLink = false;

		if (result.success) {
			magicLinkSent = true;
		} else {
			setError(result.error || t.signInFailed, 'general');
		}
	}

	function skipToForm() {
		if (emailInput) emailInput.focus();
	}

	function fillDevCredentials() {
		email = DEV_EMAIL;
		password = DEV_PASSWORD;
	}
</script>

<svelte:head>
	<title>Login - {appName}</title>
	<meta name="theme-color" content={darkBackground} media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content={lightBackground} media="(prefers-color-scheme: light)" />
</svelte:head>

<button
	class="absolute -top-10 left-0 bg-black text-white px-4 py-2 z-[100] font-medium focus:top-0"
	onclick={skipToForm}
	type="button"
>
	{t.skipToForm}
</button>

<div class="sr-only" aria-live="polite" aria-atomic="true">
	{successAnnouncement}
</div>

<div
	class="flex flex-col min-h-screen min-h-dvh w-full max-w-[100vw] overflow-x-hidden m-0 p-0"
	style:background-color={isDark ? darkBackground || '#121212' : lightBackground || '#f5f5f5'}
	style:--primary-color={primaryColor}
>
	<!-- Theme Toggle - Top Left -->
	<button
		type="button"
		onclick={toggleTheme}
		class="absolute top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg border cursor-pointer transition-all"
		style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
		style:background-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
		style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
		aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if isDark}
			<Sun size={20} weight="bold" />
		{:else}
			<Moon size={20} weight="bold" />
		{/if}
	</button>

	{#if headerControls}
		<div class="absolute top-4 right-4 z-50 opacity-60 flex gap-3">
			{@render headerControls()}
		</div>
	{/if}

	<main class="flex-1 flex flex-col items-center justify-center">
		<div class="w-full max-w-[480px] mx-auto px-4 flex flex-col items-center">
			<!-- Logo Section -->
			<div class="flex flex-col items-center pt-8 max-[480px]:pt-6 pb-4 anim-fade-in-scale">
				<button
					type="button"
					onclick={fillDevCredentials}
					class="w-[100px] h-[100px] max-[480px]:w-[80px] max-[480px]:h-[80px] rounded-full border-[3px] flex items-center justify-center mb-3 cursor-pointer transition-transform shadow-lg hover:scale-105 active:scale-95"
					class:success-pulse={showSuccess}
					style:border-color={showSuccess ? '#22c55e' : primaryColor}
					style:background-color={isDark ? '#000' : '#fff'}
					aria-label="{appName} logo"
				>
					{#if showSuccess}
						<Check size={55} class="text-green-500" />
					{:else}
						<Logo size={55} color={primaryColor} />
					{/if}
				</button>
				<h1 class="text-2xl font-semibold" style:color={isDark ? '#fff' : '#000'}>{appName}</h1>
			</div>

			<!-- Form Section -->
			<div class="w-full flex justify-center pt-2 pb-8">
				<div
					class="w-full max-w-[440px] rounded-2xl p-6 max-[480px]:p-5 border backdrop-blur-[10px] anim-fade-in-up"
					class:shake={shakeError}
					style:background-color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}
					style:border-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
				>
					{#if showTwoFactor}
						<!-- 2FA Verification -->
						<div class="text-center mb-6">
							<h2
								class="text-xl font-semibold"
								style:color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'}
							>
								{t.twoFactorTitle}
							</h2>
							<p
								class="text-sm mt-2"
								style:color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
							>
								{useBackupCode ? t.twoFactorBackupSubtitle : t.twoFactorSubtitle}
							</p>
						</div>

						{#if error}
							<div
								class="flex items-start gap-2 p-3 mb-4 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-500"
								role="alert"
							>
								<Warning size={18} class="text-red-500 shrink-0" />
								<p>{error}</p>
							</div>
						{/if}

						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleTwoFactorVerify();
							}}
						>
							<div class="mb-3">
								<input
									type="text"
									bind:value={twoFactorCode}
									placeholder={useBackupCode ? t.twoFactorBackupPlaceholder : '000000'}
									required
									autocomplete="one-time-code"
									inputmode={useBackupCode ? 'text' : 'numeric'}
									maxlength={useBackupCode ? 20 : 6}
									class="w-full h-14 px-4 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
									style:--ring-color={primaryColor}
									style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
									style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
									style:color={isDark ? '#fff' : '#000'}
									style:text-align="center"
									style:font-size="1.5rem"
									style:letter-spacing="0.5rem"
									style:--tw-ring-color="var(--ring-color)"
								/>
							</div>

							{#if !useBackupCode}
								<label
									class="remember-label flex items-center gap-2 cursor-pointer"
									style:margin-bottom="1rem"
									style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
								>
									<input
										type="checkbox"
										bind:checked={trustDevice}
										style:accent-color={primaryColor}
									/>
									<span>{t.twoFactorTrustDevice}</span>
								</label>
							{/if}

							<button
								type="submit"
								disabled={loading || !twoFactorCode}
								aria-disabled={loading || !twoFactorCode}
								class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
								style:background-color={primaryColor + '60'}
								style:border-color={primaryColor}
								style:color={isDark ? '#fff' : '#000'}
							>
								{loading ? t.twoFactorVerifying : t.twoFactorConfirm}
							</button>
						</form>

						<button
							type="button"
							class="bg-transparent border-none cursor-pointer font-medium p-1 hover:opacity-70 block w-full text-center mt-4"
							style:color={primaryColor}
							onclick={() => {
								useBackupCode = !useBackupCode;
								twoFactorCode = '';
								clearError();
							}}
						>
							{useBackupCode ? t.twoFactorUseAuthenticator : t.twoFactorUseBackupCode}
						</button>

						<button
							type="button"
							class="bg-transparent border-none cursor-pointer font-medium p-1 hover:opacity-70 block w-full text-center mt-2"
							style:color={primaryColor}
							onclick={() => {
								showTwoFactor = false;
								twoFactorCode = '';
								useBackupCode = false;
								clearError();
							}}
						>
							{t.twoFactorBackToLogin}
						</button>
					{:else}
						{#if showVerifiedBanner}
							<div
								class="flex items-center gap-2 p-3 mb-4 rounded-xl relative text-sm bg-green-500/15 border border-green-500/30 text-green-500"
								role="status"
								aria-live="polite"
							>
								<Check size={18} class="text-green-500 shrink-0" />
								<p>{t.emailVerified}</p>
								<button
									type="button"
									class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-green-500 text-xl cursor-pointer p-1 leading-none opacity-70 hover:opacity-100"
									onclick={() => (showVerifiedBanner = false)}
									aria-label="Close"
								>
									&times;
								</button>
							</div>
						{/if}

						<div class="text-center mb-6">
							<h2
								class="text-xl font-semibold"
								style:color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'}
							>
								{t.title}
							</h2>
							<p
								class="text-sm mt-2"
								style:color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
							>
								{t.subtitle}
							</p>
						</div>

						{#if passkeyAvailable && onSignInWithPasskey}
							<button
								type="button"
								onclick={handlePasskeySignIn}
								disabled={loading || showSuccess}
								aria-disabled={loading || showSuccess}
								class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity bg-transparent hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
								style:border-color={primaryColor}
								style:color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'}
							>
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
									<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
								</svg>
								<span>Passkey</span>
							</button>
							<div class="divider flex items-center gap-4 my-5">
								<span
									class="text-xs"
									style:color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
									>{t.orDivider}</span
								>
							</div>
						{/if}

						{#if verificationEmailSent}
							<div
								class="flex items-center gap-2 p-3 mb-4 rounded-xl relative text-sm bg-green-500/15 border border-green-500/30 text-green-500"
								role="status"
								aria-live="polite"
							>
								<Check size={18} class="text-green-500 shrink-0" />
								<p>{t.verificationEmailSent}</p>
								<button
									type="button"
									class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-green-500 text-xl cursor-pointer p-1 leading-none opacity-70 hover:opacity-100"
									onclick={() => (verificationEmailSent = false)}
									aria-label="Close"
								>
									&times;
								</button>
							</div>
						{/if}

						{#if isLockedOut}
							<div
								class="flex gap-3 p-4 mb-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500"
								role="alert"
								aria-live="assertive"
							>
								<div class="shrink-0 mt-0.5">
									<Warning size={24} />
								</div>
								<div class="flex flex-col gap-1">
									<p class="font-semibold text-[0.9rem]">{t.accountLocked}</p>
									<p class="text-[0.8rem] opacity-90">
										{t.tooManyAttempts}
										{#if rateLimitCountdown > 0}
											{t.retryIn} <strong>{formatCountdown(rateLimitCountdown)}</strong>
										{/if}
									</p>
									<button
										type="button"
										class="bg-transparent border-none cursor-pointer font-medium text-[0.8rem] p-0 text-left underline mt-1"
										onclick={() => goto(forgotPasswordPath)}
										style:color={primaryColor}
									>
										{t.resetPassword}
									</button>
								</div>
							</div>
						{:else if error}
							<div
								class="flex items-start gap-2 p-3 mb-4 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-500"
								id="form-error"
								role="alert"
								aria-live="assertive"
							>
								<Warning size={18} class="text-red-500 shrink-0" />
								<div class="flex flex-col gap-1">
									<p>{error}</p>
									{#if showEmailNotVerified && onResendVerification}
										<button
											type="button"
											class="bg-transparent border-none cursor-pointer font-medium text-sm p-0 text-left underline hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
											onclick={handleResendVerification}
											disabled={resendingVerification}
											aria-disabled={resendingVerification}
											style:color={primaryColor}
										>
											{resendingVerification ? t.resendingVerification : t.resendVerification}
										</button>
									{/if}
									{#if rateLimitCountdown > 0}
										<p class="font-semibold mt-1">
											{t.retryIn}
											{formatCountdown(rateLimitCountdown)}
										</p>
									{/if}
								</div>
							</div>
						{/if}

						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleLogin();
							}}
							aria-busy={loading}
						>
							<!-- Email -->
							<div class="mb-3">
								<label for="email" class="sr-only">{t.emailPlaceholder}</label>
								<input
									id="email"
									type="email"
									bind:this={emailInput}
									bind:value={email}
									placeholder={t.emailPlaceholder}
									required
									autocomplete={passkeyAvailable ? 'username webauthn' : 'email'}
									aria-invalid={errorField === 'email'}
									class="w-full h-14 px-4 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
									class:border-red-500={errorField === 'email'}
									style:--ring-color={errorField === 'email' ? '#ef4444' : primaryColor}
									style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
									style:border-color={errorField === 'email'
										? '#ef4444'
										: isDark
											? 'rgba(255,255,255,0.2)'
											: 'rgba(0,0,0,0.1)'}
									style:color={isDark ? '#fff' : '#000'}
									style:--tw-ring-color="var(--ring-color)"
								/>
							</div>

							<!-- Password -->
							<div class="mb-3">
								<label for="password" class="sr-only">{t.passwordPlaceholder}</label>
								<div class="relative">
									<input
										id="password"
										type={showPassword ? 'text' : 'password'}
										bind:this={passwordInput}
										bind:value={password}
										placeholder={t.passwordPlaceholder}
										required
										autocomplete="current-password"
										aria-invalid={errorField === 'password'}
										class="w-full h-14 px-4 pr-12 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
										class:border-red-500={errorField === 'password'}
										style:--ring-color={errorField === 'password' ? '#ef4444' : primaryColor}
										style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
										style:border-color={errorField === 'password'
											? '#ef4444'
											: isDark
												? 'rgba(255,255,255,0.2)'
												: 'rgba(0,0,0,0.1)'}
										style:color={isDark ? '#fff' : '#000'}
										style:--tw-ring-color="var(--ring-color)"
									/>
									<button
										type="button"
										onclick={() => (showPassword = !showPassword)}
										class="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity hover:opacity-80"
										style:color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
										aria-label={showPassword ? t.hidePassword : t.showPassword}
									>
										{#if showPassword}
											<EyeSlash size={20} />
										{:else}
											<Eye size={20} />
										{/if}
									</button>
								</div>
							</div>

							<!-- Remember & Forgot -->
							<div class="flex justify-between items-center mb-4 text-sm">
								<label
									class="remember-label flex items-center gap-2 cursor-pointer"
									style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
								>
									<input
										type="checkbox"
										bind:checked={rememberMe}
										style:accent-color={primaryColor}
									/>
									<span>{t.rememberMe}</span>
								</label>
								<button
									type="button"
									onclick={() => goto(forgotPasswordPath)}
									class="bg-transparent border-none cursor-pointer font-medium p-1 hover:opacity-70"
									style:color={primaryColor}
								>
									{t.forgotPassword}
								</button>
							</div>

							<!-- Submit -->
							<button
								type="submit"
								disabled={loading || showSuccess || rateLimitCountdown > 0}
								aria-disabled={loading || showSuccess || rateLimitCountdown > 0}
								class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
								style:background-color={showSuccess ? '#22c55e' : primaryColor + '60'}
								style:border-color={showSuccess ? '#22c55e' : primaryColor}
								style:color={isDark ? '#fff' : '#000'}
							>
								{#if loading}
									<svg
										class="spinner"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
										<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
									</svg>
									<span>{t.signingIn}</span>
								{:else if showSuccess}
									<Check size={20} />
									<span>{t.success}</span>
								{:else}
									<SignIn size={20} />
									<span>{t.signInButton}</span>
								{/if}
							</button>
						</form>

						{#if onSendMagicLink}
							{#if magicLinkSent}
								<div
									class="flex items-center gap-2 p-3 mb-4 rounded-xl relative text-sm bg-green-500/15 border border-green-500/30 text-green-500"
									role="status"
									aria-live="polite"
								>
									<Check size={18} class="text-green-500 shrink-0" />
									<p>{t.magicLinkSent?.replace('{email}', email)}</p>
									<button
										type="button"
										class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-green-500 text-xl cursor-pointer p-1 leading-none opacity-70 hover:opacity-100"
										onclick={() => (magicLinkSent = false)}
										aria-label="Close"
									>
										&times;
									</button>
								</div>
							{:else}
								<button
									type="button"
									onclick={handleSendMagicLink}
									disabled={sendingMagicLink || !email}
									aria-disabled={sendingMagicLink || !email}
									class="w-full bg-transparent border-none cursor-pointer font-medium text-sm p-3 text-center transition-opacity hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
									style:color={primaryColor}
								>
									{sendingMagicLink ? t.magicLinkSending : t.magicLinkButton}
								</button>
							{/if}
						{/if}

						<p
							class="text-center text-sm mt-4"
							style:color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
						>
							{t.noAccount}
							<button
								type="button"
								class="bg-transparent border-none cursor-pointer font-medium p-1 hover:opacity-70"
								onclick={() => goto(registerPath)}
								style:color={primaryColor}
							>
								{t.createAccount}
							</button>
						</p>
					{/if}
				</div>
			</div>

			{#if version}
				<p
					class="text-[10px] text-gray-400/60 select-none pointer-events-none m-0 pt-2 pb-1 text-center"
				>
					v{version}{#if buildTime}
						· {new Date(buildTime).toLocaleDateString('de-DE', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
						})}
						{new Date(buildTime).toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
						})}{/if}
				</p>
			{/if}
		</div>
	</main>

	{#if appSlider}
		<footer class="w-full max-w-[640px] mx-auto pb-4 anim-fade-in">
			{@render appSlider()}
		</footer>
	{/if}
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}

	/* Entrance Animations */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.anim-fade-in-scale {
		animation: fadeInScale 0.5s ease-out both;
	}

	.anim-fade-in-up {
		animation: fadeInUp 0.5s ease-out 0.15s both;
	}

	.anim-fade-in {
		animation: fadeIn 0.5s ease-out 0.3s both;
	}

	/* Interactive Animations */
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
		to {
			transform: rotate(360deg);
		}
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	@keyframes success-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.success-pulse {
		animation: success-pulse 0.6s ease-in-out;
	}

	/* Divider pseudo-elements */
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: currentColor;
		opacity: 0.2;
	}

	/* Custom checkbox styling */
	.remember-label input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
		background-color: transparent;
		border: 1.5px solid currentColor;
		border-radius: 0.25rem;
		appearance: none;
		-webkit-appearance: none;
		display: grid;
		place-content: center;
		opacity: 0.5;
	}

	.remember-label input[type='checkbox']::before {
		content: '';
		width: 0.65rem;
		height: 0.65rem;
		transform: scale(0);
		transition: transform 0.1s ease-in-out;
		box-shadow: inset 1rem 1rem var(--primary-color, #fff);
		clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
	}

	.remember-label input[type='checkbox']:checked {
		border-color: var(--primary-color, #fff);
		opacity: 1;
	}

	.remember-label input[type='checkbox']:checked::before {
		transform: scale(1);
	}

	/* Focus ring color via CSS variable */
	input:focus {
		--tw-ring-color: var(--ring-color, currentColor);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.anim-fade-in-scale,
		.anim-fade-in-up,
		.anim-fade-in,
		.shake,
		.spinner,
		.success-pulse {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
