<script lang="ts">
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import SceneTabs from '$lib/components/workbench/scenes/SceneTabs.svelte';
	import SceneRenameDialog from '$lib/components/workbench/scenes/SceneRenameDialog.svelte';
	import ConfirmDialog from '$lib/components/workbench/scenes/ConfirmDialog.svelte';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import { getApp, getAppByDragType, isAppAccessible } from '$lib/app-registry';
	import { onMount, onDestroy } from 'svelte';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { DragPreview } from '@mana/shared-ui/dnd';
	import type { DragType } from '@mana/shared-ui/dnd';
	import { ContextMenu } from '@mana/shared-ui';
	import { _ } from 'svelte-i18n';
	import { buildContextMenuItems, createWorkbenchContextMenu } from '$lib/context-menu';

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
		function updateDefaultWidth() {
			DEFAULT_WIDTH = window.innerWidth < 640 ? window.innerWidth - 32 : DESKTOP_WIDTH;
		}
		updateDefaultWidth();
		window.addEventListener('resize', updateDefaultWidth);
		return () => window.removeEventListener('resize', updateDefaultWidth);
	});

	// ── Scene store wiring ──────────────────────────────────
	onMount(() => {
		workbenchScenesStore.initialize();
	});
	onDestroy(() => {
		workbenchScenesStore.dispose();
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
	let carouselPages = $derived<CarouselPage[]>(
		openApps.map((a) => {
			const entry = getApp(a.appId);
			return {
				id: a.appId,
				minimized: a.minimized,
				maximized: a.maximized,
				widthPx: a.widthPx ?? DEFAULT_WIDTH,
				heightPx: a.heightPx,
				title: (() => {
					const k = `apps.${a.appId}`;
					const t = $_(k);
					return t !== k ? t : (entry?.name ?? a.appId);
				})(),
				color: entry?.color ?? '#6B7280',
			};
		})
	);

	let showPicker = $state(false);

	// ── App CRUD (delegated to active scene) ────────────────
	function handleAddApp(appId: string) {
		workbenchScenesStore.addApp(appId);
		showPicker = false;
	}
	function handleRemoveApp(id: string) {
		workbenchScenesStore.removeApp(id);
	}
	function handleMinimizeApp(id: string) {
		workbenchScenesStore.minimizeApp(id);
	}
	function handleRestoreApp(id: string) {
		workbenchScenesStore.restoreApp(id);
	}
	function handleMaximizeApp(id: string) {
		workbenchScenesStore.toggleMaximizeApp(id);
	}
	function handleResize(id: string, widthPx: number, heightPx?: number) {
		workbenchScenesStore.resizeApp(id, widthPx, heightPx);
	}
	function handleMoveLeft(id: string) {
		workbenchScenesStore.moveAppLeft(id);
	}
	function handleMoveRight(id: string) {
		workbenchScenesStore.moveAppRight(id);
	}
	function handleReorder(fromId: string, toId: string) {
		workbenchScenesStore.reorderApps(fromId, toId);
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
			onMinimize: () => handleMinimizeApp(appId),
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
			onRestore: () => handleRestoreApp(appId),
			onMaximize: () => handleMaximizeApp(appId),
			onClose: () => handleRemoveApp(appId),
		});
		ctxMenu.open(e, appId, items);
	}

	// ── Scene CRUD dialogs ──────────────────────────────────
	type SceneDialogMode =
		| { kind: 'create' }
		| { kind: 'rename'; id: string; name: string; icon?: string };
	let sceneDialog = $state<SceneDialogMode | null>(null);
	let sceneToDelete = $state<{ id: string; name: string } | null>(null);

	function handleCreateScene() {
		sceneDialog = { kind: 'create' };
	}
	function handleRequestRename(id: string) {
		const scene = scenes.find((s) => s.id === id);
		if (!scene) return;
		sceneDialog = { kind: 'rename', id, name: scene.name, icon: scene.icon };
	}
	async function handleSubmitSceneDialog(name: string, icon: string | undefined) {
		const mode = sceneDialog;
		if (!mode) return;
		if (mode.kind === 'create') {
			await workbenchScenesStore.createScene({ name, icon });
		} else {
			await workbenchScenesStore.renameScene(mode.id, name, icon);
		}
		sceneDialog = null;
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
	<SceneTabs
		{scenes}
		{activeSceneId}
		onSelect={(id) => workbenchScenesStore.setActiveScene(id)}
		onCreate={handleCreateScene}
		onRequestRename={handleRequestRename}
		onDuplicate={handleDuplicateScene}
		onRequestDelete={handleRequestDeleteScene}
		onReorder={(fromId, toId) => workbenchScenesStore.reorderScenes(fromId, toId)}
	/>

	<PageCarousel
		pages={carouselPages}
		defaultWidth={DEFAULT_WIDTH}
		{showPicker}
		onReorder={handleReorder}
		onRestore={handleRestoreApp}
		onMaximize={handleMaximizeApp}
		onRemove={handleRemoveApp}
		onTogglePicker={() => (showPicker = !showPicker)}
		onTabContextMenu={handleTabContextMenu}
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
	</PageCarousel>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenu.items}
		onClose={() => ctxMenu.close()}
	/>

	<SceneRenameDialog
		show={sceneDialog !== null}
		title={sceneDialog?.kind === 'rename' ? 'Szene umbenennen' : 'Neue Szene'}
		initialName={sceneDialog?.kind === 'rename' ? sceneDialog.name : ''}
		initialIcon={sceneDialog?.kind === 'rename' ? (sceneDialog.icon ?? '') : ''}
		confirmLabel={sceneDialog?.kind === 'rename' ? 'Speichern' : 'Erstellen'}
		onSubmit={handleSubmitSceneDialog}
		onCancel={() => (sceneDialog = null)}
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
