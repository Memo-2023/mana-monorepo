<script lang="ts">
	import type { ContentNode, NodeKind } from '$lib/types/content';
	import NodeCard from './NodeCard.svelte';

	interface Props {
		kind: NodeKind;
		kindLabel: string;
		kindLabelPlural: string;
		description: string;
		user: any;
	}

	let { kind, kindLabel, kindLabelPlural, description, user }: Props = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadNodes() {
		try {
			const response = await fetch(`/api/nodes?kind=${kind}`);
			if (!response.ok) throw new Error(`Failed to load ${kindLabelPlural}`);
			nodes = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadNodes();
	});

	function getNodeUrl(node: ContentNode): string {
		const baseUrls: Record<NodeKind, string> = {
			world: '/worlds',
			character: '/characters',
			object: '/objects',
			place: '/places',
			story: '/stories',
		};
		return `${baseUrls[node.kind]}/${node.slug}`;
	}
</script>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-theme-text-primary">{kindLabelPlural}</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">{description}</p>
		</div>
		{#if user}
			<div class="mt-4 sm:mt-0">
				<a
					href="/{kind === 'world'
						? 'worlds'
						: kind === 'character'
							? 'characters'
							: kind === 'place'
								? 'places'
								: kind === 'object'
									? 'objects'
									: 'stories'}/new"
					class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700"
				>
					{kindLabel} erstellen
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<p class="text-theme-text-secondary">Lade {kindLabelPlural}...</p>
		</div>
	{:else if error}
		<div class="rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
		</div>
	{:else if nodes.length === 0}
		<div class="rounded-lg bg-theme-surface py-12 text-center shadow">
			<p class="text-theme-text-secondary">Noch keine {kindLabelPlural} vorhanden</p>
			{#if user}
				<a
					href="/{kind === 'world'
						? 'worlds'
						: kind === 'character'
							? 'characters'
							: kind === 'place'
								? 'places'
								: kind === 'object'
									? 'objects'
									: 'stories'}/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-theme-primary-500"
				>
					Erste {kindLabel} erstellen
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<NodeCard {node} href={getNodeUrl(node)} />
			{/each}
		</div>
	{/if}
</div>
