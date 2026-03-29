<script lang="ts">
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
	import { useAllCities, findCityBySlug } from '$lib/data/queries';
	import type { LocalCity } from '$lib/data/local-store';

	let { children } = $props();

	const allCities = useAllCities();

	let currentCity = $derived(findCityBySlug(allCities.value, $page.params.slug ?? ''));

	setContext('currentCity', {
		get value() {
			return currentCity;
		},
	});
</script>

{#if currentCity}
	{@render children()}
{:else if allCities.value.length > 0}
	<div class="py-12 text-center">
		<span class="mb-2 block text-4xl">🔍</span>
		<p class="text-foreground-secondary">Stadt nicht gefunden.</p>
		<a href="/" class="mt-3 inline-block text-sm text-primary hover:underline">
			Zurück zu allen Städten
		</a>
	</div>
{:else}
	<!-- Still loading -->
	<div class="flex items-center justify-center py-12">
		<div
			class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{/if}
