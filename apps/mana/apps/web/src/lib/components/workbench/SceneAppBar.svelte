<!--
  SceneAppBar — Combined scene + app tabs bar (Chrome tab-group style).
  Rendered by the layout's bottom-stack via bottomBarStore.
-->
<script lang="ts">
	import { Plus } from '@mana/shared-icons';
	import type { CarouselPage } from '$lib/components/page-carousel/types';
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';

	interface Props {
		scenes: WorkbenchScene[];
		activeSceneId: string | null;
		pages: CarouselPage[];
		onSceneSelect: (id: string) => void;
		onSceneCreate: () => void;
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
</script>

<div class="scene-app-bar">
	{#each scenes as scene (scene.id)}
		{@const isActive = scene.id === activeSceneId}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<button
			type="button"
			class="scene-pill"
			class:active={isActive}
			onclick={() => onSceneSelect(scene.id)}
			oncontextmenu={(e) => onSceneContextMenu(e, scene)}
		>
			{#if scene.icon}
				<span class="scene-icon">{scene.icon}</span>
			{/if}
			<span class="scene-name">{scene.name}</span>
		</button>

		<!-- App tabs appear inline right after the active scene pill -->
		{#if isActive && pages.length > 0}
			{#each pages as p (p.id)}
				{@const AppIcon = p.icon}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
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
			{#if scenes.length > 1}
				<span class="bar-sep"></span>
			{/if}
		{/if}
	{/each}
	<button type="button" class="scene-add" onclick={onSceneCreate} title="Neue Szene">
		<Plus size={12} />
	</button>
</div>

<style>
	.scene-app-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		padding: 0.3125rem 0.625rem;
		margin: 0 auto;
		width: fit-content;
		max-width: calc(100vw - 2rem);
		pointer-events: auto;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
		scrollbar-width: none;
	}
	.scene-app-bar::-webkit-scrollbar {
		display: none;
	}
	.bar-sep {
		width: 1px;
		height: 16px;
		background: hsl(var(--color-border));
		flex-shrink: 0;
		margin: 0 0.25rem;
	}

	/* Scene pills — bold group headers */
	.scene-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		flex-shrink: 0;
		border: none;
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.3125rem 0.625rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
		max-width: 140px;
	}
	.scene-pill:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}
	.scene-pill.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		box-shadow: inset 0 0 0 1px hsl(var(--color-primary) / 0.25);
	}
	.scene-icon {
		font-size: 0.8125rem;
		line-height: 1;
	}
	.scene-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.scene-add:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-primary));
	}

	/* App tabs — lighter, inline after active scene */
	.app-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.1875rem 0.375rem;
		border-radius: 0.3125rem;
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
		font-size: 0.6875rem;
		font-weight: 400;
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
		border-radius: 0.25rem;
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
