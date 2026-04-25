<script lang="ts">
	import { Card } from '@mana/shared-ui';
	import type { Deck } from '../types';

	interface Props {
		deck: Deck;
		onclick?: () => void;
	}

	let { deck, onclick }: Props = $props();

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<Card variant="outlined" interactive {onclick} fullWidth class="text-left">
	<div class="space-y-3">
		<!-- Color strip -->
		<div class="h-1 w-12 rounded-full" style="background: {deck.color}"></div>

		<!-- Title -->
		<h3 class="text-lg font-semibold text-foreground line-clamp-2">{deck.title}</h3>

		<!-- Description -->
		{#if deck.description}
			<p class="text-sm text-muted-foreground line-clamp-2">
				{deck.description}
			</p>
		{/if}

		<!-- Footer -->
		<div
			class="flex items-center justify-between border-t border-border pt-2 text-sm text-muted-foreground"
		>
			<div class="flex items-center gap-2">
				<span>{deck.cardCount || 0} Karten</span>
				{#if deck.visibility === 'public'}
					<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
						Öffentlich
					</span>
				{/if}
			</div>
			<span>{formatDate(deck.updatedAt)}</span>
		</div>
	</div>
</Card>
