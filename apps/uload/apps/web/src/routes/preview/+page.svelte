<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import CardRenderer from '$lib/components/cards/CardRenderer.svelte';
	import type { Card } from '$lib/components/cards/types';

	let card = $state<Card | null>(null);

	onMount(() => {
		if (browser) {
			const cardData = sessionStorage.getItem('previewCard');
			if (cardData) {
				try {
					card = JSON.parse(cardData);
				} catch (error) {
					console.error('Error parsing preview card:', error);
				}
			}
		}
	});
</script>

<svelte:head>
	<title>Card Preview - uload</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-8">
	<div class="mx-auto max-w-2xl">
		<div class="mb-6 text-center">
			<h1 class="text-2xl font-bold text-gray-900">Card Preview</h1>
			<p class="mt-2 text-gray-600">This is how your card will look</p>
		</div>

		{#if card}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<CardRenderer {card} readonly={true} />
			</div>
		{:else}
			<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
				<p class="text-gray-600">No card data found for preview</p>
				<button
					onclick={() => window.close()}
					class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Close Preview
				</button>
			</div>
		{/if}
	</div>
</div>
