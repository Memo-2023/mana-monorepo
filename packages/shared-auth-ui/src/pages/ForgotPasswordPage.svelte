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
	<meta name="theme-color" content={darkBackground} media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content={lightBackground} media="(prefers-color-scheme: light)" />
</svelte:head>

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

	<main class="flex-1 flex flex-col">
		<!-- Logo Section -->
		<div class="flex flex-col items-center pt-12 max-[480px]:pt-8 px-4 pb-6 anim-fade-in-scale">
			<div
				class="w-[100px] h-[100px] max-[480px]:w-[80px] max-[480px]:h-[80px] rounded-full border-[3px] flex items-center justify-center mb-3 shadow-lg"
				style:border-color={primaryColor}
				style:background-color={isDark ? '#000' : '#fff'}
			>
				<Logo size={55} color={primaryColor} />
			</div>
			<h1 class="text-2xl font-semibold" style:color={isDark ? '#fff' : '#000'}>{appName}</h1>
		</div>

		<!-- Form Section -->
		<div class="flex-1 flex justify-center px-4 pt-4 pb-8">
			<div
				class="w-full max-w-[400px] rounded-2xl p-6 max-[480px]:p-5 border backdrop-blur-[10px] anim-fade-in-up"
				style:background-color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'}
				style:border-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
			>
				<!-- Title -->
				<h2
					class="text-xl font-semibold text-center mb-6"
					style:color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'}
				>
					{mode === 'form' ? t.titleForm : t.titleSuccess}
				</h2>

				<!-- Error Messages -->
				{#if error}
					<div
						class="flex items-start gap-2 p-3 mb-4 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-500"
						role="alert"
					>
						<p>{error}</p>
					</div>
				{/if}

				<!-- Form Mode -->
				{#if mode === 'form'}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleForgotPassword();
						}}
					>
						<p
							class="mb-4 text-sm"
							style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
						>
							{t.description}
						</p>

						<div class="mb-4">
							<input
								type="email"
								bind:value={email}
								placeholder={t.emailPlaceholder}
								required
								class="w-full h-14 px-4 border rounded-xl text-base transition-colors focus:outline-none focus:ring-2"
								style:--ring-color={primaryColor}
								style:background-color={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'}
								style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
								style:color={isDark ? '#fff' : '#000'}
								style:--tw-ring-color="var(--ring-color)"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							aria-disabled={loading}
							class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
							style:background-color={primaryColor + '60'}
							style:border-color={primaryColor}
							style:color={isDark ? '#fff' : '#000'}
						>
							<Key size={20} />
							{loading ? t.sending : t.sendResetLinkButton}
						</button>
					</form>

					<!-- Back Button -->
					<div class="mt-4">
						<button
							type="button"
							onclick={() => goto(loginPath)}
							class="w-full bg-transparent border-none cursor-pointer font-medium text-sm p-3 text-center flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
							style:color={isDark ? '#fff' : '#000'}
						>
							<ArrowLeft size={20} />
							{t.backToLogin}
						</button>
					</div>

					<!-- Success Mode -->
				{:else}
					<div class="pb-4">
						<div class="flex flex-col items-center mb-6">
							<div
								class="w-20 h-20 rounded-full flex items-center justify-center mb-6"
								style:background-color={primaryColor + '30'}
								style:color={primaryColor}
							>
								<EnvelopeOpen size={40} />
							</div>

							<p
								class="text-sm text-center px-2"
								style:color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
							>
								{getSuccessMessage(resetEmail)}
							</p>
						</div>

						<div class="flex flex-col gap-3">
							<button
								type="button"
								onclick={() => goto(loginPath)}
								class="w-full h-14 border-2 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
								style:background-color={primaryColor + '60'}
								style:border-color={primaryColor}
								style:color={isDark ? '#fff' : '#000'}
							>
								<SignIn size={20} />
								{t.backToLogin}
							</button>

							<button
								type="button"
								onclick={() => {
									mode = 'form';
									error = null;
								}}
								class="w-full h-10 border rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-70"
								style:background-color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
								style:border-color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
								style:color={isDark ? '#fff' : '#000'}
							>
								{t.resendEmail}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</main>

	{#if appSlider}
		<footer class="w-full pb-4 anim-fade-in">
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

	/* Focus ring color via CSS variable */
	input:focus {
		--tw-ring-color: var(--ring-color, currentColor);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.anim-fade-in-scale,
		.anim-fade-in-up,
		.anim-fade-in {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
