<script lang="ts">
	import type { UsageData } from '@manacore/shared-subscription-types';

	interface Props {
		title?: string;
		usageData: UsageData;
		currentPlan?: string;
		// i18n labels
		yourManaLabel?: string;
		availableLabel?: string;
		consumedLabel?: string;
		currentPlanLabel?: string;
	}

	let {
		title,
		usageData,
		currentPlan,
		yourManaLabel = 'Dein Mana',
		availableLabel = 'verfügbar',
		consumedLabel = 'verbraucht',
		currentPlanLabel = 'Aktueller Plan'
	}: Props = $props();

	// Use real credits (this would normally come from a store/API)
	const currentMana = usageData.currentMana;

	// Calculate used vs available Mana
	const usedMana = usageData.maxMana - currentMana;
	const formattedCurrentMana = currentMana.toString();
	const formattedUsedMana = usedMana.toString();
	const calculatedPercentage = Math.round((currentMana / usageData.maxMana) * 100);
	// Minimum 1% for numbers up to 5, so that a small blue bar is always visible
	const availablePercentage =
		currentMana <= 5 && currentMana > 0 ? Math.max(1, calculatedPercentage) : calculatedPercentage;
</script>

<div class="rounded-2xl p-5 bg-content border border-theme shadow-lg">
	<!-- Mana Progress Bar -->
	<div>
		<div class="mb-4 flex items-start justify-between">
			<div class="flex-1">
				<h2 class="text-xl font-bold text-theme">{title || yourManaLabel}</h2>
			</div>
			<div class="flex items-end">
				<div class="self-start rounded-xl px-4 py-1.5 bg-menu">
					<p class="text-xl font-bold text-theme">
						{formattedCurrentMana}
					</p>
				</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="relative mb-2 h-4 overflow-hidden rounded-lg bg-menu">
			<div
				class="h-full rounded-lg"
				style="width: {availablePercentage}%; background: linear-gradient(90deg, #4287f5 0%, #66B2FF 100%); box-shadow: 0 0 4px #4287f580;"
			></div>
		</div>

		<!-- Percentage -->
		<div class="flex justify-between">
			<p class="text-sm font-medium text-theme-secondary">
				{availablePercentage}% {availableLabel}
			</p>
			<p class="text-sm font-medium text-theme-secondary">
				{formattedUsedMana} {consumedLabel}
			</p>
		</div>

		<!-- Current Plan -->
		{#if currentPlan}
			<div class="mt-3 border-t border-theme pt-3">
				<p class="text-center text-sm font-medium text-theme-secondary">
					{currentPlanLabel}: {currentPlan}
				</p>
			</div>
		{/if}
	</div>
</div>
