<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentWorld } from '$lib/stores/worldContext';
	import type { ContentNode } from '$lib/types/content';
	import NodeForm from '$lib/components/forms/NodeForm.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import { NodeService } from '$lib/services/nodeService';

	let { data } = $props();

	if (!data.user) {
		goto('/auth/login');
	}

	if (!$currentWorld) {
		goto('/');
	}

	const slug = $page.params.slug;
	const worldSlug = $page.params.world;

	let node = $state<ContentNode | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let isOwner = $state(false);

	async function loadCharacter() {
		try {
			if (slug) node = await NodeService.get(slug);

			// Ensure it's a character and belongs to this world
			if (node && node.kind !== 'character') {
				throw new Error('Dies ist kein Charakter');
			}
			if (node && node.world_slug !== worldSlug) {
				throw new Error('Dieser Charakter gehört nicht zu dieser Welt');
			}

			isOwner = data.user?.id === node?.owner_id;

			if (!isOwner) {
				throw new Error('Du hast keine Berechtigung, diesen Charakter zu bearbeiten');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function handleSave(updatedNode: ContentNode) {
		goto(`/worlds/${worldSlug}/characters/${updatedNode.slug}`);
	}

	function handleCancel() {
		goto(`/worlds/${worldSlug}/characters/${node?.slug}`);
	}

	// Load character on mount
	$effect(() => {
		loadCharacter();
	});
</script>

<svelte:head>
	<title>{node ? `${node.title} bearbeiten - Worldream` : 'Charakter bearbeiten - Worldream'}</title
	>
</svelte:head>

{#if loading}
	<LoadingOverlay message="Lade Charakter..." />
{:else if error}
	<div class="mx-auto max-w-4xl">
		<div class="rounded-md bg-red-50/50 p-4">
			<h2 class="text-lg font-medium text-red-800">Fehler</h2>
			<p class="text-sm text-red-600">{error}</p>
			<div class="mt-4">
				<a
					href="/worlds/{worldSlug}/characters"
					class="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					Zurück zu Charakteren
				</a>
			</div>
		</div>
	</div>
{:else if node}
	<NodeForm
		mode="edit"
		kind="character"
		initialData={node}
		worldSlug={$currentWorld?.slug}
		worldTitle={$currentWorld?.title}
		onSubmit={handleSave}
		onCancel={handleCancel}
	/>
{/if}
