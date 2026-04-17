<!--
  Rituals — guided sequences. Two flavours live here:
    - utility  : data-capture rituals (log drink, log mood, show tasks)
    - ceremony : presence/meaning rituals (morning coffee, bedtime, reset)
  Templates are grouped by category. Running a ritual hands off to
  RitualRunner (companion), which renders each step type.
-->
<script lang="ts">
	import { Plus, Play, Trash } from '@mana/shared-icons';
	import RitualRunner from '$lib/modules/companion/components/RitualRunner.svelte';
	import { ritualStore, useAllRituals, RITUAL_TEMPLATES } from '$lib/companion/rituals';
	import type { LocalRitual, RitualCategory } from '$lib/companion/rituals/types';

	const rituals = useAllRituals();
	let activeRitual = $state<LocalRitual | null>(null);
	let showTemplates = $state(false);
	let filter = $state<RitualCategory | 'all'>('all');

	const CATEGORY_LABELS: Record<RitualCategory, string> = {
		utility: 'Utility',
		ceremony: 'Zeremoniell',
		mixed: 'Mixed',
	};

	async function createFromTemplate(templateId: string) {
		const template = RITUAL_TEMPLATES.find((t) => t.id === templateId);
		if (!template) return;
		await ritualStore.createFromTemplate(template);
		showTemplates = false;
	}

	const templatesByCategory = $derived.by(() => {
		const buckets: Record<RitualCategory, typeof RITUAL_TEMPLATES> = {
			utility: [],
			ceremony: [],
			mixed: [],
		};
		for (const t of RITUAL_TEMPLATES) {
			buckets[t.category ?? 'utility'].push(t);
		}
		return buckets;
	});

	const filteredRituals = $derived.by(() => {
		if (filter === 'all') return rituals.value;
		return rituals.value.filter((r) => (r.category ?? 'utility') === filter);
	});
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
			<div class="filter-chips">
				<button
					type="button"
					class="chip"
					class:active={filter === 'all'}
					onclick={() => (filter = 'all')}
				>
					Alle
				</button>
				<button
					type="button"
					class="chip"
					class:active={filter === 'utility'}
					onclick={() => (filter = 'utility')}
				>
					Utility
				</button>
				<button
					type="button"
					class="chip"
					class:active={filter === 'ceremony'}
					onclick={() => (filter = 'ceremony')}
				>
					Zeremoniell
				</button>
			</div>
			<button type="button" class="primary" onclick={() => (showTemplates = !showTemplates)}>
				<Plus size={14} /><span>{showTemplates ? 'Schließen' : 'Aus Template'}</span>
			</button>
		</header>

		{#if showTemplates}
			<div class="templates">
				{#each ['ceremony', 'utility', 'mixed'] as const as cat (cat)}
					{#if templatesByCategory[cat].length > 0}
						<div class="template-group">
							<div class="template-group-label">{CATEGORY_LABELS[cat]}</div>
							{#each templatesByCategory[cat] as t (t.id)}
								<button type="button" class="template" onclick={() => createFromTemplate(t.id)}>
									<strong>{t.title}</strong>
									<span>{t.description ?? ''}</span>
								</button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<ul class="list">
			{#each filteredRituals as r (r.id)}
				<li class="item">
					<button type="button" class="item-main" onclick={() => (activeRitual = r)}>
						<Play size={12} />
						<span>{r.title}</span>
						{#if r.category && r.category !== 'utility'}
							<span class="cat-pill cat-{r.category}">{CATEGORY_LABELS[r.category]}</span>
						{/if}
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
			{#if filteredRituals.length === 0 && !showTemplates}
				<li class="empty">
					{filter === 'all'
						? 'Noch keine Rituale — erstelle eines aus einer Vorlage oben.'
						: 'Keine Rituale in dieser Kategorie.'}
				</li>
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
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.filter-chips {
		display: inline-flex;
		gap: 0.25rem;
	}
	.chip {
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
	}
	.chip.active {
		background: color-mix(in oklab, hsl(var(--color-primary)) 14%, transparent);
		color: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary) / 0.4);
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
		gap: 0.75rem;
		padding: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.375rem;
	}
	.template-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.template-group-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0.375rem 0.125rem;
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
	.cat-pill {
		margin-left: auto;
		font-size: 0.7rem;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklab, hsl(var(--color-primary)) 12%, transparent);
		color: hsl(var(--color-primary));
	}
	.cat-pill.cat-ceremony {
		background: color-mix(in oklab, #ec4899 18%, transparent);
		color: #ec4899;
	}
	.cat-pill.cat-mixed {
		background: color-mix(in oklab, #f59e0b 18%, transparent);
		color: #f59e0b;
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
