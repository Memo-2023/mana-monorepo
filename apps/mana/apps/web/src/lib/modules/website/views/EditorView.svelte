<script lang="ts">
	import { untrack } from 'svelte';
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
	import SiteSettingsDialog from '../components/SiteSettingsDialog.svelte';

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

	type SidebarTab = 'pages' | 'insert' | 'block';

	let selectedBlockId = $state<string | null>(null);
	let showSettings = $state(false);
	let activeTab = $state<SidebarTab>('pages');

	const selectedBlock = $derived(
		selectedBlockId ? (pageBlocks.find((b) => b.id === selectedBlockId) ?? null) : null
	);

	const selectedSiblings = $derived.by(() => {
		if (!selectedBlock) return [];
		const parentId = selectedBlock.parentBlockId ?? null;
		return pageBlocks.filter((b) => (b.parentBlockId ?? null) === parentId);
	});

	// Clear selection when switching page.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		props.pageId;
		untrack(() => {
			selectedBlockId = null;
			activeTab = 'pages';
		});
	});

	// Auto-switch to Block tab whenever a block is selected — the user's
	// next action is almost always to edit its props. Untracked so this
	// doesn't loop when `activeTab` itself changes.
	$effect(() => {
		if (selectedBlockId) {
			untrack(() => {
				activeTab = 'block';
			});
		}
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
		<main class="wb-editor__center">
			{#if pageBlocks.length === 0}
				<div class="wb-editor__empty">
					<h3>Leere Seite</h3>
					<p>Öffne den Tab <strong>Einfügen</strong> rechts, um den ersten Block zu setzen.</p>
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

		<aside class="wb-editor__sidebar">
			<div class="wb-tabs" role="tablist" aria-label="Editor-Panels">
				<button
					class="wb-tab"
					class:wb-tab--active={activeTab === 'pages'}
					role="tab"
					aria-selected={activeTab === 'pages'}
					onclick={() => (activeTab = 'pages')}
				>
					Seiten
				</button>
				<button
					class="wb-tab"
					class:wb-tab--active={activeTab === 'insert'}
					role="tab"
					aria-selected={activeTab === 'insert'}
					onclick={() => (activeTab = 'insert')}
				>
					Einfügen
				</button>
				<button
					class="wb-tab"
					class:wb-tab--active={activeTab === 'block'}
					role="tab"
					aria-selected={activeTab === 'block'}
					onclick={() => (activeTab = 'block')}
				>
					Block
				</button>
			</div>

			<div class="wb-sidebar__body">
				{#if activeTab === 'pages'}
					<div class="wb-sidebar__pane">
						{#if site}
							<div class="wb-editor__site-meta">
								<div class="wb-editor__site-row">
									<div class="wb-editor__site-id">
										<p class="wb-editor__site-name">{site.name}</p>
										<p class="wb-editor__site-slug">/s/{site.slug}</p>
									</div>
									<button
										class="wb-editor__settings-btn"
										onclick={() => (showSettings = true)}
										title="Website-Einstellungen"
									>
										⚙
									</button>
								</div>
							</div>
						{/if}
						<PageList siteId={props.siteId} pages={sitePages} activePageId={props.pageId} />
					</div>
				{:else if activeTab === 'insert'}
					<div class="wb-sidebar__pane">
						<InsertPalette onInsert={addBlock} />
					</div>
				{:else}
					<div class="wb-sidebar__pane">
						{#if selectedBlock}
							<BlockInspector
								block={selectedBlock}
								siblings={selectedSiblings}
								onDeleted={() => (selectedBlockId = null)}
							/>
						{:else}
							<p class="wb-editor__inspector-empty">
								Wähle einen Block in der Vorschau, um ihn zu bearbeiten.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>

{#if showSettings && site}
	<SiteSettingsDialog {site} onClose={() => (showSettings = false)} />
{/if}

<style>
	.wb-editor-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.wb-editor {
		display: grid;
		grid-template-columns: 1fr 18rem;
		gap: 1px;
		flex: 1 1 auto;
		min-height: 0;
		background: rgba(255, 255, 255, 0.06);
	}
	.wb-editor__sidebar {
		background: rgb(15, 18, 24);
		display: flex;
		flex-direction: column;
		min-height: 0;
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

	/* Tabs */
	.wb-tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		flex: 0 0 auto;
	}
	.wb-tab {
		flex: 1 1 0;
		padding: 0.625rem 0.5rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		opacity: 0.6;
		transition:
			opacity 0.15s,
			border-color 0.15s,
			background 0.15s;
	}
	.wb-tab:hover {
		opacity: 0.9;
		background: rgba(255, 255, 255, 0.03);
	}
	.wb-tab--active {
		opacity: 1;
		border-bottom-color: rgba(99, 102, 241, 0.9);
	}

	.wb-sidebar__body {
		flex: 1 1 auto;
		overflow-y: auto;
		min-height: 0;
	}
	.wb-sidebar__pane {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	/* Site meta (inside Pages tab) */
	.wb-editor__site-meta {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}
	.wb-editor__site-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.wb-editor__site-id {
		min-width: 0;
		flex: 1 1 auto;
	}
	.wb-editor__settings-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		flex: 0 0 auto;
	}
	.wb-editor__settings-btn:hover {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.4);
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
	.wb-editor__inspector-empty {
		font-size: 0.8125rem;
		opacity: 0.5;
		margin: 0;
	}

	@media (max-width: 960px) {
		.wb-editor {
			grid-template-columns: 1fr;
			grid-auto-rows: min-content;
		}
		.wb-editor__sidebar {
			max-height: 60vh;
		}
	}
</style>
