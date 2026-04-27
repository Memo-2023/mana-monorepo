<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { getContext } from 'svelte';
	import { ChartBar } from '@mana/shared-icons';
	import type { Deck } from '$lib/modules/cards/types';
	import { RoutePage } from '$lib/components/shell';
	import { _ } from 'svelte-i18n';

	// Get live query data from layout context
	const allDecks: { readonly value: Deck[] } = getContext('cardDecks');

	let decks = $derived(allDecks?.value ?? []);
	let totalCards = $derived(decks.reduce((sum, d) => sum + (d.cardCount || 0), 0));
</script>

<svelte:head>
	<title>{$_('cards.progress.page_title_html')}</title>
</svelte:head>

<RoutePage appId="cards" backHref="/cards">
	<div class="mx-auto max-w-5xl space-y-6">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{$_('cards.progress.heading')}</h1>
			<p class="text-muted-foreground mt-1 text-sm">{$_('cards.progress.subtitle')}</p>
		</div>

		<!-- Stats Overview -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-foreground">{decks.length}</div>
				<div class="text-sm text-muted-foreground">{$_('cards.progress.stat_decks')}</div>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-foreground">{totalCards}</div>
				<div class="text-sm text-muted-foreground">{$_('cards.progress.stat_total_cards')}</div>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-orange-500">0</div>
				<div class="text-sm text-muted-foreground">{$_('cards.progress.stat_due')}</div>
			</div>
		</div>

		<!-- Decks Breakdown -->
		<div class="rounded-xl border border-border bg-card">
			<h2 class="border-b border-border p-4 text-lg font-semibold text-foreground">
				<span class="flex items-center gap-2">
					<ChartBar size={20} />
					{$_('cards.progress.section_overview')}
				</span>
			</h2>
			{#if decks.length === 0}
				<div class="py-12 text-center">
					<div class="mb-4 text-4xl">🎯</div>
					<p class="text-muted-foreground">{$_('cards.progress.empty_title')}</p>
					<p class="mt-2 text-sm text-muted-foreground">{$_('cards.progress.empty_hint')}</p>
				</div>
			{:else}
				<div class="divide-y divide-border">
					{#each decks as deck (deck.id)}
						<div class="flex items-center justify-between p-4">
							<div class="flex items-center gap-3">
								<div class="h-3 w-3 rounded-full" style="background: {deck.color}"></div>
								<div>
									<div class="font-medium text-foreground">{deck.title}</div>
									<div class="text-sm text-muted-foreground">
										{$_('cards.progress.deck_cards', { values: { n: deck.cardCount || 0 } })}
									</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm text-muted-foreground">
									{formatDate(new Date(deck.updatedAt), {
										day: '2-digit',
										month: 'short',
									})}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</RoutePage>
