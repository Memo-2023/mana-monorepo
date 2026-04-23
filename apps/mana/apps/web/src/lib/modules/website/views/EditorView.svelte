<script lang="ts">
	import {
		useAllSites,
		useAllPages,
		useAllBlocks,
		findSite,
		pagesForSite,
		blocksForPage,
	} from '../queries';
	import { blocksStore } from '../stores/blocks.svelte';
	import BlockRenderer from '../components/BlockRenderer.svelte';
	import BlockInspector from '../components/BlockInspector.svelte';
	import InsertPalette from '../components/InsertPalette.svelte';
	import PageList from '../components/PageList.svelte';
	import PublishBar from '../components/PublishBar.svelte';

	interface Props {
		siteId: string;
		pageId: string;
	}

	let props: Props = $props();

	const sites = useAllSites();
	const pages = useAllPages();
	const blocks = useAllBlocks();

	const site = $derived(findSite(sites.value, props.siteId));
	const sitePages = $derived(pagesForSite(pages.value, props.siteId));
	const pageBlocks = $derived(blocksForPage(blocks.value, props.pageId));

	let selectedBlockId = $state<string | null>(null);

	const selectedBlock = $derived(
		selectedBlockId ? (pageBlocks.find((b) => b.id === selectedBlockId) ?? null) : null
	);

	// Clear selection when switching page.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		props.pageId;
		selectedBlockId = null;
	});

	async function addBlock(type: string) {
		const block = await blocksStore.addBlock({ pageId: props.pageId, type });
		selectedBlockId = block.id;
	}
</script>

<div class="wb-editor-layout">
	{#if site}
		<PublishBar {site} />
	{/if}

	<div class="wb-editor">
		<aside class="wb-editor__left">
			{#if site}
				<div class="wb-editor__site-meta">
					<p class="wb-editor__site-name">{site.name}</p>
					<p class="wb-editor__site-slug">/s/{site.slug}</p>
				</div>
			{/if}

			<PageList siteId={props.siteId} pages={sitePages} activePageId={props.pageId} />

			<div class="wb-editor__palette">
				<InsertPalette onInsert={addBlock} />
			</div>
		</aside>

		<main class="wb-editor__center">
			{#if pageBlocks.length === 0}
				<div class="wb-editor__empty">
					<h3>Leere Seite</h3>
					<p>Füge links einen Block ein, um loszulegen.</p>
				</div>
			{:else}
				<div class="wb-editor__preview">
					<BlockRenderer
						blocks={pageBlocks}
						mode="edit"
						{selectedBlockId}
						onSelect={(id) => (selectedBlockId = id)}
					/>
				</div>
			{/if}
		</main>

		<aside class="wb-editor__right">
			{#if selectedBlock}
				<BlockInspector block={selectedBlock} onDeleted={() => (selectedBlockId = null)} />
			{:else}
				<p class="wb-editor__inspector-empty">
					Wähle einen Block in der Vorschau, um ihn zu bearbeiten.
				</p>
			{/if}
		</aside>
	</div>
</div>

<style>
	.wb-editor-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.wb-editor {
		display: grid;
		grid-template-columns: 16rem 1fr 20rem;
		gap: 1px;
		flex: 1 1 auto;
		min-height: 0;
		background: rgba(255, 255, 255, 0.06);
	}
	.wb-editor__left,
	.wb-editor__right {
		background: rgb(15, 18, 24);
		padding: 1rem;
		overflow-y: auto;
	}
	.wb-editor__left {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-editor__center {
		background: rgb(10, 12, 16);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.wb-editor__preview {
		flex: 1 1 auto;
	}
	.wb-editor__empty {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.5rem;
		padding: 3rem 1.5rem;
		opacity: 0.6;
	}
	.wb-editor__empty h3 {
		margin: 0;
	}
	.wb-editor__empty p {
		margin: 0;
		font-size: 0.875rem;
	}
	.wb-editor__site-meta {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-editor__site-name {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.wb-editor__site-slug {
		margin: 0.1rem 0 0;
		font-size: 0.75rem;
		opacity: 0.55;
		font-family: ui-monospace, monospace;
	}
	.wb-editor__palette {
		margin-top: auto;
	}
	.wb-editor__inspector-empty {
		font-size: 0.8125rem;
		opacity: 0.5;
	}

	@media (max-width: 960px) {
		.wb-editor {
			grid-template-columns: 1fr;
			grid-auto-rows: min-content;
		}
		.wb-editor__left,
		.wb-editor__right {
			max-height: 50vh;
		}
	}
</style>
