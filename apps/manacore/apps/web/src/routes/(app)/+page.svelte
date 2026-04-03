<script lang="ts">
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import { getAppEntry } from '$lib/components/workbench/app-registry';
	import { createAppSettingsStore } from '@manacore/shared-stores';
	import { DragPreview } from '@manacore/shared-ui/dnd';
	import { getEntityByDragType, ensureEntitiesRegistered } from '$lib/entities';
	import type { DragType } from '@manacore/shared-ui/dnd';

	ensureEntitiesRegistered();

	function resolveEntity(type: string, data: Record<string, unknown>) {
		const entity = getEntityByDragType(type as DragType);
		if (!entity) return null;
		const display = entity.getDisplayData(data);
		const appEntry = getAppEntry(entity.appId);
		return {
			title: display.title,
			subtitle: display.subtitle,
			color: appEntry?.color,
			appName: appEntry?.name,
		};
	}

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
			{ appId: 'habits', minimized: false },
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
		{ appId: 'habits', minimized: false },
	]);

	// Load persisted state once on mount (not reactive — avoids loop with persistState)
	import { onMount } from 'svelte';
	onMount(() => {
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

	function handleMoveLeft(id: string) {
		const idx = openApps.findIndex((a) => a.appId === id);
		if (idx <= 0) return;
		const apps = [...openApps];
		[apps[idx - 1], apps[idx]] = [apps[idx], apps[idx - 1]];
		openApps = apps;
		persistState();
	}

	function handleMoveRight(id: string) {
		const idx = openApps.findIndex((a) => a.appId === id);
		if (idx === -1 || idx >= openApps.length - 1) return;
		const apps = [...openApps];
		[apps[idx], apps[idx + 1]] = [apps[idx + 1], apps[idx]];
		openApps = apps;
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

<DragPreview {resolveEntity} />

<div class="workbench">
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
			{@const idx = openApps.findIndex((a) => a.appId === p.id)}
			<AppPage
				appId={p.id}
				widthPx={p.widthPx}
				heightPx={p.heightPx}
				maximized={p.maximized}
				onClose={() => handleRemoveApp(p.id)}
				onMinimize={() => handleMinimizeApp(p.id)}
				onMaximize={() => handleMaximizeApp(p.id)}
				onResize={(w, h) => handleResize(p.id, w, h)}
				onMoveLeft={idx > 0 ? () => handleMoveLeft(p.id) : undefined}
				onMoveRight={idx < openApps.length - 1 ? () => handleMoveRight(p.id) : undefined}
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
		/* Break out of layout's max-w-7xl px-4 container */
		margin: -2rem -1rem 0;
		width: calc(100% + 2rem);
	}

	@media (min-width: 640px) {
		.workbench {
			margin: -2rem -1.5rem 0;
			width: calc(100% + 3rem);
		}
	}

	@media (min-width: 1024px) {
		.workbench {
			margin: -2rem -2rem 0;
			padding-top: 2rem;
			width: calc(100% + 4rem);
		}
	}
</style>
