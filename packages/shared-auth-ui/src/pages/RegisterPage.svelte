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

	// Password validation
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

	function getPageBackground() {
		return isDark ? darkBackground : lightBackground;
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
</svelte:head>

<div
	class="flex min-h-screen flex-col justify-between"
	style="background-color: {getPageBackground()}; max-width: 100vw; overflow-x: hidden;"
>
	<!-- Theme Toggle - Top Left -->
	<button
		type="button"
		onclick={toggleTheme}
		style="position: absolute; top: 1rem; left: 1rem; z-index: 50; display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; border: 1px solid {isDark
			? 'rgba(255, 255, 255, 0.2)'
			: 'rgba(0, 0, 0, 0.2)'}; background: {isDark
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(0, 0, 0, 0.05)'}; color: {isDark
			? 'rgba(255, 255, 255, 0.7)'
			: 'rgba(0, 0, 0, 0.7)'}; cursor: pointer; transition: all 0.2s ease;"
		aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if isDark}
			<Sun size={20} weight="bold" />
		{:else}
			<Moon size={20} weight="bold" />
		{/if}
	</button>

	{#if headerControls}
		<div
			style="position: absolute; top: 1rem; right: 1rem; z-index: 50; opacity: 0.6; display: flex; gap: 0.75rem;"
		>
			{@render headerControls()}
		</div>
	{/if}

	<!-- Top Section - Logo -->
	<div class="flex flex-col items-center justify-center pt-16 pb-8">
		<div
			class="flex items-center justify-center rounded-full transition-all mb-4"
			style="width: 120px; height: 120px; border: 3px solid {primaryColor}; background-color: {isDark
				? '#000'
				: '#fff'}; box-shadow: {isDark
				? '0 6px 12px rgba(0, 0, 0, 0.4)'
				: '0 6px 12px rgba(0, 0, 0, 0.15)'};"
		>
			<Logo size={55} color={primaryColor} />
		</div>
		<h1 class="text-2xl font-semibold" style="color: {isDark ? '#ffffff' : '#000000'};">
			{appName}
		</h1>
	</div>

	<!-- Middle Section - Register Form -->
	<div class="flex-1 flex items-start justify-center px-5 pt-8 pb-8">
		<div
			class="w-full max-w-md rounded-xl p-6"
			style="background-color: {isDark
				? 'rgba(255, 255, 255, 0.08)'
				: 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark
				? 'rgba(255, 255, 255, 0.1)'
				: 'rgba(0, 0, 0, 0.1)'};"
		>
			<!-- Title -->
			<h2
				class="mb-6 text-center text-xl font-semibold"
				style="color: {isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};"
			>
				{t.title}
			</h2>

			<!-- Error Messages -->
			{#if error}
				<div class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3">
					<p class="text-sm text-red-500">{error}</p>
				</div>
			{/if}

			<!-- Verification Email Sent Confirmation -->
			{#if verificationEmailSent}
				<div class="mb-4 rounded-xl bg-green-500/20 border border-green-500/30 p-4">
					<p class="text-sm text-green-500 font-medium">
						{t.verificationEmailSent}
					</p>
				</div>
			{/if}

			<!-- Success Message with Resend Option -->
			{#if success && needsVerification}
				<div
					class="mb-6 rounded-xl p-5"
					style="background-color: {isDark
						? 'rgba(34, 197, 94, 0.15)'
						: 'rgba(34, 197, 94, 0.1)'}; border: 2px solid rgba(34, 197, 94, 0.4);"
				>
					<div class="flex items-start gap-3 mb-4">
						<div
							class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
							style="background-color: rgba(34, 197, 94, 0.2);"
						>
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
						</div>
						<div>
							<h3
								class="font-semibold text-base mb-1"
								style="color: {isDark ? '#22c55e' : '#16a34a'};"
							>
								{t.checkYourEmail || 'Check your email'}
							</h3>
							<p
								class="text-sm"
								style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};"
							>
								{t.accountCreated}
							</p>
						</div>
					</div>

					{#if onResendVerification}
						<div
							class="pt-3 border-t"
							style="border-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
						>
							<p
								class="text-xs mb-2"
								style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
							>
								Didn't receive the email?
							</p>
							<button
								type="button"
								onclick={handleResendVerification}
								disabled={resendingVerification}
								class="w-full flex items-center justify-center gap-2 h-11 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-50"
								style="background-color: {primaryColor}40; border: 1.5px solid {primaryColor}; color: {isDark
									? '#ffffff'
									: '#000000'};"
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
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										></path>
									</svg>
									{t.resendVerification}
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Register Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleRegister();
				}}
				class="space-y-4"
			>
				<div>
					<input
						type="email"
						bind:value={email}
						placeholder={t.emailPlaceholder}
						required
						class="h-14 w-full rounded-xl border px-4 text-lg transition-colors focus:outline-none focus:ring-2"
						style="background-color: {isDark
							? 'rgba(0, 0, 0, 0.2)'
							: 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark
							? 'rgba(255, 255, 255, 0.2)'
							: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
							? '#ffffff'
							: '#000000'}; --tw-ring-color: {primaryColor};"
					/>
				</div>

				<div>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder={t.passwordPlaceholder}
							required
							minlength={8}
							class="h-14 w-full rounded-xl border px-4 pr-14 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark
								? 'rgba(255, 255, 255, 0.2)'
								: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
								? '#ffffff'
								: '#000000'}; --tw-ring-color: {primaryColor};"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex items-center justify-center w-14 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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

				<div>
					<div class="relative">
						<input
							type={showConfirmPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder={t.confirmPasswordPlaceholder}
							required
							minlength={8}
							class="h-14 w-full rounded-xl border px-4 pr-14 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark
								? 'rgba(255, 255, 255, 0.2)'
								: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
								? '#ffffff'
								: '#000000'}; --tw-ring-color: {primaryColor};"
						/>
						<button
							type="button"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							class="absolute inset-y-0 right-0 flex items-center justify-center w-14 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
					class="text-xs -mt-2"
					style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};"
				>
					{t.passwordRequirements}
				</p>

				<button
					type="submit"
					disabled={loading}
					class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2 mt-2"
					style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark
						? '#ffffff'
						: '#000000'};"
				>
					<UserPlus size={20} class="inline-block" />
					{loading ? t.creatingAccount : t.createAccountButton}
				</button>
			</form>

			<!-- Back Button -->
			<div class="mt-4">
				<button
					onclick={() => goto(loginPath)}
					class="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80"
					style="color: {isDark ? '#ffffff' : '#000000'};"
				>
					<ArrowLeft size={20} class="inline-block" />
					{t.backToLogin}
				</button>
			</div>
		</div>
	</div>

	<!-- App Slider -->
	{#if appSlider}
		<div class="w-full px-4 pb-8">
			{@render appSlider()}
		</div>
	{:else}
		<!-- Bottom padding -->
		<div class="pb-8"></div>
	{/if}
</div>
