<!--
  Themes — Workbench-embedded theme picker.

  Custom layout tuned for the narrow panel (no shared ThemePage):
  - Big gradient theme cards (primary → secondary) with overlay label
  - Beefy mode selector (Hell / Dunkel / System)
  - Wallpaper picker below in a 2-column grid
-->
<script lang="ts">
	import { Sun, Moon, Desktop, Check } from '@mana/shared-icons';
	import {
		THEME_DEFINITIONS,
		DEFAULT_THEME_VARIANTS,
		EXTENDED_THEME_VARIANTS,
		type ThemeVariant,
		type ThemeMode,
	} from '@mana/shared-theme';
	import { theme } from '$lib/stores/theme';
	import { wallpaperStore } from '$lib/stores/wallpaper.svelte';
	import WallpaperPicker from '$lib/components/wallpaper/WallpaperPicker.svelte';

	const modes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
		{ id: 'light', label: 'Hell', icon: Sun },
		{ id: 'dark', label: 'Dunkel', icon: Moon },
		{ id: 'system', label: 'System', icon: Desktop },
	];

	/** Pick the light- or dark-mode palette based on the effective mode,
	 *  so the preview card reflects what the app actually renders right
	 *  now instead of a single canonical look. */
	function paletteFor(variant: ThemeVariant) {
		const def = THEME_DEFINITIONS[variant];
		return theme.effectiveMode === 'dark' ? def.dark : def.light;
	}

	function gradientCss(variant: ThemeVariant): string {
		const c = paletteFor(variant);
		return `linear-gradient(135deg, hsl(${c.primary}) 0%, hsl(${c.secondary}) 100%)`;
	}

	let allVariants = $derived<ThemeVariant[]>([
		...DEFAULT_THEME_VARIANTS,
		...EXTENDED_THEME_VARIANTS,
	]);
</script>

<div class="themes-page">
	<!-- ── Mode selector ──────────────────────────────────────────── -->
	<section class="mode-section">
		<h2 class="section-heading">Modus</h2>
		<div class="mode-row" role="tablist">
			{#each modes as m}
				{@const isActive = theme.mode === m.id}
				<button
					type="button"
					role="tab"
					aria-selected={isActive}
					class="mode-btn"
					class:active={isActive}
					onclick={() => theme.setMode(m.id)}
				>
					<m.icon size={16} weight={isActive ? 'fill' : 'regular'} />
					<span>{m.label}</span>
				</button>
			{/each}
		</div>
	</section>

	<!-- ── Theme cards ────────────────────────────────────────────── -->
	<section class="themes-section">
		<h2 class="section-heading">Aktuelles Theme</h2>
		<div class="themes-grid">
			{#each allVariants as variant (variant)}
				{@const def = THEME_DEFINITIONS[variant]}
				{@const isActive = theme.variant === variant}
				<button
					type="button"
					class="theme-card"
					class:active={isActive}
					style:background={gradientCss(variant)}
					onclick={() => theme.setVariant(variant)}
					aria-label={def.label}
					aria-pressed={isActive}
				>
					<!-- Active checkmark -->
					{#if isActive}
						<span class="active-check">
							<Check size={12} weight="bold" />
						</span>
					{/if}

					<!-- Theme name overlay -->
					<span class="theme-label">{def.label}</span>
				</button>
			{/each}
		</div>
	</section>

	<!-- ── Wallpaper section ──────────────────────────────────────── -->
	<section class="wallpaper-section">
		<h2 class="section-heading">Hintergrund</h2>
		<WallpaperPicker />
	</section>
</div>

<style>
	.themes-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-heading {
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0 0 0.625rem 0;
	}

	/* ── Mode selector ─────────────────────────────────────────── */
	.mode-row {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.625rem;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.625rem;
		border: none;
		background: transparent;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}

	.mode-btn:hover {
		color: hsl(var(--color-foreground));
	}

	.mode-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.12);
	}

	.mode-btn.active:hover {
		color: hsl(var(--color-primary-foreground, 0 0% 100%));
	}

	/* ── Theme cards ───────────────────────────────────────────── */
	.themes-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}

	.theme-card {
		position: relative;
		aspect-ratio: 16 / 10;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		cursor: pointer;
		overflow: hidden;
		padding: 0;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.15s;
	}

	.theme-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.12);
	}

	.theme-card.active {
		border-color: hsl(var(--color-primary));
		box-shadow:
			0 0 0 2px hsl(var(--color-primary) / 0.35),
			0 4px 12px hsl(0 0% 0% / 0.12);
	}

	/* Dark overlay at the bottom for label readability */
	.theme-card::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 50%, hsl(0 0% 0% / 0.35) 100%);
		pointer-events: none;
	}

	.active-check {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: hsl(0 0% 100%);
		color: hsl(var(--color-primary));
		box-shadow: 0 1px 4px hsl(0 0% 0% / 0.2);
	}

	.theme-label {
		position: absolute;
		left: 0.625rem;
		bottom: 0.5rem;
		z-index: 1;
		font-size: 0.875rem;
		font-weight: 700;
		color: hsl(0 0% 100%);
		text-shadow: 0 1px 3px hsl(0 0% 0% / 0.5);
		letter-spacing: -0.01em;
	}

	/* ── Wallpaper section ─────────────────────────────────────── */
	.wallpaper-section {
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	/* Force all WallpaperPicker grids to 2 columns in this panel context
	   (defaults are 4 and 3 which cram tiles in a narrow panel). */
	.wallpaper-section :global(.grid.grid-cols-4),
	.wallpaper-section :global(.grid.grid-cols-3) {
		grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
		gap: 0.625rem !important;
	}

	/* WallpaperPicker pill-group buttons (scope toggle + Farben/Bilder/
	   Upload tabs) — restyle to match the mode selector above so active
	   state reads clearly against the panel background. */
	.wallpaper-section :global(.flex.rounded-lg.bg-muted) {
		background: hsl(var(--color-muted) / 0.3);
	}

	.wallpaper-section :global(.flex.rounded-lg.bg-muted > button) {
		color: hsl(var(--color-muted-foreground));
		transition:
			background 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}

	.wallpaper-section :global(.flex.rounded-lg.bg-muted > button:hover) {
		color: hsl(var(--color-foreground));
	}

	/* Active pill-group button — primary fill with white text, matching
	   the mode selector. Targets the button that carries .bg-surface
	   (applied via `class:bg-surface={activeTab === tab.id}`). */
	.wallpaper-section :global(.flex.rounded-lg.bg-muted > button.bg-surface) {
		background: hsl(var(--color-primary)) !important;
		color: hsl(var(--color-primary-foreground, 0 0% 100%)) !important;
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.12) !important;
	}
</style>
