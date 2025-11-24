<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import Icon from '../components/Icon.svelte';
	import GoogleSignInButton from '../components/GoogleSignInButton.svelte';
	import AppleSignInButton from '../components/AppleSignInButton.svelte';

	type AuthMode = 'initial' | 'login' | 'forgot-password' | 'password-reset-success';

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
		/** Forgot password function */
		onForgotPassword: (email: string) => Promise<AuthResult>;
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
		/** Light background color */
		lightBackground?: string;
		/** Dark background color */
		darkBackground?: string;
		/** AppSlider snippet to render at the bottom (optional) */
		appSlider?: Snippet;
		/** Header snippet for controls like theme toggle and language selector */
		headerControls?: Snippet;
	}

	let {
		appName,
		logo: Logo,
		primaryColor,
		onSignIn,
		onSignInWithGoogle,
		onSignInWithApple,
		onForgotPassword,
		goto,
		enableGoogle = false,
		enableApple = false,
		successRedirect = '/dashboard',
		registerPath = '/register',
		lightBackground = '#f5f5f5',
		darkBackground = '#121212',
		appSlider,
		headerControls
	}: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let email = $state('');
	let password = $state('');
	let mode = $state<AuthMode>('initial');
	let resetEmail = $state('');
	let showPassword = $state(false);

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

	async function handleLogin() {
		loading = true;
		error = null;

		if (!email) {
			error = 'Email is required';
			loading = false;
			return;
		}

		if (!password) {
			error = 'Password is required';
			loading = false;
			return;
		}

		const result = await onSignIn(email, password);

		loading = false;

		if (result.success) {
			goto(successRedirect);
		} else {
			error = result.error || 'Sign in failed';
		}
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
			resetForm();
			switchMode('password-reset-success');
		} else {
			error = result.error || 'Failed to send reset email';
		}
	}

	async function handleGoogleSuccess(idToken: string) {
		if (!onSignInWithGoogle) return;

		const result = await onSignInWithGoogle(idToken);
		if (result.success) {
			goto(successRedirect);
		} else {
			error = result.error || 'Google sign in failed';
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
	<title>Login - {appName}</title>
</svelte:head>

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

	<!-- Middle Section - Auth Form -->
	<div class="flex-1 flex items-start justify-center px-5 pt-8 pb-8">
		<div
			class="w-full max-w-md rounded-xl p-6"
			style="background-color: {isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
		>
			<!-- Title -->
			<div class="mb-6">
				<h2
					class="text-center text-xl font-semibold flex items-center justify-center gap-2"
					style="color: {isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};"
				>
					{#if mode === 'initial'}
						Mana Login
					{:else if mode === 'login'}
						Sign In
					{:else if mode === 'forgot-password'}
						Reset Password
					{:else if mode === 'password-reset-success'}
						Email Sent
					{/if}
				</h2>
				{#if mode === 'initial'}
					<p
						class="mt-3 text-sm text-center"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
					>
						Sign in with your Mana account
					</p>
				{/if}
			</div>

			<!-- Error Messages -->
			{#if error}
				<div class="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 p-3">
					<p class="text-sm text-red-500">{error}</p>
				</div>
			{/if}

			<!-- Initial Mode -->
			{#if mode === 'initial'}
				<div class="mb-2 flex flex-col gap-3">
					<button
						onclick={() => goto(registerPath)}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
						style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="user-plus" size={20} />
						Create Account
					</button>

					<button
						onclick={() => switchMode('login')}
						class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border"
						style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="sign-in" size={20} />
						Sign In
					</button>
				</div>

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
							placeholder="Email"
							required
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
						/>
					</div>

					<div class="mb-2 relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Password"
							required
							class="h-14 w-full rounded-xl border px-4 pr-12 text-lg transition-colors focus:outline-none focus:ring-2"
							style="background-color: {isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'}; --tw-ring-color: {primaryColor};"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
						>
							<Icon
								name={showPassword ? 'eye-off' : 'eye'}
								size={20}
								color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
							/>
						</button>
					</div>

					<button
						type="button"
						onclick={() => switchMode('forgot-password')}
						class="mb-4 flex h-10 w-full items-center justify-center rounded-xl font-medium transition-all hover:opacity-80 border"
						style="background-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}; border-color: {isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						Forgot Password?
					</button>

					<button
						type="submit"
						disabled={loading}
						class="flex h-14 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
						style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="sign-in" size={20} />
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<!-- Social Login -->
				{#if enableGoogle || enableApple}
					<div class="my-4 flex items-center gap-3">
						<div class="flex-1 border-t" style="border-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"></div>
						<p class="text-xs" style="color: {isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};">or</p>
						<div class="flex-1 border-t" style="border-color: {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"></div>
					</div>

					<div class="mb-4 flex flex-col gap-2">
						{#if enableGoogle && onSignInWithGoogle}
							<GoogleSignInButton onSuccess={handleGoogleSuccess} />
						{/if}
						{#if enableApple}
							<AppleSignInButton />
						{/if}
					</div>
				{/if}

				<!-- Back Button -->
				<div class="mt-4">
					<button
						onclick={() => {
							resetForm();
							switchMode('initial');
						}}
						class="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80"
						style="color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="arrow-left" size={20} />
						Back
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

					<div class="flex flex-col gap-4">
						<button
							type="submit"
							disabled={loading}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
							style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="key" size={20} />
							{loading ? 'Sending...' : 'Reset Password'}
						</button>

						<button
							type="button"
							onclick={() => {
								resetForm();
								switchMode('login');
							}}
							class="flex h-10 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80"
							style="color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="arrow-left" size={20} />
							Back
						</button>
					</div>
				</form>

			<!-- Password Reset Success Mode -->
			{:else if mode === 'password-reset-success'}
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
							onclick={() => {
								resetEmail = '';
								switchMode('login');
							}}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 border-2"
							style="background-color: {primaryColor}60; border-color: {primaryColor}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="sign-in" size={20} />
							Back to Login
						</button>

						<button
							onclick={() => switchMode('forgot-password')}
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

	<!-- App Slider (shown on initial mode) -->
	{#if appSlider && mode === 'initial'}
		<div class="w-full pb-8 px-2 pt-4">
			{@render appSlider()}
		</div>
	{:else}
		<!-- Bottom padding -->
		<div class="pb-8"></div>
	{/if}
</div>
