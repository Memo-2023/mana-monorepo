<script lang="ts">
	import type { FigureResponse } from '@figgos/shared';
	import { api } from '$lib/api';

	let figures = $state<FigureResponse[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		api.figures
			.list()
			.then(({ figures: f }) => {
				figures = f;
				error = null;
			})
			.catch((e) => (error = e.message))
			.finally(() => (loading = false));
	});
</script>

<div class="mx-auto max-w-2xl px-5 pt-8">
	<h1 class="text-4xl font-black tracking-tight text-foreground">Collection</h1>
	<p class="mt-1 text-base text-muted-foreground">
		{loading ? '...' : `${figures.length} ${figures.length === 1 ? 'Figgo' : 'Figgos'}`}
	</p>

	{#if loading}
		<div class="mt-20 flex justify-center">
			<svg class="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else if error}
		<div class="mt-20 text-center">
			<p class="text-base text-destructive">{error}</p>
		</div>
	{:else if figures.length === 0}
		<div class="mt-20 text-center">
			<p class="text-lg font-bold text-muted-foreground">No figures yet</p>
			<p class="mt-2 text-sm text-muted-foreground">Create your first Figgo!</p>
		</div>
	{:else}
		<div class="mt-6 grid grid-cols-2 gap-4">
			{#each figures as figure (figure.id)}
				<a
					href="/card/{figure.id}"
					class="block transition-opacity hover:opacity-80 active:opacity-70"
				>
					<div class="aspect-[1/1.45] overflow-hidden rounded-xl">
						{#if figure.imageUrl}
							<img src={figure.imageUrl} alt={figure.name} class="h-full w-full object-cover" />
						{:else}
							<div
								class="flex h-full w-full items-center justify-center rounded-xl border-2 border-border-muted bg-surface"
							>
								<span class="text-sm font-bold text-muted-foreground">{figure.name}</span>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
