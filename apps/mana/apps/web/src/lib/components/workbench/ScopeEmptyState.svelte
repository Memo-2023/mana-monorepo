<!--
  ScopeEmptyState — shown inside a module's ListView when the list is
  empty *because* the active scene's scope tags filter everything out.
  Gives the user a one-click way to clear the scope instead of leaving
  them to figure out why their records vanished.

  Usage:
    {#if filtered.length === 0}
      {#if hasActiveSceneScope()}
        <ScopeEmptyState />
      {:else}
        <p class="empty">Keine Aufgaben</p>
      {/if}
    {/if}
-->
<script lang="ts">
	import { Funnel } from '@mana/shared-icons';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';

	interface Props {
		/** Optional module label — e.g. "Aufgaben". Omit for the generic copy. */
		label?: string;
	}

	let { label }: Props = $props();

	async function handleClear() {
		const id = workbenchScenesStore.activeSceneId;
		if (!id) return;
		await workbenchScenesStore.setSceneScopeTags(id, undefined);
	}

	let primaryLine = $derived(
		label
			? `Aktive Bereichsfilter verbergen alle ${label}.`
			: 'Aktive Bereichsfilter verbergen alles.'
	);
</script>

<div class="scope-empty">
	<Funnel size={20} weight="duotone" />
	<p class="scope-empty-line">{primaryLine}</p>
	<button type="button" class="scope-clear-btn" onclick={handleClear}>
		Bereich zurücksetzen
	</button>
</div>

<style>
	.scope-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
	}
	.scope-empty-line {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.4;
		max-width: 24ch;
	}
	.scope-clear-btn {
		margin-top: 0.25rem;
		padding: 0.3125rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-primary));
		background: color-mix(in oklab, hsl(var(--color-primary)) 10%, transparent);
		border: 1px solid color-mix(in oklab, hsl(var(--color-primary)) 30%, transparent);
		border-radius: 9999px;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.scope-clear-btn:hover {
		background: color-mix(in oklab, hsl(var(--color-primary)) 18%, transparent);
		border-color: color-mix(in oklab, hsl(var(--color-primary)) 45%, transparent);
	}
</style>
