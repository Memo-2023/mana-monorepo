<!--
  AgentPicker — compact <select> over the user's active agents plus
  an "(unset)" option for missions that shouldn't be bound to any
  specific agent. Used by the mission create/edit flow and the scene
  settings dialog.
-->
<script lang="ts">
	import { useAgents } from '$lib/data/ai/agents/queries';

	interface Props {
		/** Current agent id (or undefined for unset / default fallback). */
		value: string | undefined;
		/** Fired when the user picks a different agent. Null = cleared. */
		onSelect: (id: string | undefined) => void;
		/** When true, the "(keiner)" option is omitted — every mission
		 *  must pick an agent. Default false. */
		required?: boolean;
		/** Render just the select (default) or a labeled row. */
		label?: string;
	}

	let { value, onSelect, required = false, label }: Props = $props();

	const agents = $derived(useAgents({ state: 'active' }));

	function handleChange(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		onSelect(v === '' ? undefined : v);
	}
</script>

<div class="wrap">
	{#if label}
		<span class="lbl">{label}</span>
	{/if}
	<select value={value ?? ''} onchange={handleChange}>
		{#if !required}
			<option value="">— keiner —</option>
		{/if}
		{#each agents.value as a (a.id)}
			<option value={a.id}>{a.avatar ?? '🤖'} {a.name}</option>
		{/each}
	</select>
</div>

<style>
	.wrap {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.lbl {
		font-size: 0.6875rem;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: hsl(var(--color-muted-foreground));
	}
	select {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		font: inherit;
		font-size: 0.8125rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
	}
</style>
