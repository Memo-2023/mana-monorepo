<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Einstellungen | Todo</title>
</svelte:head>

<div class="settings-view">
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-foreground">Einstellungen</h1>
	</header>

	<div class="space-y-6">
		<!-- Account Section -->
		<section class="bg-card rounded-lg border border-border p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">Konto</h2>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-foreground">E-Mail</p>
						<p class="text-sm text-muted-foreground">
							{authStore.user?.email || 'Nicht angemeldet'}
						</p>
					</div>
				</div>

				<div class="pt-4 border-t border-border">
					<button
						class="text-red-500 hover:text-red-600 text-sm font-medium"
						onclick={() => {
							authStore.signOut();
							goto('/login');
						}}
					>
						Abmelden
					</button>
				</div>
			</div>
		</section>

		<!-- Appearance Section -->
		<section class="bg-card rounded-lg border border-border p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">Erscheinungsbild</h2>

			<p class="text-sm text-muted-foreground">
				Theme-Einstellungen sind in der Navigation verfügbar.
			</p>
		</section>

		<!-- About Section -->
		<section class="bg-card rounded-lg border border-border p-6">
			<h2 class="text-lg font-semibold text-foreground mb-4">Über</h2>

			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">Todo App v1.0.0</p>
				<p class="text-sm text-muted-foreground">Teil des ManaCore Ökosystems</p>
			</div>
		</section>
	</div>
</div>

<style>
	.settings-view {
		padding-bottom: 100px;
	}
</style>
