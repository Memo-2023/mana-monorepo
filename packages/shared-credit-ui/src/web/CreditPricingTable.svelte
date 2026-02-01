<script lang="ts">
	import {
		getPricingTable,
		CreditCategory,
		type CreditOperationType,
	} from '@manacore/credit-operations';

	interface Props {
		/** The app to show pricing for (e.g., 'todo', 'chat', 'calendar') */
		app: string;
		/** Title for the pricing table */
		title?: string;
		/** Whether to show category headers */
		showCategories?: boolean;
		/** Filter to specific categories */
		categories?: CreditCategory[];
		/** i18n labels */
		operationLabel?: string;
		costLabel?: string;
		freeLabel?: string;
		aiLabel?: string;
		productivityLabel?: string;
		premiumLabel?: string;
		creditsLabel?: string;
	}

	let {
		app,
		title,
		showCategories = true,
		categories,
		operationLabel = 'Operation',
		costLabel = 'Cost',
		freeLabel = 'Free',
		aiLabel = 'AI Features',
		productivityLabel = 'Create',
		premiumLabel = 'Premium',
		creditsLabel = 'Credits',
	}: Props = $props();

	const allOperations = $derived(getPricingTable(app));

	const filteredOperations = $derived(
		categories ? allOperations.filter((op) => categories.includes(op.category)) : allOperations
	);

	const groupedOperations = $derived(() => {
		if (!showCategories) return { all: filteredOperations };

		const groups: Record<string, typeof filteredOperations> = {};

		for (const op of filteredOperations) {
			const key = op.category;
			if (!groups[key]) groups[key] = [];
			groups[key].push(op);
		}

		return groups;
	});

	function getCategoryLabel(category: CreditCategory): string {
		switch (category) {
			case CreditCategory.AI:
				return aiLabel;
			case CreditCategory.PRODUCTIVITY:
				return productivityLabel;
			case CreditCategory.PREMIUM:
				return premiumLabel;
			default:
				return category;
		}
	}

	function getCategoryIcon(category: CreditCategory): string {
		switch (category) {
			case CreditCategory.AI:
				return 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z';
			case CreditCategory.PRODUCTIVITY:
				return 'M12 4.5v15m7.5-7.5h-15';
			case CreditCategory.PREMIUM:
				return 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z';
			default:
				return '';
		}
	}
</script>

<div class="pricing-table">
	{#if title}
		<h3 class="pricing-table__title">{title}</h3>
	{/if}

	{#if filteredOperations.length === 0}
		<p class="pricing-table__empty">No pricing information available for this app.</p>
	{:else if showCategories}
		{@const groups = groupedOperations()}
		{#each Object.entries(groups) as [category, operations]}
			<div class="pricing-table__category">
				<div class="pricing-table__category-header">
					<svg
						class="pricing-table__category-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d={getCategoryIcon(category as CreditCategory)}
						/>
					</svg>
					<h4 class="pricing-table__category-title">
						{getCategoryLabel(category as CreditCategory)}
					</h4>
				</div>
				<ul class="pricing-table__list">
					{#each operations as op}
						<li class="pricing-table__item">
							<div class="pricing-table__item-info">
								<span class="pricing-table__item-name">{op.name}</span>
								<span class="pricing-table__item-description">{op.description}</span>
							</div>
							<div
								class="pricing-table__item-cost"
								class:pricing-table__item-cost--free={op.cost === 0}
							>
								{#if op.cost === 0}
									{freeLabel}
								{:else}
									{op.formattedCost}
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	{:else}
		<div class="pricing-table__simple">
			<div class="pricing-table__header-row">
				<span>{operationLabel}</span>
				<span>{costLabel}</span>
			</div>
			<ul class="pricing-table__list">
				{#each filteredOperations as op}
					<li class="pricing-table__item">
						<div class="pricing-table__item-info">
							<span class="pricing-table__item-name">{op.name}</span>
						</div>
						<div
							class="pricing-table__item-cost"
							class:pricing-table__item-cost--free={op.cost === 0}
						>
							{#if op.cost === 0}
								{freeLabel}
							{:else}
								{op.formattedCost}
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<p class="pricing-table__footer">
		{freeLabel}: Read, edit, delete, and organize items
	</p>
</div>

<style>
	.pricing-table {
		padding: 1.25rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .pricing-table {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.pricing-table__title {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.pricing-table__empty {
		margin: 0;
		padding: 1rem;
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
	}

	.pricing-table__category {
		margin-bottom: 1.25rem;
	}

	.pricing-table__category:last-child {
		margin-bottom: 0;
	}

	.pricing-table__category-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .pricing-table__category-header {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.pricing-table__category-icon {
		width: 1.125rem;
		height: 1.125rem;
		color: rgb(59, 130, 246);
	}

	.pricing-table__category-title {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.pricing-table__simple {
		margin-bottom: 0.75rem;
	}

	.pricing-table__header-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.dark) .pricing-table__header-row {
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.pricing-table__list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.pricing-table__item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .pricing-table__item {
		border-bottom: 1px solid rgba(255, 255, 255, 0.03);
	}

	.pricing-table__item:last-child {
		border-bottom: none;
	}

	.pricing-table__item-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.pricing-table__item-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.pricing-table__item-description {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.pricing-table__item-cost {
		flex-shrink: 0;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		background: rgba(59, 130, 246, 0.1);
		color: rgb(59, 130, 246);
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.pricing-table__item-cost--free {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(34, 197, 94);
	}

	.pricing-table__footer {
		margin: 1rem 0 0 0;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	:global(.dark) .pricing-table__footer {
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}
</style>
