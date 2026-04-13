<script lang="ts">
	import { Plus, Play, Pause, Trash } from '@mana/shared-icons';
	import RitualRunner from '$lib/modules/companion/components/RitualRunner.svelte';
	import {
		ritualStore,
		useActiveRituals,
		useAllRituals,
		RITUAL_TEMPLATES,
	} from '$lib/companion/rituals';
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

	function startRitual(ritual: LocalRitual) {
		activeRitual = ritual;
	}

	function handleComplete() {
		activeRitual = null;
	}
</script>

<svelte:head>
	<title>Rituale - Mana Companion</title>
</svelte:head>

{#if activeRitual}
	<RitualRunner
		ritual={activeRitual}
		onComplete={handleComplete}
		onClose={() => (activeRitual = null)}
	/>
{:else}
	<div class="rituals-page">
		<div class="page-header">
			<h2>Rituale</h2>
			<button class="add-btn" onclick={() => (showTemplates = !showTemplates)}>
				<Plus size={16} weight="bold" /> Neu
			</button>
		</div>

		{#if showTemplates}
			<div class="templates">
				<h3>Vorlage waehlen</h3>
				{#each RITUAL_TEMPLATES as tpl}
					<button class="template-card" onclick={() => createFromTemplate(tpl.id)}>
						<span class="tpl-title">{tpl.title}</span>
						<span class="tpl-desc">{tpl.description}</span>
						<span class="tpl-trigger"
							>{tpl.trigger === 'morning'
								? 'Morgens'
								: tpl.trigger === 'evening'
									? 'Abends'
									: 'Manuell'}</span
						>
					</button>
				{/each}
			</div>
		{/if}

		<div class="ritual-list">
			{#each rituals.value as ritual (ritual.id)}
				<div class="ritual-card">
					<div class="ritual-info">
						<span class="ritual-title">{ritual.title}</span>
						{#if ritual.description}
							<span class="ritual-desc">{ritual.description}</span>
						{/if}
						<span class="ritual-trigger">
							{ritual.trigger === 'morning'
								? 'Morgens'
								: ritual.trigger === 'evening'
									? 'Abends'
									: 'Manuell'}
							· {ritual.status === 'active' ? 'Aktiv' : 'Pausiert'}
						</span>
					</div>
					<div class="ritual-actions">
						{#if ritual.status === 'active'}
							<button class="action-btn play" onclick={() => startRitual(ritual)} title="Starten">
								<Play size={16} weight="fill" />
							</button>
							<button
								class="action-btn"
								onclick={() => ritualStore.pause(ritual.id)}
								title="Pausieren"
							>
								<Pause size={14} weight="bold" />
							</button>
						{:else}
							<button
								class="action-btn"
								onclick={() => ritualStore.resume(ritual.id)}
								title="Fortsetzen"
							>
								<Play size={14} weight="bold" />
							</button>
						{/if}
						<button
							class="action-btn danger"
							onclick={() => ritualStore.delete(ritual.id)}
							title="Loeschen"
						>
							<Trash size={14} />
						</button>
					</div>
				</div>
			{:else}
				<p class="empty">Noch keine Rituale. Erstelle eins aus einer Vorlage.</p>
			{/each}
		</div>
	</div>
{/if}

<style>
	.rituals-page {
		max-width: 560px;
		margin: 0 auto;
		padding: 1rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.page-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}

	.templates {
		margin-bottom: 1.5rem;
	}

	.templates h3 {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 0.75rem;
	}

	.template-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
		cursor: pointer;
		text-align: left;
		margin-bottom: 0.5rem;
		transition: all 0.15s;
	}

	.template-card:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		background: hsl(var(--color-primary) / 0.03);
	}

	.tpl-title {
		font-weight: 600;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}
	.tpl-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.tpl-trigger {
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	.ritual-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ritual-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}

	.ritual-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.ritual-title {
		font-weight: 500;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}
	.ritual-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.ritual-trigger {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.ritual-actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--color-muted) / 0.2);
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.action-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.action-btn.play {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}
	.action-btn.play:hover {
		background: hsl(var(--color-primary) / 0.25);
	}
	.action-btn.danger:hover {
		background: hsl(var(--color-error) / 0.15);
		color: hsl(var(--color-error));
	}

	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		padding: 2rem 1rem;
	}
</style>
