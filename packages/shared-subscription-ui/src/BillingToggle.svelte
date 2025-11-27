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

<div class="mx-auto mb-2 flex max-w-lg rounded-lg p-1 bg-menu">
	<button
		onclick={() => onChange('monthly')}
		class="flex flex-1 items-center justify-center rounded-md py-3 transition-colors"
		class:bg-content={billingCycle === 'monthly'}
		class:text-mana={billingCycle === 'monthly'}
		class:font-bold={billingCycle === 'monthly'}
		class:text-theme={billingCycle !== 'monthly'}
	>
		<span class="text-sm">
			{monthlyLabel}
		</span>
	</button>

	<button
		onclick={() => onChange('yearly')}
		class="flex flex-1 items-center justify-center gap-2 rounded-md py-3 transition-colors"
		class:bg-content={billingCycle === 'yearly'}
		class:text-mana={billingCycle === 'yearly'}
		class:font-bold={billingCycle === 'yearly'}
		class:text-theme={billingCycle !== 'yearly'}
	>
		<span class="text-sm">
			{yearlyLabel}
		</span>
		{#if yearlyDiscount}
			<span class="rounded-xl bg-mana px-2 py-1 text-xs font-bold text-white">
				-{yearlyDiscount}
			</span>
		{/if}
	</button>
</div>
