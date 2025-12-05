<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentWorld } from '$lib/stores/worldContext';
	import type { ContentNode } from '$lib/types/content';
	import NodeEditForm from '$lib/components/NodeEditForm.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

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

			if (!isOwner) {
				throw new Error('Du hast keine Berechtigung, dieses Objekt zu bearbeiten');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	async function handleSave(updatedNode: Partial<ContentNode>) {
		const response = await fetch(`/api/nodes/${slug}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedNode),
		});

		if (!response.ok) {
			const data = await response.json();
			throw new Error(data.error || 'Fehler beim Speichern');
		}

		const updated = await response.json();
		goto(`/worlds/${worldSlug}/objects/${updated.slug}`);
	}

	function handleCancel() {
		goto(`/worlds/${worldSlug}/objects/${slug}`);
	}

	$effect(() => {
		loadObject();
	});
</script>

<svelte:head>
	<title
		>{node?.title ? `${node.title} bearbeiten` : 'Objekt bearbeiten'} | {$currentWorld?.title ||
			'Worldream'}</title
	>
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
{:else if node && isOwner}
	<NodeEditForm {node} onSave={handleSave} onCancel={handleCancel} {worldSlug} />
{/if}
