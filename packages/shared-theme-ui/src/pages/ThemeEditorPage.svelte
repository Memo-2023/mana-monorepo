<script lang="ts">
	import type {
		ThemeColors,
		EffectiveMode,
		CreateCustomThemeInput,
		CustomTheme,
	} from '@manacore/shared-theme';
	import { ArrowLeft } from '@manacore/shared-icons';
	import ThemeEditor from '../components/editor/ThemeEditor.svelte';
	import ThemeLivePreview from '../components/editor/ThemeLivePreview.svelte';

	interface Props {
		/** Theme to edit (for update mode) */
		editTheme?: CustomTheme;
		/** Current effective mode */
		effectiveMode?: EffectiveMode;
		/** Callback when theme is saved */
		onSave?: (theme: CreateCustomThemeInput) => Promise<void>;
		/** Callback to navigate back */
		onBack?: () => void;
		/** Is saving in progress */
		isSaving?: boolean;
		/** Page title */
		title?: string;
	}

	let {
		editTheme,
		effectiveMode = 'light',
		onSave,
		onBack,
		isSaving = false,
		title,
	}: Props = $props();

	// Track current theme state for preview
	let currentTheme = $state<Partial<CreateCustomThemeInput>>(
		editTheme
			? {
					name: editTheme.name,
					description: editTheme.description,
					emoji: editTheme.emoji,
					icon: editTheme.icon,
					lightColors: editTheme.lightColors,
					darkColors: editTheme.darkColors,
					baseVariant: editTheme.baseVariant,
				}
			: {}
	);

	// Preview mode state - syncs with editor mode
	let previewMode = $state<EffectiveMode>(effectiveMode);

	// Get colors for preview - always show current theme colors
	let displayColors = $derived<ThemeColors | null>(
		currentTheme.lightColors && currentTheme.darkColors
			? previewMode === 'dark'
				? (currentTheme.darkColors as ThemeColors)
				: (currentTheme.lightColors as ThemeColors)
			: null
	);

	function handleThemeChange(theme: Partial<CreateCustomThemeInput>) {
		currentTheme = theme;
	}

	function handlePreview(colors: ThemeColors, mode: EffectiveMode) {
		// Update preview mode when user clicks preview in editor
		previewMode = mode;
	}

	function handleStopPreview() {
		// No-op - preview always shows current colors
	}

	async function handleSave(theme: CreateCustomThemeInput) {
		await onSave?.(theme);
	}

	let pageTitle = $derived(
		title ?? (editTheme ? `"${editTheme.name}" bearbeiten` : 'Neues Theme erstellen')
	);
</script>

<div class="editor-page">
	<!-- Header -->
	<header class="page-header">
		{#if onBack}
			<button type="button" class="back-btn" onclick={onBack} aria-label="Zurück">
				<ArrowLeft size={20} weight="bold" />
			</button>
		{/if}
		<div class="header-content">
			<h1 class="page-title">{pageTitle}</h1>
			<p class="page-subtitle">Gestalte dein eigenes Theme mit individuellen Farben</p>
		</div>
	</header>

	<!-- Split Layout: Editor + Preview -->
	<div class="editor-layout">
		<!-- Editor Panel -->
		<div class="editor-panel">
			<ThemeEditor
				initialTheme={editTheme
					? {
							name: editTheme.name,
							description: editTheme.description,
							emoji: editTheme.emoji,
							icon: editTheme.icon,
							lightColors: editTheme.lightColors,
							darkColors: editTheme.darkColors,
							baseVariant: editTheme.baseVariant,
						}
					: undefined}
				{effectiveMode}
				onThemeChange={handleThemeChange}
				onSave={handleSave}
				onPreview={handlePreview}
				onStopPreview={handleStopPreview}
				{isSaving}
			/>
		</div>

		<!-- Preview Panel -->
		<div class="preview-panel">
			<div class="preview-sticky">
				{#if displayColors}
					<ThemeLivePreview
						colors={displayColors}
						mode={previewMode}
						onModeChange={(m) => (previewMode = m)}
					/>
				{:else}
					<div class="preview-placeholder">
						<p>Wähle eine Basis-Variante oder passe Farben an, um eine Vorschau zu sehen</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.editor-page {
		min-height: 100vh;
		background: hsl(var(--background));
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: hsl(var(--muted));
		border: none;
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: hsl(var(--muted) / 0.8);
	}

	.header-content {
		flex: 1;
	}

	.page-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.page-subtitle {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		margin: 0.125rem 0 0;
	}

	/* Layout - Full width on desktop */
	.editor-layout {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	@media (min-width: 1400px) {
		.editor-layout {
			grid-template-columns: 1fr 440px;
			padding: 1.5rem 2.5rem;
		}
	}

	@media (min-width: 1600px) {
		.editor-layout {
			grid-template-columns: 1fr 480px;
			padding: 1.5rem 3rem;
		}
	}

	@media (min-width: 1920px) {
		.editor-layout {
			grid-template-columns: 1fr 520px;
			padding: 2rem 4rem;
		}
	}

	.editor-panel {
		min-width: 0;
	}

	.preview-panel {
		min-width: 0;
	}

	.preview-sticky {
		position: sticky;
		top: 1.5rem;
	}

	.preview-placeholder {
		background: hsl(var(--surface));
		border: 1px dashed hsl(var(--border));
		border-radius: 0.5rem;
		padding: 2rem 1rem;
		text-align: center;
	}

	.preview-placeholder p {
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}

		.preview-sticky {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.page-header {
			padding: 1rem;
		}

		.page-title {
			font-size: 1.25rem;
		}

		.editor-layout {
			padding: 1rem;
			gap: 1rem;
		}
	}
</style>
