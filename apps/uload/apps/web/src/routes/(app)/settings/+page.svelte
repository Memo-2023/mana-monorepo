<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { uloadStore } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';

	let user = $derived(authStore.user);

	async function handleLogout() {
		uloadStore.stopSync();
		await authStore.signOut();
		goto('/login');
	}

	async function handleClearData() {
		if (!confirm('Alle lokalen Daten löschen? Dies kann nicht rückgängig gemacht werden.')) return;
		await uloadStore.reset();
		toast.success('Lokale Daten gelöscht');
	}
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-8 text-3xl font-bold">Einstellungen</h1>

	{#if user}
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-lg font-semibold">Account</h2>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-sm opacity-60">E-Mail</span>
					<span class="text-sm font-medium">{user.email}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-sm opacity-60">Name</span>
					<span class="text-sm font-medium">{user.email}</span>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20"
		>
			<p class="text-sm">
				Du bist als Gast unterwegs. <a
					href="/login"
					class="font-medium text-indigo-600 hover:underline">Anmelden</a
				> um Daten zu synchronisieren.
			</p>
		</div>
	{/if}

	<div class="space-y-4">
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-lg font-semibold">Daten</h2>
			<button
				onclick={handleClearData}
				class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
			>
				Lokale Daten löschen
			</button>
		</div>

		{#if user}
			<button
				onclick={handleLogout}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
			>
				Abmelden
			</button>
		{/if}
	</div>
</div>
