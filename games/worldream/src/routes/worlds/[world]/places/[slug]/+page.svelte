<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentWorld } from '$lib/stores/worldContext';
	import NodeDetail from '$lib/components/NodeDetail.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

	let { data } = $props();

	let node = $state<ContentNode | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let isOwner = $state(false);

	const slug = $page.params.slug;
	const worldSlug = $page.params.world;

	async function loadPlace() {
		try {
			const response = await fetch(`/api/nodes/${slug}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Ort nicht gefunden');
				}
				throw new Error('Fehler beim Laden des Orts');
			}
			node = await response.json();

			// Ensure it's a place and belongs to this world
			if (node && node.kind !== 'place') {
				throw new Error('Dies ist kein Ort');
			}
			if (node && node.world_slug !== worldSlug) {
				throw new Error('Dieser Ort gehört nicht zu dieser Welt');
			}

			isOwner = data.user?.id === node?.owner_id;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function deletePlace() {
		if (!confirm('Möchtest du diesen Ort wirklich löschen?')) return;

		try {
			const response = await fetch(`/api/nodes/${slug}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Fehler beim Löschen');
			goto(`/worlds/${worldSlug}/places`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Löschen';
		}
	}

	$effect(() => {
		loadPlace();
	});
</script>

<svelte:head>
	<title>{node?.title || 'Ort'} | {$currentWorld?.title || 'Worldream'}</title>
</svelte:head>

{#if loading}
	<LoadingOverlay message="Lade Ort..." />
{:else if error}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
			<a
				href="/worlds/{worldSlug}/places"
				class="mt-2 inline-block text-sm text-theme-primary-600 hover:text-violet-500 dark:hover:text-violet-300"
			>
				Zurück zur Übersicht
			</a>
		</div>
	</div>
{:else if node}
	<NodeDetail
		{node}
		{isOwner}
		onDelete={deletePlace}
		editPath="/worlds/{worldSlug}/places/{slug}/edit"
		backPath="/worlds/{worldSlug}/places"
	/>
{/if}
