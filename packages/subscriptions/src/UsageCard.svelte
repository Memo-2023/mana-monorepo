<script lang="ts">
	import type { UsageData } from './plans';

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
		currentPlanLabel = 'Aktueller Plan',
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

<div class="usage-card">
	<!-- Mana Progress Bar -->
	<div>
		<div class="usage-card__header">
			<div class="usage-card__title-wrapper">
				<h2 class="usage-card__title">{title || yourManaLabel}</h2>
			</div>
			<div class="usage-card__value-wrapper">
				<div class="usage-card__value-badge">
					<p class="usage-card__value">
						{formattedCurrentMana}
					</p>
				</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="usage-card__progress-track">
			<div class="usage-card__progress-fill" style="width: {availablePercentage}%;"></div>
		</div>

		<!-- Percentage -->
		<div class="usage-card__stats">
			<p class="usage-card__stat">
				{availablePercentage}% {availableLabel}
			</p>
			<p class="usage-card__stat">
				{formattedUsedMana}
				{consumedLabel}
			</p>
		</div>

		<!-- Current Plan -->
		{#if currentPlan}
			<div class="usage-card__plan">
				<p class="usage-card__plan-text">
					{currentPlanLabel}: {currentPlan}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.usage-card {
		position: relative;
		padding: 1.25rem;
		border-radius: 1rem;
		transition: all 0.2s ease;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .usage-card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.usage-card__header {
		margin-bottom: 1rem;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.usage-card__title-wrapper {
		flex: 1;
	}

	.usage-card__title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.usage-card__value-wrapper {
		display: flex;
		align-items: flex-end;
	}

	.usage-card__value-badge {
		align-self: flex-start;
		border-radius: 0.75rem;
		padding: 0.375rem 1rem;
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .usage-card__value-badge {
		background: rgba(255, 255, 255, 0.1);
	}

	.usage-card__value {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.usage-card__progress-track {
		position: relative;
		margin-bottom: 0.5rem;
		height: 1rem;
		overflow: hidden;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .usage-card__progress-track {
		background: rgba(255, 255, 255, 0.1);
	}

	.usage-card__progress-fill {
		height: 100%;
		border-radius: 0.5rem;
		background: linear-gradient(90deg, #4287f5 0%, #66b2ff 100%);
		box-shadow: 0 0 4px rgba(66, 135, 245, 0.5);
	}

	.usage-card__stats {
		display: flex;
		justify-content: space-between;
	}

	.usage-card__stat {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.usage-card__plan {
		margin-top: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 0.75rem;
	}

	:global(.dark) .usage-card__plan {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.usage-card__plan-text {
		margin: 0;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}
</style>
