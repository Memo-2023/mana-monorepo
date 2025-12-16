<script lang="ts">
	/**
	 * ZitareQuoteWidget - Random inspiring quote from favorites
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { zitareService, type Favorite } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let loadingState = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Favorite | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	// Determine app URL based on environment
	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const zitareUrl = isDev ? APP_URLS.zitare.dev : APP_URLS.zitare.prod;

	async function load() {
		loadingState = 'loading';
		retrying = true;

		const result = await zitareService.getRandomFavorite();

		if (result.data) {
			data = result.data;
			loadingState = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			loadingState = 'error';

			// Don't retry if service is unavailable (network error)
			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	async function loadNewQuote() {
		await load();
	}

	onMount(load);
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>=�</span>
			{$_('dashboard.widgets.zitare.title')}
		</h3>
		{#if loadingState === 'success' && data}
			<button
				type="button"
				onclick={loadNewQuote}
				class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
				title={$_('dashboard.widgets.zitare.refresh')}
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M1 4v6h6" />
					<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
				</svg>
			</button>
		{/if}
	</div>

	{#if loadingState === 'loading'}
		<WidgetSkeleton lines={3} />
	{:else if loadingState === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if !data}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">(</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.zitare.empty')}
			</p>
			<a
				href={zitareUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.zitare.explore')}
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			<!-- Quote display -->
			<blockquote class="border-l-4 border-primary/30 pl-4">
				<p class="text-sm italic text-muted-foreground">
					"{data.quoteId}"
				</p>
			</blockquote>

			<!-- Note: The Favorite only contains quoteId, we'd need a separate
			     API call to get the full quote text and author. For now, showing ID -->

			<a
				href={zitareUrl}
				target="_blank"
				rel="noopener"
				class="block text-center text-sm text-primary hover:underline"
			>
				{$_('dashboard.widgets.zitare.view_all')} �
			</a>
		</div>
	{/if}
</div>
