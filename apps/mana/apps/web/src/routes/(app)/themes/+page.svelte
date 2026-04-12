<script lang="ts">
	import { ThemePage } from '@mana/shared-theme-ui';
	import { PageHeader } from '@mana/shared-ui';
	import { theme } from '$lib/stores/theme';
	import { wallpaperStore } from '$lib/stores/wallpaper.svelte';
	import WallpaperPicker from '$lib/components/wallpaper/WallpaperPicker.svelte';
</script>

<svelte:head>
	<title>Themes | Mana</title>
</svelte:head>

<PageHeader title="Themes" backHref="/" sticky />

<ThemePage
	currentVariant={theme.variant}
	onSelectTheme={(v) => theme.setVariant(v)}
	showModeSelector={true}
	currentMode={theme.mode}
	onModeChange={(m) => theme.setMode(m)}
	showBackButton={false}
	transparent={wallpaperStore.hasWallpaper}
>
	<section class="mt-8 pt-8 border-t border-border">
		<h2 class="text-sm font-medium text-muted-foreground mb-4">Hintergrund</h2>
		<WallpaperPicker />
	</section>
</ThemePage>
