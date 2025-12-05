<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import NodeDetail from '$lib/components/NodeDetail.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

	let { data } = $props();

	let node = $state<ContentNode | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let isOwner = $state(false);

	const slug = $page.params.slug;

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

			// Ensure it's an object
			if (node && node.kind !== 'object') {
				throw new Error('Dies ist kein Objekt');
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

			// Navigate back to appropriate page
			if (node?.world_slug) {
				goto(`/worlds/${node.world_slug}/objects`);
			} else {
				goto('/objects');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Löschen';
		}
	}

	$effect(() => {
		loadObject();
	});
</script>

<svelte:head>
	<title>{node?.title || 'Objekt'} | Worldream</title>
</svelte:head>

{#if loading}
	<LoadingOverlay message="Lade Objekt..." />
{:else if error}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
			<a
				href="/objects"
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
		editPath="/objects/{slug}/edit"
		backPath={node.world_slug ? `/worlds/${node.world_slug}/objects` : '/objects'}
	/>
{/if}
