<!--
  Themes — Workbench-embedded theme picker with variant selection,
  light/dark mode toggle, and wallpaper picker.
-->
<script lang="ts">
	import { ThemePage } from '@mana/shared-theme-ui';
	import { theme } from '$lib/stores/theme';
	import { wallpaperStore } from '$lib/stores/wallpaper.svelte';
	import WallpaperPicker from '$lib/components/wallpaper/WallpaperPicker.svelte';
</script>

<div class="themes-page">
	<ThemePage
		currentVariant={theme.variant}
		onSelectTheme={(v) => theme.setVariant(v)}
		showModeSelector={true}
		currentMode={theme.mode}
		onModeChange={(m) => theme.setMode(m)}
		showBackButton={false}
		transparent={wallpaperStore.hasWallpaper}
	>
		<section class="wallpaper-section">
			<h2 class="wallpaper-heading">Hintergrund</h2>
			<WallpaperPicker />
		</section>
	</ThemePage>
</div>

<style>
	.themes-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}

	.wallpaper-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.wallpaper-heading {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 1rem;
	}
</style>
