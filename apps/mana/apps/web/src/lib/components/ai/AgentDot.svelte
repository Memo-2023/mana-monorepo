<!--
  AgentDot — tiny inline indicator showing which AI agent last wrote
  a record. Reads the __lastActor field stamped by the Dexie hooks;
  when kind='ai', resolves the agent's avatar from the live agent
  query. When no AI actor is present, renders nothing.

  Usage:
    <AgentDot record={task} />
    <AgentDot record={note} />

  Intentionally minimal: one emoji dot + tooltip. No click handler
  (future: could navigate to the agent detail). Designed to be
  dropped into any list-item without disrupting layout — the wrapper
  is inline with zero width when hidden.
-->
<script lang="ts">
	import { useAgents } from '$lib/data/ai/agents/queries';
	import { normalizeActor } from '$lib/data/events/actor';

	interface Props {
		/** Any Dexie record that might carry __lastActor. */
		record: unknown;
	}

	const { record }: Props = $props();

	const agents = $derived(useAgents({ state: 'active' }));
	const agentById = $derived(new Map(agents.value.map((a) => [a.id, a])));

	const actor = $derived(() => {
		const raw = (record as Record<string, unknown>)?.__lastActor;
		if (!raw) return null;
		return normalizeActor(raw);
	});

	const resolved = $derived(() => {
		const a = actor();
		if (!a || a.kind !== 'ai') return null;
		const agent = agentById.get(a.principalId);
		return {
			avatar: agent?.avatar ?? '🤖',
			name: agent?.name ?? a.displayName,
		};
	});
</script>

{#if resolved()}
	<span class="agent-dot" title="Erstellt von {resolved()?.name}">
		{resolved()?.avatar}
	</span>
{/if}

<style>
	.agent-dot {
		display: inline-block;
		font-size: 0.6875rem;
		line-height: 1;
		opacity: 0.7;
		flex-shrink: 0;
		cursor: default;
	}
	.agent-dot:hover {
		opacity: 1;
	}
</style>
