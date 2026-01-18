<script lang="ts">
	import type { Component } from 'svelte';
	import type { AuthResult } from '../types';
	import { Eye, EyeSlash, UserPlus, ArrowLeft, Sun, Moon } from '@manacore/shared-icons';

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
		// Referral
		referralCodePlaceholder: string;
		referralCodeValid: string;
		referralCodeInvalid: string;
		referralCodeValidating: string;
		referralBonusCredits: string;
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
	}

	/** Referral code validation result */
	interface ReferralValidation {
		valid: boolean;
		referrerName?: string;
		bonusCredits?: number;
		error?: string;
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
		// Referral
		referralCodePlaceholder: 'Referral Code (optional)',
		referralCodeValid: 'Valid code!',
		referralCodeInvalid: 'Invalid code',
		referralCodeValidating: 'Checking...',
		referralBonusCredits: 'bonus credits',
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
	};

	interface Props {
		/** App name */
		appName: string;
		/** Logo component */
		logo: Component<{ size?: number; color?: string }>;
		/** Primary color (hex) */
		primaryColor: string;
		/** Sign up function (with optional referral code) */
		onSignUp: (email: string, password: string, referralCode?: string) => Promise<AuthResult>;
		/** Navigation function */
		goto: (path: string) => void;
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
		/** Referral code validation function */
		onValidateReferralCode?: (code: string) => Promise<ReferralValidation>;
		/** Initial referral code (e.g., from URL) */
		initialReferralCode?: string;
		/** Base signup credits (shown to user) */
		baseSignupCredits?: number;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onSignUp,
		goto,
		successRedirect = '/dashboard',
		loginPath = '/login',
		lightBackground = '#f5f5f5',
		darkBackground = '#121212',
		appSlider,
		headerControls,
		translations = {},
		onValidateReferralCode,
		initialReferralCode = '',
		baseSignupCredits = 25,
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

	// Referral state
	let referralCode = $state(initialReferralCode);
	let referralValidation = $state<ReferralValidation | null>(null);
	let validatingReferral = $state(false);
	let referralDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Calculate total credits (base + bonus)
	let totalCredits = $derived(
		baseSignupCredits + (referralValidation?.valid ? referralValidation.bonusCredits || 0 : 0)
	);

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

	// Referral code validation
	async function validateReferralCode(code: string) {
		if (!code || code.length < 3 || !onValidateReferralCode) {
			referralValidation = null;
			return;
		}

		validatingReferral = true;
		try {
			const result = await onValidateReferralCode(code);
			referralValidation = result;
		} catch {
			referralValidation = { valid: false, error: 'Validation failed' };
		} finally {
			validatingReferral = false;
		}
	}

	function handleReferralCodeChange(value: string) {
		referralCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

		// Clear previous timer
		if (referralDebounceTimer) {
			clearTimeout(referralDebounceTimer);
		}

		// Reset validation if empty
		if (!referralCode) {
			referralValidation = null;
			return;
		}

		// Debounce validation
		referralDebounceTimer = setTimeout(() => {
			validateReferralCode(referralCode);
		}, 500);
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

		// Pass referral code if valid
		const validReferralCode = referralValidation?.valid ? referralCode : undefined;
		const result = await onSignUp(email, password, validReferralCode);

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

			<!-- Success Message -->
			{#if success && needsVerification}
				<div class="mb-4 rounded-xl bg-green-500/20 border border-green-500/30 p-3">
					<p class="text-sm text-green-500">
						{t.accountCreated}
					</p>
				</div>
			{/if}

			<!-- Register Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleRegister();
				}}
				class="pb-4"
			>
				<div class="mb-2">
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

				<div class="mb-2">
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

				<div class="mb-2">
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
					class="mb-4 mt-2 text-xs"
					style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
				>
					{t.passwordRequirements}
				</p>

				<!-- Referral Code Input -->
				{#if onValidateReferralCode}
					<div class="mb-4">
						<div class="relative">
							<input
								type="text"
								value={referralCode}
								oninput={(e) => handleReferralCodeChange((e.target as HTMLInputElement).value)}
								placeholder={t.referralCodePlaceholder}
								maxlength={12}
								class="h-14 w-full rounded-xl border px-4 pr-24 text-lg transition-colors focus:outline-none focus:ring-2 uppercase tracking-wider"
								style="background-color: {isDark
									? 'rgba(0, 0, 0, 0.2)'
									: 'rgba(255, 255, 255, 0.8)'}; border-color: {referralValidation?.valid
									? '#22c55e'
									: referralValidation && !referralValidation.valid
										? '#ef4444'
										: isDark
											? 'rgba(255, 255, 255, 0.2)'
											: 'rgba(0, 0, 0, 0.1)'}; color: {isDark
									? '#ffffff'
									: '#000000'}; --tw-ring-color: {primaryColor};"
							/>
							<!-- Validation indicator -->
							<div class="absolute inset-y-0 right-0 flex items-center pr-4">
								{#if validatingReferral}
									<span
										class="text-sm"
										style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
									>
										{t.referralCodeValidating}
									</span>
								{:else if referralValidation?.valid}
									<span class="text-sm text-green-500">✓ {t.referralCodeValid}</span>
								{:else if referralValidation && !referralValidation.valid}
									<span class="text-sm text-red-500">✗ {t.referralCodeInvalid}</span>
								{/if}
							</div>
						</div>
						<!-- Bonus info -->
						{#if referralValidation?.valid && referralValidation.bonusCredits}
							<p class="mt-2 text-sm text-green-500">
								+{referralValidation.bonusCredits}
								{t.referralBonusCredits}
								{#if referralValidation.referrerName}
									(von {referralValidation.referrerName})
								{/if}
							</p>
						{/if}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
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
