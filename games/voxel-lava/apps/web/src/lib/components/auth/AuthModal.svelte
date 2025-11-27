<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Login from './Login.svelte';
	import Register from './Register.svelte';
	import PasswordReset from './PasswordReset.svelte';
	import { AuthService } from '../../services/AuthService';

	export let isOpen = false;

	// Event-Dispatcher für Kommunikation mit übergeordneten Komponenten
	const dispatch = createEventDispatcher();

	// Aktuelle Ansicht (login, register, passwordReset)
	let currentView = 'login';

	// Benutzer-Status
	let isLoggedIn = false;
	let currentUser: any = null;

	// Beim Mounten prüfen, ob der Benutzer angemeldet ist
	onMount(async () => {
		await checkAuthStatus();
	});

	// Authentifizierungsstatus prüfen
	async function checkAuthStatus() {
		const user = await AuthService.getCurrentUser();
		isLoggedIn = !!user;
		currentUser = user;
	}

	// Ansicht wechseln (login, register, passwordReset)
	function handleSwitchView(event: CustomEvent<string>) {
		currentView = event.detail;
	}

	// Nach erfolgreicher Anmeldung
	async function handleLogin() {
		await checkAuthStatus();
		if (isLoggedIn) {
			dispatch('login', currentUser);
			closeModal();
		}
	}

	// Abmelden
	async function handleLogout() {
		const success = await AuthService.logout();
		if (success) {
			await checkAuthStatus();
			dispatch('logout');
		}
	}

	// Modal schließen
	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	// Klick außerhalb des Modals abfangen
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	// Tastendruck abfangen (Escape zum Schließen)
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal-content">
			<button class="close-button" on:click={closeModal}>×</button>

			{#if isLoggedIn}
				<div class="user-profile">
					<h2>Willkommen!</h2>
					<p class="user-email">{currentUser?.email}</p>

					<div class="profile-actions">
						<button class="auth-button" on:click={handleLogout}> Abmelden </button>
					</div>
				</div>
			{:else if currentView === 'login'}
				<Login on:switchView={handleSwitchView} on:login={handleLogin} />
			{:else if currentView === 'register'}
				<Register on:switchView={handleSwitchView} />
			{:else if currentView === 'passwordReset'}
				<PasswordReset on:switchView={handleSwitchView} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		padding: 16px;
		box-sizing: border-box;
	}

	.modal-content {
		position: relative;
		width: 100%;
		max-width: 400px;
		min-width: 280px;
		max-height: 90%;
		overflow-y: auto;
		animation: fadeIn 0.3s ease-out;
		box-sizing: border-box;
		background-color: transparent;
	}

	.close-button {
		position: absolute;
		top: 10px;
		right: 10px;
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		z-index: 10;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.3);
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}

	.user-profile {
		background-color: rgba(42, 50, 66, 0.9);
		border-radius: 8px;
		padding: 24px;
		width: 100%;
		max-width: 400px;
		min-width: 280px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		color: white;
		text-align: center;
		box-sizing: border-box;
	}

	.user-profile h2 {
		margin-top: 0;
		margin-bottom: 16px;
	}

	.user-email {
		font-size: 1.1rem;
		margin-bottom: 24px;
		padding: 8px;
		background-color: rgba(30, 36, 48, 0.8);
		border-radius: 4px;
	}

	.profile-actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
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
		box-sizing: border-box;
	}

	.auth-button:hover {
		background-color: #2b6cb0;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
