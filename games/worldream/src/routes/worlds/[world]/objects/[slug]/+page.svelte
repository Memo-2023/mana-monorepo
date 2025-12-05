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

	async function loadObject() {
		try {
			const response = await fetch(`/api/nodes/${slug}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Objekt nicht gefunden');
				}
				throw new Error('Fehler beim Laden des Objekts');
			}
			node = await response.json();

			// Ensure it's an object and belongs to this world
			if (node && node.kind !== 'object') {
				throw new Error('Dies ist kein Objekt');
			}
			if (node && node.world_slug !== worldSlug) {
				throw new Error('Dieses Objekt gehört nicht zu dieser Welt');
			}

			isOwner = data.user?.id === node?.owner_id;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function deleteObject() {
		if (!confirm('Möchtest du dieses Objekt wirklich löschen?')) return;

		try {
			const response = await fetch(`/api/nodes/${slug}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Fehler beim Löschen');
			goto(`/worlds/${worldSlug}/objects`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Löschen';
		}
	}

	$effect(() => {
		loadObject();
	});
</script>

<svelte:head>
	<title>{node?.title || 'Objekt'} | {$currentWorld?.title || 'Worldream'}</title>
</svelte:head>

{#if loading}
	<LoadingOverlay message="Lade Objekt..." />
{:else if error}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
			<a
				href="/worlds/{worldSlug}/objects"
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
		onDelete={deleteObject}
		editPath="/worlds/{worldSlug}/objects/{slug}/edit"
		backPath="/worlds/{worldSlug}/objects"
	/>
{/if}
