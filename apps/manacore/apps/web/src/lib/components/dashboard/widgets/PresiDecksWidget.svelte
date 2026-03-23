<script lang="ts">
	/**
	 * PresiDecksWidget - Recent presentations
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { presiService, type PresiDeck } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const presiUrl = isDev ? APP_URLS.presi.dev : APP_URLS.presi.prod;

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let decks = $state<PresiDeck[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await presiService.getRecentDecks(MAX_DISPLAY);

		if (result.data) {
			decks = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

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
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📊</span>
			{$_('dashboard.widgets.presi.title')}
		</h3>
		{#if decks.length > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{decks.length}
			</span>
		{/if}
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if decks.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🎨</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.presi.empty')}
			</p>
			<a
				href={presiUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Präsentation erstellen
			</a>
		</div>
	{:else}
		<div class="space-y-1">
			{#each decks as deck}
				<a
					href="{presiUrl}/deck/{deck.id}"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<span class="text-base">{deck.isPublic ? '🌐' : '📄'}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{deck.title}</p>
						{#if deck.description}
							<p class="truncate text-xs text-muted-foreground">{deck.description}</p>
						{/if}
					</div>
					<span class="flex-shrink-0 text-xs text-muted-foreground">
						{formatDate(deck.updatedAt)}
					</span>
				</a>
			{/each}
		</div>

		<div class="mt-3 text-center">
			<a
				href={presiUrl}
				target="_blank"
				rel="noopener"
				class="text-sm text-primary hover:underline"
			>
				Alle Präsentationen
			</a>
		</div>
	{/if}
</div>
