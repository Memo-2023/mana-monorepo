<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { AuthResult } from '../types';
	import { Check, Warning, Eye, EyeSlash, SignIn, Sun, Moon } from '@manacore/shared-icons';
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
		emailRequired: string;
		emailInvalid: string;
		passwordRequired: string;
		signInFailed: string;
		googleSignInFailed: string;
		signInSuccess: string;
		googleSignInSuccess: string;
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
		googleSignInFailed: 'Google sign in failed',
		signInSuccess: 'Successfully signed in. Redirecting...',
		googleSignInSuccess: 'Successfully signed in with Google. Redirecting...',
	};

	interface Props {
		appName: string;
		logo: Component<{ size?: number; color?: string }>;
		primaryColor: string;
		onSignIn: (email: string, password: string) => Promise<AuthResult>;
		onSignInWithGoogle?: (idToken: string) => Promise<AuthResult>;
		onSignInWithApple?: (identityToken: string) => Promise<AuthResult>;
		goto: (path: string) => void;
		enableGoogle?: boolean;
		enableApple?: boolean;
		successRedirect?: string;
		registerPath?: string;
		forgotPasswordPath?: string;
		lightBackground?: string;
		darkBackground?: string;
		appSlider?: Snippet;
		headerControls?: Snippet;
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
		if (emailInput) emailInput.focus();
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
			showSuccess = true;
			successAnnouncement = t.signInSuccess;
			setTimeout(() => goto(successRedirect), 600);
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
			setTimeout(() => goto(successRedirect), 600);
		} else {
			setError(result.error || t.googleSignInFailed, 'general');
		}
	}

	function skipToForm() {
		if (emailInput) emailInput.focus();
	}

	function fillDevCredentials() {
		email = 'till.schneider@memoro.ai';
		password = 'Aa-12345678';
	}
</script>

<svelte:head>
	<title>Login - {appName}</title>
	<meta name="theme-color" content={darkBackground} media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content={lightBackground} media="(prefers-color-scheme: light)" />
</svelte:head>

<button class="skip-link" onclick={skipToForm} type="button">
	{t.skipToForm}
</button>

<div class="sr-only" aria-live="polite" aria-atomic="true">
	{successAnnouncement}
</div>

<div
	class="page-container"
	class:dark={isDark}
	class:light={!isDark}
	style:--light-bg={lightBackground}
	style:--dark-bg={darkBackground}
	style:--primary-color={primaryColor}
>
	<!-- Theme Toggle - Top Left -->
	<button
		type="button"
		onclick={toggleTheme}
		class="theme-toggle"
		aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	>
		{#if isDark}
			<Sun size={20} weight="bold" />
		{:else}
			<Moon size={20} weight="bold" />
		{/if}
	</button>

	{#if headerControls}
		<div class="header-controls">
			{@render headerControls()}
		</div>
	{/if}

	<main class="main-content">
		<!-- Logo Section -->
		<div class="logo-section">
			<button
				type="button"
				onclick={fillDevCredentials}
				class="logo-button"
				class:success-pulse={showSuccess}
				style:border-color={showSuccess ? '#22c55e' : primaryColor}
				aria-label="{appName} logo"
			>
				{#if showSuccess}
					<Check size={55} class="text-green-500" />
				{:else}
					<Logo size={55} color={primaryColor} />
				{/if}
			</button>
			<h1 class="app-name">{appName}</h1>
		</div>

		<!-- Form Section -->
		<div class="form-section">
			<div class="form-card" class:shake={shakeError}>
				<div class="form-header">
					<h2 class="form-title">{t.title}</h2>
					<p class="form-subtitle">{t.subtitle}</p>
				</div>

				{#if error}
					<div class="error-message" id="form-error" role="alert" aria-live="assertive">
						<Warning size={18} class="text-red-500 shrink-0" />
						<p>{error}</p>
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
					<div class="input-group">
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
							class="input-field"
							class:input-error={errorField === 'email'}
							style:--ring-color={errorField === 'email' ? '#ef4444' : primaryColor}
						/>
					</div>

					<!-- Password -->
					<div class="input-group">
						<label for="password" class="sr-only">{t.passwordPlaceholder}</label>
						<div class="input-wrapper">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:this={passwordInput}
								bind:value={password}
								placeholder={t.passwordPlaceholder}
								required
								autocomplete="current-password"
								aria-invalid={errorField === 'password'}
								class="input-field has-icon"
								class:input-error={errorField === 'password'}
								style:--ring-color={errorField === 'password' ? '#ef4444' : primaryColor}
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="password-toggle"
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
					<div class="options-row">
						<label class="remember-label">
							<input type="checkbox" bind:checked={rememberMe} style:accent-color={primaryColor} />
							<span>{t.rememberMe}</span>
						</label>
						<button
							type="button"
							onclick={() => goto(forgotPasswordPath)}
							class="forgot-link"
							style:color={primaryColor}
						>
							{t.forgotPassword}
						</button>
					</div>

					<!-- Submit -->
					<button
						type="submit"
						disabled={loading || showSuccess}
						class="submit-button"
						style:background-color={showSuccess ? '#22c55e' : primaryColor + '60'}
						style:border-color={showSuccess ? '#22c55e' : primaryColor}
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

				{#if enableGoogle || enableApple}
					<div class="divider">
						<span>{t.orDivider}</span>
					</div>
					<div class="social-buttons">
						{#if enableGoogle && onSignInWithGoogle}
							<GoogleSignInButton onSuccess={handleGoogleSuccess} />
						{/if}
						{#if enableApple}
							<AppleSignInButton />
						{/if}
					</div>
				{/if}

				<p class="register-link">
					{t.noAccount}
					<button type="button" onclick={() => goto(registerPath)} style:color={primaryColor}>
						{t.createAccount}
					</button>
				</p>
			</div>
		</div>
	</main>

	{#if appSlider}
		<footer class="app-slider-section">
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

	.page-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100dvh;
		width: 100%;
		max-width: 100vw;
		overflow-x: hidden;
		margin: 0;
		padding: 0;
		/* Dark mode default */
		background-color: var(--dark-bg, #121212);
	}

	.page-container.light {
		background-color: var(--light-bg, #f5f5f5);
	}

	.theme-toggle {
		position: absolute;
		top: 1rem;
		left: 1rem;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.light .theme-toggle {
		border-color: rgba(0, 0, 0, 0.2);
		background: rgba(0, 0, 0, 0.05);
		color: rgba(0, 0, 0, 0.7);
	}

	.theme-toggle:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.light .theme-toggle:hover {
		background: rgba(0, 0, 0, 0.1);
		color: #000;
	}

	.header-controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 50;
		opacity: 0.6;
		display: flex;
		gap: 0.75rem;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.logo-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1rem 1.5rem;
	}

	.logo-button {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: 3px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.75rem;
		cursor: pointer;
		transition: transform 0.2s;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		/* Dark mode default */
		background-color: #000;
	}

	.light .logo-button {
		background-color: #fff;
	}

	.logo-button:hover {
		transform: scale(1.05);
	}

	.logo-button:active {
		transform: scale(0.95);
	}

	.app-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: #fff;
	}

	.light .app-name {
		color: #000;
	}

	.form-section {
		flex: 1;
		display: flex;
		justify-content: center;
		padding: 1rem 1rem 2rem;
	}

	.form-card {
		width: 100%;
		max-width: 400px;
		border-radius: 1rem;
		padding: 1.5rem;
		border: 1px solid;
		backdrop-filter: blur(10px);
		/* Dark mode default */
		background-color: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.light .form-card {
		background-color: rgba(255, 255, 255, 0.7);
		border-color: rgba(0, 0, 0, 0.1);
	}

	.form-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.form-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.form-subtitle {
		font-size: 0.875rem;
		margin-top: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.light .form-title {
		color: rgba(0, 0, 0, 0.9);
	}

	.light .form-subtitle {
		color: rgba(0, 0, 0, 0.6);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
		border-radius: 0.75rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		font-size: 0.875rem;
	}

	.input-group {
		margin-bottom: 0.75rem;
	}

	.input-wrapper {
		position: relative;
	}

	.input-field {
		width: 100%;
		height: 3.5rem;
		padding: 0 1rem;
		border: 1px solid;
		border-radius: 0.75rem;
		font-size: 1rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		/* Dark mode default */
		background-color: rgba(0, 0, 0, 0.2);
		border-color: rgba(255, 255, 255, 0.2);
		color: #fff;
	}

	.input-field.input-error {
		border-color: #ef4444;
	}

	.light .input-field {
		background-color: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
		color: #000;
	}

	.light .input-field.input-error {
		border-color: #ef4444;
	}

	.input-field:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--ring-color, currentColor);
	}

	.input-field.has-icon {
		padding-right: 3rem;
	}

	.password-toggle {
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		width: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		transition: opacity 0.2s;
		color: rgba(255, 255, 255, 0.5);
	}

	.light .password-toggle {
		color: rgba(0, 0, 0, 0.4);
	}

	.password-toggle:hover {
		opacity: 0.8;
	}

	.options-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.remember-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.7);
	}

	.light .remember-label {
		color: rgba(0, 0, 0, 0.7);
	}

	.remember-label input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
		background-color: transparent;
		border: 1.5px solid rgba(255, 255, 255, 0.4);
		border-radius: 0.25rem;
		appearance: none;
		-webkit-appearance: none;
		display: grid;
		place-content: center;
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
	}

	.remember-label input[type='checkbox']:checked::before {
		transform: scale(1);
	}

	.light .remember-label input[type='checkbox'] {
		border-color: rgba(0, 0, 0, 0.3);
	}

	.forgot-link {
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 500;
		padding: 0.25rem;
	}

	.forgot-link:hover {
		opacity: 0.7;
	}

	.submit-button {
		width: 100%;
		height: 3.5rem;
		border: 2px solid;
		border-radius: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: opacity 0.2s;
		color: #fff;
	}

	.light .submit-button {
		color: #000;
	}

	.submit-button:hover:not(:disabled) {
		opacity: 0.85;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1.25rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: currentColor;
		opacity: 0.2;
	}

	.divider span {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.light .divider span {
		color: rgba(0, 0, 0, 0.5);
	}

	.social-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.register-link {
		text-align: center;
		font-size: 0.875rem;
		margin-top: 1rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.light .register-link {
		color: rgba(0, 0, 0, 0.6);
	}

	.register-link button {
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 500;
		padding: 0.25rem;
	}

	.register-link button:hover {
		opacity: 0.7;
	}

	.app-slider-section {
		width: 100%;
		padding: 0 0 1rem;
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

	.logo-section {
		animation: fadeInScale 0.5s ease-out both;
	}

	.form-card {
		animation: fadeInUp 0.5s ease-out 0.15s both;
	}

	.app-slider-section {
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

	/* Accessibility */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: #000;
		color: #fff;
		padding: 0.5rem 1rem;
		z-index: 100;
		font-weight: 500;
	}

	.skip-link:focus {
		top: 0;
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.logo-section,
		.form-card,
		.app-slider-section,
		.shake,
		.spinner,
		.success-pulse {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.logo-section {
			padding-top: 2rem;
		}

		.logo-button {
			width: 80px;
			height: 80px;
		}

		.logo-button :global(svg) {
			width: 40px;
			height: 40px;
		}

		.form-card {
			padding: 1.25rem;
		}
	}
</style>
