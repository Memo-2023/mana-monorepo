<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import { THEME_DEFINITIONS, THEME_VARIANTS } from '@manacore/shared-theme';
</script>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-6 text-2xl font-bold text-foreground">Alle Themes</h1>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each THEME_VARIANTS as variant}
			{@const def = THEME_DEFINITIONS[variant]}
			<button
				class="card text-left transition-all hover:border-primary/50"
				class:border-primary={theme.variant === variant}
				onclick={() => theme.setVariant(variant)}
			>
				<div class="flex items-center gap-3">
					<span class="text-3xl">{def.icon}</span>
					<div>
						<h3 class="font-semibold">{def.label}</h3>
						<p class="text-sm text-muted-foreground">{def.emoji}</p>
					</div>
				</div>
				{#if theme.variant === variant}
					<div class="mt-3 text-sm text-primary">✓ Aktiv</div>
				{/if}
			</button>
		{/each}
	</div>
</div>
