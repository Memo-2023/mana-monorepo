<script lang="ts">
	import type { Game } from '$lib/data/games';

	let { game, href }: { game: Game; href: string } = $props();

	const difficultyColors: Record<string, string> = {
		Einfach: 'bg-green-500/20 text-green-400',
		Mittel: 'bg-yellow-500/20 text-yellow-400',
		Schwer: 'bg-red-500/20 text-red-400',
	};
</script>

<a
	{href}
	class="group block rounded-xl border border-border bg-card p-0 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
>
	{#if game.thumbnail}
		<div class="aspect-video w-full overflow-hidden bg-muted">
			<img
				src={game.thumbnail}
				alt={game.title}
				class="h-full w-full object-cover transition-transform group-hover:scale-105"
				loading="lazy"
			/>
		</div>
	{:else}
		<div class="aspect-video w-full bg-muted flex items-center justify-center">
			<span class="text-4xl opacity-40">🎮</span>
		</div>
	{/if}

	<div class="p-4">
		<div class="flex items-start justify-between gap-2 mb-2">
			<h3 class="font-semibold text-foreground group-hover:text-primary transition-colors">
				{game.title}
			</h3>
			<span class="shrink-0 text-xs px-2 py-0.5 rounded-full {difficultyColors[game.difficulty]}">
				{game.difficulty}
			</span>
		</div>

		<p class="text-sm text-muted-foreground line-clamp-2 mb-3">
			{game.description}
		</p>

		<div class="flex flex-wrap gap-1">
			{#each game.tags.slice(0, 3) as tag}
				<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
					{tag}
				</span>
			{/each}
		</div>
	</div>
</a>
