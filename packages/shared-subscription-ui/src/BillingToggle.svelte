<script lang="ts">
	import type { BillingCycle } from '@manacore/shared-subscription-types';

	interface Props {
		billingCycle: BillingCycle;
		onChange: (cycle: BillingCycle) => void;
		yearlyDiscount?: string;
		monthlyLabel?: string;
		yearlyLabel?: string;
	}

	let {
		billingCycle,
		onChange,
		yearlyDiscount = '33%',
		monthlyLabel = 'Monatlich',
		yearlyLabel = 'Jährlich',
	}: Props = $props();
</script>

<div class="billing-toggle">
	<button
		onclick={() => onChange('monthly')}
		class="billing-toggle__button"
		class:billing-toggle__button--active={billingCycle === 'monthly'}
	>
		<span class="billing-toggle__label">
			{monthlyLabel}
		</span>
	</button>

	<button
		onclick={() => onChange('yearly')}
		class="billing-toggle__button billing-toggle__button--yearly"
		class:billing-toggle__button--active={billingCycle === 'yearly'}
	>
		<span class="billing-toggle__label">
			{yearlyLabel}
		</span>
		{#if yearlyDiscount}
			<span class="billing-toggle__discount">
				-{yearlyDiscount}
			</span>
		{/if}
	</button>
</div>

<style>
	.billing-toggle {
		display: flex;
		max-width: 32rem;
		margin: 0 auto 0.5rem;
		padding: 0.25rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .billing-toggle {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.billing-toggle__button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		color: hsl(var(--muted-foreground));
	}

	.billing-toggle__button--yearly {
		gap: 0.5rem;
	}

	.billing-toggle__button--active {
		background: rgba(255, 255, 255, 0.9);
		color: hsl(var(--primary, 221 83% 53%));
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .billing-toggle__button--active {
		background: rgba(255, 255, 255, 0.15);
	}

	.billing-toggle__button:hover:not(.billing-toggle__button--active) {
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .billing-toggle__button:hover:not(.billing-toggle__button--active) {
		background: rgba(255, 255, 255, 0.05);
	}

	.billing-toggle__label {
		font-size: 0.875rem;
	}

	.billing-toggle__discount {
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		background: hsl(var(--primary, 221 83% 53%));
	}
</style>
