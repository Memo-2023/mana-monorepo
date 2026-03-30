<script lang="ts">
	/**
	 * ManadeckProgressWidget - Learning progress (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useManadeckProgress } from '$lib/data/cross-app-queries';
	import { APP_URLS } from '@manacore/shared-branding';

	const progress = useManadeckProgress();

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const manadeckUrl = isDev ? APP_URLS.manadeck.dev : APP_URLS.manadeck.prod;
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🎴</span>
			{$_('dashboard.widgets.manadeck.title')}
		</h3>
	</div>

	{#if progress.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else}
		<div class="mb-3 grid grid-cols-2 gap-3">
			<div class="rounded-lg bg-surface-hover p-2 text-center">
				<div class="text-lg font-bold">{progress.value.totalCards}</div>
				<div class="text-xs text-muted-foreground">Karten</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2 text-center">
				<div class="text-lg font-bold">{progress.value.cardsLearned}</div>
				<div class="text-xs text-muted-foreground">Gelernt</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2 text-center">
				<div class="text-lg font-bold">{progress.value.totalDecks}</div>
				<div class="text-xs text-muted-foreground">Decks</div>
			</div>
			<div class="rounded-lg bg-surface-hover p-2 text-center">
				<div class="text-lg font-bold text-primary">{progress.value.dueForReview}</div>
				<div class="text-xs text-muted-foreground">Fällig</div>
			</div>
		</div>

		{#if progress.value.dueForReview > 0}
			<a
				href={manadeckUrl}
				target="_blank"
				rel="noopener"
				class="block rounded-lg bg-primary/10 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
			>
				{progress.value.dueForReview} Karten wiederholen →
			</a>
		{/if}
	{/if}
</div>
