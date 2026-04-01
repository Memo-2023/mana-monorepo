<script lang="ts">
	import type { Component } from 'svelte';
	import type { AuthResult } from '../types';
	import { Eye, EyeSlash, UserPlus, ArrowLeft, Sun, Moon } from '@manacore/shared-icons';
	import PasswordStrength from '../components/PasswordStrength.svelte';

	import type { Snippet } from 'svelte';

	/** Translation strings for the register page */
	export interface RegisterTranslations {
		title: string;
		emailPlaceholder: string;
		passwordPlaceholder: string;
		confirmPasswordPlaceholder: string;
		passwordRequirements: string;
		createAccountButton: string;
		creatingAccount: string;
		backToLogin: string;
		showPassword: string;
		hidePassword: string;
		// Error messages
		emailRequired: string;
		passwordRequired: string;
		confirmPasswordRequired: string;
		passwordsDoNotMatch: string;
		passwordTooShort: string;
		passwordStrengthError: string;
		registrationFailed: string;
		// Success messages
		accountCreated: string;
		// Verification resend
		resendVerification?: string;
		resendingVerification?: string;
		verificationEmailSent?: string;
		checkYourEmail?: string;
		emailAlreadyRegistered?: string;
		emailAlreadyRegisteredMessage?: string;
		goToLogin?: string;
	}

	/** Default English translations */
	const defaultTranslations: RegisterTranslations = {
		title: 'Create Account',
		emailPlaceholder: 'Email',
		passwordPlaceholder: 'Password',
		confirmPasswordPlaceholder: 'Confirm Password',
		passwordRequirements:
			'Password must be at least 8 characters with lowercase, uppercase, number, and special character.',
		createAccountButton: 'Create Account',
		creatingAccount: 'Creating Account...',
		backToLogin: 'Back to Login',
		showPassword: 'Show password',
		hidePassword: 'Hide password',
		// Error messages
		emailRequired: 'Email is required',
		passwordRequired: 'Password is required',
		confirmPasswordRequired: 'Please confirm your password',
		passwordsDoNotMatch: 'Passwords do not match',
		passwordTooShort: 'Password must be at least 8 characters',
		passwordStrengthError:
			'Password must include lowercase, uppercase, number, and special character',
		registrationFailed: 'Registration failed',
		accountCreated: 'Account created! Please check your email to verify your account.',
		// Verification resend
		resendVerification: 'Resend verification email',
		resendingVerification: 'Sending...',
		verificationEmailSent: 'Verification email sent! Please check your inbox.',
		checkYourEmail: 'Check your email',
		emailAlreadyRegistered: 'Email already registered',
		emailAlreadyRegisteredMessage:
			"An account with this email already exists. If you haven't verified your email yet, resend the verification email.",
		goToLogin: 'Sign in instead',
	};

	interface Props {
		/** App name */
		appName: string;
		/** Logo component */
		logo: Component<{ size?: number; color?: string }>;
		/** Primary color (hex) */
		primaryColor: string;
		/** Sign up function */
		onSignUp: (email: string, password: string) => Promise<AuthResult>;
		/** Navigation function */
		goto: (path: string) => void;
		/** Resend verification email function */
		onResendVerification?: (email: string) => Promise<AuthResult>;
		/** Success redirect path */
		successRedirect?: string;
		/** Login page path */
		loginPath?: string;
		/** Light background color */
		lightBackground?: string;
		/** Dark background color */
		darkBackground?: string;
		/** App slider snippet */
		appSlider?: Snippet;
		/** Header controls snippet (e.g., language selector) */
		headerControls?: Snippet;
		/** Translations for i18n support */
		translations?: Partial<RegisterTranslations>;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onSignUp,
		goto,
		onResendVerification,
		successRedirect = '/dashboard',
		loginPath = '/login',
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
	let success = $state(false);
	let needsVerification = $state(false);
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let resendingVerification = $state(false);
	let verificationEmailSent = $state(false);
	let emailAlreadyRegistered = $state(false);

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
			userThemePreference = systemIsDark ? 'light' : 'dark';
		} else {
			userThemePreference = userThemePreference === 'dark' ? 'light' : 'dark';
		}
	}

	async function handleRegister() {
		loading = true;
		error = null;
		success = false;

		// Validation
		if (!email) {
			error = t.emailRequired;
			loading = false;
			return;
		}

		if (!password) {
			error = t.passwordRequired;
			loading = false;
			return;
		}

		if (!confirmPassword) {
			error = t.confirmPasswordRequired;
			loading = false;
			return;
		}

		if (password !== confirmPassword) {
			error = t.passwordsDoNotMatch;
			loading = false;
			return;
		}

		if (password.length < 8) {
			error = t.passwordTooShort;
			loading = false;
			return;
		}

		// Check password strength
		const hasLowercase = /[a-z]/.test(password);
		const hasUppercase = /[A-Z]/.test(password);
		const hasDigit = /[0-9]/.test(password);
		const hasSymbol = /[^a-zA-Z0-9]/.test(password);

		if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
			error = t.passwordStrengthError;
			loading = false;
			return;
		}

		const result = await onSignUp(email, password);

		loading = false;

		if (result.success) {
			if (result.needsVerification) {
				needsVerification = true;
				success = true;
				password = '';
				confirmPassword = '';
			} else {
				goto(successRedirect);
			}
		} else if (result.error === 'EMAIL_ALREADY_REGISTERED') {
			emailAlreadyRegistered = true;
			needsVerification = true;
			success = true;
			password = '';
			confirmPassword = '';
		} else {
			error = result.error || t.registrationFailed;
		}
	}

	async function handleResendVerification() {
		if (!onResendVerification || !email || resendingVerification) return;

		resendingVerification = true;
		error = null;

		const result = await onResendVerification(email);
		resendingVerification = false;

		if (result.success) {
			verificationEmailSent = true;
		} else {
			error = result.error || t.registrationFailed;
		}
	}
</script>

<svelte:head>
	<title>Create Account - {appName}</title>
	<meta name="theme-color" content={darkBackground} media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content={lightBackground} media="(prefers-color-scheme: light)" />
</svelte:head>

<div
	class="flex flex-col min-h-screen min-h-dvh w-full max-w-[100vw] overflow-x-hidden m-0 p-0"
	style:background-color={isDark ? darkBackground || '#121212' : lightBackground || '#f5f5f5'}
>
	<!-- Theme Toggle -->
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
				<div
					class="w-[100px] h-[100px] max-[480px]:w-[80px] max-[480px]:h-[80px] rounded-full border-[3px] flex items-center justify-center mb-3 cursor-pointer transition-transform shadow-lg hover:scale-105"
					style:border-color={primaryColor}
					style:background-color={isDark ? '#000' : '#fff'}
				>
					<Logo size={55} color={primaryColor} />
				</div>
				<h1 class="text-2xl font-semibold" style:color={isDark ? '#fff' : '#000'}>{appName}</h1>
			</div>

			<!-- Form Section -->
			<div class="w-full flex justify-center pt-2 pb-8">
				<div
					class="w-full max-w-[440px] rounded-2xl p-6 max-[480px]:p-5 border backdrop-blur-[10px] anim-fade-in-up"
					style:background-color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}
					style:border-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
				>
					<!-- Title -->
					<div class="text-center mb-6">
						<h2
							class="text-xl font-semibold"
							style:color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'}
						>
							{t.title}
						</h2>
					</div>

					<!-- Error Message -->
					{#if error}
						<div
							class="flex items-start gap-2 p-3 mb-4 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-500"
							role="alert"
						>
							<span>&#9888;</span>
							<p>{error}</p>
						</div>
					{/if}

					<!-- Verification Email Sent -->
					{#if verificationEmailSent}
						<div
							class="flex items-center gap-2 p-3 mb-4 rounded-xl text-sm bg-green-500/15 border border-green-500/30 text-green-500"
						>
							<span>{t.verificationEmailSent}</span>
						</div>
					{/if}

					<!-- Success: Needs Verification / Already Registered -->
					{#if success && needsVerification}
						<div
							class="mb-6 rounded-xl p-5 border-2"
							class:bg-green-500={false}
							style:background-color={emailAlreadyRegistered
								? 'color-mix(in srgb, #f59e0b 15%, transparent)'
								: 'color-mix(in srgb, #22c55e 15%, transparent)'}
							style:border-color={emailAlreadyRegistered
								? 'color-mix(in srgb, #f59e0b 40%, transparent)'
								: 'color-mix(in srgb, #22c55e 40%, transparent)'}
						>
							<div class="flex items-start gap-3 mb-4">
								<div
									class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
									style:background-color={emailAlreadyRegistered
										? 'color-mix(in srgb, #f59e0b 20%, transparent)'
										: 'color-mix(in srgb, #22c55e 20%, transparent)'}
								>
									{#if emailAlreadyRegistered}
										<svg
											class="w-5 h-5"
											style:color="#f59e0b"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											></path>
										</svg>
									{:else}
										<svg
											class="w-5 h-5 text-green-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											></path>
										</svg>
									{/if}
								</div>
								<div>
									<h3
										class="font-semibold text-base mb-1"
										style:color={emailAlreadyRegistered
											? isDark
												? '#fbbf24'
												: '#d97706'
											: isDark
												? '#22c55e'
												: '#16a34a'}
									>
										{emailAlreadyRegistered
											? t.emailAlreadyRegistered || 'Email already registered'
											: t.checkYourEmail || 'Check your email'}
									</h3>
									<p
										class="text-sm"
										style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
									>
										{emailAlreadyRegistered
											? t.emailAlreadyRegisteredMessage ||
												"An account with this email already exists. If you haven't verified your email yet, resend the verification email."
											: t.accountCreated}
									</p>
								</div>
							</div>

							<div
								class="pt-3 border-t flex flex-col gap-2"
								style:border-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
							>
								{#if onResendVerification}
									<button
										type="button"
										onclick={handleResendVerification}
										disabled={resendingVerification}
										aria-disabled={resendingVerification}
										class="w-full flex items-center justify-center gap-2 h-11 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed border-[1.5px]"
										style:background-color="{primaryColor}40"
										style:border-color={primaryColor}
										style:color={isDark ? '#fff' : '#000'}
									>
										{#if resendingVerification}
											<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
													fill="none"
												></circle>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											{t.resendingVerification}
										{:else}
											{t.resendVerification}
										{/if}
									</button>
								{/if}
								{#if emailAlreadyRegistered}
									<button
										type="button"
										onclick={() => goto(loginPath)}
										class="w-full flex items-center justify-center h-11 rounded-lg font-medium transition-opacity hover:opacity-80 border-[1.5px]"
										style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
										style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
										style:background-color="transparent"
									>
										{t.goToLogin || 'Sign in instead'}
									</button>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Register Form -->
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleRegister();
						}}
					>
						<!-- Email -->
						<div class="mb-3">
							<input
								type="email"
								bind:value={email}
								placeholder={t.emailPlaceholder}
								required
								class="w-full h-14 px-4 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
								style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
								style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
								style:color={isDark ? '#fff' : '#000'}
								style:--tw-ring-color={primaryColor}
							/>
						</div>

						<!-- Password -->
						<div class="mb-3">
							<div class="relative">
								<input
									type={showPassword ? 'text' : 'password'}
									bind:value={password}
									placeholder={t.passwordPlaceholder}
									required
									minlength={8}
									class="w-full h-14 px-4 pr-12 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
									style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
									style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
									style:color={isDark ? '#fff' : '#000'}
									style:--tw-ring-color={primaryColor}
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity"
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

						<PasswordStrength {password} {primaryColor} />

						<!-- Confirm Password -->
						<div class="mb-3">
							<div class="relative">
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									bind:value={confirmPassword}
									placeholder={t.confirmPasswordPlaceholder}
									required
									minlength={8}
									class="w-full h-14 px-4 pr-12 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
									style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
									style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
									style:color={isDark ? '#fff' : '#000'}
									style:--tw-ring-color={primaryColor}
								/>
								<button
									type="button"
									onclick={() => (showConfirmPassword = !showConfirmPassword)}
									class="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity"
									style:color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
									aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
								>
									{#if showConfirmPassword}
										<EyeSlash size={20} />
									{:else}
										<Eye size={20} />
									{/if}
								</button>
							</div>
						</div>

						<!-- Password Requirements -->
						<p
							class="text-xs mb-3"
							style:color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
						>
							{t.passwordRequirements}
						</p>

						<!-- Submit -->
						<button
							type="submit"
							disabled={loading}
							aria-disabled={loading}
							class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
							style:background-color="{primaryColor}60"
							style:border-color={primaryColor}
							style:color={isDark ? '#fff' : '#000'}
						>
							{#if loading}
								<svg
									class="w-5 h-5 animate-spin"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
									<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
								</svg>
								<span>{t.creatingAccount}</span>
							{:else}
								<UserPlus size={20} />
								<span>{t.createAccountButton}</span>
							{/if}
						</button>
					</form>

					<!-- Back to Login -->
					<div class="text-center mt-4">
						<button
							type="button"
							onclick={() => goto(loginPath)}
							class="inline-flex items-center gap-2 bg-transparent border-none cursor-pointer font-medium transition-opacity hover:opacity-70"
							style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
						>
							<ArrowLeft size={20} />
							{t.backToLogin}
						</button>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- App Slider -->
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
	.anim-fade-in-up {
		animation: fadeInUp 0.5s ease-out 0.15s both;
	}
	.anim-fade-in-scale {
		animation: fadeInScale 0.5s ease-out both;
	}
	.anim-fade-in {
		animation: fadeIn 0.5s ease-out 0.3s both;
	}

	@media (prefers-reduced-motion: reduce) {
		.anim-fade-in-up,
		.anim-fade-in-scale,
		.anim-fade-in {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
