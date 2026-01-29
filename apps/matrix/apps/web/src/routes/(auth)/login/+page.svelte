<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { loginWithPassword, discoverHomeserver, checkHomeserver, matrixStore } from '$lib/matrix';
	import {
		Eye,
		EyeSlash,
		CircleNotch,
		HardDrive,
		User,
		Lock,
		Warning,
		SignIn,
		Sun,
		Moon,
		Check,
		ChatCircle,
	} from '@manacore/shared-icons';

	// Form state
	let homeserver = $state('matrix.mana.how');
	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);

	// UI state
	let loading = $state(false);
	let loadingSSO = $state(false);
	let checkingServer = $state(false);
	let error = $state<string | null>(null);
	let serverValid = $state<boolean | null>(null);
	let showSuccess = $state(false);
	let shakeError = $state(false);

	// Theme state
	let userThemePreference = $state<'light' | 'dark' | null>(null);
	let systemIsDark = $state(
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
			: true
	);

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

	// SSO Login via Mana Core
	function handleSSOLogin() {
		if (!browser) return;
		loadingSSO = true;
		const redirectUrl = encodeURIComponent(window.location.origin + '/chat');
		window.location.href = `https://matrix.mana.how/_matrix/client/v3/login/sso/redirect/oidc-manacore?redirectUrl=${redirectUrl}`;
	}

	// Auto-discover homeserver when username looks like a full Matrix ID
	let discoverTimeout: ReturnType<typeof setTimeout>;

	function handleUsernameInput() {
		if (username.includes(':')) {
			clearTimeout(discoverTimeout);
			discoverTimeout = setTimeout(async () => {
				const discovered = await discoverHomeserver(username);
				if (discovered) {
					homeserver = discovered.replace(/^https?:\/\//, '');
					await validateServer();
				}
			}, 500);
		}
	}

	async function validateServer() {
		if (!homeserver.trim()) {
			serverValid = null;
			return;
		}

		checkingServer = true;
		const result = await checkHomeserver(homeserver);
		serverValid = result.ok;
		checkingServer = false;

		if (!result.ok) {
			setError(`Server nicht erreichbar: ${result.error}`);
		} else {
			error = null;
		}
	}

	function setError(message: string) {
		error = message;
		shakeError = true;
		setTimeout(() => (shakeError = false), 500);
	}

	async function handleLogin(e: Event) {
		e.preventDefault();

		if (!username.trim() || !password.trim()) {
			setError('Bitte Benutzername und Passwort eingeben');
			return;
		}

		loading = true;
		error = null;

		const result = await loginWithPassword(homeserver, username, password);

		if (result.success && result.credentials) {
			showSuccess = true;
			const initialized = await matrixStore.initialize(result.credentials);

			if (initialized) {
				setTimeout(() => goto('/chat'), 600);
			} else {
				showSuccess = false;
				setError(matrixStore.error || 'Matrix Client konnte nicht initialisiert werden');
			}
		} else {
			setError(result.error || 'Anmeldung fehlgeschlagen');
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Login - Mana Matrix</title>
</svelte:head>

<div
	class="page-container"
	class:dark={isDark}
	class:light={!isDark}
>
	<!-- Theme Toggle -->
	<button
		type="button"
		onclick={toggleTheme}
		class="theme-toggle"
		aria-label={isDark ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
	>
		{#if isDark}
			<Sun size={20} weight="bold" />
		{:else}
			<Moon size={20} weight="bold" />
		{/if}
	</button>

	<main class="main-content">
		<!-- Logo Section -->
		<div class="logo-section">
			<div
				class="logo-button"
				class:success-pulse={showSuccess}
			>
				{#if showSuccess}
					<Check size={55} class="text-green-500" />
				{:else}
					<ChatCircle size={55} weight="duotone" class="text-violet-500" />
				{/if}
			</div>
			<h1 class="app-name">Mana Matrix</h1>
			<p class="app-subtitle">Sichere Matrix-Kommunikation</p>
		</div>

		<!-- Form Section -->
		<div class="form-section">
			<div class="form-card" class:shake={shakeError}>
				<div class="form-header">
					<h2 class="form-title">Anmelden</h2>
					<p class="form-subtitle">Mit deinem Matrix-Konto anmelden</p>
				</div>

				{#if error}
					<div class="error-message" role="alert">
						<Warning size={18} class="text-red-500 shrink-0" />
						<p>{error}</p>
					</div>
				{/if}

				<form onsubmit={handleLogin}>
					<!-- Homeserver -->
					<div class="input-group">
						<label for="homeserver" class="input-label">
							<HardDrive size={16} />
							Homeserver
							{#if checkingServer}
								<CircleNotch size={14} class="animate-spin ml-auto" />
							{:else if serverValid === true}
								<span class="ml-auto text-green-500 text-xs">Verbunden</span>
							{:else if serverValid === false}
								<span class="ml-auto text-red-500 text-xs">Nicht erreichbar</span>
							{/if}
						</label>
						<input
							id="homeserver"
							type="text"
							bind:value={homeserver}
							onblur={validateServer}
							class="input-field"
							class:input-success={serverValid === true}
							class:input-error={serverValid === false}
							placeholder="matrix.org"
							disabled={loading}
						/>
					</div>

					<!-- Username -->
					<div class="input-group">
						<label for="username" class="input-label">
							<User size={16} />
							Benutzername
						</label>
						<input
							id="username"
							type="text"
							bind:value={username}
							oninput={handleUsernameInput}
							class="input-field"
							placeholder="@user:matrix.org oder username"
							disabled={loading}
							autocomplete="username"
						/>
					</div>

					<!-- Password -->
					<div class="input-group">
						<label for="password" class="input-label">
							<Lock size={16} />
							Passwort
						</label>
						<div class="input-wrapper">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								class="input-field has-icon"
								placeholder="Dein Passwort"
								disabled={loading}
								autocomplete="current-password"
							/>
							<button
								type="button"
								class="password-toggle"
								onclick={() => (showPassword = !showPassword)}
								tabindex={-1}
								aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
							>
								{#if showPassword}
									<EyeSlash size={20} />
								{:else}
									<Eye size={20} />
								{/if}
							</button>
						</div>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading || showSuccess}
						class="submit-button"
					>
						{#if loading}
							<CircleNotch size={20} class="animate-spin" />
							<span>Anmelden...</span>
						{:else if showSuccess}
							<Check size={20} />
							<span>Erfolgreich!</span>
						{:else}
							<SignIn size={20} />
							<span>Anmelden</span>
						{/if}
					</button>
				</form>

				<!-- Divider -->
				<div class="divider">
					<span>oder</span>
				</div>

				<!-- SSO Login -->
				<button
					type="button"
					class="sso-button"
					onclick={handleSSOLogin}
					disabled={loadingSSO}
				>
					{#if loadingSSO}
						<CircleNotch size={20} class="animate-spin" />
						<span>Weiterleiten...</span>
					{:else}
						<SignIn size={20} />
						<span>Mit Mana Core anmelden</span>
					{/if}
				</button>

				<!-- Footer -->
				<p class="register-link">
					Noch kein Konto?
					<a href="/register">Registrieren</a>
				</p>
			</div>
		</div>
	</main>
</div>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100dvh;
		width: 100%;
		background-color: #121212;
	}

	.page-container.light {
		background-color: #f5f5f5;
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
		animation: fadeInScale 0.5s ease-out both;
	}

	.logo-button {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: 3px solid #8b5cf6;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.75rem;
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
		background-color: #000;
		transition: transform 0.2s;
	}

	.light .logo-button {
		background-color: #fff;
	}

	.app-name {
		font-size: 1.5rem;
		font-weight: 600;
		color: #fff;
		margin: 0;
	}

	.light .app-name {
		color: #000;
	}

	.app-subtitle {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 0.25rem;
	}

	.light .app-subtitle {
		color: rgba(0, 0, 0, 0.6);
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
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		background-color: rgba(255, 255, 255, 0.08);
		animation: fadeInUp 0.5s ease-out 0.15s both;
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
		margin: 0;
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
		align-items: flex-start;
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

	.input-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 0.5rem;
	}

	.light .input-label {
		color: rgba(0, 0, 0, 0.7);
	}

	.input-wrapper {
		position: relative;
	}

	.input-field {
		width: 100%;
		height: 3rem;
		padding: 0 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.75rem;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
		background-color: rgba(0, 0, 0, 0.2);
		color: #fff;
		box-sizing: border-box;
	}

	.light .input-field {
		background-color: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
		color: #000;
	}

	.input-field:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
	}

	.input-field.input-success {
		border-color: #22c55e;
	}

	.input-field.input-error {
		border-color: #ef4444;
	}

	.input-field.has-icon {
		padding-right: 3rem;
	}

	.input-field::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.light .input-field::placeholder {
		color: rgba(0, 0, 0, 0.4);
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
		color: rgba(255, 255, 255, 0.5);
		transition: opacity 0.2s;
	}

	.light .password-toggle {
		color: rgba(0, 0, 0, 0.4);
	}

	.password-toggle:hover {
		opacity: 0.8;
	}

	.submit-button {
		width: 100%;
		height: 3rem;
		margin-top: 1rem;
		border: 2px solid #8b5cf6;
		border-radius: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		color: #fff;
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3));
	}

	.light .submit-button {
		color: #000;
	}

	.submit-button:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(124, 58, 237, 0.5));
		transform: translateY(-1px);
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

	.sso-button {
		width: 100%;
		height: 3rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.75rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		color: rgba(255, 255, 255, 0.8);
		background: rgba(255, 255, 255, 0.05);
	}

	.light .sso-button {
		border-color: rgba(0, 0, 0, 0.2);
		color: rgba(0, 0, 0, 0.8);
		background: rgba(0, 0, 0, 0.05);
	}

	.sso-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	.light .sso-button:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.1);
	}

	.sso-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.register-link {
		text-align: center;
		font-size: 0.875rem;
		margin-top: 1.25rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.light .register-link {
		color: rgba(0, 0, 0, 0.6);
	}

	.register-link a {
		color: #8b5cf6;
		font-weight: 500;
		text-decoration: none;
	}

	.register-link a:hover {
		text-decoration: underline;
	}

	/* Animations */
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

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
		20%, 40%, 60%, 80% { transform: translateX(4px); }
	}

	.shake {
		animation: shake 0.5s ease-in-out;
	}

	@keyframes success-pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	.success-pulse {
		animation: success-pulse 0.6s ease-in-out;
		border-color: #22c55e !important;
	}

	/* Spin animation for loading */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
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

		.form-card {
			padding: 1.25rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.logo-section,
		.form-card,
		.shake,
		.success-pulse {
			animation: none;
		}
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
