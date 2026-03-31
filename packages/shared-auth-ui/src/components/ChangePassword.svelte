<script lang="ts">
	import { Eye, EyeSlash } from '@manacore/shared-icons';
	import PasswordStrength from './PasswordStrength.svelte';

	interface Props {
		onChangePassword: (
			currentPassword: string,
			newPassword: string
		) => Promise<{ success: boolean; error?: string }>;
		primaryColor?: string;
		locale?: 'de' | 'en';
	}

	let { onChangePassword, primaryColor = '#6366f1', locale = 'de' }: Props = $props();

	const textsDE = {
		title: 'Passwort ändern',
		successMessage: 'Passwort erfolgreich geändert.',
		currentPasswordLabel: 'Aktuelles Passwort',
		newPasswordLabel: 'Neues Passwort',
		confirmPasswordLabel: 'Neues Passwort bestätigen',
		hidePassword: 'Passwort verbergen',
		showPassword: 'Passwort anzeigen',
		minChars: 'Mindestens 8 Zeichen',
		passwordsMismatch: 'Passwörter stimmen nicht überein',
		submitting: 'Wird geändert...',
		submit: 'Passwort ändern',
		defaultError: 'Fehler beim Ändern des Passworts',
	};

	const textsEN = {
		title: 'Change Password',
		successMessage: 'Password changed successfully.',
		currentPasswordLabel: 'Current Password',
		newPasswordLabel: 'New Password',
		confirmPasswordLabel: 'Confirm New Password',
		hidePassword: 'Hide password',
		showPassword: 'Show password',
		minChars: 'At least 8 characters',
		passwordsMismatch: 'Passwords do not match',
		submitting: 'Changing...',
		submit: 'Change Password',
		defaultError: 'Error changing password',
	};

	const txt = $derived(locale === 'en' ? textsEN : textsDE);

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
			error = result.error || txt.defaultError;
		}
	}
</script>

<div class="change-password">
	<h3 class="section-title">{txt.title}</h3>

	{#if success}
		<div class="success-message" role="status">
			<p>{txt.successMessage}</p>
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
			<label for="current-password" class="input-label">{txt.currentPasswordLabel}</label>
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
					aria-label={showCurrentPassword ? txt.hidePassword : txt.showPassword}
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
			<label for="new-password" class="input-label">{txt.newPasswordLabel}</label>
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
					aria-label={showNewPassword ? txt.hidePassword : txt.showPassword}
				>
					{#if showNewPassword}
						<EyeSlash size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
			{#if newPassword.length > 0 && !passwordLongEnough}
				<p class="field-hint error">{txt.minChars}</p>
			{:else}
				<p class="field-hint">{txt.minChars}</p>
			{/if}
		</div>

		<PasswordStrength password={newPassword} {primaryColor} {locale} />

		<div class="input-group">
			<label for="confirm-password" class="input-label">{txt.confirmPasswordLabel}</label>
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
					aria-label={showConfirmPassword ? txt.hidePassword : txt.showPassword}
				>
					{#if showConfirmPassword}
						<EyeSlash size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
			{#if confirmPassword.length > 0 && !passwordsMatch}
				<p class="field-hint error">{txt.passwordsMismatch}</p>
			{/if}
		</div>

		<button
			type="submit"
			disabled={!canSubmit}
			aria-disabled={!canSubmit}
			class="submit-button"
			style:background-color={primaryColor + '60'}
			style:border-color={primaryColor}
		>
			{loading ? txt.submitting : txt.submit}
		</button>
	</form>
</div>

<style>
	.change-password {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--theme-border, 220 13% 91%));
		background: hsl(var(--theme-surface, 0 0% 100%) / 0.5);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	/* Semantic green kept */
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

	.input-wrapper {
		position: relative;
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

	.input-field.has-icon {
		padding-right: 2.75rem;
	}

	.input-field:focus {
		outline: none;
		box-shadow: 0 0 0 2px var(--ring-color, currentColor);
	}

	/* Semantic red kept */
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
		color: hsl(var(--theme-muted-foreground, 220 9% 46%));
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.password-toggle:hover {
		color: hsl(var(--theme-foreground, 220 9% 10%));
	}

	.field-hint {
		font-size: 0.75rem;
		margin: 0.25rem 0 0;
		color: hsl(var(--theme-muted-foreground, 220 9% 46%) / 0.7);
	}

	/* Semantic red kept */
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
		color: hsl(var(--theme-foreground, 220 9% 10%));
		margin-top: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		opacity: 0.8;
	}

	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
