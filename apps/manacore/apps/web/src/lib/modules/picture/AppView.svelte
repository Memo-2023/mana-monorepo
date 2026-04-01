<!--
  Picture — Split-Screen AppView
  Recent images grid with favorites.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalImage } from './types';

	let images = $state<LocalImage[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<LocalImage>('images').toArray();
			return all.filter((i) => !i.deletedAt && !i.archivedAt);
		}).subscribe((val) => {
			images = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const sorted = $derived(
		[...images].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 20)
	);

	const favoriteCount = $derived(images.filter((i) => i.isFavorite).length);
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex items-center justify-between">
		<p class="text-xs text-white/40">{images.length} Bilder</p>
		<p class="text-xs text-white/40">{favoriteCount} Favoriten</p>
	</div>

	<div class="flex-1 overflow-auto">
		<div class="grid grid-cols-3 gap-1.5">
			{#each sorted as image (image.id)}
				<div class="group relative aspect-square overflow-hidden rounded-md bg-white/5">
					{#if image.publicUrl}
						<img
							src={image.publicUrl}
							alt={image.prompt}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					{:else}
						<div class="flex h-full items-center justify-center text-white/20 text-xs">
							{image.format ?? 'img'}
						</div>
					{/if}
					{#if image.isFavorite}
						<span class="absolute right-1 top-1 text-xs text-yellow-400">&#9733;</span>
					{/if}
				</div>
			{/each}
		</div>

		{#if sorted.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Bilder</p>
		{/if}
	</div>
</div>
