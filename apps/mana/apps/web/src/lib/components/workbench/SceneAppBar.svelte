<!--
  SceneAppBar — Combined scene + app tabs bar (Chrome tab-group style).
  Rendered by the layout's bottom-stack via bottomBarStore.
-->
<script lang="ts">
	import { Plus, Check, X, Funnel } from '@mana/shared-icons';
	import { tick } from 'svelte';
	import type { CarouselPage } from '$lib/components/page-carousel/types';
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';
	import { useAgents } from '$lib/data/ai/agents/queries';
	import { useAllTags } from '@mana/shared-stores';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';

	// Resolve each scene's bound agent → avatar + name. Cheap lookup
	// since all active agents are already in memory from the live-
	// query. No extra Dexie round-trip per render.
	const agents = $derived(useAgents({ state: 'active' }));
	const agentById = $derived(new Map(agents.value.map((a) => [a.id, a])));

	// Tag name lookup for the scope-badge tooltip. Same liveQuery that
	// SceneHeader already uses — no extra Dexie round-trip.
	const allTags = $derived(useAllTags());
	const tagNameById = $derived(new Map((allTags.value ?? []).map((t) => [t.id, t.name] as const)));

	function scopeTitle(scopeTagIds: readonly string[] | undefined): string {
		const names = (scopeTagIds ?? [])
			.map((id) => tagNameById.get(id))
			.filter((n): n is string => !!n);
		return names.length > 0
			? `Bereich: ${names.join(', ')} — klicken zum Aufheben`
			: 'Bereichsfilter aktiv — klicken zum Aufheben';
	}

	async function handleClearScope(e: MouseEvent | KeyboardEvent, sceneId: string) {
		e.stopPropagation();
		if ('key' in e) e.preventDefault();
		try {
			await workbenchScenesStore.setSceneScopeTags(sceneId, undefined);
		} catch (err) {
			console.error('[workbench] setSceneScopeTags failed:', err);
		}
	}

	interface Props {
		scenes: WorkbenchScene[];
		activeSceneId: string | null;
		pages: CarouselPage[];
		onSceneSelect: (id: string) => void;
		onSceneCreate: (name: string) => void;
		onSceneContextMenu: (e: MouseEvent, scene: WorkbenchScene) => void;
		onAppClick: (id: string) => void;
		onAppContextMenu: (e: MouseEvent, id: string) => void;
		onAddApp: () => void;
	}

	let {
		scenes,
		activeSceneId,
		pages,
		onSceneSelect,
		onSceneCreate,
		onSceneContextMenu,
		onAppClick,
		onAppContextMenu,
		onAddApp,
	}: Props = $props();

	let creating = $state(false);
	let newName = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	async function startCreate() {
		creating = true;
		newName = '';
		await tick();
		inputEl?.focus();
	}

	function submitCreate() {
		const trimmed = newName.trim();
		if (trimmed) {
			onSceneCreate(trimmed);
		}
		creating = false;
		newName = '';
	}

	function cancelCreate() {
		creating = false;
		newName = '';
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitCreate();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelCreate();
		}
	}
</script>

<div class="scene-app-bar-wrapper">
	<div class="scene-app-bar">
		{#each scenes as scene (scene.id)}
			{@const isActive = scene.id === activeSceneId}

			{#if isActive && pages.length > 0}
				{@const boundAgent = scene.viewingAsAgentId ? agentById.get(scene.viewingAsAgentId) : null}
				{@const hasScope = (scene.scopeTagIds?.length ?? 0) > 0}
				<!-- Active scene + its app tabs wrapped in a visual group -->
				<div class="scene-group">
					<button
						type="button"
						class="scene-pill active"
						onclick={() => onSceneSelect(scene.id)}
						oncontextmenu={(e) => onSceneContextMenu(e, scene)}
						title={boundAgent ? `Agent: ${boundAgent.name}` : undefined}
					>
						{#if boundAgent}
							<span class="scene-agent-avatar">{boundAgent.avatar ?? '🤖'}</span>
						{/if}
						<span class="scene-name">{scene.name}</span>
						{#if hasScope}
							<span class="scope-badge" title="Bereichsfilter aktiv">
								<Funnel size={10} weight="fill" />
							</span>
						{/if}
						<span class="scene-count">{scene.openApps.length}</span>
					</button>
					<span class="group-sep"></span>
					{#each pages as p (p.id)}
						{@const AppIcon = p.icon}
						<button
							class="app-tab"
							onclick={() => onAppClick(p.id)}
							oncontextmenu={(e) => onAppContextMenu(e, p.id)}
						>
							{#if AppIcon}
								<span class="app-icon" style="color: {p.color}">
									<AppIcon size={12} weight="fill" />
								</span>
							{:else}
								<span class="app-dot" style="background-color: {p.color}"></span>
							{/if}
							<span class="app-title">{p.title}</span>
						</button>
					{/each}
					<button class="app-add" onclick={onAddApp} title="App hinzufügen">
						<Plus size={12} />
					</button>
				</div>
			{:else}
				{@const boundAgent = scene.viewingAsAgentId ? agentById.get(scene.viewingAsAgentId) : null}
				{@const hasScope = (scene.scopeTagIds?.length ?? 0) > 0}
				<button
					type="button"
					class="scene-pill"
					class:active={isActive}
					onclick={() => onSceneSelect(scene.id)}
					oncontextmenu={(e) => onSceneContextMenu(e, scene)}
					title={boundAgent ? `Agent: ${boundAgent.name}` : undefined}
				>
					{#if boundAgent}
						<span class="scene-agent-avatar">{boundAgent.avatar ?? '🤖'}</span>
					{/if}
					<span class="scene-name">{scene.name}</span>
					{#if hasScope}
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<span
							class="scope-badge"
							role="button"
							tabindex="0"
							aria-label="Bereich aufheben"
							title={scopeTitle(scene.scopeTagIds)}
							onclick={(e) => handleClearScope(e, scene.id)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') handleClearScope(e, scene.id);
							}}
						>
							<Funnel size={10} weight="fill" />
						</span>
					{/if}
					<span class="scene-count">{scene.openApps.length}</span>
				</button>
			{/if}
		{/each}

		{#if creating}
			<div class="inline-create">
				<input
					bind:this={inputEl}
					class="inline-create-input"
					type="text"
					maxlength="40"
					placeholder="Name…"
					bind:value={newName}
					onkeydown={handleInputKeydown}
					onblur={submitCreate}
				/>
				<button class="inline-create-btn confirm" onclick={submitCreate} title="Erstellen">
					<Check size={14} weight="bold" />
				</button>
				<button class="inline-create-btn cancel" onclick={cancelCreate} title="Abbrechen">
					<X size={14} weight="bold" />
				</button>
			</div>
		{:else}
			<button type="button" class="scene-add" onclick={startCreate} title="Neue Szene">
				<Plus size={14} />
			</button>
		{/if}
	</div>
</div>

<style>
	.scene-app-bar-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		/* Bar slot (see bottomChromeHeight in (app)/+layout.svelte). */
		height: 64px;
	}

	.scene-app-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		margin: 0 auto;
		width: fit-content;
		max-width: calc(100vw - 2rem);
		pointer-events: auto;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
		scrollbar-width: none;
	}
	.scene-app-bar::-webkit-scrollbar {
		display: none;
	}
	.scene-group {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		background: hsl(var(--color-primary) / 0.1);
		border: 1.5px solid hsl(var(--color-primary) / 0.25);
		border-radius: 9999px;
		padding: 0.125rem;
	}

	/* Scene pills */
	.scene-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		flex-shrink: 0;
		border: none;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
		font-weight: 500;
		padding: 0 0.875rem;
		height: 40px;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
		max-width: 140px;
	}
	.scene-pill:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}
	.scene-pill.active {
		background: transparent;
		color: hsl(var(--color-foreground));
		box-shadow: none;
	}
	.scene-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.scene-agent-avatar {
		font-size: 0.875rem;
		line-height: 1;
	}
	.scene-count {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}
	.scope-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-primary));
		opacity: 0.8;
		flex-shrink: 0;
		cursor: pointer;
		padding: 0.125rem;
		margin: -0.125rem;
		border-radius: 9999px;
		transition:
			opacity 0.15s,
			background 0.15s;
	}
	.scope-badge:hover,
	.scope-badge:focus-visible {
		opacity: 1;
		background: color-mix(in oklab, hsl(var(--color-primary)) 18%, transparent);
		outline: none;
	}
	.group-sep {
		width: 1px;
		height: 1.25rem;
		background: hsl(var(--color-border));
		flex-shrink: 0;
	}
	.scene-add {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.scene-add:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-primary));
	}

	/* Inline create */
	.inline-create {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.inline-create-input {
		width: 120px;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		border: 1.5px solid hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-card));
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}
	.inline-create-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.inline-create-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s;
		padding: 0;
	}
	.inline-create-btn.confirm {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}
	.inline-create-btn.confirm:hover {
		background: hsl(var(--color-primary) / 0.25);
	}
	.inline-create-btn.cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.inline-create-btn.cancel:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}

	/* App tabs — lighter, inline after active scene */
	.app-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0 0.875rem;
		height: 40px;
		border-radius: 9999px;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	.app-tab:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.app-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.app-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.app-title {
		font-size: 0.9375rem;
		font-weight: 500;
		max-width: 90px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.app-add {
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.1875rem;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		margin-left: 0.0625rem;
		flex-shrink: 0;
	}
	.app-add:hover {
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
	}
</style>
