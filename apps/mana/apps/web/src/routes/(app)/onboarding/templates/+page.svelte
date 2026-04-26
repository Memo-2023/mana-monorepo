<!--
  Onboarding — Screen 3: Templates.
  Multi-select of use-case templates. On Weiter, the dedup'd union of
  picked templates' modules (capped at 8) is written to a fresh Home
  scene via `workbenchScenesStore.createScene`, then we advance to the
  wish screen (Screen 4), which owns markComplete + reset + goto('/').

  Skip path (no selections): no scene written (the hardcoded
  DEFAULT_HOME_APPS fallback in workbench-scenes kicks in on first
  liveQuery), still advance to /onboarding/wish.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		House,
		Briefcase,
		Heart,
		Barbell,
		GraduationCap,
		Compass,
		Camera,
		Check,
		ArrowLeft,
	} from '@mana/shared-icons';
	import type { Component } from 'svelte';
	import {
		ONBOARDING_TEMPLATES,
		resolveModulesForTemplates,
		type OnboardingTemplateId,
	} from '@mana/shared-branding';
	import { workbenchScenesStore } from '$lib/stores/workbench-scenes.svelte';
	import { onboardingFlow } from '$lib/stores/onboarding-flow.svelte';

	// Icon lookup — templates ship a phosphor name (string), the page
	// resolves it to the actual component. Keeps templates data-only
	// so they can be consumed by memoro/mobile later without pulling
	// in a web-only icon binding.
	const ICONS: Record<string, Component> = {
		House,
		Briefcase,
		Heart,
		Barbell,
		GraduationCap,
		Compass,
		Camera,
	};

	// Prefill from the flow store so a back-nav preserves what the user
	// already picked. Start empty on first visit.
	let selected = $state<Set<OnboardingTemplateId>>(
		new Set(onboardingFlow.selectedTemplateIds as OnboardingTemplateId[])
	);
	let saving = $state(false);
	let error = $state<string | null>(null);

	function toggle(id: OnboardingTemplateId) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
		onboardingFlow.setSelectedTemplateIds(Array.from(next));
	}

	async function handleNext() {
		if (saving) return;
		saving = true;
		error = null;

		try {
			if (selected.size > 0) {
				// Preserve selection order. `selected` is a Set, but we inserted
				// in order toggled — that matches the user's mental priority.
				const modules = resolveModulesForTemplates(Array.from(selected));
				if (modules.length > 0) {
					await workbenchScenesStore.createScene({
						name: 'Zuhause',
						seedApps: modules.map((appId) => ({ appId })),
						setActive: true,
					});
				}
			}
			await goto('/onboarding/wish');
		} catch (err) {
			console.error('[onboarding/templates] save failed:', err);
			error = 'Konnte die Auswahl nicht speichern. Versuch es noch mal.';
			saving = false;
		}
	}

	async function handleBack() {
		await goto('/onboarding/look');
	}
</script>

<div class="screen">
	<div class="hero">
		<h1>Wofür willst du Mana nutzen?</h1>
		<p class="subtitle">
			Wähl aus, was zu dir passt. Wir stellen dir dazu passende Module auf deinen Startbildschirm —
			weitere kannst du jederzeit hinzufügen.
		</p>
	</div>

	<div class="grid">
		{#each ONBOARDING_TEMPLATES as tpl (tpl.id)}
			{@const Icon = ICONS[tpl.iconName]}
			{@const isSelected = selected.has(tpl.id)}
			<button
				type="button"
				class="tile"
				class:selected={isSelected}
				onclick={() => toggle(tpl.id)}
				aria-pressed={isSelected}
			>
				<div class="tile-icon">
					{#if Icon}
						<Icon size={24} weight={isSelected ? 'fill' : 'regular'} />
					{/if}
				</div>
				<div class="tile-body">
					<div class="tile-name">{tpl.name}</div>
					<div class="tile-desc">{tpl.shortDescription}</div>
				</div>
				{#if isSelected}
					<div class="tile-check">
						<Check size={12} weight="bold" />
					</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<div class="actions">
		<button type="button" class="btn-ghost" onclick={handleBack} disabled={saving}>
			<ArrowLeft size={16} weight="bold" />
			<span>Zurück</span>
		</button>
		<button
			type="button"
			class="btn-primary"
			onclick={handleNext}
			disabled={saving}
			aria-label="Weiter zur Wunsch-Frage"
		>
			{saving ? 'Speichere…' : 'Weiter'}
		</button>
	</div>
</div>

<style>
	.screen {
		width: 100%;
		max-width: 680px;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.hero h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.5;
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}

	@media (max-width: 500px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	.tile {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface, var(--color-background)));
		border-radius: 0.875rem;
		cursor: pointer;
		text-align: left;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease,
			background 0.15s ease;
		color: inherit;
	}

	.tile:hover {
		transform: translateY(-1px);
		border-color: hsl(var(--color-primary) / 0.4);
	}

	.tile.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.08);
		box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.25);
	}

	.tile-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 0.625rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.tile.selected .tile-icon {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.tile-body {
		flex: 1;
		min-width: 0;
	}

	.tile-name {
		font-size: 0.9375rem;
		font-weight: 600;
		margin-bottom: 0.125rem;
	}

	.tile-desc {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.35;
	}

	.tile-check {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		box-shadow: 0 1px 4px hsl(0 0% 0% / 0.2);
	}

	.error {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9375rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.btn-ghost:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.4);
		color: hsl(var(--color-foreground));
	}

	.btn-ghost:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		font-size: 0.9375rem;
		font-weight: 600;
		border-radius: 0.75rem;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			opacity 0.15s ease;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.35);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
