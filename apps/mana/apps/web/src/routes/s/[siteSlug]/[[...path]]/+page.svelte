<script lang="ts">
	import { getBlockSpec } from '@mana/website-blocks';
	import type { PageServerData } from './$types';
	import type { SnapshotBlockNode } from '$lib/modules/website/publish';

	interface Props {
		data: PageServerData;
	}

	let { data }: Props = $props();

	const page = $derived(data.page);
	const blocks = $derived(page.blocks as SnapshotBlockNode[]);

	// Adapter: the snapshot's `SnapshotBlockNode` already carries a
	// `children: SnapshotBlockNode[]`, but the registry's Block type
	// expects the flat fields from the Dexie row. We rebuild on the fly
	// rather than changing the registry contract — M2 only renders
	// top-level blocks (containers arrive in M3).
	function asRegistryBlock(b: SnapshotBlockNode, order: number) {
		return {
			id: b.id,
			type: b.type,
			props: b.props,
			schemaVersion: b.schemaVersion,
			order,
			parentBlockId: null,
			slotKey: b.slotKey,
		};
	}
</script>

<svelte:head>
	<title>{page.seo?.title ?? page.title}</title>
	{#if page.seo?.description}
		<meta name="description" content={page.seo.description} />
	{/if}
	{#if page.seo?.noindex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
	{#if page.seo?.ogImage}
		<meta property="og:image" content={page.seo.ogImage} />
	{/if}
</svelte:head>

{#each blocks as block, i (block.id)}
	{@const spec = getBlockSpec(block.type)}
	{#if spec}
		<spec.Component block={asRegistryBlock(block, i)} mode="public" />
	{/if}
{/each}
