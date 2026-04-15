<!--
  AI Rituals app — guided routines. Wraps the existing RitualRunner.
-->
<script lang="ts">
	import { Plus, Play, Trash } from '@mana/shared-icons';
	import RitualRunner from '$lib/modules/companion/components/RitualRunner.svelte';
	import { ritualStore, useAllRituals, RITUAL_TEMPLATES } from '$lib/companion/rituals';
	import type { LocalRitual } from '$lib/companion/rituals/types';

	const rituals = useAllRituals();
	let activeRitual = $state<LocalRitual | null>(null);
	let showTemplates = $state(false);

	async function createFromTemplate(templateId: string) {
		const template = RITUAL_TEMPLATES.find((t) => t.id === templateId);
		if (!template) return;
		await ritualStore.createFromTemplate(template);
		showTemplates = false;
	}
</script>

<div class="r">
	{#if activeRitual}
		<button class="back" onclick={() => (activeRitual = null)}>← Zurück</button>
		<RitualRunner
			ritual={activeRitual}
			onComplete={() => (activeRitual = null)}
			onClose={() => (activeRitual = null)}
		/>
	{:else}
		<header class="bar">
			<button type="button" class="primary" onclick={() => (showTemplates = !showTemplates)}>
				<Plus size={14} /><span>Aus Template</span>
			</button>
		</header>

		{#if showTemplates}
			<div class="templates">
				{#each RITUAL_TEMPLATES as t}
					<button type="button" class="template" onclick={() => createFromTemplate(t.id)}>
						<strong>{t.title}</strong>
						<span>{t.description ?? ''}</span>
					</button>
				{/each}
			</div>
		{/if}

		<ul class="list">
			{#each rituals.value as r (r.id)}
				<li class="item">
					<button type="button" class="item-main" onclick={() => (activeRitual = r)}>
						<Play size={12} />
						<span>{r.title}</span>
					</button>
					<button
						type="button"
						class="item-del"
						onclick={() => ritualStore.delete(r.id)}
						title="Löschen"
					>
						<Trash size={11} />
					</button>
				</li>
			{/each}
			{#if rituals.value.length === 0 && !showTemplates}
				<li class="empty">Noch keine Rituale — erstelle eines aus einer Vorlage oben.</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	.r {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 1rem 1.25rem;
	}
	.back {
		align-self: flex-start;
		border: none;
		background: none;
		padding: 0.25rem 0;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}
	.bar {
		display: flex;
		justify-content: flex-end;
	}
	.primary {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		border: 1px solid color-mix(in oklab, hsl(var(--color-primary)) 45%, transparent);
		border-radius: 0.375rem;
		background: color-mix(in oklab, hsl(var(--color-primary)) 12%, hsl(var(--color-surface)));
		color: hsl(var(--color-primary));
		cursor: pointer;
		font: inherit;
		font-size: 0.8125rem;
	}
	.templates {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
	}
	.template {
		text-align: left;
		padding: 0.5rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.template span {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.item {
		display: flex;
		align-items: center;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
	}
	.item-main {
		flex: 1;
		display: inline-flex;
		gap: 0.375rem;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border: none;
		background: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		text-align: left;
	}
	.item-del {
		border: none;
		background: none;
		padding: 0.375rem 0.5rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		list-style: none;
		color: hsl(var(--color-muted-foreground));
		padding: 1rem 0;
		font-size: 0.875rem;
	}
</style>
