<script lang="ts">
	/**
	 * PictureRecentWidget - Recent AI-generated images (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useRecentImages } from '$lib/data/cross-app-queries';
	import { APP_URLS } from '@manacore/shared-branding';

	const images = useRecentImages(6);

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const pictureUrl = isDev ? APP_URLS.picture.dev : APP_URLS.picture.prod;
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎨</span>
			{$_('dashboard.widgets.picture.title')}
		</h3>
	</div>

	{#if images.loading}
		<div class="grid grid-cols-3 gap-2">
			{#each Array(6) as _}
				<div class="aspect-square animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (images.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🎨</div>
			<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.picture.empty')}</p>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-2">
			{#each images.value ?? [] as image (image.id)}
				<a
					href="{pictureUrl}/images/{image.id}"
					target="_blank"
					rel="noopener"
					class="group relative aspect-square overflow-hidden rounded-lg bg-surface-hover"
				>
					{#if image.publicUrl}
						<img
							src={image.publicUrl}
							alt={image.prompt || 'Generated image'}
							class="h-full w-full object-cover transition-transform group-hover:scale-105"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-2xl">🖼️</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
