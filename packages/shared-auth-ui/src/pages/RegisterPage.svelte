<script lang="ts">
	import type { Component } from 'svelte';
	import type { AuthResult } from '../types';
	import Icon from '../components/Icon.svelte';

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
	}

	/** Default English translations */
	const defaultTranslations: RegisterTranslations = {
		title: 'Create Account',
		emailPlaceholder: 'Email',
		passwordPlaceholder: 'Password',
		confirmPasswordPlaceholder: 'Confirm Password',
		passwordRequirements: 'Password must be at least 8 characters with lowercase, uppercase, number, and special character.',
		createAccountButton: 'Create Account',
		creatingAccount: 'Creating Account...',
		backToLogin: 'Back to Login',
		showPassword: 'Show password',
		hidePassword: 'Hide password',
		emailRequired: 'Email is required',
		passwordRequired: 'Password is required',
		confirmPasswordRequired: 'Please confirm your password',
		passwordsDoNotMatch: 'Passwords do not match',
		passwordTooShort: 'Password must be at least 8 characters',
		passwordStrengthError: 'Password must include lowercase, uppercase, number, and special character',
		registrationFailed: 'Registration failed',
		accountCreated: 'Account created! Please check your email to verify your account.'
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
		/** Translations for i18n support */
		translations?: Partial<RegisterTranslations>;
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
		translations = {}
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

	// Password validation
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
</script>

<svelte:head>
	<title>Create Account - {appName}</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col justify-between"
	style="background-color: {getPageBackground()};"
>
	<!-- Top Section - Logo -->
	<div class="flex flex-col items-center justify-center pt-16 pb-8">
		<div
			class="flex items-center justify-center rounded-full transition-all mb-4"
			style="width: 120px; height: 120px; border: 3px solid {primaryColor}; background-color: {isDark ? '#000' : '#fff'}; box-shadow: {isDark
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
			style="background-color: {isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
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
						style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
					/>
				</div>

				<div class="mb-2 relative">
					<input
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						placeholder={t.passwordPlaceholder}
						required
						minlength={8}
						class="h-14 w-full rounded-xl border px-4 pr-12 text-lg transition-colors focus:outline-none focus:ring-2"
						style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
						aria-label={showPassword ? t.hidePassword : t.showPassword}
					>
						<Icon
							name={showPassword ? 'eye-off' : 'eye'}
							size={20}
							color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
						/>
					</button>
				</div>

				<div class="mb-2 relative">
					<input
						type={showConfirmPassword ? 'text' : 'password'}
						bind:value={confirmPassword}
						placeholder={t.confirmPasswordPlaceholder}
						required
						minlength={8}
						class="h-14 w-full rounded-xl border px-4 pr-12 text-lg transition-colors focus:outline-none focus:ring-2"
						style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
					/>
					<button
						type="button"
						onclick={() => (showConfirmPassword = !showConfirmPassword)}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
						aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
					>
						<Icon
							name={showConfirmPassword ? 'eye-off' : 'eye'}
							size={20}
							color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
						/>
					</button>
				</div>

				<!-- Password Requirements -->
				<p
					class="mb-4 mt-2 text-xs"
					style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
				>
					{t.passwordRequirements}
				</p>

				<button
					type="submit"
					disabled={loading}
					class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
					style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
				>
					<Icon name="user-plus" size={20} />
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
					<Icon name="arrow-left" size={20} />
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
