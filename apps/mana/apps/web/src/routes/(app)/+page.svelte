<script lang="ts">
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import SceneAppBar from '$lib/components/workbench/SceneAppBar.svelte';
	import SceneHeader from '$lib/components/workbench/scenes/SceneHeader.svelte';
	import ConfirmDialog from '$lib/components/workbench/scenes/ConfirmDialog.svelte';
	import BindAgentDialog from '$lib/components/workbench/scenes/BindAgentDialog.svelte';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import { getApp, getAppByDragType, isAppAccessible } from '$lib/app-registry';
	import { onMount, onDestroy } from 'svelte';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { bottomBarStore } from '$lib/stores/bottom-bar.svelte';
	import { DragPreview } from '@mana/shared-ui/dnd';
	import type { DragType } from '@mana/shared-ui/dnd';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { Pencil, Copy, Trash, Image, Sparkle } from '@mana/shared-icons';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tick } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { buildContextMenuItems, createWorkbenchContextMenu } from '$lib/context-menu';
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';

	function resolveEntity(type: string, data: Record<string, unknown>) {
		const app = getAppByDragType(type as DragType);
		if (!app?.getDisplayData) return null;
		const display = app.getDisplayData(data);
		return {
			title: display.title,
			subtitle: display.subtitle,
			color: app.color,
			appName: app.name,
		};
	}

	// ── Default card width (responsive) ─────────────────────
	const DESKTOP_WIDTH = 480;
	let DEFAULT_WIDTH = $state(DESKTOP_WIDTH);

	onMount(() => {
		// Coalesce resize events to one update per animation frame.
		// Without this, dragging the window edge fires `resize` dozens
		// of times per second and each fire re-derives carouselPages
		// (and historically re-ran i18n lookups for every open app),
		// causing visible jank.
		let rafId: number | null = null;
		function updateDefaultWidth() {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				DEFAULT_WIDTH = window.innerWidth < 640 ? window.innerWidth - 32 : DESKTOP_WIDTH;
			});
		}
		// Initial measurement is synchronous — we want the first paint
		// to land with the correct width, not one frame late.
		DEFAULT_WIDTH = window.innerWidth < 640 ? window.innerWidth - 32 : DESKTOP_WIDTH;
		window.addEventListener('resize', updateDefaultWidth);
		return () => {
			window.removeEventListener('resize', updateDefaultWidth);
			if (rafId !== null) cancelAnimationFrame(rafId);
		};
	});

	// ── Scene store wiring ──────────────────────────────────
	onMount(async () => {
		await workbenchScenesStore.initialize();
		// Deep-link: `/?app=settings` (or any registered appId) opens the
		// app in the active scene (or focuses it if already open) and
		// scrolls it into view. Used by command menu, pill-nav settings
		// link, onboarding CTAs, sync-status banner — anywhere we used
		// to navigate to `/settings` before the route was removed.
		const target = $page.url.searchParams.get('app');
		if (target && getApp(target)) {
			const already = workbenchScenesStore.openApps.find((a) => a.appId === target);
			if (!already) await workbenchScenesStore.addApp(target);
			await tick();
			scrollToPage(target);
			// Clean the query out of the URL so refresh doesn't re-trigger.
			const clean = new URL($page.url);
			clean.searchParams.delete('app');
			history.replaceState({}, '', clean);
		}
	});
	onDestroy(() => {
		workbenchScenesStore.dispose();
		bottomBarStore.clear();
	});

	let scenes = $derived(workbenchScenesStore.scenes);
	let activeSceneId = $derived(workbenchScenesStore.activeSceneId);

	// Soft-filter the scene's open apps so gated modules don't render
	// for users who aren't allowed to use them. The store still holds
	// the full list — that way a founder-tier scene migrated to a
	// guest device just hides the gated tabs locally instead of
	// destructively deleting them from sync. When the user upgrades
	// (or signs in) the apps reappear automatically.
	let openApps = $derived(
		workbenchScenesStore.openApps.filter((a) => isAppAccessible(a.appId, authStore.user?.tier))
	);

	// ── Map openApps → CarouselPage[] ───────────────────────
	// Title resolution is split into its own derived so that DEFAULT_WIDTH
	// changes (window resize) don't re-invoke `$_(...)` for every open
	// app. This derived only re-runs when the set of open apps or the
	// active locale actually changes.
	let appTitles = $derived.by(() => {
		void $locale;
		const map = new Map<string, string>();
		for (const a of openApps) {
			const entry = getApp(a.appId);
			const k = `apps.${a.appId}`;
			const t = $_(k);
			map.set(a.appId, t !== k ? t : (entry?.name ?? a.appId));
		}
		return map;
	});

	let carouselPages = $derived<CarouselPage[]>(
		openApps.map((a) => {
			const entry = getApp(a.appId);
			return {
				id: a.appId,
				maximized: a.maximized,
				widthPx: a.widthPx ?? DEFAULT_WIDTH,
				title: appTitles.get(a.appId) ?? a.appId,
				color: entry?.color ?? '#6B7280',
				icon: entry?.icon,
			};
		})
	);

	let showPicker = $state(false);

	function scrollToPage(id: string) {
		const el = document.querySelector(`[data-page-id="${id}"]`);
		if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	}

	function scrollCarouselToStart() {
		// Reset the horizontal scroll position so the SceneHeader (first
		// item in the track) is visible — used after switching scenes so
		// the user lands on the new scene's intro rather than wherever
		// the previous scene was scrolled to.
		const track = document.querySelector<HTMLElement>('.fokus-track');
		track?.scrollTo({ left: 0, behavior: 'smooth' });
	}

	// ── Reset scroll on scene switch ────────────────────────
	// Watches activeSceneId. On the first tick (initial mount) we skip
	// the scroll because that's just the hydration pass — otherwise we
	// would fight the carousel's own centre-the-first-card layout.
	let lastSceneId: string | null = null;
	$effect(() => {
		const id = activeSceneId;
		if (lastSceneId === null) {
			lastSceneId = id;
			return;
		}
		if (id !== lastSceneId) {
			lastSceneId = id;
			scrollCarouselToStart();
		}
	});

	// ── Keyboard shortcuts 1-9 / 0 ─────────────────────────
	// 1-9 scroll to the Nth open app in the active scene.
	// 0 opens the new-app picker (which scrolls itself into view).
	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const target = e.target as HTMLElement | null;
			if (target) {
				const tag = target.tagName;
				if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable)
					return;
			}
			if (e.key === '0') {
				e.preventDefault();
				showPicker = true;
				return;
			}
			if (e.key >= '1' && e.key <= '9') {
				const idx = Number(e.key) - 1;
				const page = carouselPages[idx];
				if (!page) return;
				e.preventDefault();
				scrollToPage(page.id);
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	// ── Register SceneAppBar in the layout's bottom-stack ───
	// Split into two effects so prop churn (carouselPages re-deriving on
	// every openApps change) doesn't re-write barComponent. The first
	// effect handles registration/teardown when scenes appear/disappear;
	// the second pushes fresh props on every reactive tick.
	let barRegistered = $state(false);
	$effect(() => {
		const hasScenes = scenes.length > 0;
		if (hasScenes && !barRegistered) {
			bottomBarStore.set(SceneAppBar, {});
			barRegistered = true;
		} else if (!hasScenes && barRegistered) {
			bottomBarStore.clear();
			barRegistered = false;
		}
	});
	$effect(() => {
		if (!barRegistered) return;
		bottomBarStore.setProps({
			scenes,
			activeSceneId,
			pages: carouselPages,
			onSceneSelect: (id: string) => workbenchScenesStore.setActiveScene(id),
			onSceneCreate: (name: string) => workbenchScenesStore.createScene({ name }),
			onSceneContextMenu: handleSceneContextMenu,
			onAppClick: scrollToPage,
			onAppContextMenu: (e: MouseEvent, id: string) => handleTabContextMenu(e, id),
			onAddApp: () => (showPicker = !showPicker),
		});
	});

	// ── App CRUD (delegated to active scene) ────────────────
	function handleAddApp(appId: string) {
		workbenchScenesStore.addApp(appId);
		showPicker = false;
	}
	function handleRemoveApp(id: string) {
		workbenchScenesStore.removeApp(id);
	}
	function handleMaximizeApp(id: string) {
		workbenchScenesStore.toggleMaximizeApp(id);
	}
	function handleResize(id: string, widthPx: number) {
		workbenchScenesStore.resizeApp(id, widthPx);
	}
	function handleMoveLeft(id: string) {
		workbenchScenesStore.moveAppLeft(id);
	}
	function handleMoveRight(id: string) {
		workbenchScenesStore.moveAppRight(id);
	}
	// ── Card / tab context menus ────────────────────────────
	const ctxMenu = createWorkbenchContextMenu();

	function handleCardContextMenu(e: MouseEvent, appId: string, idx: number) {
		const app = getApp(appId);
		if (!app) return;
		const entry = openApps.find((a) => a.appId === appId);
		const items = buildContextMenuItems({
			location: 'card',
			appId,
			app,
			maximized: entry?.maximized,
			onMaximize: () => handleMaximizeApp(appId),
			onClose: () => handleRemoveApp(appId),
			onMoveLeft: idx > 0 ? () => handleMoveLeft(appId) : undefined,
			onMoveRight: idx < openApps.length - 1 ? () => handleMoveRight(appId) : undefined,
		});
		ctxMenu.open(e, appId, items);
	}

	function handleTabContextMenu(e: MouseEvent, appId: string) {
		const app = getApp(appId);
		if (!app) return;
		const items = buildContextMenuItems({
			location: 'tab',
			appId,
			app,
			onMaximize: () => handleMaximizeApp(appId),
			onClose: () => handleRemoveApp(appId),
		});
		ctxMenu.open(e, appId, items);
	}

	function handleSceneContextMenu(e: MouseEvent, scene: WorkbenchScene) {
		e.preventDefault();
		const items: ContextMenuItem[] = [
			{
				id: 'rename',
				label: 'Umbenennen',
				icon: Pencil,
				action: () => handleRequestRename(scene.id),
			},
			{
				id: 'duplicate',
				label: 'Duplizieren',
				icon: Copy,
				action: () => handleDuplicateScene(scene.id),
			},
			{
				id: 'bind-agent',
				label: scene.viewingAsAgentId ? 'Agent-Bindung ändern…' : 'An Agent binden…',
				icon: Sparkle,
				action: () => handleRequestBindAgent(scene.id),
			},
			{
				id: 'wallpaper',
				label: 'Hintergrund ändern',
				icon: Image,
				action: () => goto('/?app=themes'),
			},
		];
		if (scenes.length > 1) {
			items.push({ id: 'div', label: '', type: 'divider' });
			items.push({
				id: 'delete',
				label: 'Löschen',
				icon: Trash,
				variant: 'danger',
				action: () => handleRequestDeleteScene(scene.id),
			});
		}
		ctxMenu.open(e, scene.id, items);
	}

	// ── Scene CRUD dialogs ──────────────────────────────────
	let sceneToDelete = $state<{ id: string; name: string } | null>(null);
	let sceneToBindAgent = $state<WorkbenchScene | null>(null);
	let bindAgentDialogOpen = $state(false);

	function handleRequestBindAgent(id: string) {
		const scene = scenes.find((s) => s.id === id);
		if (!scene) return;
		sceneToBindAgent = scene;
		bindAgentDialogOpen = true;
	}

	function handleRequestRename(id: string) {
		// Unified rename path: scroll the carousel to the scene header
		// and focus its contenteditable <h1>. Previously opened a modal
		// dialog that read from the store while the live header might
		// already hold unsaved typing — the two paths could overwrite
		// each other. Inline is the single source of truth now.
		const scene = scenes.find((s) => s.id === id);
		if (!scene) return;
		if (id !== activeSceneId) workbenchScenesStore.setActiveScene(id);
		scrollCarouselToStart();
		// Next tick: the header is mounted + the scroll has started;
		// querying now lands on the active scene's h1 which
		// contenteditable plaintext-only focuses cleanly.
		setTimeout(() => {
			const h1 = document.querySelector<HTMLElement>('.scene-header .scene-name[contenteditable]');
			h1?.focus();
		}, 120);
	}
	function handleDuplicateScene(id: string) {
		workbenchScenesStore.duplicateScene(id);
	}
	function handleRequestDeleteScene(id: string) {
		const scene = scenes.find((s) => s.id === id);
		if (!scene) return;
		sceneToDelete = { id, name: scene.name };
	}
	async function handleConfirmDeleteScene() {
		if (!sceneToDelete) return;
		await workbenchScenesStore.deleteScene(sceneToDelete.id);
		sceneToDelete = null;
	}
</script>

<svelte:head>
	<title>Home - Mana</title>
</svelte:head>

<DragPreview {resolveEntity} />

<div class="workbench">
	<PageCarousel
		pages={carouselPages}
		defaultWidth={DEFAULT_WIDTH}
		{showPicker}
		onTogglePicker={() => (showPicker = !showPicker)}
		addLabel="App hinzufügen"
	>
		{#snippet page(p)}
			{@const idx = openApps.findIndex((a) => a.appId === p.id)}
			<AppPage
				appId={p.id}
				widthPx={p.widthPx}
				maximized={p.maximized}
				onClose={() => handleRemoveApp(p.id)}
				onMaximize={() => handleMaximizeApp(p.id)}
				onResize={(w) => handleResize(p.id, w)}
				onMoveLeft={idx > 0 ? () => handleMoveLeft(p.id) : undefined}
				onMoveRight={idx < openApps.length - 1 ? () => handleMoveRight(p.id) : undefined}
				onContextMenu={(e) => handleCardContextMenu(e, p.id, idx)}
			/>
		{/snippet}
		{#snippet picker()}
			<AppPagePicker
				onSelect={handleAddApp}
				onClose={() => (showPicker = false)}
				activeAppIds={openApps.map((a) => a.appId)}
				userTier={authStore.user?.tier}
			/>
		{/snippet}
		{#snippet leading()}
			<SceneHeader scene={workbenchScenesStore.activeScene} />
		{/snippet}
	</PageCarousel>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenu.items}
		onClose={() => ctxMenu.close()}
	/>

	<ConfirmDialog
		show={sceneToDelete !== null}
		title="Szene löschen"
		message={sceneToDelete
			? `„${sceneToDelete.name}" wird endgültig entfernt. Die Apps selbst bleiben erhalten — nur dieses Layout geht verloren.`
			: ''}
		confirmLabel="Löschen"
		variant="danger"
		onConfirm={handleConfirmDeleteScene}
		onCancel={() => (sceneToDelete = null)}
	/>

	<BindAgentDialog bind:scene={sceneToBindAgent} bind:open={bindAgentDialogOpen} />
</div>

<style>
	.workbench {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
		/* Break out of layout's max-w-7xl px-3 container;
		   only negate the inner wrapper's py-2, keep main's pt-4 */
		margin: -0.5rem -0.75rem 0;
		width: calc(100% + 1.5rem);
	}

	@media (min-width: 640px) {
		.workbench {
			margin: -0.75rem -1.5rem 0;
			width: calc(100% + 3rem);
		}
	}

	@media (min-width: 1024px) {
		.workbench {
			margin: -0.75rem -2rem 0;
			width: calc(100% + 4rem);
		}
	}
</style>
