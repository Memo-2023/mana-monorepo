<script lang="ts">
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import { getAppEntry } from '$lib/components/workbench/app-registry';
	import { createAppSettingsStore } from '@manacore/shared-stores';
	import { DragPreview, dragSource } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';

	// ── Tags for drag & drop ───────────────────────────────
	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	// ── Persisted workbench state ───────────────────────────
	const DEFAULT_WIDTH = 480;

	interface WorkbenchSettings extends Record<string, unknown> {
		openApps: {
			appId: string;
			minimized: boolean;
			maximized?: boolean;
			widthPx?: number;
			heightPx?: number;
		}[];
	}

	const workbenchStore = createAppSettingsStore<WorkbenchSettings>('workbench-settings', {
		openApps: [
			{ appId: 'todo', minimized: false },
			{ appId: 'calendar', minimized: false },
			{ appId: 'contacts', minimized: false },
		],
	});

	let openApps = $state<
		{
			appId: string;
			minimized: boolean;
			maximized?: boolean;
			widthPx?: number;
			heightPx?: number;
		}[]
	>([
		{ appId: 'todo', minimized: false },
		{ appId: 'calendar', minimized: false },
		{ appId: 'contacts', minimized: false },
	]);

	$effect(() => {
		const s = workbenchStore.settings;
		if (s.openApps?.length) openApps = [...s.openApps];
	});

	function persistState() {
		workbenchStore.update({
			openApps: openApps.map((a) => ({
				appId: a.appId,
				minimized: a.minimized,
				maximized: a.maximized,
				widthPx: a.widthPx,
				heightPx: a.heightPx,
			})),
		});
	}

	// ── Map to CarouselPage[] ───────────────────────────────
	let carouselPages = $derived<CarouselPage[]>(
		openApps.map((a) => {
			const entry = getAppEntry(a.appId);
			return {
				id: a.appId,
				minimized: a.minimized,
				maximized: a.maximized,
				widthPx: a.widthPx ?? DEFAULT_WIDTH,
				heightPx: a.heightPx,
				title: entry?.name ?? a.appId,
				color: entry?.color ?? '#6B7280',
			};
		})
	);

	let showPicker = $state(false);

	// ── App CRUD ────────────────────────────────────────────
	function handleAddApp(appId: string) {
		if (!openApps.some((a) => a.appId === appId)) {
			openApps = [...openApps, { appId, minimized: false }];
		} else {
			openApps = openApps.map((a) => (a.appId === appId ? { ...a, minimized: false } : a));
		}
		showPicker = false;
		persistState();
	}

	function handleRemoveApp(id: string) {
		openApps = openApps.filter((a) => a.appId !== id);
		persistState();
	}

	function handleMinimizeApp(id: string) {
		openApps = openApps.map((a) => (a.appId === id ? { ...a, minimized: true } : a));
		persistState();
	}

	function handleRestoreApp(id: string) {
		openApps = openApps.map((a) => (a.appId === id ? { ...a, minimized: false } : a));
		persistState();
	}

	function handleMaximizeApp(id: string) {
		openApps = openApps.map((a) =>
			a.appId === id ? { ...a, maximized: !a.maximized, minimized: false } : a
		);
		persistState();
	}

	function handleResize(id: string, widthPx: number, heightPx?: number) {
		openApps = openApps.map((a) =>
			a.appId === id ? { ...a, widthPx, ...(heightPx !== undefined ? { heightPx } : {}) } : a
		);
		persistState();
	}

	function handleReorder(fromId: string, toId: string) {
		const fromIdx = openApps.findIndex((a) => a.appId === fromId);
		const toIdx = openApps.findIndex((a) => a.appId === toId);
		if (fromIdx === -1 || toIdx === -1) return;
		const apps = [...openApps];
		const [moved] = apps.splice(fromIdx, 1);
		apps.splice(toIdx, 0, moved);
		openApps = apps;
		persistState();
	}
</script>

<svelte:head>
	<title>Home - ManaCore</title>
</svelte:head>

<DragPreview />

<div class="workbench">
	{#if allTags.length > 0}
		<div class="tag-bar">
			{#each allTags as tag (tag.id)}
				<button
					class="tag-pill"
					use:dragSource={{
						type: 'tag',
						data: () => ({ id: tag.id, name: tag.name, color: tag.color }),
					}}
				>
					<span class="tag-dot" style="background: {tag.color}"></span>
					{tag.name}
				</button>
			{/each}
		</div>
	{/if}

	<PageCarousel
		pages={carouselPages}
		defaultWidth={DEFAULT_WIDTH}
		{showPicker}
		onReorder={handleReorder}
		onRestore={handleRestoreApp}
		onMaximize={handleMaximizeApp}
		onRemove={handleRemoveApp}
		onTogglePicker={() => (showPicker = !showPicker)}
		addLabel="App hinzufügen"
	>
		{#snippet page(p)}
			<AppPage
				appId={p.id}
				widthPx={p.widthPx}
				heightPx={p.heightPx}
				maximized={p.maximized}
				onClose={() => handleRemoveApp(p.id)}
				onMinimize={() => handleMinimizeApp(p.id)}
				onMaximize={() => handleMaximizeApp(p.id)}
				onResize={(w, h) => handleResize(p.id, w, h)}
			/>
		{/snippet}
		{#snippet picker()}
			<AppPagePicker
				onSelect={handleAddApp}
				onClose={() => (showPicker = false)}
				activeAppIds={openApps.map((a) => a.appId)}
			/>
		{/snippet}
	</PageCarousel>
</div>

<style>
	.workbench {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.tag-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		padding: 0.5rem 1rem 0.25rem;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.5rem;
		border-radius: 9999px;
		border: none;
		background: rgba(0, 0, 0, 0.04);
		font-size: 0.6875rem;
		color: #6b7280;
		cursor: grab;
		transition: all 0.15s;
		user-select: none;
		touch-action: none;
	}
	.tag-pill:hover {
		background: rgba(0, 0, 0, 0.08);
		color: #374151;
	}
	:global(.dark) .tag-pill {
		background: rgba(255, 255, 255, 0.06);
		color: #9ca3af;
	}
	:global(.dark) .tag-pill:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}
	.tag-pill:active {
		cursor: grabbing;
	}
	:global(.tag-pill.mana-drag-source-active) {
		opacity: 0.4;
		transform: scale(0.95);
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
</style>
