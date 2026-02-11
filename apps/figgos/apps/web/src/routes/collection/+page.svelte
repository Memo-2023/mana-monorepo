<script lang="ts">
	import { CARDS } from '$lib/data/cards';
</script>

<div class="mx-auto max-w-2xl px-5 pt-8">
	<h1 class="text-4xl font-black tracking-tight text-foreground">Collection</h1>
	<p class="mt-1 text-base text-muted-foreground">
		{CARDS.length} {CARDS.length === 1 ? 'Figgo' : 'Figgos'}
	</p>

	<div class="mt-6 grid grid-cols-2 gap-4">
		{#each CARDS as card (card.id)}
			<a href="/card/{card.id}" class="block transition-opacity hover:opacity-80 active:opacity-70">
				<div class="aspect-[1/1.45] overflow-hidden rounded-xl">
					<img
						src={card.image}
						alt={card.name}
						class="h-full w-full object-cover"
					/>
				</div>
			</a>
		{/each}
	</div>
</div>
