<script lang="ts">
	import { X, ArrowRight } from '@manacore/shared-icons';
	import type { BottomNotification } from './types';

	interface Props {
		notifications: BottomNotification[];
	}

	let { notifications }: Props = $props();

	// Show highest priority notification (error > warning > info)
	const PRIORITY: Record<string, number> = { error: 3, warning: 2, info: 1 };
	let active = $derived(
		notifications.length > 0
			? [...notifications].sort((a, b) => (PRIORITY[b.type] ?? 0) - (PRIORITY[a.type] ?? 0))[0]
			: null
	);

	function handleDismiss() {
		if (active?.onDismiss) active.onDismiss();
	}
</script>

{#if active}
	<div
		class="notification-bar"
		class:warning={active.type === 'warning'}
		class:error={active.type === 'error'}
	>
		<p class="notification-message">{active.message}</p>
		<div class="notification-actions">
			{#if active.action}
				<button class="notification-action" onclick={active.action.onClick}>
					{#if active.action.icon}
						{@const ActionIcon = active.action.icon}
						<ActionIcon size={14} weight="bold" />
					{/if}
					{active.action.label}
					<ArrowRight size={12} />
				</button>
			{/if}
			{#if active.dismissible !== false}
				<button class="notification-dismiss" onclick={handleDismiss} aria-label="Schließen">
					<X size={14} />
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.notification-bar {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.625rem 0.5rem 0.875rem;
		background: var(--color-surface-elevated, rgba(255, 255, 255, 0.95));
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		border-radius: 0.625rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(12px);
		max-width: 480px;
		width: max-content;
		animation: slideUp 250ms ease-out;
	}
	:global(.dark) .notification-bar {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
	}

	.notification-bar.warning {
		border-color: rgba(245, 158, 11, 0.3);
	}
	.notification-bar.error {
		border-color: rgba(239, 68, 68, 0.3);
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.notification-message {
		flex: 1;
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--color-muted-foreground, rgba(0, 0, 0, 0.65));
	}

	.notification-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.notification-action {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: var(--color-primary, #7c3aed);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 150ms ease;
		white-space: nowrap;
		font-family: inherit;
	}
	.notification-action:hover {
		filter: brightness(0.9);
	}

	.notification-dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		color: var(--color-muted-foreground, rgba(0, 0, 0, 0.35));
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 150ms ease;
	}
	.notification-dismiss:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--color-foreground, rgba(0, 0, 0, 0.7));
	}
	:global(.dark) .notification-dismiss:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 480px) {
		.notification-bar {
			max-width: calc(100vw - 2rem);
		}
	}
</style>
