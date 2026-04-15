<script lang="ts">
	import { formatCreditCost } from './operations';

	interface Props {
		/** The operation name or description */
		operation: string;
		/** Amount of credits consumed (positive) or refunded (negative) */
		amount: number;
		/** Remaining balance after the transaction */
		remainingBalance?: number;
		/** Toast type */
		type?: 'success' | 'error' | 'warning';
		/** Whether the toast is visible */
		visible?: boolean;
		/** Callback when toast should be dismissed */
		onDismiss?: () => void;
		/** Auto-dismiss timeout in ms (0 = no auto-dismiss) */
		autoDismissMs?: number;
		/** i18n labels */
		creditsLabel?: string;
		remainingLabel?: string;
		insufficientLabel?: string;
	}

	let {
		operation,
		amount,
		remainingBalance,
		type = 'success',
		visible = true,
		onDismiss,
		autoDismissMs = 4000,
		creditsLabel = 'Credits',
		remainingLabel = 'remaining',
		insufficientLabel = 'Insufficient credits',
	}: Props = $props();

	const isDeduction = $derived(amount > 0);
	const formattedAmount = $derived(formatCreditCost(Math.abs(amount)));
	const formattedRemaining = $derived(
		remainingBalance !== undefined ? formatCreditCost(remainingBalance) : null
	);

	// Auto-dismiss logic
	$effect(() => {
		if (visible && autoDismissMs > 0 && onDismiss) {
			const timer = setTimeout(() => {
				onDismiss();
			}, autoDismissMs);
			return () => clearTimeout(timer);
		}
		return undefined;
	});
</script>

{#if visible}
	<div
		class="credit-toast"
		class:credit-toast--success={type === 'success'}
		class:credit-toast--error={type === 'error'}
		class:credit-toast--warning={type === 'warning'}
		role="alert"
	>
		<div class="credit-toast__icon-wrapper">
			{#if type === 'success'}
				<svg class="credit-toast__icon" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else if type === 'error'}
				<svg class="credit-toast__icon" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			{:else}
				<svg class="credit-toast__icon" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
			{/if}
		</div>

		<div class="credit-toast__content">
			<p class="credit-toast__operation">{operation}</p>
			<div class="credit-toast__details">
				{#if type === 'error'}
					<span class="credit-toast__amount credit-toast__amount--error">{insufficientLabel}</span>
				{:else}
					<span class="credit-toast__amount" class:credit-toast__amount--refund={!isDeduction}>
						{isDeduction ? '-' : '+'}{formattedAmount}
					</span>
					{#if formattedRemaining !== null}
						<span class="credit-toast__remaining">
							({formattedRemaining}
							{remainingLabel})
						</span>
					{/if}
				{/if}
			</div>
		</div>

		{#if onDismiss}
			<button class="credit-toast__dismiss" onclick={onDismiss} aria-label="Dismiss">
				<svg viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{/if}
	</div>
{/if}

<style>
	.credit-toast {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		min-width: 280px;
		max-width: 400px;
		animation: slide-in 0.2s ease-out;
	}

	:global(.dark) .credit-toast {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(-0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.credit-toast__icon-wrapper {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
	}

	.credit-toast--success .credit-toast__icon-wrapper {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(34, 197, 94);
	}

	.credit-toast--error .credit-toast__icon-wrapper {
		background: rgba(239, 68, 68, 0.1);
		color: rgb(239, 68, 68);
	}

	.credit-toast--warning .credit-toast__icon-wrapper {
		background: rgba(245, 158, 11, 0.1);
		color: rgb(245, 158, 11);
	}

	.credit-toast__icon {
		width: 1rem;
		height: 1rem;
	}

	.credit-toast__content {
		flex: 1;
		min-width: 0;
	}

	.credit-toast__operation {
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.credit-toast__details {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.credit-toast__amount {
		font-weight: 600;
		color: rgb(239, 68, 68);
	}

	.credit-toast__amount--refund {
		color: rgb(34, 197, 94);
	}

	.credit-toast__amount--error {
		color: rgb(239, 68, 68);
	}

	.credit-toast__remaining {
		color: hsl(var(--color-muted-foreground));
	}

	.credit-toast__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.15s ease;
	}

	.credit-toast__dismiss:hover {
		background: rgba(0, 0, 0, 0.05);
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .credit-toast__dismiss:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.credit-toast__dismiss svg {
		width: 0.875rem;
		height: 0.875rem;
	}
</style>
