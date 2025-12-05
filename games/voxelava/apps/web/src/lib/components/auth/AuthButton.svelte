<script lang="ts">
	import { onMount } from 'svelte';
	import { AuthService } from '../../services/AuthService';
	import AuthModal from './AuthModal.svelte';

	// Eigenschaften
	export let buttonClass = '';
	export let showUserEmail = true;

	// Zustände
	let isModalOpen = false;
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

	// Modal öffnen
	function openModal() {
		isModalOpen = true;
	}

	// Nach erfolgreicher Anmeldung
	async function handleLogin() {
		await checkAuthStatus();
	}

	// Nach Abmeldung
	async function handleLogout() {
		await checkAuthStatus();
	}
</script>

<div class="auth-button-container">
	<button type="button" class="auth-button {buttonClass}" on:click={openModal}>
		{#if isLoggedIn}
			<span class="user-icon">👤</span>
			{#if showUserEmail && currentUser?.email}
				<span class="user-email">{currentUser.email.split('@')[0]}</span>
			{:else}
				<span>Profil</span>
			{/if}
		{:else}
			<span class="login-icon">🔑</span>
			<span>Anmelden</span>
		{/if}
	</button>

	<AuthModal bind:isOpen={isModalOpen} on:login={handleLogin} on:logout={handleLogout} />
</div>

<style>
	.auth-button-container {
		display: inline-block;
	}

	.auth-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: rgba(42, 50, 66, 0.9);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 8px 16px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.auth-button:hover {
		background-color: rgba(60, 70, 90, 0.9);
	}

	.user-icon,
	.login-icon {
		font-size: 1.1rem;
	}

	.user-email {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
