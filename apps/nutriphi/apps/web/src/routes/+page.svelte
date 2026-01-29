<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import DailySummary from '$lib/components/DailySummary.svelte';
	import MealList from '$lib/components/MealList.svelte';
	import AddMealButton from '$lib/components/AddMealButton.svelte';
	import { Camera, PencilLine } from '@manacore/shared-icons';

	// Redirect to login if not authenticated
	$effect(() => {
		if (!authStore.loading && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	let showAddMenu = $state(false);
</script>

{#if authStore.isAuthenticated}
	<div class="min-h-screen bg-[var(--color-background-page)]">
		<Header />

		<main class="container mx-auto px-4 pb-24 pt-4 max-w-lg">
			<!-- Daily Summary -->
			<DailySummary />

			<!-- Today's Meals -->
			<div class="mt-6">
				<h2 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
					Heutige Mahlzeiten
				</h2>
				<MealList />
			</div>
		</main>

		<!-- Floating Add Button -->
		<div class="fixed bottom-6 left-1/2 -translate-x-1/2">
			<AddMealButton />
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-[var(--color-background-page)] flex items-center justify-center">
		<div class="animate-pulse text-[var(--color-text-secondary)]">Laden...</div>
	</div>
{/if}
