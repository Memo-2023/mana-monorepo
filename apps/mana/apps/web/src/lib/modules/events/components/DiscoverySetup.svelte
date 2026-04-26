<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { discoveryStore } from '../discovery/store.svelte';
	import { EVENT_CATEGORIES } from '../discovery/types';
	import RegionPicker from './RegionPicker.svelte';

	interface Props {
		onComplete?: () => void;
	}

	let { onComplete }: Props = $props();

	let step = $state<1 | 2>(1);
	let selectedCategories = $state<Set<string>>(new Set());
	let freetext = $state('');

	function toggleCategory(id: string) {
		const next = new Set(selectedCategories);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedCategories = next;
	}

	async function finishSetup() {
		// Save interests
		for (const cat of selectedCategories) {
			await discoveryStore.addInterest({ category: cat });
		}
		if (freetext.trim()) {
			for (const text of freetext
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)) {
				await discoveryStore.addInterest({ category: 'other', freetext: text });
			}
		}
		onComplete?.();
	}

	const canProceed = $derived(discoveryStore.regions.length > 0);
	const canFinish = $derived(selectedCategories.size > 0 || freetext.trim().length > 0);
</script>

<div class="setup">
	<h2 class="setup-title">{$_('events.discovery_setup.title')}</h2>

	{#if step === 1}
		<div class="step">
			<p class="step-desc">{$_('events.discovery_setup.step1_desc')}</p>
			<RegionPicker regions={discoveryStore.regions} />
			<button class="next-btn" disabled={!canProceed} onclick={() => (step = 2)}>
				{$_('events.discovery_setup.action_next')}
			</button>
		</div>
	{:else}
		<div class="step">
			<p class="step-desc">{$_('events.discovery_setup.step2_desc')}</p>
			<div class="category-grid">
				{#each EVENT_CATEGORIES as cat}
					<button
						class="category-chip"
						class:selected={selectedCategories.has(cat.id)}
						onclick={() => toggleCategory(cat.id)}
					>
						{cat.label}
					</button>
				{/each}
			</div>
			<input
				class="input"
				bind:value={freetext}
				placeholder={$_('events.discovery_setup.placeholder_freetext')}
			/>
			<div class="step-actions">
				<button class="back-btn" onclick={() => (step = 1)}>
					{$_('events.discovery_setup.action_back')}
				</button>
				<button class="next-btn" disabled={!canFinish} onclick={finishSetup}>
					{$_('events.discovery_setup.action_finish')}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.setup-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.step {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.step-desc {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.category-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.category-chip {
		padding: 0.375rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		background: hsl(var(--color-background));
		font-size: 0.8125rem;
		cursor: pointer;
		color: hsl(var(--color-foreground));
		transition:
			background 0.1s,
			border-color 0.1s;
		font-family: inherit;
	}
	.category-chip.selected {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.input {
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-background));
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		font-family: inherit;
	}
	.step-actions {
		display: flex;
		gap: 0.5rem;
	}
	.next-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
	}
	.next-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.back-btn {
		padding: 0.5rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		font-family: inherit;
	}
</style>
