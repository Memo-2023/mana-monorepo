<script lang="ts">
	import type {
		ThemeColors,
		ThemeVariant,
		EffectiveMode,
		CreateCustomThemeInput,
		HSLValue,
	} from '@manacore/shared-theme';
	import {
		THEME_DEFINITIONS,
		THEME_VARIANTS,
		MAIN_THEME_COLORS,
		EXTENDED_THEME_COLORS,
		THEME_COLOR_LABELS,
	} from '@manacore/shared-theme';
	import {
		Sun,
		Moon,
		CaretDown,
		CaretUp,
		FloppyDisk,
		ArrowCounterClockwise,
	} from '@manacore/shared-icons';
	import ColorPicker from './ColorPicker.svelte';

	interface Props {
		/** Initial theme data (for editing existing theme) */
		initialTheme?: Partial<CreateCustomThemeInput>;
		/** Current effective mode for preview */
		effectiveMode?: EffectiveMode;
		/** Callback when theme changes */
		onThemeChange?: (theme: Partial<CreateCustomThemeInput>) => void;
		/** Callback when save is triggered */
		onSave?: (theme: CreateCustomThemeInput) => void;
		/** Callback to preview theme */
		onPreview?: (colors: ThemeColors, mode: EffectiveMode) => void;
		/** Callback to stop preview */
		onStopPreview?: () => void;
		/** Show save button */
		showSaveButton?: boolean;
		/** Is saving in progress */
		isSaving?: boolean;
	}

	let {
		initialTheme,
		effectiveMode = 'light',
		onThemeChange,
		onSave,
		onPreview,
		onStopPreview,
		showSaveButton = true,
		isSaving = false,
	}: Props = $props();

	// Get default colors from a base variant
	function getDefaultColors(variant: ThemeVariant = 'ocean'): {
		light: ThemeColors;
		dark: ThemeColors;
	} {
		const definition = THEME_DEFINITIONS[variant];
		if (definition) {
			return { light: definition.light, dark: definition.dark };
		}
		// Fallback to ocean
		const ocean = THEME_DEFINITIONS['ocean'];
		return { light: ocean.light, dark: ocean.dark };
	}

	// Initialize theme state
	const defaultColors = getDefaultColors(initialTheme?.baseVariant);

	let name = $state(initialTheme?.name ?? '');
	let description = $state(initialTheme?.description ?? '');
	let baseVariant = $state<ThemeVariant | undefined>(initialTheme?.baseVariant);
	let lightColors = $state<ThemeColors>(
		(initialTheme?.lightColors as ThemeColors) ?? { ...defaultColors.light }
	);
	let darkColors = $state<ThemeColors>(
		(initialTheme?.darkColors as ThemeColors) ?? { ...defaultColors.dark }
	);

	// UI State
	let editingMode = $state<EffectiveMode>(effectiveMode);
	let showExtendedColors = $state(false);

	// Current colors based on editing mode
	let currentColors = $derived(editingMode === 'light' ? lightColors : darkColors);

	// Build the theme input object
	let themeInput = $derived<Partial<CreateCustomThemeInput>>({
		name: name || undefined,
		description: description || undefined,
		baseVariant,
		lightColors,
		darkColors,
	});

	// Notify parent of changes
	$effect(() => {
		onThemeChange?.(themeInput);
	});

	// Check if theme is valid for saving
	let isValid = $derived(name.trim().length > 0);

	function updateColor(key: keyof ThemeColors, value: HSLValue) {
		if (editingMode === 'light') {
			lightColors = { ...lightColors, [key]: value };
		} else {
			darkColors = { ...darkColors, [key]: value };
		}
	}

	function handleBaseVariantChange(variant: ThemeVariant) {
		baseVariant = variant;
		const colors = getDefaultColors(variant);
		lightColors = { ...colors.light };
		darkColors = { ...colors.dark };
	}

	function resetToBase() {
		if (baseVariant) {
			const colors = getDefaultColors(baseVariant);
			lightColors = { ...colors.light };
			darkColors = { ...colors.dark };
		}
	}

	function handleSave() {
		if (!isValid) return;

		const theme: CreateCustomThemeInput = {
			name: name.trim(),
			description: description.trim() || undefined,
			lightColors,
			darkColors,
			baseVariant,
		};

		onSave?.(theme);
	}
</script>

<div class="theme-editor">
	<!-- Theme Info + Base Variant in one row -->
	<section class="editor-section compact">
		<div class="info-row">
			<div class="form-group name-group">
				<label for="theme-name" class="form-label">Name *</label>
				<input
					id="theme-name"
					type="text"
					class="form-input"
					bind:value={name}
					placeholder="Mein Theme"
					required
				/>
			</div>

			<div class="form-group desc-group">
				<label for="theme-description" class="form-label">Beschreibung</label>
				<input
					id="theme-description"
					type="text"
					class="form-input"
					bind:value={description}
					placeholder="Kurze Beschreibung..."
				/>
			</div>
		</div>

		<div class="variant-row">
			<span class="variant-label">Basis:</span>
			<div class="variant-buttons">
				{#each THEME_VARIANTS as variantName}
					{@const variant = THEME_DEFINITIONS[variantName]}
					<button
						type="button"
						class="variant-button"
						class:selected={baseVariant === variantName}
						onclick={() => handleBaseVariantChange(variantName)}
						title={variant.label}
					>
						{variant.emoji}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Colors Section -->
	<section class="editor-section">
		<div class="mode-header">
			<h3 class="section-title">Farben</h3>
			<div class="mode-toggle">
				<button
					type="button"
					class="mode-button"
					class:active={editingMode === 'light'}
					onclick={() => (editingMode = 'light')}
				>
					<Sun size={14} weight={editingMode === 'light' ? 'fill' : 'regular'} />
					Hell
				</button>
				<button
					type="button"
					class="mode-button"
					class:active={editingMode === 'dark'}
					onclick={() => (editingMode = 'dark')}
				>
					<Moon size={14} weight={editingMode === 'dark' ? 'fill' : 'regular'} />
					Dunkel
				</button>
			</div>
		</div>

		<!-- Main Colors -->
		<div class="colors-grid">
			{#each MAIN_THEME_COLORS as colorKey}
				<div class="color-item">
					<ColorPicker
						label={THEME_COLOR_LABELS[colorKey]}
						value={currentColors[colorKey]}
						onChange={(value) => updateColor(colorKey, value)}
						compact
					/>
				</div>
			{/each}
		</div>

		<!-- Extended Colors (collapsible) -->
		<button
			type="button"
			class="colors-toggle"
			onclick={() => (showExtendedColors = !showExtendedColors)}
		>
			<span>Erweiterte Farben ({EXTENDED_THEME_COLORS.length})</span>
			{#if showExtendedColors}
				<CaretUp size={14} />
			{:else}
				<CaretDown size={14} />
			{/if}
		</button>

		{#if showExtendedColors}
			<div class="colors-grid extended">
				{#each EXTENDED_THEME_COLORS as colorKey}
					<div class="color-item">
						<ColorPicker
							label={THEME_COLOR_LABELS[colorKey]}
							value={currentColors[colorKey]}
							onChange={(value) => updateColor(colorKey, value)}
							compact
						/>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Actions -->
	<div class="editor-actions">
		{#if baseVariant}
			<button type="button" class="action-button secondary" onclick={resetToBase}>
				<ArrowCounterClockwise size={14} />
				Reset
			</button>
		{/if}

		{#if showSaveButton && onSave}
			<button
				type="button"
				class="action-button primary"
				onclick={handleSave}
				disabled={!isValid || isSaving}
			>
				<FloppyDisk size={14} />
				{isSaving ? 'Speichern...' : 'Speichern'}
			</button>
		{/if}
	</div>
</div>

<style>
	.theme-editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.editor-section {
		background: hsl(var(--surface));
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
	}

	.editor-section.compact {
		padding: 0.875rem 1rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	/* Info Row - Name + Description side by side */
	.info-row {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.form-input {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		background: hsl(var(--input));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.form-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--primary) / 0.15);
	}

	/* Variant Row */
	.variant-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.variant-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.variant-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.variant-button {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		background: hsl(var(--muted));
		border: 1px solid transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.variant-button:hover {
		background: hsl(var(--muted) / 0.7);
		transform: scale(1.05);
	}

	.variant-button.selected {
		background: hsl(var(--primary) / 0.15);
		border-color: hsl(var(--primary));
	}

	/* Mode Toggle */
	.mode-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.mode-toggle {
		display: flex;
		background: hsl(var(--muted));
		border-radius: 0.375rem;
		padding: 0.125rem;
	}

	.mode-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-button:hover {
		color: hsl(var(--foreground));
	}

	.mode-button.active {
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	/* Colors Grid */
	.colors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.5rem;
	}

	.colors-grid.extended {
		margin-top: 0.5rem;
	}

	.color-item {
		background: hsl(var(--background));
		padding: 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--border));
	}

	/* Colors Toggle */
	.colors-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.75rem;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--muted) / 0.5);
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.colors-toggle:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	/* Actions */
	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.action-button:hover:not(:disabled) {
		background: hsl(var(--muted) / 0.8);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-button.primary {
		background: hsl(var(--primary));
		border-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.action-button.primary:hover:not(:disabled) {
		background: hsl(var(--primary) / 0.9);
	}

	.action-button.secondary {
		background: transparent;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.info-row {
			grid-template-columns: 1fr;
		}

		.mode-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.colors-grid {
			grid-template-columns: 1fr;
		}

		.editor-actions {
			flex-wrap: wrap;
		}

		.action-button {
			flex: 1;
			justify-content: center;
		}
	}
</style>
