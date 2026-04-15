<!--
  BindAgentDialog — small modal for picking (or clearing) the Agent a
  Scene is "viewed as". Purely a UI lens; see
  docs/plans/multi-agent-workbench.md §Phase 5d for the rationale.
-->
<script lang="ts">
	import AgentPicker from '$lib/components/ai/AgentPicker.svelte';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
	import type { WorkbenchScene } from '$lib/types/workbench-scenes';

	interface Props {
		scene: WorkbenchScene | null;
		open: boolean;
	}

	let { scene = $bindable(null), open = $bindable(false) }: Props = $props();

	let selection = $state<string | undefined>(undefined);

	$effect(() => {
		if (scene) selection = scene.viewingAsAgentId;
	});

	async function save() {
		if (!scene) return;
		await workbenchScenesStore.setSceneAgent(scene.id, selection);
		open = false;
	}

	function cancel() {
		open = false;
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') cancel();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open && scene}
	<div class="scrim-wrap" role="presentation">
		<button type="button" class="scrim" aria-label="Schließen" onclick={cancel}></button>
		<div class="panel" role="dialog" aria-modal="true" aria-labelledby="bind-agent-title">
			<h2 id="bind-agent-title">Scene an Agent binden</h2>
			<p class="lede">
				Die Scene „{scene.name}" zeigt ab dann den Agent-Avatar als Hinweis und setzt ihn in
				Mission-Filtern vor. Scene-Inhalte ändern sich dadurch nicht.
			</p>
			<AgentPicker value={selection} onSelect={(id) => (selection = id)} label="Agent" />
			<footer>
				<button type="button" class="btn-ghost" onclick={cancel}>Abbrechen</button>
				<button type="button" class="btn-primary" onclick={save}>Übernehmen</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	.scrim-wrap {
		position: fixed;
		inset: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	.scrim {
		position: absolute;
		inset: 0;
		border: none;
		background: rgba(0, 0, 0, 0.45);
		cursor: pointer;
	}
	.panel {
		position: relative;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		padding: 1.25rem 1.5rem;
		max-width: 24rem;
		width: 100%;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1rem;
	}
	.lede {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
	}
	footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.btn-ghost,
	.btn-primary {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn-ghost {
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
	}
	.btn-primary {
		border: 1px solid color-mix(in oklab, hsl(var(--color-primary)) 45%, transparent);
		background: color-mix(in oklab, hsl(var(--color-primary)) 18%, hsl(var(--color-surface)));
		color: hsl(var(--color-primary));
	}
</style>
