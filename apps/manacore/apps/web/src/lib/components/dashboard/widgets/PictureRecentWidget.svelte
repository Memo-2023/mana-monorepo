<script lang="ts">
	/**
	 * PictureRecentWidget - Recent AI-generated images
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { pictureService, type GeneratedImage } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';
	import { APP_URLS } from '@manacore/shared-branding';

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const pictureUrl = isDev ? APP_URLS.picture.dev : APP_URLS.picture.prod;

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<GeneratedImage[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 6;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await pictureService.getRecentGenerations(MAX_DISPLAY);

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			// Don't retry if service is unavailable (network error)
			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return 'Gestern';
		}

		return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}

	function truncatePrompt(prompt: string, maxLength = 40): string {
		if (prompt.length <= maxLength) return prompt;
		return prompt.slice(0, maxLength) + '...';
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎨</span>
			{$_('dashboard.widgets.picture.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={3} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🖼️</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.picture.empty')}
			</p>
			<a
				href={pictureUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.picture.create')}
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-2">
			{#each data as image}
				<a
					href="{pictureUrl}/gallery/{image.id}"
					target="_blank"
					rel="noopener"
					class="group relative aspect-square overflow-hidden rounded-lg bg-surface-hover"
				>
					<img
						src={image.thumbnailUrl || image.imageUrl}
						alt={truncatePrompt(image.prompt)}
						class="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
					<div
						class="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
					>
						<p class="p-2 text-xs text-white">{truncatePrompt(image.prompt, 30)}</p>
					</div>
					{#if image.isFavorite}
						<div class="absolute right-1 top-1 text-sm">❤️</div>
					{/if}
				</a>
			{/each}
		</div>
		<div class="mt-3 text-center">
			<a
				href="{pictureUrl}/gallery"
				target="_blank"
				rel="noopener"
				class="text-sm text-primary hover:underline"
			>
				{$_('dashboard.widgets.picture.view_all')}
			</a>
		</div>
	{/if}
</div>
