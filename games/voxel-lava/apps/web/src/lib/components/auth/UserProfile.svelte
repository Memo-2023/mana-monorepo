<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AuthService } from '../../services/AuthService';
	import { LevelService } from '../../services/LevelService';
	import type { LevelMetadata } from '../../types/level.types';

	// Event-Dispatcher für Kommunikation mit übergeordneten Komponenten
	const dispatch = createEventDispatcher();

	// Benutzer-Daten
	let user: any = null;
	let userLevels: LevelMetadata[] = [];
	let isLoading = true;
	let errorMessage = '';

	// Passwort-Änderung
	let showPasswordChange = false;
	let newPassword = '';
	let confirmNewPassword = '';
	let passwordChangeError = '';
	let passwordChangeSuccess = '';
	let isPasswordChanging = false;

	// Beim Mounten Benutzerdaten laden
	onMount(async () => {
		await loadUserData();
	});

	// Benutzerdaten laden
	async function loadUserData() {
		try {
			isLoading = true;
			errorMessage = '';

			// Aktuellen Benutzer abrufen
			user = await AuthService.getCurrentUser();

			if (user) {
				// Levels des Benutzers laden
				userLevels = await LevelService.getUserLevels();
			} else {
				errorMessage = 'Du bist nicht angemeldet.';
			}
		} catch (error) {
			console.error('Error loading user data:', error);
			errorMessage = 'Fehler beim Laden der Benutzerdaten.';
		} finally {
			isLoading = false;
		}
	}

	// Passwort ändern
	async function handlePasswordChange() {
		// Validierung
		if (!newPassword || !confirmNewPassword) {
			passwordChangeError = 'Bitte fülle alle Felder aus.';
			return;
		}

		if (newPassword !== confirmNewPassword) {
			passwordChangeError = 'Die Passwörter stimmen nicht überein.';
			return;
		}

		if (newPassword.length < 6) {
			passwordChangeError = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
			return;
		}

		try {
			isPasswordChanging = true;
			passwordChangeError = '';

			const success = await AuthService.updatePassword(newPassword);

			if (success) {
				passwordChangeSuccess = 'Passwort erfolgreich geändert.';
				newPassword = '';
				confirmNewPassword = '';
				// Nach kurzer Verzögerung Passwort-Änderung ausblenden
				setTimeout(() => {
					showPasswordChange = false;
					passwordChangeSuccess = '';
				}, 3000);
			} else {
				passwordChangeError = 'Fehler beim Ändern des Passworts.';
			}
		} catch (error) {
			console.error('Password change error:', error);
			passwordChangeError = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
		} finally {
			isPasswordChanging = false;
		}
	}

	// Abmelden
	async function handleLogout() {
		const success = await AuthService.logout();
		if (success) {
			dispatch('logout');
		}
	}

	// Level bearbeiten
	function editLevel(levelId: string) {
		dispatch('editLevel', levelId);
	}

	// Level löschen
	async function deleteLevel(levelId: string) {
		if (confirm('Möchtest du dieses Level wirklich löschen?')) {
			const success = await LevelService.deleteLevel(levelId);
			if (success) {
				// Levels neu laden
				userLevels = await LevelService.getUserLevels();
			}
		}
	}

	// Level öffentlich/privat umschalten
	function toggleLevelVisibility(level: LevelMetadata) {
		// Hier würde die Logik zum Umschalten der Sichtbarkeit implementiert werden
		// Da wir keinen direkten Zugriff auf die Funktion haben, müsste diese im LevelService ergänzt werden
		console.log('Toggle visibility for level:', level.id);
	}
</script>

<div class="profile-container">
	<h2>Dein Profil</h2>

	{#if errorMessage}
		<div class="error-message">
			{errorMessage}
		</div>
	{/if}

	{#if isLoading}
		<div class="loading">Daten werden geladen...</div>
	{:else if user}
		<div class="user-info">
			<div class="user-email">
				<span class="label">E-Mail:</span>
				<span class="value">{user.email}</span>
			</div>

			<div class="account-actions">
				<button
					type="button"
					class="action-button secondary"
					on:click={() => (showPasswordChange = !showPasswordChange)}
				>
					{showPasswordChange ? 'Abbrechen' : 'Passwort ändern'}
				</button>

				<button type="button" class="action-button" on:click={handleLogout}> Abmelden </button>
			</div>

			{#if showPasswordChange}
				<div class="password-change-form">
					<h3>Passwort ändern</h3>

					{#if passwordChangeError}
						<div class="error-message">
							{passwordChangeError}
						</div>
					{/if}

					{#if passwordChangeSuccess}
						<div class="success-message">
							{passwordChangeSuccess}
						</div>
					{/if}

					<div class="form-group">
						<label for="newPassword">Neues Passwort</label>
						<input
							type="password"
							id="newPassword"
							bind:value={newPassword}
							placeholder="Mindestens 6 Zeichen"
							disabled={isPasswordChanging}
						/>
					</div>

					<div class="form-group">
						<label for="confirmNewPassword">Passwort bestätigen</label>
						<input
							type="password"
							id="confirmNewPassword"
							bind:value={confirmNewPassword}
							placeholder="Passwort wiederholen"
							disabled={isPasswordChanging}
						/>
					</div>

					<button
						type="button"
						class="action-button"
						on:click={handlePasswordChange}
						disabled={isPasswordChanging}
					>
						{isPasswordChanging ? 'Wird geändert...' : 'Passwort ändern'}
					</button>
				</div>
			{/if}
		</div>

		<div class="user-levels">
			<h3>Deine Levels</h3>

			{#if userLevels.length === 0}
				<div class="no-levels">Du hast noch keine Levels erstellt.</div>
			{:else}
				<div class="levels-list">
					{#each userLevels as level}
						<div class="level-card">
							<div class="level-info">
								<h4 class="level-name">{level.name}</h4>
								<p class="level-description">{level.description || 'Keine Beschreibung'}</p>
								<div class="level-stats">
									<span class="stat">
										<i class="icon">👁️</i>
										{level.playCount}
									</span>
									<span class="stat">
										<i class="icon">❤️</i>
										{level.likesCount}
									</span>
									<span class="stat">
										<i class="icon">🏷️</i>
										{level.difficulty || 'Normal'}
									</span>
								</div>
							</div>

							<div class="level-actions">
								<button
									type="button"
									class="icon-button"
									on:click={() => editLevel(level.id)}
									title="Level bearbeiten"
								>
									✏️
								</button>

								<button
									type="button"
									class="icon-button"
									on:click={() => toggleLevelVisibility(level)}
									title={level.isPublic ? 'Auf privat setzen' : 'Öffentlich machen'}
								>
									{level.isPublic ? '🔒' : '🌐'}
								</button>

								<button
									type="button"
									class="icon-button delete"
									on:click={() => deleteLevel(level.id)}
									title="Level löschen"
								>
									🗑️
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="not-logged-in">
			Du bist nicht angemeldet. Bitte melde dich an, um dein Profil zu sehen.
		</div>
	{/if}
</div>

<style>
	.profile-container {
		background-color: rgba(42, 50, 66, 0.9);
		border-radius: 8px;
		padding: 24px;
		width: 100%;
		max-width: 800px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		color: white;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 24px;
		text-align: center;
		font-size: 1.5rem;
	}

	h3 {
		margin-top: 24px;
		margin-bottom: 16px;
		font-size: 1.2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 8px;
	}

	.user-info {
		background-color: rgba(30, 36, 48, 0.8);
		padding: 16px;
		border-radius: 6px;
		margin-bottom: 24px;
	}

	.user-email {
		margin-bottom: 16px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.label {
		font-weight: bold;
		color: rgba(255, 255, 255, 0.7);
	}

	.value {
		font-size: 1.1rem;
	}

	.account-actions {
		display: flex;
		gap: 12px;
		margin-top: 16px;
	}

	.action-button {
		padding: 10px 16px;
		background-color: #3182ce;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.action-button:hover {
		background-color: #2b6cb0;
	}

	.action-button:disabled {
		background-color: #64748b;
		cursor: not-allowed;
	}

	.action-button.secondary {
		background-color: #4a5568;
	}

	.action-button.secondary:hover {
		background-color: #2d3748;
	}

	.password-change-form {
		margin-top: 24px;
		padding: 16px;
		background-color: rgba(49, 130, 206, 0.1);
		border-radius: 6px;
		border-left: 3px solid #3182ce;
	}

	.password-change-form h3 {
		margin-top: 0;
		margin-bottom: 16px;
		border-bottom: none;
		padding-bottom: 0;
	}

	.form-group {
		margin-bottom: 16px;
	}

	label {
		display: block;
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
	}

	input:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.3);
	}

	input::placeholder {
		color: rgba(255, 255, 255, 0.4);
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

	.loading,
	.no-levels,
	.not-logged-in {
		padding: 16px;
		text-align: center;
		background-color: rgba(30, 36, 48, 0.8);
		border-radius: 6px;
		margin-bottom: 16px;
	}

	.levels-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.level-card {
		background-color: rgba(30, 36, 48, 0.8);
		border-radius: 6px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.level-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.level-name {
		margin-top: 0;
		margin-bottom: 8px;
		font-size: 1.1rem;
	}

	.level-description {
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 12px;
		font-size: 0.9rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.level-stats {
		display: flex;
		gap: 12px;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.icon {
		font-style: normal;
	}

	.level-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.icon-button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.icon-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.icon-button.delete:hover {
		background-color: rgba(220, 38, 38, 0.2);
	}
</style>
