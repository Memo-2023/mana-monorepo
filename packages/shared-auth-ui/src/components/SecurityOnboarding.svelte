<script lang="ts">
	interface Props {
		onSetupPasskey?: () => Promise<{ success: boolean; error?: string }>;
		onSkip: () => void;
		passkeyAvailable: boolean;
		primaryColor?: string;
		locale?: 'de' | 'en';
	}

	let {
		onSetupPasskey,
		onSkip,
		passkeyAvailable,
		primaryColor = '#6366f1',
		locale = 'de',
	}: Props = $props();

	const textsDE = {
		passkeySetup: 'Passkey eingerichtet!',
		passkeySetupDescription:
			'Dein Konto ist jetzt mit einem Passkey gesichert. Du kannst dich ab sofort ohne Passwort anmelden.',
		continue: 'Weiter',
		secureYourAccount: 'Sichere dein Konto',
		secureDescription: 'Schütze dein Konto mit zusätzlicher Sicherheit.',
		setupPasskey: 'Passkey einrichten',
		passkeyDescription: 'Anmelden ohne Passwort mit Touch ID, Face ID oder Windows Hello',
		setupNow: 'Jetzt einrichten',
		hint2fa: 'Du kannst 2FA jederzeit in den Einstellungen aktivieren.',
		skip: 'Überspringen',
		defaultError: 'Fehler beim Einrichten des Passkeys',
	};

	const textsEN = {
		passkeySetup: 'Passkey set up!',
		passkeySetupDescription:
			'Your account is now secured with a passkey. You can sign in without a password from now on.',
		continue: 'Continue',
		secureYourAccount: 'Secure your account',
		secureDescription: 'Protect your account with additional security.',
		setupPasskey: 'Set up Passkey',
		passkeyDescription: 'Sign in without a password using Touch ID, Face ID, or Windows Hello',
		setupNow: 'Set up now',
		hint2fa: 'You can enable 2FA at any time in Settings.',
		skip: 'Skip',
		defaultError: 'Error setting up passkey',
	};

	const txt = $derived(locale === 'en' ? textsEN : textsDE);

	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSetupPasskey() {
		if (!onSetupPasskey) return;
		loading = true;
		error = null;

		const result = await onSetupPasskey();
		loading = false;

		if (result.success) {
			success = true;
		} else {
			error = result.error || txt.defaultError;
		}
	}
</script>

<div class="onboarding-container">
	{#if success}
		<div class="onboarding-card">
			<div class="icon-circle success-icon">
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</div>
			<h2 class="onboarding-title">{txt.passkeySetup}</h2>
			<p class="onboarding-description">
				{txt.passkeySetupDescription}
			</p>
			<button
				type="button"
				class="primary-button"
				style:background-color={primaryColor + '60'}
				style:border-color={primaryColor}
				onclick={onSkip}
			>
				{txt.continue}
			</button>
		</div>
	{:else}
		<div class="onboarding-card">
			<div class="icon-circle" style:border-color={primaryColor}>
				<svg
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				</svg>
			</div>
			<h2 class="onboarding-title">{txt.secureYourAccount}</h2>
			<p class="onboarding-description">{txt.secureDescription}</p>

			{#if error}
				<div class="error-message" role="alert">
					<p>{error}</p>
				</div>
			{/if}

			{#if passkeyAvailable && onSetupPasskey}
				<div class="option-card">
					<div class="option-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
							<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
						</svg>
					</div>
					<div class="option-content">
						<h3 class="option-title">{txt.setupPasskey}</h3>
						<p class="option-description">
							{txt.passkeyDescription}
						</p>
					</div>
					<button
						type="button"
						class="setup-button"
						style:background-color={primaryColor + '60'}
						style:border-color={primaryColor}
						disabled={loading}
						onclick={handleSetupPasskey}
					>
						{loading ? '...' : txt.setupNow}
					</button>
				</div>
			{/if}

			<p class="hint-text">{txt.hint2fa}</p>

			<button type="button" class="skip-button" onclick={onSkip}> {txt.skip} </button>
		</div>
	{/if}
</div>

<style>
	.onboarding-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
	}

	.onboarding-card {
		width: 100%;
		max-width: 24rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 2rem;
		border-radius: 1rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		background: hsl(var(--theme-surface, 0 0% 100%) / 0.5);
	}

	.icon-circle {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		border: 2px solid hsl(var(--theme-border, 220 13% 91%));
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
		color: hsl(var(--theme-foreground, 220 9% 10%) / 0.7);
	}

	/* Semantic green kept */
	.success-icon {
		border-color: #22c55e;
		color: #22c55e;
	}

	.onboarding-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.onboarding-description {
		font-size: 0.875rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}

	/* Semantic red kept */
	.error-message {
		width: 100%;
		padding: 0.625rem 0.75rem;
		margin-bottom: 1rem;
		border-radius: 0.5rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		font-size: 0.8125rem;
		text-align: left;
	}

	.error-message p {
		margin: 0;
	}

	.option-card {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		background: hsl(var(--theme-surface, 0 0% 100%) / 0.5);
		margin-bottom: 1rem;
	}

	.option-icon {
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
	}

	.option-content {
		text-align: center;
	}

	.option-title {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.option-description {
		font-size: 0.8125rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin: 0;
		line-height: 1.4;
	}

	.setup-button {
		width: 100%;
		height: 2.5rem;
		border: 2px solid;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: opacity 0.2s;
		color: hsl(var(--theme-foreground, 220 9% 10%));
		background: transparent;
	}

	.setup-button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.setup-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hint-text {
		font-size: 0.8125rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%) / 0.7);
		margin: 0 0 1.25rem;
	}

	.skip-button {
		background: none;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		cursor: pointer;
		padding: 0.5rem 1rem;
		transition: color 0.2s;
	}

	.skip-button:hover {
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.primary-button {
		width: 100%;
		height: 2.75rem;
		border: 2px solid;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: opacity 0.2s;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.primary-button:hover {
		opacity: 0.8;
	}
</style>
