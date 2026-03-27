<script lang="ts">
	import { Eye, EyeSlash } from '@manacore/shared-icons';
	import PasswordStrength from './PasswordStrength.svelte';

	interface Props {
		onChangePassword: (
			currentPassword: string,
			newPassword: string
		) => Promise<{ success: boolean; error?: string }>;
		primaryColor?: string;
	}

	let { onChangePassword, primaryColor = '#6366f1' }: Props = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	let passwordsMatch = $derived(newPassword === confirmPassword);
	let passwordLongEnough = $derived(newPassword.length >= 8);
	let canSubmit = $derived(
		currentPassword.length > 0 && passwordLongEnough && passwordsMatch && !loading
	);

	function reset() {
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		showCurrentPassword = false;
		showNewPassword = false;
		showConfirmPassword = false;
		error = null;
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		loading = true;
		error = null;
		success = false;

		const result = await onChangePassword(currentPassword, newPassword);
		loading = false;

		if (result.success) {
			success = true;
			reset();
			setTimeout(() => (success = false), 4000);
		} else {
			error = result.error || 'Fehler beim Ändern des Passworts';
		}
	}
</script>

<div class="change-password">
	<h3 class="section-title">Passwort ändern</h3>

	{#if success}
		<div class="success-message" role="status">
			<p>Passwort erfolgreich geändert.</p>
		</div>
	{/if}

	{#if error}
		<div class="error-message" role="alert">
			<p>{error}</p>
		</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="input-group">
			<label for="current-password" class="input-label">Aktuelles Passwort</label>
			<div class="input-wrapper">
				<input
					id="current-password"
					type={showCurrentPassword ? 'text' : 'password'}
					bind:value={currentPassword}
					required
					autocomplete="current-password"
					class="input-field has-icon"
					style:--ring-color={primaryColor}
				/>
				<button
					type="button"
					onclick={() => (showCurrentPassword = !showCurrentPassword)}
					class="password-toggle"
					aria-label={showCurrentPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
				>
					{#if showCurrentPassword}
						<EyeSlash size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
		</div>

		<div class="input-group">
			<label for="new-password" class="input-label">Neues Passwort</label>
			<div class="input-wrapper">
				<input
					id="new-password"
					type={showNewPassword ? 'text' : 'password'}
					bind:value={newPassword}
					required
					autocomplete="new-password"
					class="input-field has-icon"
					class:input-error={newPassword.length > 0 && !passwordLongEnough}
					style:--ring-color={primaryColor}
				/>
				<button
					type="button"
					onclick={() => (showNewPassword = !showNewPassword)}
					class="password-toggle"
					aria-label={showNewPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
				>
					{#if showNewPassword}
						<EyeSlash size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
			{#if newPassword.length > 0 && !passwordLongEnough}
				<p class="field-hint error">Mindestens 8 Zeichen</p>
			{:else}
				<p class="field-hint">Mindestens 8 Zeichen</p>
			{/if}
		</div>

		<PasswordStrength password={newPassword} {primaryColor} />

		<div class="input-group">
			<label for="confirm-password" class="input-label">Neues Passwort bestätigen</label>
			<div class="input-wrapper">
				<input
					id="confirm-password"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					required
					autocomplete="new-password"
					class="input-field has-icon"
					class:input-error={confirmPassword.length > 0 && !passwordsMatch}
					style:--ring-color={primaryColor}
				/>
				<button
					type="button"
					onclick={() => (showConfirmPassword = !showConfirmPassword)}
					class="password-toggle"
					aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
				>
					{#if showConfirmPassword}
						<EyeSlash size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
			{#if confirmPassword.length > 0 && !passwordsMatch}
				<p class="field-hint error">Passwörter stimmen nicht überein</p>
			{/if}
		</div>

		<button
			type="submit"
			disabled={!canSubmit}
			class="submit-button"
			style:background-color={primaryColor + '60'}
			style:border-color={primaryColor}
		>
			{loading ? 'Wird geändert...' : 'Passwort ändern'}
		</button>
	</form>
</div>

<style>
	.change-password {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
	}

	:global(.light) .change-password {
		border-color: rgba(0, 0, 0, 0.1);
		background: rgba(0, 0, 0, 0.02);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	:global(.light) .section-title {
		color: rgba(0, 0, 0, 0.9);
	}

	.success-message {
		padding: 0.625rem 0.75rem;
		margin-bottom: 0.75rem;
		border-radius: 0.5rem;
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #22c55e;
		font-size: 0.8125rem;
	}

	.success-message p {
		margin: 0;
	}

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

	.input-group {
		margin-bottom: 0.75rem;
	}

	.input-label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.375rem;
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.light) .input-label {
		color: rgba(0, 0, 0, 0.7);
	}

	.input-wrapper {
		position: relative;
	}

	.input-field {
		width: 100%;
		height: 2.75rem;
		padding: 0 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		background: rgba(0, 0, 0, 0.2);
		color: #fff;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	:global(.light) .input-field {
		background: rgba(255, 255, 255, 0.8);
		border-color: rgba(0, 0, 0, 0.1);
		color: #000;
	}

	.input-field.has-icon {
		padding-right: 2.75rem;
	}

	.input-field:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--ring-color, currentColor);
	}

	.input-field.input-error {
		border-color: #ef4444;
	}

	.password-toggle {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.light) .password-toggle {
		color: rgba(0, 0, 0, 0.5);
	}

	.password-toggle:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	:global(.light) .password-toggle:hover {
		color: rgba(0, 0, 0, 0.8);
	}

	.field-hint {
		font-size: 0.75rem;
		margin: 0.25rem 0 0;
		color: rgba(255, 255, 255, 0.4);
	}

	:global(.light) .field-hint {
		color: rgba(0, 0, 0, 0.4);
	}

	.field-hint.error {
		color: #ef4444;
	}

	.submit-button {
		width: 100%;
		height: 2.75rem;
		border: 2px solid;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: opacity 0.2s;
		color: rgba(255, 255, 255, 0.9);
		margin-top: 0.5rem;
	}

	:global(.light) .submit-button {
		color: rgba(0, 0, 0, 0.9);
	}

	.submit-button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
