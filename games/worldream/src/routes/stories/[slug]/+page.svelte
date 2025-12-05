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

	async function loadStory() {
		try {
			const response = await fetch(`/api/nodes/${slug}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Story nicht gefunden');
				}
				throw new Error('Fehler beim Laden der Story');
			}
			node = await response.json();

			// Ensure it's a story
			if (node && node.kind !== 'story') {
				throw new Error('Dies ist keine Story');
			}

			isOwner = data.user?.id === node?.owner_id;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function deleteStory() {
		if (!confirm('Möchtest du diese Story wirklich löschen?')) return;

		try {
			const response = await fetch(`/api/nodes/${slug}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Fehler beim Löschen');

			// Navigate back to appropriate page
			if (node?.world_slug) {
				goto(`/worlds/${node.world_slug}/stories`);
			} else {
				goto('/stories');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler beim Löschen';
		}
	}

	$effect(() => {
		loadStory();
	});
</script>

<svelte:head>
	<title>{node?.title || 'Story'} | Worldream</title>
</svelte:head>

{#if loading}
	<LoadingOverlay message="Lade Story..." />
{:else if error}
	<div class="mx-auto max-w-4xl">
		<div class="bg-theme-error/10 rounded-md p-4">
			<p class="text-sm text-theme-error">{error}</p>
			<a
				href="/stories"
				class="mt-2 inline-block text-sm text-theme-primary-600 hover:text-theme-primary-500"
			>
				Zurück zur Übersicht
			</a>
		</div>
	</div>
{:else if node}
	<NodeDetail
		{node}
		{isOwner}
		onDelete={deleteStory}
		editPath="/stories/{slug}/edit"
		backPath={node.world_slug ? `/worlds/${node.world_slug}/stories` : '/stories'}
	/>
{/if}
