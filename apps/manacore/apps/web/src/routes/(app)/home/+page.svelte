<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, X, ArrowsOut } from '@manacore/shared-icons';
	import AppPage from '$lib/components/workbench/AppPage.svelte';
	import AppPagePicker from '$lib/components/workbench/AppPagePicker.svelte';
	import { getAppEntry, APP_REGISTRY } from '$lib/components/workbench/app-registry';
	import { createAppSettingsStore } from '@manacore/shared-stores';

	// ── Persisted workbench state ───────────────────────────
	const DEFAULT_WIDTH = 480;

	interface WorkbenchSettings extends Record<string, unknown> {
		openApps: { appId: string; minimized: boolean; maximized?: boolean; widthPx?: number }[];
	}

	const workbenchStore = createAppSettingsStore<WorkbenchSettings>('workbench-settings', {
		openApps: [
			{ appId: 'todo', minimized: false },
			{ appId: 'calendar', minimized: false },
			{ appId: 'contacts', minimized: false },
		],
	});

	// Local reactive state synced from persisted store
	let openApps = $state<
		{ appId: string; minimized: boolean; maximized?: boolean; widthPx?: number }[]
	>([
		{ appId: 'todo', minimized: false },
		{ appId: 'calendar', minimized: false },
		{ appId: 'contacts', minimized: false },
	]);

	// Initialize from persisted settings
	$effect(() => {
		const s = workbenchStore.settings;
		if (s.openApps?.length) openApps = [...s.openApps];
	});

	// Persist changes (debounced via store)
	function persistState() {
		workbenchStore.update({
			openApps: openApps.map((a) => ({
				appId: a.appId,
				minimized: a.minimized,
				maximized: a.maximized,
				widthPx: a.widthPx,
			})),
		});
	}

	let expandedApps = $derived(openApps.filter((a) => !a.minimized));

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

	function handleRemoveApp(appId: string) {
		openApps = openApps.filter((a) => a.appId !== appId);
		persistState();
	}

	function handleMinimizeApp(appId: string) {
		openApps = openApps.map((a) => (a.appId === appId ? { ...a, minimized: true } : a));
		persistState();
	}

	function handleRestoreApp(appId: string) {
		openApps = openApps.map((a) => (a.appId === appId ? { ...a, minimized: false } : a));
		persistState();
	}

	function handleMaximizeApp(appId: string) {
		openApps = openApps.map((a) =>
			a.appId === appId ? { ...a, maximized: !a.maximized, minimized: false } : a
		);
		persistState();
	}

	function handleResize(appId: string, widthPx: number) {
		openApps = openApps.map((a) => (a.appId === appId ? { ...a, widthPx } : a));
		persistState();
	}

	// ── Drag reorder ────────────────────────────────────────
	let dragAppId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, appId: string) {
		dragAppId = appId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', appId);
		}
	}

	function handleDragOver(e: DragEvent) {
		if (!dragAppId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(e: DragEvent, targetAppId: string) {
		e.preventDefault();
		if (!dragAppId || dragAppId === targetAppId) return;
		const fromIdx = openApps.findIndex((a) => a.appId === dragAppId);
		const toIdx = openApps.findIndex((a) => a.appId === targetAppId);
		if (fromIdx === -1 || toIdx === -1) return;
		const apps = [...openApps];
		const [moved] = apps.splice(fromIdx, 1);
		apps.splice(toIdx, 0, moved);
		openApps = apps;
		dragAppId = null;
		persistState();
	}

	function handleDragEnd() {
		dragAppId = null;
	}

	// ── Minimized tabs ──────────────────────────────────────
	let minimizedApps = $derived(
		openApps
			.filter((a) => a.minimized)
			.map((a) => {
				const entry = getAppEntry(a.appId);
				return {
					appId: a.appId,
					name: entry?.name ?? a.appId,
					color: entry?.color ?? '#6B7280',
				};
			})
	);

	let pickerEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (showPicker && pickerEl) {
			pickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	});
</script>

<svelte:head>
	<title>Home - ManaCore</title>
</svelte:head>

<div class="workbench">
	<!-- App carousel -->
	<div class="fokus-track" style="--sheet-width: {DEFAULT_WIDTH}px">
		{#each expandedApps as app (app.appId)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="page-drag-wrapper"
				class:dragging={dragAppId === app.appId}
				draggable={true}
				ondragstart={(e) => handleDragStart(e, app.appId)}
				ondragover={handleDragOver}
				ondrop={(e) => handleDrop(e, app.appId)}
				ondragend={handleDragEnd}
			>
				<AppPage
					appId={app.appId}
					widthPx={app.widthPx ?? DEFAULT_WIDTH}
					maximized={app.maximized}
					onClose={() => handleRemoveApp(app.appId)}
					onMinimize={() => handleMinimizeApp(app.appId)}
					onMaximize={() => handleMaximizeApp(app.appId)}
					onResize={(w) => handleResize(app.appId, w)}
				/>
			</div>
		{/each}

		<!-- Picker / add button -->
		{#if expandedApps.length === 0}
			<div class="empty-wrapper">
				{#if showPicker}
					<AppPagePicker
						onSelect={handleAddApp}
						onClose={() => (showPicker = false)}
						activeAppIds={openApps.map((a) => a.appId)}
					/>
				{:else}
					<button class="add-card alone" onclick={() => (showPicker = true)}>
						<Plus size={24} />
						<span class="add-label">App hinzufügen</span>
					</button>
				{/if}
			</div>
		{:else if showPicker}
			<div bind:this={pickerEl}>
				<AppPagePicker
					onSelect={handleAddApp}
					onClose={() => (showPicker = false)}
					activeAppIds={openApps.map((a) => a.appId)}
				/>
			</div>
		{:else}
			<button class="add-card" onclick={() => (showPicker = true)} title="App hinzufügen">
				<Plus size={18} />
			</button>
		{/if}
	</div>

	<!-- Minimized tabs -->
	{#if minimizedApps.length > 0}
		<div class="minimized-tabs">
			{#each minimizedApps as app (app.appId)}
				<div class="minimized-tab">
					<span class="tab-dot" style="background-color: {app.color}"></span>
					<button class="tab-title" onclick={() => handleRestoreApp(app.appId)}>
						{app.name}
					</button>
					<button
						class="tab-maximize"
						onclick={() => handleMaximizeApp(app.appId)}
						title="Maximieren"
					>
						<ArrowsOut size={12} />
					</button>
					<button
						class="tab-close"
						onclick={() => handleRemoveApp(app.appId)}
						title={$_('common.close')}
					>
						<X size={12} />
					</button>
				</div>
			{/each}
			<button class="tab-add" onclick={() => (showPicker = true)} title="App hinzufügen">
				<Plus size={14} />
			</button>
		</div>
	{/if}
</div>

<style>
	.workbench {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* Carousel */
	.fokus-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		padding: 1rem calc(50% - var(--sheet-width) / 2);
		scrollbar-width: none;
		flex: 1;
	}
	.fokus-track::-webkit-scrollbar {
		display: none;
	}

	.page-drag-wrapper {
		flex: 0 0 auto;
		transition: opacity 0.15s;
	}
	.page-drag-wrapper.dragging {
		opacity: 0.4;
	}

	/* Add button */
	.add-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 2px dashed rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s;
	}
	.empty-wrapper {
		flex: 0 0 auto;
		width: var(--sheet-width, min(480px, 85vw));
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	.add-card.alone {
		width: 100%;
		min-height: 60vh;
		border-color: rgba(0, 0, 0, 0.12);
	}
	.add-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, transparent);
	}
	:global(.dark) .add-card {
		border-color: rgba(255, 255, 255, 0.06);
		color: #4b5563;
	}
	:global(.dark) .add-card.alone {
		border-color: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
	:global(.dark) .add-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 8%, transparent);
	}
	.add-label {
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Minimized tabs */
	.minimized-tabs {
		position: fixed;
		bottom: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 45;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.75rem;
		background: #fffef5;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		animation: slideUp 0.25s ease-out;
	}
	:global(.dark) .minimized-tabs {
		background: #252220;
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.minimized-tab:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .minimized-tab:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.tab-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.tab-title {
		border: none;
		background: none;
		color: #374151;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0;
	}
	.tab-title:hover {
		color: var(--color-primary, #8b5cf6);
	}
	:global(.dark) .tab-title {
		color: #e5e7eb;
	}
	:global(.dark) .tab-title:hover {
		color: var(--color-primary, #8b5cf6);
	}
	.tab-maximize,
	.tab-close {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		opacity: 0;
		transition: all 0.15s;
	}
	.minimized-tab:hover .tab-maximize,
	.minimized-tab:hover .tab-close {
		opacity: 1;
	}
	.tab-maximize:hover {
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}
	.tab-close:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}
	.tab-add {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		margin-left: 0.125rem;
	}
	.tab-add:hover {
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}

</style>
