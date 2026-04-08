<!--
  Picture — Workbench ListView
  Recent images grid with favorites.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalImage } from './types';

	const imagesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalImage>('images').toArray();
		const visible = all.filter((i) => !i.deletedAt && !i.isArchived);
		return decryptRecords('images', visible);
	}, [] as LocalImage[]);

	const images = $derived(imagesQuery.value);

	const sorted = $derived(
		[...images].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 20)
	);

	const favoriteCount = $derived(images.filter((i) => i.isFavorite).length);
</script>

<BaseListView
	items={sorted}
	getKey={(i) => i.id}
	emptyTitle="Keine Bilder"
	listClass="grid grid-cols-2 sm:grid-cols-3 gap-1.5 content-start"
>
	{#snippet header()}
		<span class="flex-1">{images.length} Bilder</span>
		<span>{favoriteCount} Favoriten</span>
	{/snippet}

	{#snippet item(image)}
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
	{/snippet}
</BaseListView>
