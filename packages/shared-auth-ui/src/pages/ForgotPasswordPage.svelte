<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import Icon from '../components/Icon.svelte';

	type PageMode = 'form' | 'success';

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
		appSlider
	}: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');
	let mode = $state<PageMode>('form');
	let resetEmail = $state('');

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

	function getPageBackground() {
		return isDark ? darkBackground : lightBackground;
	}

	async function handleForgotPassword() {
		loading = true;
		error = null;

		if (!email) {
			error = 'Email is required';
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
			error = result.error || 'Failed to send reset email';
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - {appName}</title>
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

	<!-- Middle Section - Form -->
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
				{mode === 'form' ? 'Reset Password' : 'Email Sent'}
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
						Enter your email address and we'll send you a link to reset your password.
					</p>

					<div class="mb-4">
						<input
							type="email"
							bind:value={email}
							placeholder="Email"
							required
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
						style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="key" size={20} />
						{loading ? 'Sending...' : 'Send Reset Link'}
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
						Back to Login
					</button>
				</div>

			<!-- Success Mode -->
			{:else}
				<div class="pb-4">
					<div class="flex flex-col items-center mb-6">
						<div
							class="w-20 h-20 rounded-full flex items-center justify-center mb-6"
							style="background-color: {primaryColor}30;"
						>
							<Icon name="mail-open" size={40} color={primaryColor} />
						</div>

						<p
							class="text-sm text-center px-2"
							style="color: {isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};"
						>
							We've sent a password reset link to <strong>{resetEmail}</strong>. Please check your
							inbox.
						</p>
					</div>

					<div class="flex flex-col gap-3">
						<button
							onclick={() => goto(loginPath)}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
							style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="sign-in" size={20} />
							Back to Login
						</button>

						<button
							onclick={() => {
								mode = 'form';
								error = null;
							}}
							class="flex h-10 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border"
							style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							Resend Email
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
