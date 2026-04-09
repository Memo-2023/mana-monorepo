<script lang="ts">
	import type { CostItem } from './usage';

	interface Props {
		costs: CostItem[];
		title?: string;
		manaLabel?: string;
	}

	let { costs, title = 'Mana-Kosten', manaLabel = 'Mana' }: Props = $props();

	// Icon mapping
	const iconPaths: Record<string, string> = {
		'mic-outline':
			'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
		'chatbubble-outline':
			'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
		'add-circle-outline': 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
		'copy-outline':
			'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
	};
</script>

<div class="cost-card">
	<h3 class="cost-card__title">{title}</h3>

	<div class="cost-card__list">
		{#each costs as item}
			<div class="cost-card__item">
				<div class="cost-card__item-left">
					<svg
						class="cost-card__icon"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d={iconPaths[item.icon] || iconPaths['mic-outline']} />
					</svg>
					<p class="cost-card__action">
						{item.action}
					</p>
				</div>
				<p class="cost-card__cost">
					{item.cost}
					{manaLabel}
				</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.cost-card {
		position: relative;
		padding: 1rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .cost-card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.cost-card__title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.cost-card__list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cost-card__item {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cost-card__item-left {
		display: flex;
		align-items: center;
	}

	.cost-card__icon {
		width: 1.125rem;
		height: 1.125rem;
		margin-right: 0.5rem;
		color: hsl(var(--primary, 221 83% 53%));
	}

	.cost-card__action {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.cost-card__cost {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}
</style>
