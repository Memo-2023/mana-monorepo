<script lang="ts">
	/**
	 * ManadeckProgressWidget - Learning progress and due cards
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { manadeckService, type LearningProgress, type Deck } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';
	import { APP_URLS } from '@manacore/shared-branding';

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const manadeckUrl = isDev ? APP_URLS.manadeck.dev : APP_URLS.manadeck.prod;

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let progress = $state<LearningProgress | null>(null);
	let decks = $state<Deck[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	async function load() {
		state = 'loading';
		retrying = true;

		const [progressResult, decksResult] = await Promise.all([
			manadeckService.getLearningProgress(),
			manadeckService.getDecks(),
		]);

		if (progressResult.data && decksResult.data) {
			progress = progressResult.data;
			decks = decksResult.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = progressResult.error || decksResult.error;
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

	// Calculate progress percentage
	const progressPercent = $derived(
		progress && progress.totalCards > 0
			? Math.round((progress.cardsLearned / progress.totalCards) * 100)
			: 0
	);

	// Get decks with due cards
	const decksWithDue = $derived(decks.filter((d) => d.dueCount > 0).slice(0, 3));

	// Total due cards
	const totalDue = $derived(decks.reduce((sum, d) => sum + d.dueCount, 0));
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎴</span>
			{$_('dashboard.widgets.manadeck.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if !progress || decks.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📚</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.manadeck.empty')}
			</p>
			<a
				href={manadeckUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.manadeck.create_deck')}
			</a>
		</div>
	{:else}
		<!-- Stats row -->
		<div class="mb-4 grid grid-cols-3 gap-2 text-center">
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-primary">{progress.streakDays}</div>
				<div class="text-xs text-muted-foreground">{$_('dashboard.widgets.manadeck.streak')}</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-orange-500">{totalDue}</div>
				<div class="text-xs text-muted-foreground">{$_('dashboard.widgets.manadeck.due')}</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2">
				<div class="text-xl font-bold text-green-500">{progress.reviewsToday}</div>
				<div class="text-xs text-muted-foreground">{$_('dashboard.widgets.manadeck.today')}</div>
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mb-4">
			<div class="mb-1 flex justify-between text-xs text-muted-foreground">
				<span>{$_('dashboard.widgets.manadeck.learned')}</span>
				<span>{progressPercent}%</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-surface-hover">
				<div
					class="h-full rounded-full bg-primary transition-all duration-500"
					style="width: {progressPercent}%"
				></div>
			</div>
		</div>

		<!-- Decks with due cards -->
		{#if decksWithDue.length > 0}
			<div class="space-y-2">
				{#each decksWithDue as deck}
					<a
						href="{manadeckUrl}/deck/{deck.id}/study"
						target="_blank"
						rel="noopener"
						class="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-hover"
					>
						<span class="truncate text-sm font-medium">{deck.name}</span>
						<span class="flex items-center gap-1 text-sm text-orange-500">
							{deck.dueCount}
							<span class="text-xs text-muted-foreground"
								>{$_('dashboard.widgets.manadeck.due')}</span
							>
						</span>
					</a>
				{/each}
			</div>
		{/if}

		{#if totalDue > 0}
			<div class="mt-3 text-center">
				<a
					href="{manadeckUrl}/study"
					target="_blank"
					rel="noopener"
					class="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					{$_('dashboard.widgets.manadeck.start_study')}
				</a>
			</div>
		{/if}
	{/if}
</div>
