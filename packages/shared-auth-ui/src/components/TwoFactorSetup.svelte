<script lang="ts">
	import QRCode from 'qrcode';
	import type { AuthResult, TwoFactorSetupTranslations } from '../types';

	const defaultTranslations: TwoFactorSetupTranslations = {
		title: 'Zwei-Faktor-Authentifizierung',
		statusEnabled: 'Aktiviert',
		statusDisabled: 'Deaktiviert',
		enableButton: 'Aktivieren',
		disableButton: 'Deaktivieren',
		regenerateButton: 'Backup-Codes erneuern',
		passwordLabel: 'Passwort zur Bestätigung',
		passwordPlaceholder: 'Passwort',
		confirmButton: 'Bestätigen',
		cancelButton: 'Abbrechen',
		setupTitle: '2FA einrichten',
		setupStep1: '1. Scanne den QR-Code oder gib den Schlüssel manuell ein',
		setupStep2: '2. Sichere deine Backup-Codes',
		manualEntryLabel: 'Schlüssel für manuelle Eingabe:',
		copyButton: 'Kopieren',
		copiedButton: 'Kopiert!',
		doneButton: 'Fertig',
		disableConfirmTitle: '2FA deaktivieren',
		disableConfirmText:
			'Bist du sicher, dass du die Zwei-Faktor-Authentifizierung deaktivieren möchtest?',
		backupCodesTitle: 'Neue Backup-Codes',
		backupCodesWarning: 'Speichere diese Codes sicher ab. Sie ersetzen die bisherigen Codes.',
		copyCodesButton: 'Codes kopieren',
		copiedCodesButton: 'Kopiert!',
	};

	interface Props {
		enabled: boolean;
		onEnable: (
			password: string
		) => Promise<{ success: boolean; totpURI?: string; backupCodes?: string[]; error?: string }>;
		onDisable: (password: string) => Promise<{ success: boolean; error?: string }>;
		onGenerateBackupCodes: (
			password: string
		) => Promise<{ success: boolean; backupCodes?: string[]; error?: string }>;
		primaryColor?: string;
		translations?: Partial<TwoFactorSetupTranslations>;
	}

	let {
		enabled,
		onEnable,
		onDisable,
		onGenerateBackupCodes,
		primaryColor = '#6366f1',
		translations = {},
	}: Props = $props();

	const t = $derived({ ...defaultTranslations, ...translations });

	type View =
		| 'status'
		| 'enable-password'
		| 'setup'
		| 'disable-password'
		| 'regenerate-password'
		| 'backup-codes';

	let view = $state<View>('status');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let totpURI = $state<string | null>(null);
	let backupCodes = $state<string[]>([]);
	let copied = $state(false);
	let codesCopied = $state(false);
	let qrCodeDataUrl = $state('');

	$effect(() => {
		if (totpURI) {
			QRCode.toDataURL(totpURI, { width: 200, margin: 2 }).then((url: string) => {
				qrCodeDataUrl = url;
			});
		}
	});

	/** Extract the secret from an otpauth:// URI */
	function extractSecret(uri: string): string {
		try {
			const url = new URL(uri);
			return url.searchParams.get('secret') || uri;
		} catch {
			return uri;
		}
	}

	function reset() {
		view = 'status';
		password = '';
		error = null;
		totpURI = null;
		backupCodes = [];
		copied = false;
		codesCopied = false;
	}

	async function handleEnable() {
		if (!password) return;
		loading = true;
		error = null;

		const result = await onEnable(password);
		loading = false;

		if (result.success && result.totpURI) {
			totpURI = result.totpURI;
			backupCodes = result.backupCodes || [];
			view = 'setup';
			password = '';
		} else {
			error = result.error || 'Fehler beim Aktivieren';
		}
	}

	async function handleDisable() {
		if (!password) return;
		loading = true;
		error = null;

		const result = await onDisable(password);
		loading = false;

		if (result.success) {
			reset();
		} else {
			error = result.error || 'Fehler beim Deaktivieren';
		}
	}

	async function handleRegenerateBackupCodes() {
		if (!password) return;
		loading = true;
		error = null;

		const result = await onGenerateBackupCodes(password);
		loading = false;

		if (result.success && result.backupCodes) {
			backupCodes = result.backupCodes;
			view = 'backup-codes';
			password = '';
		} else {
			error = result.error || 'Fehler beim Erneuern der Codes';
		}
	}

	async function copyToClipboard(text: string, type: 'uri' | 'codes') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'uri') {
				copied = true;
				setTimeout(() => (copied = false), 2000);
			} else {
				codesCopied = true;
				setTimeout(() => (codesCopied = false), 2000);
			}
		} catch {
			// Clipboard API not available
		}
	}
</script>

<div class="two-factor-setup">
	{#if view === 'status'}
		<div class="section-header">
			<h3 class="section-title">{t.title}</h3>
			<div class="status-badge" class:status-enabled={enabled} class:status-disabled={!enabled}>
				<span class="status-dot"></span>
				{enabled ? t.statusEnabled : t.statusDisabled}
			</div>
		</div>

		<div class="action-buttons">
			{#if enabled}
				<button
					type="button"
					class="action-button secondary"
					style:border-color={primaryColor}
					onclick={() => {
						view = 'regenerate-password';
						error = null;
					}}
				>
					{t.regenerateButton}
				</button>
				<button
					type="button"
					class="action-button danger"
					onclick={() => {
						view = 'disable-password';
						error = null;
					}}
				>
					{t.disableButton}
				</button>
			{:else}
				<button
					type="button"
					class="action-button primary"
					style:background-color={primaryColor + '60'}
					style:border-color={primaryColor}
					onclick={() => {
						view = 'enable-password';
						error = null;
					}}
				>
					{t.enableButton}
				</button>
			{/if}
		</div>
	{:else if view === 'enable-password' || view === 'disable-password' || view === 'regenerate-password'}
		<div class="section-header">
			<h3 class="section-title">
				{#if view === 'disable-password'}
					{t.disableConfirmTitle}
				{:else if view === 'regenerate-password'}
					{t.backupCodesTitle}
				{:else}
					{t.title}
				{/if}
			</h3>
		</div>

		{#if view === 'disable-password'}
			<p class="confirm-text">{t.disableConfirmText}</p>
		{/if}

		{#if error}
			<div class="error-message" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		<form
			onsubmit={(e) => {
				e.preventDefault();
				if (view === 'enable-password') handleEnable();
				else if (view === 'disable-password') handleDisable();
				else handleRegenerateBackupCodes();
			}}
		>
			<div class="input-group">
				<label for="2fa-password" class="input-label">{t.passwordLabel}</label>
				<input
					id="2fa-password"
					type="password"
					bind:value={password}
					placeholder={t.passwordPlaceholder}
					required
					autocomplete="current-password"
					class="input-field"
					style:--ring-color={primaryColor}
				/>
			</div>

			<div class="action-buttons">
				<button type="button" class="action-button secondary" onclick={reset}>
					{t.cancelButton}
				</button>
				<button
					type="submit"
					disabled={loading || !password}
					class="action-button primary"
					style:background-color={view === 'disable-password' ? '#ef444460' : primaryColor + '60'}
					style:border-color={view === 'disable-password' ? '#ef4444' : primaryColor}
				>
					{loading ? '...' : t.confirmButton}
				</button>
			</div>
		</form>
	{:else if view === 'setup'}
		<div class="section-header">
			<h3 class="section-title">{t.setupTitle}</h3>
		</div>

		<div class="setup-step">
			<p class="step-label">{t.setupStep1}</p>

			{#if totpURI}
				<div class="qr-section">
					{#if qrCodeDataUrl}
						<img
							src={qrCodeDataUrl}
							alt="QR Code for TOTP setup"
							width="200"
							height="200"
							class="qr-image"
						/>
					{:else}
						<div class="qr-placeholder" style:width="200px" style:height="200px"></div>
					{/if}
				</div>

				<div class="manual-entry">
					<p class="manual-label">{t.manualEntryLabel}</p>
					<div class="secret-display">
						<code class="secret-code">{extractSecret(totpURI)}</code>
						<button
							type="button"
							class="copy-button"
							style:color={primaryColor}
							onclick={() => copyToClipboard(extractSecret(totpURI || ''), 'uri')}
						>
							{copied ? t.copiedButton : t.copyButton}
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if backupCodes.length > 0}
			<div class="setup-step">
				<p class="step-label">{t.setupStep2}</p>
				<p class="backup-warning">{t.backupCodesWarning}</p>

				<div class="backup-grid">
					{#each backupCodes as code}
						<code class="backup-code">{code}</code>
					{/each}
				</div>

				<button
					type="button"
					class="copy-button"
					style:color={primaryColor}
					style:margin-top="0.5rem"
					onclick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
				>
					{codesCopied ? t.copiedCodesButton : t.copyCodesButton}
				</button>
			</div>
		{/if}

		<div class="action-buttons" style:margin-top="1.5rem">
			<button
				type="button"
				class="action-button primary"
				style:background-color={primaryColor + '60'}
				style:border-color={primaryColor}
				onclick={reset}
			>
				{t.doneButton}
			</button>
		</div>
	{:else if view === 'backup-codes'}
		<div class="section-header">
			<h3 class="section-title">{t.backupCodesTitle}</h3>
		</div>

		<p class="backup-warning">{t.backupCodesWarning}</p>

		<div class="backup-grid">
			{#each backupCodes as code}
				<code class="backup-code">{code}</code>
			{/each}
		</div>

		<button
			type="button"
			class="copy-button"
			style:color={primaryColor}
			style:margin-top="0.5rem"
			onclick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
		>
			{codesCopied ? t.copiedCodesButton : t.copyCodesButton}
		</button>

		<div class="action-buttons" style:margin-top="1.5rem">
			<button
				type="button"
				class="action-button primary"
				style:background-color={primaryColor + '60'}
				style:border-color={primaryColor}
				onclick={reset}
			>
				{t.doneButton}
			</button>
		</div>
	{/if}
</div>

<style>
	.two-factor-setup {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		background: hsl(var(--theme-surface, 0 0% 100%) / 0.5);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
	}

	/* Semantic green kept */
	.status-enabled {
		color: #22c55e;
		background: rgba(34, 197, 94, 0.15);
	}

	.status-disabled {
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		background: hsl(var(--theme-muted, 220 14% 96%));
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: currentColor;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.action-button {
		flex: 1;
		height: 2.75rem;
		border: 2px solid;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: opacity 0.2s;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.action-button.primary {
		border-style: solid;
	}

	.action-button.secondary {
		background: transparent;
		border-color: hsl(var(--theme-border, 220 13% 91%));
	}

	/* Semantic red kept */
	.action-button.danger {
		background: rgba(239, 68, 68, 0.15);
		border-color: #ef4444;
		color: #ef4444;
	}

	.action-button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.confirm-text {
		font-size: 0.875rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin-bottom: 1rem;
	}

	.input-group {
		margin-bottom: 0.75rem;
	}

	.input-label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.375rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
	}

	.input-field {
		width: 100%;
		height: 2.75rem;
		padding: 0 0.75rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		background: hsl(var(--theme-background, 0 0% 100%));
		color: hsl(var(--theme-foreground, 220 9% 10%));
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.input-field:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--ring-color, currentColor);
	}

	/* Semantic red kept */
	.error-message {
		padding: 0.625rem 0.75rem;
		margin-bottom: 0.75rem;
		border-radius: 0.5rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		font-size: 0.8125rem;
	}

	.error-message p {
		margin: 0;
	}

	.setup-step {
		margin-bottom: 1.25rem;
	}

	.step-label {
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.qr-section {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.qr-image {
		border-radius: 0.5rem;
		background: #fff;
		padding: 0.5rem;
	}

	.qr-placeholder {
		border-radius: 0.5rem;
		background: hsl(var(--theme-muted, 220 14% 96%));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.manual-entry {
		margin-top: 0.75rem;
	}

	.manual-label {
		font-size: 0.8125rem;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		margin-bottom: 0.375rem;
	}

	.secret-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--theme-muted, 220 14% 96%));
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
	}

	.secret-code {
		flex: 1;
		font-size: 0.8125rem;
		font-family: monospace;
		word-break: break-all;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.copy-button {
		background: none;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		padding: 0.25rem;
	}

	.copy-button:hover {
		opacity: 0.7;
	}

	/* Semantic amber kept */
	.backup-warning {
		font-size: 0.8125rem;
		color: #f59e0b;
		margin-bottom: 0.75rem;
	}

	.backup-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		gap: 0.375rem;
	}

	.backup-code {
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--theme-muted, 220 14% 96%));
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		font-size: 0.8125rem;
		font-family: monospace;
		text-align: center;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	@media (prefers-reduced-motion: reduce) {
		* {
			transition-duration: 0.01ms !important;
		}
	}
</style>
