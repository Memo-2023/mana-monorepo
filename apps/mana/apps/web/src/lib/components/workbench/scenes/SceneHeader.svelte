<!--
  SceneHeader — large title + description shown left of the first page
  in the workbench carousel. Part of the scroll track, so it slides away
  as the user moves right (intentional: it's an intro block, not chrome).
  Click opens the existing rename dialog for editing name + description.
-->
<script lang="ts">
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';

	interface Props {
		scene: WorkbenchScene | null;
		onEdit: () => void;
	}

	const { scene, onEdit }: Props = $props();
</script>

{#if scene}
	<button
		type="button"
		class="scene-header"
		onclick={onEdit}
		aria-label="Szene bearbeiten"
		title="Klicken, um Name und Beschreibung zu bearbeiten"
	>
		<h1 class="scene-name">{scene.name}</h1>
		<p class="scene-desc" class:placeholder={!scene.description}>
			{scene.description || 'Beschreibung hinzufügen…'}
		</p>
	</button>
{/if}

<style>
	.scene-header {
		width: 420px;
		max-width: 60vw;
		padding: 2rem 2.5rem 2rem 0;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: hsl(var(--color-foreground));
		transition: opacity 0.2s;
	}
	.scene-header:hover {
		opacity: 0.85;
	}
	.scene-header:focus-visible {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 0.5rem;
		border-radius: 0.5rem;
	}

	.scene-name {
		margin: 0;
		font-size: clamp(2.75rem, 5vw, 4.5rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: hsl(var(--color-foreground));
	}
	.scene-desc {
		margin: 0;
		font-size: 1rem;
		line-height: 1.45;
		color: hsl(var(--color-muted-foreground));
		max-width: 32ch;
	}
	.scene-desc.placeholder {
		opacity: 0.55;
		font-style: italic;
	}

	@media (max-width: 639px) {
		.scene-header {
			width: 280px;
			padding: 1.25rem 1.5rem 1.25rem 0;
			gap: 0.5rem;
		}
		.scene-desc {
			font-size: 0.875rem;
		}
	}
</style>
