<script lang="ts">
	import type { Deck } from '$lib/types/deck';
	import { Card, Badge } from '@manacore/shared-ui';

	interface Props {
		deck: Deck;
		onclick?: () => void;
	}

	let { deck, onclick }: Props = $props();

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<Card variant="elevated" class="cursor-pointer hover:shadow-lg transition-shadow" onclick={onclick}>
	<div class="space-y-3">
		<!-- Title -->
		<h3 class="text-lg font-semibold line-clamp-2">{deck.title}</h3>

		<!-- Description -->
		{#if deck.description}
			<p class="text-sm text-muted-foreground line-clamp-2">
				{deck.description}
			</p>
		{/if}

		<!-- Tags -->
		{#if deck.tags && deck.tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each deck.tags.slice(0, 3) as tag}
					<Badge variant="default">{tag}</Badge>
				{/each}
				{#if deck.tags.length > 3}
					<Badge variant="default">+{deck.tags.length - 3}</Badge>
				{/if}
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
			<div class="flex items-center space-x-2">
				<span>📇 {deck.card_count || 0} cards</span>
				{#if deck.is_public}
					<Badge variant="info">Public</Badge>
				{/if}
			</div>
			<span>{formatDate(deck.updated_at)}</span>
		</div>
	</div>
</Card>
