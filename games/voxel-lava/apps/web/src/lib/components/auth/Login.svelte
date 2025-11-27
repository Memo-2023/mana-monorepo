<script lang="ts">
	import { AuthService } from '../../services/AuthService';
	import { createEventDispatcher } from 'svelte';

	// Event-Dispatcher für Kommunikation mit übergeordneten Komponenten
	const dispatch = createEventDispatcher();

	// Formular-Zustände
	let email = '';
	let password = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	// Formular absenden
	async function handleSubmit() {
		if (!email || !password) {
			errorMessage = 'Bitte fülle alle Felder aus.';
			return;
		}

		try {
			isLoading = true;
			errorMessage = '';

			const success = await AuthService.login(email, password);

			if (success) {
				successMessage = 'Anmeldung erfolgreich!';
				dispatch('login');
				// Formular zurücksetzen
				email = '';
				password = '';
			} else {
				errorMessage = 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.';
			}
		} catch (error) {
			errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
			console.error('Login error:', error);
		} finally {
			isLoading = false;
		}
	}

	// Zur Registrierung wechseln
	function switchToRegister() {
		dispatch('switchView', 'register');
	}

	// Zum Passwort-Reset wechseln
	function switchToPasswordReset() {
		dispatch('switchView', 'passwordReset');
	}
</script>

<div class="auth-form-container">
	<h2>Anmelden</h2>

	{#if errorMessage}
		<div class="error-message">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div class="success-message">
			{successMessage}
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="email">E-Mail</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				placeholder="deine@email.de"
				disabled={isLoading}
				required
			/>
		</div>

		<div class="form-group">
			<label for="password">Passwort</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				placeholder="Dein Passwort"
				disabled={isLoading}
				required
			/>
		</div>

		<button type="submit" class="auth-button" disabled={isLoading}>
			{isLoading ? 'Wird angemeldet...' : 'Anmelden'}
		</button>
	</form>

	<div class="auth-links">
		<button type="button" class="text-button" on:click={switchToPasswordReset} disabled={isLoading}>
			Passwort vergessen?
		</button>

		<div class="register-link">
			Noch kein Konto?
			<button type="button" class="text-button" on:click={switchToRegister} disabled={isLoading}>
				Registrieren
			</button>
		</div>
	</div>
</div>

<style>
	.auth-form-container {
		background-color: rgba(42, 50, 66, 0.9);
		border-radius: 8px;
		padding: 24px;
		width: 100%;
		max-width: 400px;
		min-width: 280px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		box-sizing: border-box;
	}

	h2 {
		color: white;
		margin-top: 0;
		margin-bottom: 24px;
		text-align: center;
		font-size: 1.5rem;
	}

	.form-group {
		margin-bottom: 16px;
		width: 100%;
		box-sizing: border-box;
	}

	label {
		display: block;
		color: white;
		margin-bottom: 8px;
		font-size: 0.9rem;
	}

	input {
		width: 100%;
		padding: 10px 12px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background-color: rgba(30, 36, 48, 0.8);
		color: white;
		font-size: 1rem;
		outline: none;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
	}

	input:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.3);
	}

	input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.auth-button {
		width: 100%;
		padding: 12px;
		background-color: #3182ce;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
		margin-top: 8px;
		box-sizing: border-box;
	}

	.auth-button:hover {
		background-color: #2b6cb0;
	}

	.auth-button:disabled {
		background-color: #64748b;
		cursor: not-allowed;
	}

	.error-message {
		background-color: rgba(220, 38, 38, 0.2);
		color: #fca5a5;
		padding: 10px;
		border-radius: 4px;
		margin-bottom: 16px;
		font-size: 0.9rem;
	}

	.success-message {
		background-color: rgba(16, 185, 129, 0.2);
		color: #6ee7b7;
		padding: 10px;
		border-radius: 4px;
		margin-bottom: 16px;
		font-size: 0.9rem;
	}

	.auth-links {
		margin-top: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.text-button {
		background: none;
		border: none;
		color: #63b3ed;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		text-decoration: underline;
		transition: color 0.2s;
	}

	.text-button:hover {
		color: #90cdf4;
	}

	.text-button:disabled {
		color: #64748b;
		cursor: not-allowed;
	}

	.register-link {
		color: white;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 4px;
	}
</style>
