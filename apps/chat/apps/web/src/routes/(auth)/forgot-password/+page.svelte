<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);
	let success = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		loading = true;

		const result = await authStore.resetPassword(email);

		if (result.success) {
			success = true;
		} else {
			error = result.error || 'Fehler beim Zurücksetzen des Passworts';
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Passwort zurücksetzen | ManaChat</title>
</svelte:head>

<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
	<div class="text-center mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Passwort zurücksetzen</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-2">
			Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen
		</p>
	</div>

	{#if success}
		<div
			class="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
		>
			<p class="text-green-700 dark:text-green-400 text-center">
				Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.
			</p>
			<div class="mt-4 text-center">
				<a href="/login" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
					Zurück zur Anmeldung
				</a>
			</div>
		</div>
	{:else}
		{#if error}
			<div
				class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
			>
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					E-Mail
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 disabled:opacity-50 disabled:cursor-not-allowed"
					placeholder="deine@email.de"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Wird gesendet...
					</span>
				{:else}
					Link senden
				{/if}
			</button>
		</form>

		<div class="mt-6 text-center">
			<a href="/login" class="text-gray-600 dark:text-gray-400 hover:underline">
				Zurück zur Anmeldung
			</a>
		</div>
	{/if}
</div>
