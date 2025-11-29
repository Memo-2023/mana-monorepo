<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, user } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';

	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	let effectiveMode = $derived(theme.effectiveMode);

	async function handleDeleteAllData() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		isDeleting = true;
		// TODO: Implement data deletion
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isDeleting = false;
		showDeleteConfirm = false;
	}

	async function handleLogout() {
		await auth.signOut();
		goto('/login');
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
		<p class="text-gray-600 dark:text-gray-400">Verwalte dein Konto und App-Einstellungen</p>
	</div>

	<!-- Account -->
	<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Konto</h2>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900 dark:text-white">E-Mail</p>
					<p class="text-gray-600 dark:text-gray-400">{$user?.email || 'Nicht angemeldet'}</p>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900 dark:text-white">Benutzer-ID</p>
					<p class="font-mono text-sm text-gray-600 dark:text-gray-400">{$user?.id || '—'}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Appearance -->
	<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Erscheinungsbild</h2>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900 dark:text-white">Dunkles Design</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Aktiviere den Dark Mode für eine augenfreundliche Ansicht
					</p>
				</div>
				<button
					onclick={() => theme.toggleMode()}
					class="relative h-7 w-12 rounded-full transition-colors {effectiveMode === 'dark'
						? 'bg-green-500'
						: 'bg-gray-200 dark:bg-gray-700'}"
				>
					<span
						class="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform {effectiveMode ===
						'dark'
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div>
		</div>
	</div>

	<!-- Data Management -->
	<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Datenverwaltung</h2>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-gray-900 dark:text-white">Daten exportieren</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Exportiere alle deine Mahlzeiten und Statistiken
					</p>
				</div>
				<button
					onclick={() => goto('/export')}
					class="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Export
				</button>
			</div>

			<hr class="border-gray-200 dark:border-gray-700" />

			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-red-600 dark:text-red-400">Alle Daten löschen</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Löscht alle deine Mahlzeiten und Statistiken unwiderruflich
					</p>
				</div>
				{#if showDeleteConfirm}
					<div class="flex gap-2">
						<button
							onclick={() => (showDeleteConfirm = false)}
							class="rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
						>
							Abbrechen
						</button>
						<button
							onclick={handleDeleteAllData}
							disabled={isDeleting}
							class="rounded-xl bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
						>
							{isDeleting ? 'Wird gelöscht...' : 'Bestätigen'}
						</button>
					</div>
				{:else}
					<button
						onclick={handleDeleteAllData}
						class="rounded-xl bg-red-100 px-4 py-2 font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Löschen
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Logout -->
	<button
		onclick={handleLogout}
		class="w-full rounded-2xl border-2 border-red-500 bg-white py-4 font-semibold text-red-600 transition-colors hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20"
	>
		Abmelden
	</button>

	<!-- App Info -->
	<div class="text-center text-sm text-gray-500 dark:text-gray-400">
		<p>Nutriphi Web v0.1.0</p>
		<p>Teil des Mana Core Ökosystems</p>
	</div>
</div>
