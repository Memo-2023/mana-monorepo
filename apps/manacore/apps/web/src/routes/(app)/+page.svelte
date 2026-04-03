<script lang="ts">
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import { getAppEntry } from '$lib/components/workbench/app-registry';
	import { createAppSettingsStore } from '@manacore/shared-stores';
	import { DragPreview } from '@manacore/shared-ui/dnd';

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
</style>
