<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import { Key, ArrowLeft, EnvelopeOpen, SignIn, Sun, Moon } from '@manacore/shared-icons';

	type PageMode = 'form' | 'success';

	/** Translation strings for the forgot password page */
	export interface ForgotPasswordTranslations {
		titleForm: string;
		titleSuccess: string;
		description: string;
		emailPlaceholder: string;
		sendResetLinkButton: string;
		sending: string;
		backToLogin: string;
		resendEmail: string;
		// Success message (uses template with email)
		successMessage: string;
		// Error messages
		emailRequired: string;
		sendFailed: string;
	}

	/** Default English translations */
	const defaultTranslations: ForgotPasswordTranslations = {
		titleForm: 'Reset Password',
		titleSuccess: 'Email Sent',
		description: "Enter your email address and we'll send you a link to reset your password.",
		emailPlaceholder: 'Email',
		sendResetLinkButton: 'Send Reset Link',
		sending: 'Sending...',
		backToLogin: 'Back to Login',
		resendEmail: 'Resend Email',
		successMessage: "We've sent a password reset link to {email}. Please check your inbox.",
		emailRequired: 'Email is required',
		sendFailed: 'Failed to send reset email',
	};

	interface Props {
		/** App name */
		appName: string;
		/** Logo component */
		logo: Component<{ size?: number; color?: string }>;
		/** Primary color (hex) */
		primaryColor: string;
		/** Forgot password function */
		onForgotPassword: (email: string) => Promise<AuthResult>;
		/** Navigation function */
		goto: (path: string) => void;
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
		translations?: Partial<ForgotPasswordTranslations>;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onForgotPassword,
		goto,
		loginPath = '/login',
		lightBackground = '#f5f5f5',
		darkBackground = '#121212',
		appSlider,
		headerControls,
		translations = {},
	}: Props = $props();

	// Merge provided translations with defaults
	const t = $derived({ ...defaultTranslations, ...translations });

	// Helper to interpolate success message with email
	function getSuccessMessage(email: string): string {
		return t.successMessage.replace('{email}', email);
	}

	let loading = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');
	let mode = $state<PageMode>('form');
	let resetEmail = $state('');

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

	function getPageBackground() {
		return isDark ? darkBackground : lightBackground;
	}

	async function handleForgotPassword() {
		loading = true;
		error = null;

		if (!email) {
			error = t.emailRequired;
			loading = false;
			return;
		}

		const result = await onForgotPassword(email);

		loading = false;

		if (result.success) {
			resetEmail = email;
			email = '';
			mode = 'success';
		} else {
			error = result.error || t.sendFailed;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - {appName}</title>
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

	<!-- Middle Section - Form -->
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
				{mode === 'form' ? t.titleForm : t.titleSuccess}
			</h2>

			<!-- Error Messages -->
			{#if error}
				<div class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3">
					<p class="text-sm text-red-500">{error}</p>
				</div>
			{/if}

			<!-- Form Mode -->
			{#if mode === 'form'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleForgotPassword();
					}}
					class="pb-4"
				>
					<p
						class="mb-4 text-sm"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};"
					>
						{t.description}
					</p>

					<div class="mb-4">
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

					<button
						type="submit"
						disabled={loading}
						class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
						style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark
							? '#ffffff'
							: '#000000'};"
					>
						<Key size={20} class="inline-block" />
						{loading ? t.sending : t.sendResetLinkButton}
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

				<!-- Success Mode -->
			{:else}
				<div class="pb-4">
					<div class="flex flex-col items-center mb-6">
						<div
							class="w-20 h-20 rounded-full flex items-center justify-center mb-6"
							style="background-color: {primaryColor}30; color: {primaryColor};"
						>
							<EnvelopeOpen size={40} />
						</div>

						<p
							class="text-sm text-center px-2"
							style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};"
						>
							{@html getSuccessMessage(resetEmail).replace(
								resetEmail,
								`<strong>${resetEmail}</strong>`
							)}
						</p>
					</div>

					<div class="flex flex-col gap-3">
						<button
							onclick={() => goto(loginPath)}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
							style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark
								? '#ffffff'
								: '#000000'};"
						>
							<SignIn size={20} class="inline-block" />
							{t.backToLogin}
						</button>

						<button
							onclick={() => {
								mode = 'form';
								error = null;
							}}
							class="flex h-10 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border"
							style="background-color: {isDark
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark
								? 'rgba(255, 255, 255, 0.2)'
								: 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							{t.resendEmail}
						</button>
					</div>
				</div>
			{/if}
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
