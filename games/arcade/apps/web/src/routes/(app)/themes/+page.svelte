<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import { THEME_DEFINITIONS, EXTENDED_THEME_VARIANTS } from '@mana/shared-theme';
	import type { ThemeVariant } from '@mana/shared-theme';

	const allThemes = EXTENDED_THEME_VARIANTS;
</script>

<svelte:head>
	<title>Themes - Arcade</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Themes</h1>
		<p class="text-muted-foreground mt-1">Wähle ein Theme für Arcade</p>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
		{#each allThemes as variant}
			{@const def = THEME_DEFINITIONS[variant]}
			{#if def}
				<button
					onclick={() => theme.setVariant(variant)}
					class="rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 {theme.variant ===
					variant
						? 'border-primary bg-primary/5 ring-2 ring-primary/30'
						: 'border-border bg-card hover:border-primary/30'}"
				>
					<div class="text-2xl mb-2">{def.icon || '🎨'}</div>
					<div class="font-medium text-foreground text-sm">{def.label}</div>
				</button>
			{/if}
		{/each}
	</div>
</div>
