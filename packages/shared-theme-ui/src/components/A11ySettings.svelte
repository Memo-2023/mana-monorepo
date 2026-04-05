<script lang="ts">
	import type { A11yStore, ContrastLevel, ColorblindMode } from '@mana/shared-theme';
	import { COLORBLIND_OPTIONS, CONTRAST_OPTIONS } from '@mana/shared-theme';
	import type { A11yTranslations } from '../types';
	import { defaultA11yTranslations } from '../types';

	interface Props {
		/** A11y store instance */
		store: A11yStore;
		/** Custom translations */
		translations?: Partial<A11yTranslations>;
		/** Show reset button */
		showReset?: boolean;
	}

	let { store, translations = {}, showReset = true }: Props = $props();

	// Merge translations with defaults
	const t = $derived({ ...defaultA11yTranslations, ...translations });

	// Colorblind mode labels mapped to translations
	const colorblindLabels: Record<ColorblindMode, string> = $derived({
		none: t.colorblindNone,
		deuteranopia: t.colorblindDeuteranopia,
		protanopia: t.colorblindProtanopia,
		monochrome: t.colorblindMonochrome,
	});
</script>

<div class="a11y-settings space-y-6">
	<!-- Contrast Setting -->
	<div class="setting-group">
		<span class="setting-label">{t.contrastLabel}</span>
		<div class="inline-flex rounded-lg bg-muted p-1" role="group" aria-label={t.contrastLabel}>
			{#each CONTRAST_OPTIONS as option}
				<button
					type="button"
					onclick={() => store.setContrast(option.value)}
					class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
						{store.contrast === option.value
						? 'bg-surface text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					title={option.description}
				>
					{option.value === 'normal' ? t.contrastNormal : t.contrastHigh}
				</button>
			{/each}
		</div>
	</div>

	<!-- Colorblind Mode -->
	<div class="setting-group">
		<label for="colorblind-select" class="setting-label">{t.colorblindLabel}</label>
		<select
			id="colorblind-select"
			class="select-input"
			value={store.colorblind}
			onchange={(e) => store.setColorblind(e.currentTarget.value as ColorblindMode)}
		>
			{#each COLORBLIND_OPTIONS as option}
				<option value={option.value}>
					{colorblindLabels[option.value]}
				</option>
			{/each}
		</select>
	</div>

	<!-- Reduce Motion -->
	<div class="setting-group">
		<div class="flex items-center justify-between">
			<div>
				<label for="reduce-motion" class="setting-label mb-0">{t.reduceMotionLabel}</label>
				<p class="text-sm text-muted-foreground">{t.reduceMotionDescription}</p>
			</div>
			<div class="flex items-center gap-2">
				{#if store.reduceMotionExplicit}
					<button
						type="button"
						onclick={() => store.resetReduceMotion()}
						class="text-xs text-muted-foreground hover:text-foreground underline"
					>
						{t.systemDefault}
					</button>
				{/if}
				<button
					id="reduce-motion"
					type="button"
					role="switch"
					aria-checked={store.reduceMotion}
					aria-label={t.reduceMotionLabel}
					onclick={() => store.setReduceMotion(!store.reduceMotion)}
					class="toggle-switch"
					class:active={store.reduceMotion}
				>
					<span class="toggle-thumb" class:active={store.reduceMotion}></span>
				</button>
			</div>
		</div>
	</div>

	<!-- Reset Button -->
	{#if showReset}
		<div class="pt-2 border-t border-border">
			<button
				type="button"
				onclick={() => store.resetAll()}
				class="text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				{t.reset}
			</button>
		</div>
	{/if}
</div>

<style>
	.a11y-settings {
		width: 100%;
	}

	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.25rem;
	}

	.select-input {
		width: 100%;
		max-width: 20rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.select-input:hover {
		border-color: hsl(var(--color-border-strong));
	}

	.select-input:focus {
		outline: none;
		border-color: hsl(var(--color-ring));
		box-shadow: 0 0 0 2px hsl(var(--color-ring) / 0.2);
	}

	.toggle-switch {
		position: relative;
		width: 2.75rem;
		height: 1.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted));
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}

	.toggle-switch.active {
		background: hsl(var(--color-primary));
	}

	.toggle-thumb {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s;
	}

	.toggle-thumb.active {
		transform: translateX(1.25rem);
	}
</style>
