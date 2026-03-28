<script lang="ts">
	import { formatCreditCost } from './operations';

	interface Props {
		/** Current credit balance */
		balance: number;
		/** Free credits remaining (optional) */
		freeCredits?: number;
		/** Whether the balance is loading */
		loading?: boolean;
		/** Callback when "Buy Credits" is clicked */
		onBuyClick?: () => void;
		/** Whether to show as compact (header) or expanded */
		variant?: 'compact' | 'expanded';
		/** Low balance threshold for warning */
		lowBalanceThreshold?: number;
		/** i18n labels */
		creditsLabel?: string;
		freeCreditsLabel?: string;
		buyCreditsLabel?: string;
		lowBalanceLabel?: string;
	}

	let {
		balance,
		freeCredits = 0,
		loading = false,
		onBuyClick,
		variant = 'compact',
		lowBalanceThreshold = 10,
		creditsLabel = 'Credits',
		freeCreditsLabel = 'free',
		buyCreditsLabel = 'Buy',
		lowBalanceLabel = 'Low balance',
	}: Props = $props();

	const totalCredits = $derived(balance + freeCredits);
	const isLowBalance = $derived(totalCredits < lowBalanceThreshold);
	const formattedBalance = $derived(formatCreditCost(totalCredits));
</script>

{#if variant === 'compact'}
	<div class="credit-balance credit-balance--compact" class:credit-balance--low={isLowBalance}>
		{#if loading}
			<div class="credit-balance__skeleton"></div>
		{:else}
			<button
				class="credit-balance__button"
				onclick={onBuyClick}
				title={isLowBalance ? lowBalanceLabel : `${formattedBalance} ${creditsLabel}`}
			>
				<svg class="credit-balance__icon" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M13 10V3L4 14h7v7l9-11h-7z"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="credit-balance__value">{formattedBalance}</span>
				{#if onBuyClick}
					<span class="credit-balance__buy">+</span>
				{/if}
			</button>
		{/if}
	</div>
{:else}
	<div class="credit-balance credit-balance--expanded" class:credit-balance--low={isLowBalance}>
		{#if loading}
			<div class="credit-balance__skeleton credit-balance__skeleton--expanded"></div>
		{:else}
			<div class="credit-balance__header">
				<div class="credit-balance__title-row">
					<svg
						class="credit-balance__icon credit-balance__icon--large"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path
							d="M13 10V3L4 14h7v7l9-11h-7z"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<h3 class="credit-balance__title">{creditsLabel}</h3>
				</div>
				<div class="credit-balance__total">
					<span class="credit-balance__value credit-balance__value--large">{formattedBalance}</span>
				</div>
			</div>

			{#if freeCredits > 0}
				<p class="credit-balance__free">
					{formatCreditCost(freeCredits)}
					{freeCreditsLabel}
				</p>
			{/if}

			{#if isLowBalance}
				<div class="credit-balance__warning">
					<svg class="credit-balance__warning-icon" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{lowBalanceLabel}</span>
				</div>
			{/if}

			{#if onBuyClick}
				<button class="credit-balance__buy-button" onclick={onBuyClick}>
					{buyCreditsLabel}
				</button>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.credit-balance {
		display: inline-flex;
		align-items: center;
	}

	/* Compact variant (header) */
	.credit-balance--compact {
		height: 2rem;
	}

	.credit-balance__button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	:global(.dark) .credit-balance__button {
		background: rgba(255, 255, 255, 0.1);
	}

	.credit-balance__button:hover {
		background: rgba(0, 0, 0, 0.1);
		border-color: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .credit-balance__button:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.credit-balance--low .credit-balance__button {
		background: rgba(239, 68, 68, 0.1);
		color: rgb(220, 38, 38);
	}

	:global(.dark) .credit-balance--low .credit-balance__button {
		background: rgba(239, 68, 68, 0.2);
		color: rgb(248, 113, 113);
	}

	.credit-balance__icon {
		width: 1rem;
		height: 1rem;
		color: rgb(59, 130, 246);
	}

	.credit-balance--low .credit-balance__icon {
		color: rgb(239, 68, 68);
	}

	.credit-balance__value {
		font-variant-numeric: tabular-nums;
	}

	.credit-balance__buy {
		margin-left: 0.125rem;
		font-weight: 700;
		opacity: 0.6;
	}

	.credit-balance__button:hover .credit-balance__buy {
		opacity: 1;
	}

	/* Expanded variant */
	.credit-balance--expanded {
		flex-direction: column;
		align-items: stretch;
		padding: 1rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		min-width: 200px;
	}

	:global(.dark) .credit-balance--expanded {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.credit-balance__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.credit-balance__title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.credit-balance__icon--large {
		width: 1.25rem;
		height: 1.25rem;
	}

	.credit-balance__title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
	}

	.credit-balance__total {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.credit-balance__value--large {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.credit-balance__free {
		margin: 0 0 0.75rem 0;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.credit-balance__warning {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem;
		margin-bottom: 0.75rem;
		border-radius: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		color: rgb(220, 38, 38);
		font-size: 0.75rem;
		font-weight: 500;
	}

	:global(.dark) .credit-balance__warning {
		background: rgba(239, 68, 68, 0.2);
		color: rgb(248, 113, 113);
	}

	.credit-balance__warning-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.credit-balance__buy-button {
		width: 100%;
		padding: 0.625rem 1rem;
		border-radius: 0.5rem;
		background: rgb(59, 130, 246);
		border: none;
		color: white;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.credit-balance__buy-button:hover {
		background: rgb(37, 99, 235);
	}

	/* Skeleton loading */
	.credit-balance__skeleton {
		width: 4rem;
		height: 2rem;
		border-radius: 9999px;
		background: linear-gradient(
			90deg,
			rgba(0, 0, 0, 0.05) 25%,
			rgba(0, 0, 0, 0.1) 50%,
			rgba(0, 0, 0, 0.05) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	:global(.dark) .credit-balance__skeleton {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.05) 25%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0.05) 75%
		);
		background-size: 200% 100%;
	}

	.credit-balance__skeleton--expanded {
		width: 100%;
		height: 6rem;
		border-radius: 0.75rem;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
