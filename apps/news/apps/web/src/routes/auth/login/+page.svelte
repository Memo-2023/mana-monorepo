<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const success = await authStore.login(email, password);
		if (success) {
			goto('/feed');
		}
	}
</script>

<svelte:head>
	<title>Login - News Hub</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<svg
				class="w-12 h-12 text-primary mx-auto mb-4"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
				/>
			</svg>
			<h1 class="text-2xl font-bold">News Hub</h1>
			<p class="text-text-secondary mt-2">Anmelden</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if authStore.error}
				<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
					{authStore.error}
				</div>
			{/if}

			<div>
				<label for="email" class="block text-sm font-medium mb-2">E-Mail</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="w-full px-4 py-3 bg-background-card border border-border rounded-lg focus:outline-none focus:border-primary"
					placeholder="deine@email.de"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium mb-2">Passwort</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="w-full px-4 py-3 bg-background-card border border-border rounded-lg focus:outline-none focus:border-primary"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={authStore.loading}
				class="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
			>
				{authStore.loading ? 'Wird angemeldet...' : 'Anmelden'}
			</button>
		</form>

		<p class="text-center text-text-secondary mt-6">
			Noch kein Konto?
			<a href="/auth/register" class="text-primary hover:underline">Registrieren</a>
		</p>
	</div>
</div>
